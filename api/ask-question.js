const Groq = require("groq-sdk");
const fs = require("fs");
const path = require("path");

const KB_FILES = [
  { name: "Missouri-Cities-Counties.md", label: "Missouri Cities & Counties" },
  { name: "Plan-Service-Areas.md", label: "Plan Service Areas & County Lookup" },
  { name: "Plans-Overview.md", label: "Plans Overview" },
  { name: "Coverage-Details.md", label: "Coverage Details" },
  { name: "Pricing.md", label: "Pricing" },
  { name: "Eligibility.md", label: "Eligibility" },
  { name: "Exclusions-Limitations.md", label: "Exclusions & Limitations" },
  { name: "FAQs.md", label: "FAQs" },
];

const KB_KEYWORDS = {
  "Missouri-Cities-Counties.md": ["city", "town", "village", "lives in", "located in", "from", "address", "florissant", "springfield", "independence", "lee's summit", "o'fallon", "wentzville", "blue springs", "joplin", "columbia", "jefferson city", "chesterfield", "st. peters", "st. joseph", "st. charles", "st. louis"],
  "Plan-Service-Areas.md": ["county", "counties", "service area", "coverage area", "where", "available in", "serve", "serves", "d-snp", "dual", "h5325", "h1608", "h2663", "plans in", "what plans"],
  "Plans-Overview.md": ["plan", "plans", "hmo", "ppo", "medicare advantage", "option", "type", "overview", "h-number"],
  "Coverage-Details.md": ["cover", "coverage", "benefit", "dental", "vision", "drug", "prescription", "hospital", "doctor", "specialist", "network", "otc"],
  "Pricing.md": ["cost", "price", "premium", "deductible", "copay", "copayment", "out-of-pocket", "pay", "fee", "afford", "dollar", "$", "moop", "maximum"],
  "Eligibility.md": ["eligible", "eligibility", "qualify", "enroll", "enrollment", "join", "age", "65", "disability", "medicaid", "residency"],
  "Exclusions-Limitations.md": ["exclusion", "limit", "limitation", "not covered", "exclude", "restriction", "denied", "deny", "excluded"],
  "FAQs.md": ["how", "when", "can i", "do i", "faq", "question", "help", "difference"],
};

function selectRelevantFiles(conversationText) {
  const q = conversationText.toLowerCase();
  const scores = {};
  for (const [file, keywords] of Object.entries(KB_KEYWORDS)) {
    scores[file] = keywords.filter((kw) => q.includes(kw)).length;
  }
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const topFiles = sorted.slice(0, 2).filter(([, score]) => score > 0).map(([f]) => f);
  if (topFiles.length === 0) return KB_FILES.map((f) => f.name);
  // Always pair city lookup with service areas so city → county → plans works in one shot
  if (topFiles.includes("Missouri-Cities-Counties.md") && !topFiles.includes("Plan-Service-Areas.md")) {
    topFiles.push("Plan-Service-Areas.md");
  }
  if (topFiles.includes("Plan-Service-Areas.md") && !topFiles.includes("Missouri-Cities-Counties.md")) {
    topFiles.push("Missouri-Cities-Counties.md");
  }
  return topFiles;
}

function loadKnowledgeBase(relevantFiles) {
  const kbPath = process.env.KB_PATH || path.join(process.cwd(), "knowledge-base");
  const kb = [];
  for (const file of KB_FILES) {
    if (!relevantFiles.includes(file.name)) continue;
    const filePath = path.join(kbPath, file.name);
    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      const limits = { "Plan-Service-Areas.md": 5000, "Missouri-Cities-Counties.md": 3500 };
      const limit = limits[file.name] || 2000;
      const content = raw.length > limit ? raw.slice(0, limit) + "\n[truncated]" : raw;
      kb.push({ ...file, content });
    } catch (err) {
      console.error(`Failed to load ${file.name}:`, err.message);
    }
  }
  return kb;
}

function buildSystemPrompt(kb) {
  const kbText = kb
    .map((f) => `## ${f.label} (${f.name})\n\n${f.content}`)
    .join("\n\n---\n\n");

  return `You are a knowledgeable customer service assistant for Aetna Medicare plans in Missouri. You answer questions with 100% accuracy based only on the knowledge base below. Never guess or make up information.

CITY → COUNTY → PLAN LOOKUP (do this automatically — never ask for county if city is provided):
When a user mentions a city or town, look it up in the "Missouri Cities & Counties" knowledge base to find the county, then use that county in the "Plan Service Areas" knowledge base to find available plans. Do this silently — do not ask the user what county their city is in.
Example: "Florissant" → look up in cities file → St. Louis County → look up in service areas → list matching plans.

CLARIFYING QUESTIONS STRATEGY:
Ask 1 targeted clarifying question only if truly needed. Priority:
1. Medicaid status — required for D-SNP eligibility questions
2. Plan H-number — required for specific cost/copay questions (all 34 plans differ)
3. What specific aspect they need (premium vs copay vs deductible)

Do NOT ask clarifying questions if:
- User already provided city OR county (look it up yourself)
- The question is general/conceptual
- You already have enough context

Ask at most 1 question per response. Once you have enough context, answer directly.

When answering:
- Be clear, concise, and helpful
- If the answer is in the knowledge base, provide it accurately
- If the question cannot be answered from the knowledge base, say so explicitly
- Cite which sections of the knowledge base support your answer

After your final answer (not when asking clarifying questions), output a JSON block in this exact format (no markdown fences):
SOURCES_JSON:{"sources":[{"file":"filename.md","label":"Section Label","excerpt":"2-3 relevant lines from that file"}]}

If you are asking a clarifying question (not providing a final answer), do NOT output SOURCES_JSON.

KNOWLEDGE BASE:

${kbText}`;
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

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { question, messages } = req.body || {};

  // Support both single question and full conversation history
  let groqMessages;
  let conversationText;

  if (messages && Array.isArray(messages) && messages.length > 0) {
    groqMessages = messages.map((m) => ({ role: m.role, content: m.content }));
    conversationText = messages.map((m) => m.content).join(" ");
  } else if (question && typeof question === "string" && question.trim()) {
    groqMessages = [{ role: "user", content: question.trim() }];
    conversationText = question.trim();
  } else {
    return res.status(400).json({ error: "question or messages is required" });
  }

  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ error: "GROQ_API_KEY not configured" });
  }

  const relevantFiles = selectRelevantFiles(conversationText);
  const kb = loadKnowledgeBase(relevantFiles);
  if (kb.length === 0) {
    return res.status(500).json({ error: "Knowledge base could not be loaded" });
  }

  const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

  try {
    const completion = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      max_tokens: 700,
      messages: [
        { role: "system", content: buildSystemPrompt(kb) },
        ...groqMessages,
      ],
    });

    const raw = completion.choices[0]?.message?.content || "";
    const { answer, sources } = extractSources(raw);

    return res.status(200).json({ answer, sources });
  } catch (err) {
    console.error("Groq API error:", err.message);
    return res.status(500).json({ error: "Failed to get answer. Please try again." });
  }
};
