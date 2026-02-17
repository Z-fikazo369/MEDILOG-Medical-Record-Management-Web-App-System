/**
 * AI Medical Summarizer — Pure Groq Implementation
 * ──────────────────────────────────────────────────
 * Primary:   Groq Llama 3.3 70B (fast, high-quality reasoning)
 * Fallback:  Offline extractive summary with medical keyword scoring
 *
 * Uses: process.env.GROQ_API_KEY
 */

import Groq from "groq-sdk";

// ─── System prompts ─────────────────────────────────────────────────
const AUDIO_PROMPT = `You are a professional medical assistant for MEDILOG, a Philippine university health clinic system. Your task is to summarize the provided doctor-patient transcript.

1. **Tone:** Use clear, formal English. Write as if preparing a clinical summary for a medical record.
2. **Structure:** Give a direct 2-paragraph summary: the first paragraph covers the patient's presenting complaint and symptoms, the second covers the doctor's assessment and recommendations.
3. **Constraint:** Do not use robotic headers like "PROBLEM:" or "ADVICE:". Keep it professional, empathetic, and concise. Flow naturally.
4. If a medication is prescribed, always include the drug name, dose, and frequency.
5. Do NOT invent or assume information that was not in the transcript.
6. Do NOT include greetings, disclaimers, or meta-commentary. Output ONLY the summary.`;

const DOCUMENT_PROMPT = `You are a professional medical assistant for MEDILOG, a Philippine university health clinic system. Your task is to summarize the text extracted from a medical document (e.g. lab results, prescriptions, medical certificates, memos, or clinical forms).

1. **Tone:** Use clear, formal English. Write as if preparing a brief note for a medical record.
2. **Structure:** Give a concise summary that captures all key information: document type, patient details (if present), relevant findings, results, dates, and any action items or instructions.
3. **Constraint:** Do not add interpretation beyond what is stated in the document. Keep it factual and organized.
4. If medications are mentioned, always include the drug name, dose, and frequency.
5. If lab values are present, state the key results and whether they are normal or abnormal (only if the document indicates this).
6. Do NOT invent or assume information that was not in the document.
7. Do NOT include greetings, disclaimers, or meta-commentary. Output ONLY the summary.`;

// ─── Main export ────────────────────────────────────────────────────
/**
 * Summarize a medical transcript or document using Groq Llama 3.3.
 * @param {string} text - The raw text to summarize
 * @param {"audio"|"document"} [type="audio"] - Type of content: "audio" for consultation transcripts, "document" for OCR/PDF extracted text
 * @returns {Promise<string>} The AI-generated summary
 */
export async function summarizeText(text, type = "audio") {
  if (!text || text.trim().length < 50) {
    return text; // Too short to summarize
  }

  const apiKey = process.env.GROQ_API_KEY;

  // ── Tier 1: Groq Llama 3.3 70B ─────────────────────────────────
  if (apiKey) {
    const groqResult = await tryGroqSummarize(text, apiKey, type);
    if (groqResult) return groqResult;
    console.warn("[AI Summarizer] Groq failed, falling back to extractive...");
  } else {
    console.warn(
      "[AI Summarizer] No GROQ_API_KEY found — using extractive fallback",
    );
  }

  // ── Tier 2: Offline extractive summary ──────────────────────────
  return extractiveSummary(text);
}

// ─── Tier 1: Groq Llama 3.3 70B ────────────────────────────────────
async function tryGroqSummarize(text, apiKey, type = "audio") {
  try {
    const groq = new Groq({ apiKey });

    // Trim text to ~4000 chars to stay within token limits
    const trimmedText = text.slice(0, 4000);

    const systemPrompt = type === "document" ? DOCUMENT_PROMPT : AUDIO_PROMPT;
    const userMessage =
      type === "document"
        ? `Summarize the following text extracted from a medical document:\n\n"${trimmedText}"`
        : `Summarize this medical consultation transcript:\n\n"${trimmedText}"`;

    const chatCompletion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.3,
      max_tokens: 400,
      top_p: 0.9,
    });

    const summary = chatCompletion.choices?.[0]?.message?.content?.trim();

    if (summary && summary.length > 20) {
      return summary;
    }

    console.warn("[AI Summarizer] Empty or too-short Groq response");
    return null;
  } catch (error) {
    console.error("[AI Summarizer] Groq request failed:", error.message);
    return null;
  }
}

// ─── Tier 2: Offline extractive summary (no API needed) ─────────────
/**
 * Picks the most clinically important sentences from the transcript.
 * Scores by position, medical keyword density, and Taglish awareness.
 */
function extractiveSummary(text) {
  const cleaned = text
    .replace(/\n+/g, ". ")
    .replace(/\.{2,}/g, ".")
    .replace(/\s+/g, " ");

  const sentences = cleaned
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.trim().length > 10);

  if (sentences.length <= 3) return sentences.join(" ");

  const medicalKeywords = [
    "prescrib",
    "diagnos",
    "symptom",
    "treatment",
    "follow-up",
    "follow up",
    "blood pressure",
    "medication",
    "dosage",
    "recommend",
    "complain",
    "patient",
    "condition",
    "normal",
    "abnormal",
    "elevated",
    "assessment",
    "impression",
    "milligram",
    "capsule",
    "tablet",
    "every 8 hours",
    "every 6 hours",
    "three times",
    "twice a day",
    "once a day",
    "medical certificate",
    "pain",
    "fever",
    "cough",
    "headache",
    "sore throat",
    "dizziness",
    "nausea",
    "vomiting",
    "diarrhea",
    "rash",
    "swelling",
    "difficulty",
    "bp",
    "temperature",
    "heart rate",
    "respiratory",
    "oxygen",
    "weight",
    "bmi",
    "sumasakit",
    "masakit",
    "lagnat",
    "ubo",
    "sipon",
    "sakit ng ulo",
    "sakit ng tiyan",
    "nahihilo",
    "nasusuka",
    "nireseta",
    "gamot",
    "paracetamol",
    "amoxicillin",
    "ibuprofen",
    "check-up",
    "nag-complain",
    "pinag-rest",
    "excused",
  ];

  const scored = sentences.map((sentence, idx) => {
    let score = 0;
    if (idx === 0) score += 4;
    if (idx === 1) score += 2;
    if (idx === sentences.length - 1) score += 3;

    const lower = sentence.toLowerCase();
    medicalKeywords.forEach((kw) => {
      if (lower.includes(kw)) score += 2;
    });

    const numberCount = (sentence.match(/\d+/g) || []).length;
    score += numberCount * 1.5;
    if (/\d+\s*(mg|ml|milligram|capsule|tablet)/i.test(sentence)) score += 3;
    if (
      /(?:assessment|diagnosis|impression|diagnosed)\s*(?:is|:)/i.test(sentence)
    )
      score += 4;

    return { sentence, score, originalIdx: idx };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored
    .slice(0, 4)
    .sort((a, b) => a.originalIdx - b.originalIdx)
    .map((s) => s.sentence)
    .join(" ");
}
