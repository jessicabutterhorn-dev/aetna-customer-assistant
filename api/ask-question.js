const Anthropic = require("@anthropic-ai/sdk");
const fs = require("fs");
const path = require("path");

const KB_FILES = [
  { name: "Plans-Overview.md", label: "Plans Overview" },
  { name: "Coverage-Details.md", label: "Coverage Details" },
  { name: "Pricing.md", label: "Pricing" },
  { name: "Eligibility.md", label: "Eligibility" },
  { name: "Exclusions-Limitations.md", label: "Exclusions & Limitations" },
  { name: "FAQs.md", label: "FAQs" },
];

function loadKnowledgeBase() {
  const kbPath =
    process.env.KB_PATH ||
    path.join(process.cwd(), "knowledge-base");

  const kb = [];
  for (const file of KB_FILES) {
    const filePath = path.join(kbPath, file.name);
    try {
      const content = fs.readFileSync(filePath, "utf-8");
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

When answering:
- Be clear, concise, and helpful
- If the answer is in the knowledge base, provide it accurately
- If the question cannot be answered from the knowledge base, say so explicitly
- Always cite which sections of the knowledge base support your answer

After your answer, output a JSON block in this exact format (no markdown fences):
SOURCES_JSON:{"sources":[{"file":"filename.md","label":"Section Label","excerpt":"2-3 relevant lines from that file"}]}

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

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { question } = req.body || {};
  if (!question || typeof question !== "string" || !question.trim()) {
    return res.status(400).json({ error: "question is required" });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });
  }

  const kb = loadKnowledgeBase();
  if (kb.length === 0) {
    return res.status(500).json({ error: "Knowledge base could not be loaded" });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const message = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 1024,
      system: buildSystemPrompt(kb),
      messages: [{ role: "user", content: question.trim() }],
    });

    const raw = message.content[0]?.text || "";
    const { answer, sources } = extractSources(raw);

    return res.status(200).json({ answer, sources });
  } catch (err) {
    console.error("Claude API error:", err.message);
    return res.status(500).json({ error: "Failed to get answer. Please try again." });
  }
};
