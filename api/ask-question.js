// Cerebras via direct fetch (OpenAI-compatible)
const fs = require("fs");
const path = require("path");

const KB_PATH = process.env.KB_PATH || path.join(process.cwd(), "knowledge-base");
const MODEL_ID = process.env.MODEL_ID || "llama3.1-8b";
const MAX_TOKENS = 1500;

// Small files always included regardless of query topic
const UNIVERSAL_FILES = [
  { name: "Escalation-Language.md", label: "Escalation Language", charLimit: 3000 },
  { name: "Plan-Service-Areas.md", label: "Plan Service Areas", charLimit: 3500 },
];

// Markdown concept/skill files with keyword routing
const MARKDOWN_FILES = [
  { name: "Source-Hierarchy.md", label: "Source Hierarchy", charLimit: 3000, keywords: ["source hierarchy", "hierarchy", "which document", "conflicts", "eoc says", "sob says", "authoritative"] },
  { name: "Skill-Drug-Question.md", label: "Drug Question Skill", charLimit: 3000, keywords: ["drug", "medication", "prescription", "rx", "formulary", "tier", "part d", "pharmacy", "script"] },
  { name: "Skill-TrOOP-Question.md", label: "TrOOP Skill", charLimit: 3000, keywords: ["troop", "true out-of-pocket", "carryover", "accumulation", "reset", "catastrophic"] },
  { name: "Skill-DME-PA-Question.md", label: "DME/PA Skill", charLimit: 3000, keywords: ["dme", "durable medical", "wheelchair", "walker", "oxygen", "prior authorization", "prior auth", "pa required"] },
  { name: "Skill-Clarify-Plan-Identity.md", label: "Plan Identity Skill", charLimit: 2500, keywords: ["which plan", "plan name", "identify", "clarify plan", "aetna medicare signature", "aetna medicare premier"] },
  { name: "Skill-Classify-Plan-Year-Scope.md", label: "Plan Year Skill", charLimit: 2500, keywords: ["plan year", "switch plans", "next year", "plan change", "disenroll"] },
  { name: "Heartland-Market-Scope.md", label: "Heartland Market", charLimit: 3000, keywords: ["heartland", "all plans", "market", "scope", "all 34", "every plan"] },
  { name: "Plans-Overview.md", label: "Plans Overview", charLimit: 4000, keywords: ["plan", "hmo", "ppo", "medicare advantage", "option", "type", "overview", "h-number", "h-code"] },
  { name: "Coverage-Details.md", label: "Coverage Details", charLimit: 4000, keywords: ["cover", "coverage", "benefit", "dental", "vision", "hospital", "doctor", "specialist", "network", "hearing"] },
  { name: "Pricing.md", label: "Pricing", charLimit: 4000, keywords: ["cost", "price", "premium", "deductible", "copay", "copayment", "out-of-pocket", "pay", "moop", "maximum out-of-pocket"] },
  { name: "Eligibility.md", label: "Eligibility", charLimit: 4000, keywords: ["eligible", "eligibility", "qualify", "enroll", "enrollment", "join", "age", "65", "disability", "medicaid", "residency"] },
  { name: "Exclusions-Limitations.md", label: "Exclusions & Limitations", charLimit: 3000, keywords: ["exclusion", "limit", "limitation", "not covered", "exclude", "restriction", "denied", "deny", "excluded", "cosmetic"] },
  { name: "FAQs.md", label: "FAQs", charLimit: 3000, keywords: ["how", "when", "can i", "do i", "faq", "help", "difference"] },
  { name: "ADR-005-Clarification.md", label: "Clarification Rules", charLimit: 2000, keywords: ["clarify", "before answering", "clarification"] },
  { name: "ADR-006-Escalation.md", label: "Escalation Rules", charLimit: 2000, keywords: ["escalation rules", "out of scope"] },
  { name: "ADR-007-No-Legal.md", label: "No Legal Interpretation", charLimit: 2000, keywords: ["legal", "interpret", "lawsuit", "liability", "attorney", "lawyer"] },
];

const DRUG_KEYWORDS = ["drug", "medication", "prescription", "rx", "formulary", "tier", "part d", "pharmacy", "script", "insulin", "generic", "brand"];
const YEAR_KEYWORDS = ["changed", "change", "what's new", "whats new", "2025", "annual notice", "anoc", "different from last year", "new this year", "what changed"];
const OTC_KEYWORDS = ["otc", "over the counter", "wallet", "extra benefit", "flex card", "food card", "grocery", "utility allowance", "extra support", "benefit card"];
const LIS_KEYWORDS = ["lis", "low income", "extra help", "subsidy", "low-income subsidy"];
const GEO_KEYWORDS = ["county", "counties", "service area", "where", "available in", "city", "town", "village", "lives in", "located in"];

const H_NUMBER_RE = /H(\d{4})[-_ ](\d{3,4})/gi;

// Manifest cache — loaded once at cold start
let _manifest = null;
function loadManifest() {
  if (_manifest) return _manifest;
  try {
    const raw = fs.readFileSync(path.join(KB_PATH, "manifest.json"), "utf-8");
    _manifest = JSON.parse(raw);
  } catch {
    _manifest = { files: [] };
  }
  return _manifest;
}

function extractHNumbers(text) {
  const re = new RegExp(H_NUMBER_RE.source, "gi");
  const found = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    found.push(`H${m[1]}-${m[2].padStart(3, "0")}`);
  }
  return [...new Set(found)];
}

function planFamilyFromId(hNum) {
  const contract = hNum.split("-")[0].toUpperCase();
  if (contract === "H1608") return "PPO";
  if (contract === "H2663") return "HMO";
  if (contract === "H5325") return "DSNP";
  return null;
}

function readFile(relPath, charLimit = 5000) {
  try {
    const full = fs.readFileSync(path.join(KB_PATH, relPath), "utf-8");
    return full.length > charLimit ? full.slice(0, charLimit) + "\n[content continues — truncated for context]" : full;
  } catch {
    return null;
  }
}

// Search within extracted text for a specific term, returning surrounding context
function searchInFile(relPath, term, contextLines = 4) {
  try {
    const raw = fs.readFileSync(path.join(KB_PATH, relPath), "utf-8");
    const lines = raw.split("\n");
    const results = [];
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes(term.toLowerCase())) {
        const start = Math.max(0, i - contextLines);
        const end = Math.min(lines.length - 1, i + contextLines);
        results.push(lines.slice(start, end + 1).join("\n"));
        if (results.length >= 10) break;
      }
    }
    return results.length ? results.join("\n---\n") : null;
  } catch {
    return null;
  }
}

function extractDrugName(text) {
  const patterns = [
    /(?:drug|medication|rx|prescription|medicine)\s+(?:called\s+)?([a-zA-Z]{4,}(?:\s+[a-zA-Z]+)?)/i,
    /([a-zA-Z]{4,}(?:\s+[a-zA-Z]+)?)\s+(?:on|in)\s+(?:the\s+)?formulary/i,
    /(?:is|does)\s+([a-zA-Z]{4,}(?:\s+[a-zA-Z]+)?)\s+(?:cover|covered)/i,
    /(?:take|taking|on|prescribed)\s+([a-zA-Z]{4,})\b/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m && m[1] && m[1].length > 3) return m[1].trim().toLowerCase();
  }
  return null;
}

function selectFiles(conversationText, provider = "cerebras") {
  const q = conversationText.toLowerCase();
  const manifest = loadManifest();
  const selected = [];
  const addedKeys = new Set();
  // Anthropic has 200K context; Cerebras/Groq are capped at ~8K tokens
  const largCtx = provider === "anthropic";

  function add(key, label, content, priority = 5) {
    if (!content || addedKeys.has(key)) return;
    addedKeys.add(key);
    selected.push({ key, label, content, priority });
  }

  // Universal files — always present
  for (const uf of UNIVERSAL_FILES) {
    const limit = largCtx ? uf.charLimit * 4 : uf.charLimit;
    const content = readFile(uf.name, limit);
    if (content) add(uf.name, uf.label, content, 1);
  }

  // H-number routing — highest priority for plan-specific questions
  const hNums = extractHNumbers(conversationText);
  for (const hNum of hNums) {
    const planFamily = planFamilyFromId(hNum);
    const hLower = hNum.toLowerCase();

    // SOB is the best first source for copay/benefit tables
    const sobEntry = manifest.files?.find(
      (e) => e.type === "sob" && e.plan_ids?.some((id) => id.toLowerCase() === hLower)
    );
    if (sobEntry) {
      const content = readFile(sobEntry.name, largCtx ? 25000 : 6500);
      if (content) add(`sob-${hNum}`, `Summary of Benefits — ${hNum}`, content, 2);
    }

    // ANOC when year-comparison keywords present
    if (YEAR_KEYWORDS.some((kw) => q.includes(kw))) {
      const anocEntry = manifest.files?.find(
        (e) => e.type === "anoc" && e.plan_ids?.some((id) => id.toLowerCase() === hLower)
      );
      if (anocEntry) {
        const content = readFile(anocEntry.name, largCtx ? 20000 : 6000);
        if (content) add(`anoc-${hNum}`, `Annual Notice of Change — ${hNum}`, content, 2);
      }
    }

    // EOC as fallback if no SOB, or for detailed coverage questions
    if (!sobEntry) {
      const eocEntry = manifest.files?.find(
        (e) => e.type === "eoc" && e.plan_ids?.some((id) => id.toLowerCase() === hLower)
      );
      if (eocEntry) {
        const content = readFile(eocEntry.name, largCtx ? 20000 : 6000);
        if (content) add(`eoc-${hNum}`, `Evidence of Coverage — ${hNum}`, content, 2);
      }
    }

    // Drug question with H-number → search correct formulary
    if (DRUG_KEYWORDS.some((kw) => q.includes(kw)) && planFamily) {
      const drugName = extractDrugName(conversationText);
      const formularyEntry = manifest.files?.find(
        (e) => e.type === "formulary" && e.plan_family === planFamily
      );
      if (formularyEntry) {
        let content;
        if (drugName) {
          const excerpt = searchInFile(formularyEntry.name, drugName);
          content = excerpt
            ? `[Formulary ${planFamily} — search results for "${drugName}"]\n\n${excerpt}`
            : `[Drug "${drugName}" not found in ${planFamily} formulary — may not be covered or may be listed under a different name]`;
        } else {
          content = readFile(formularyEntry.name, largCtx ? 15000 : 3000);
        }
        if (content) add(`formulary-${planFamily}`, `Formulary — ${planFamily}`, content, 2);
      }
    }
  }

  // Drug question without H-number → search formulary/ies
  if (hNums.length === 0 && DRUG_KEYWORDS.some((kw) => q.includes(kw))) {
    const drugName = extractDrugName(conversationText);
    // Narrow to one formulary if plan type mentioned in question
    let familyFilter = null;
    if (/\bd-?snp\b/i.test(q)) familyFilter = "DSNP";
    else if (/\bc-?snp\b/i.test(q)) familyFilter = "CSNP";
    else if (/\bhmo\b|\bppo\b/i.test(q)) familyFilter = "HMO";

    const allFormularies = manifest.files?.filter((e) => e.type === "formulary") || [];
    const formularies = familyFilter
      ? allFormularies.filter((e) => e.plan_family === familyFilter)
      : allFormularies.slice(0, 3);

    for (const fe of formularies) {
      let content;
      if (drugName) {
        const excerpt = searchInFile(fe.name, drugName, largCtx ? 10 : 3);
        if (excerpt) content = `[${fe.plan_family} Formulary — search for "${drugName}"]\n\n${excerpt}`;
      } else {
        content = readFile(fe.name, largCtx ? 15000 : 2000);
      }
      if (content) add(`formulary-${fe.plan_family}`, `Formulary — ${fe.plan_family}`, content, 3);
    }
  }

  // OTC / extra benefit questions
  if (OTC_KEYWORDS.some((kw) => q.includes(kw))) {
    const otcEntry = manifest.files?.find((e) => e.name?.toLowerCase().includes("otc_catalog"));
    if (otcEntry) {
      const content = readFile(otcEntry.name, largCtx ? 30000 : 6000);
      if (content) add("otc-catalog", "OTC Catalog 2026", content, 3);
    }
    const benefitEntries = manifest.files?.filter((e) => e.type === "extra-benefit") || [];
    for (const be of benefitEntries.slice(0, 2)) {
      const content = readFile(be.name, largCtx ? 15000 : 4000);
      if (content) add(`benefit-${be.plan_family}`, be.label, content, 3);
    }
  }

  // City/county geographic routing
  if (GEO_KEYWORDS.some((kw) => q.includes(kw))) {
    const cityMatch = conversationText.match(/(?:in|lives in|located in|from|near|city of)\s+([A-Z][a-zA-Z\s]{2,20}?)(?:\s*[,?.!]|$)/);
    const cityName = cityMatch ? cityMatch[1].trim() : null;
    let content;
    if (cityName) {
      const excerpt = searchInFile("Missouri-Cities-Counties.md", cityName, 8);
      content = excerpt
        ? `[Missouri Cities & Counties — search results for "${cityName}"]\n\n${excerpt}`
        : `[City "${cityName}" not found in Missouri cities list. Confirm county with member.]`;
    } else {
      content = readFile("Missouri-Cities-Counties.md", largCtx ? 60000 : 4000);
    }
    if (content) add("cities", "Missouri Cities & Counties", content, 3);
  }

  // LIS / Extra Help
  if (LIS_KEYWORDS.some((kw) => q.includes(kw))) {
    const lisEntry = manifest.files?.find(
      (e) => e.type === "supplemental" && e.name?.toLowerCase().includes("lis")
    );
    if (lisEntry) {
      const content = readFile(lisEntry.name, largCtx ? 20000 : 5000);
      if (content) add("lis", "LIS Premium Summary", content, 3);
    }
  }

  // Medicare & You
  if (q.includes("medicare and you") || q.includes("annual enrollment period") || q.includes("aep") || q.includes("open enrollment period")) {
    const myEntry = manifest.files?.find((e) => e.name?.toLowerCase().includes("medicare_and_you"));
    if (myEntry) {
      const content = readFile(myEntry.name, largCtx ? 60000 : 6000);
      if (content) add("medicare-and-you", "Medicare & You 2026", content, 3);
    }
  }

  // Heartland market overview
  if (q.includes("heartland") || q.includes("aetna missouri") || q.includes("market overview")) {
    const hmEntry = manifest.files?.find((e) => e.name?.toLowerCase().includes("aetna_medicare_missouri"));
    if (hmEntry) {
      const content = readFile(hmEntry.name, 4000);
      if (content) add("heartland-market", "Aetna Missouri Heartland Plans", content, 3);
    }
  }

  // Markdown concept/skill keyword scoring
  const scoredMarkdown = MARKDOWN_FILES
    .map((f) => ({ ...f, score: f.keywords.filter((kw) => q.includes(kw)).length }))
    .filter((f) => f.score > 0)
    .sort((a, b) => b.score - a.score);

  for (const f of scoredMarkdown.slice(0, 3)) {
    const content = readFile(f.name, f.charLimit);
    if (content) add(f.name, f.label, content, 4);
  }

  // Sort by priority so universal files appear first in prompt
  selected.sort((a, b) => a.priority - b.priority);

  return selected;
}

const STATIC_INSTRUCTIONS = `You are a knowledgeable customer service assistant for Aetna Medicare plans in Missouri (Heartland Market). Answer with 100% accuracy based only on the knowledge base below. Never use training data or make up information. If the knowledge base does not contain the answer, use the escalation phrases below.

MANDATORY CLOSING DISCLAIMER: Append to every answer that references any Aetna plan document:
"This information reflects the 2026 plan documents available in the system. For the most current and up-to-date information, please visit AetnaMedicare.com or contact Aetna Medicare Customer Service."

ESCALATION PHRASES — use verbatim:
- Not found in KB: "I cannot confirm this from the available knowledge base."
- Documents conflict: "The plan documents do not clearly define this requirement. Please contact Aetna Medicare Customer Service for confirmation."
- Drug not in formulary: "This drug does not appear in the uploaded formulary for this plan. For the most current information, please visit AetnaMedicare.com or contact Aetna Medicare Customer Service."
- No plan ID provided: "To give you an accurate answer, I need to know which plan you are referring to. Please provide the plan name or H-code and the state/county."

CITY → COUNTY → PLAN LOOKUP — do this automatically, never ask for county if city is provided:
When a user mentions a city or town, look it up in "Missouri Cities & Counties" to find the county, then use that county in "Plan Service Areas" to find available plans. Do this silently.

CLARIFYING QUESTIONS: Ask 1 targeted question only if truly needed. Priority: (1) Medicaid status for D-SNP questions, (2) plan H-number for specific cost questions, (3) specific aspect needed. Ask at most 1 question per response.

After your final answer (not when asking clarifying questions), output:
SOURCES_JSON:{"sources":[{"file":"filename","label":"Section Label","excerpt":"2-3 relevant lines from that source"}]}

Do NOT output SOURCES_JSON when asking a clarifying question.

KNOWLEDGE BASE:`;

function formatKBSection(files) {
  return files.map((f) => `## ${f.label}\n\n${f.content}`).join("\n\n---\n\n");
}

// Returns the stable prefix: instructions + universal files (priority=1).
// Used as the cached block in the Anthropic system parameter.
function buildCachedSystemPrefix(universalFiles) {
  return STATIC_INSTRUCTIONS + "\n\n" + formatKBSection(universalFiles);
}

// Returns the query-specific KB content (priority>=2).
// Not cached — changes every request.
function buildDynamicKBSection(querySpecificFiles) {
  return formatKBSection(querySpecificFiles);
}

// Full system prompt for OpenAI-compatible providers (Cerebras, Groq).
// Concatenates both parts — same text output as before the refactor.
function buildSystemPrompt(files) {
  const universal = files.filter((f) => f.priority === 1);
  const specific = files.filter((f) => f.priority !== 1);
  const cached = buildCachedSystemPrefix(universal);
  const dynamic = buildDynamicKBSection(specific);
  return dynamic ? cached + "\n\n---\n\n" + dynamic : cached;
}

function extractSources(text) {
  const marker = "SOURCES_JSON:";
  const idx = text.indexOf(marker);
  if (idx === -1) return { answer: text, sources: [] };
  const answer = text.slice(0, idx).trim();
  const jsonStr = text.slice(idx + marker.length).trim();
  try {
    const parsed = JSON.parse(jsonStr);
    return { answer, sources: parsed.sources || [] };
  } catch {
    return { answer, sources: [] };
  }
}

const INFERENCE_PROVIDER = process.env.INFERENCE_PROVIDER || "anthropic";

// OpenAI-compatible call used by Cerebras and Groq
async function callOpenAICompatible(endpoint, apiKey, providerName, systemPrompt, messages) {
  const apiRes = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: MODEL_ID,
      max_tokens: MAX_TOKENS,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
    }),
  });
  if (!apiRes.ok) {
    const body = await apiRes.text();
    throw Object.assign(new Error(`${providerName} HTTP ${apiRes.status}: ${body}`), { status: apiRes.status });
  }
  const data = await apiRes.json();
  const raw = data.choices?.[0]?.message?.content || "";
  console.log(JSON.stringify({
    provider: providerName,
    input_tokens: data.usage?.prompt_tokens ?? null,
    output_tokens: data.usage?.completion_tokens ?? null,
  }));
  return raw;
}

async function callCerebras(files, messages) {
  return callOpenAICompatible(
    "https://api.cerebras.ai/v1/chat/completions",
    process.env.CEREBRAS_API_KEY,
    "cerebras",
    buildSystemPrompt(files),
    messages
  );
}

async function callGroq(files, messages) {
  return callOpenAICompatible(
    "https://api.groq.com/openai/v1/chat/completions",
    process.env.GROQ_API_KEY,
    "groq",
    buildSystemPrompt(files),
    messages
  );
}

// Placeholder — replaced in commit 5 with real Anthropic SDK call
async function callAnthropic(files, messages) {
  throw new Error("Anthropic provider not yet implemented — set INFERENCE_PROVIDER=cerebras");
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { question, messages } = req.body || {};

  let userMessages;
  let conversationText;

  if (messages && Array.isArray(messages) && messages.length > 0) {
    userMessages = messages.map((m) => ({ role: m.role, content: m.content }));
    conversationText = messages.map((m) => m.content).join(" ");
  } else if (question && typeof question === "string" && question.trim()) {
    userMessages = [{ role: "user", content: question.trim() }];
    conversationText = question.trim();
  } else {
    return res.status(400).json({ error: "question or messages is required" });
  }

  const provider = INFERENCE_PROVIDER;
  const files = selectFiles(conversationText, provider);
  console.log(`[${provider}] Loaded ${files.length} KB files: ${files.map((f) => f.label).join(", ")}`);

  if (files.length === 0) {
    return res.status(500).json({ error: "Knowledge base could not be loaded" });
  }

  let raw;
  try {
    if (provider === "cerebras") {
      raw = await callCerebras(files, userMessages);
    } else if (provider === "groq") {
      raw = await callGroq(files, userMessages);
    } else {
      raw = await callAnthropic(files, userMessages);
    }
  } catch (err) {
    console.error(`Provider error [${provider}]:`, err.message);
    return res.status(500).json({ error: "Failed to get answer. Please try again." });
  }

  const { answer, sources } = extractSources(raw);
  return res.status(200).json({ answer, sources });
};
