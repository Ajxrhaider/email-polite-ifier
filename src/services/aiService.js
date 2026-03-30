import { GoogleGenerativeAI } from '@google/generative-ai';

// 1. Initializations
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

const HF_MODEL = 'Qwen/Qwen2.5-7B-Instruct';

// 2. Helper: Prompt Builder
function buildSystemPrompt(tone) {
  const toneMap = {
    professional: "highly professional, formal, and diplomatic",
    casual: "casual but polite, friendly, and collaborative",
    direct: "short, direct, and objective without being rude"
  };
  const selectedTone = toneMap[tone] || toneMap.professional;

  return `You are an expert executive communication assistant. 
Task: Rewrite the user's email draft to be ${selectedTone}. 
Constraint 1: Maintain the core message and intent.
Constraint 2: Completely eliminate any passive-aggression, sarcasm, blame-shifting, or unprofessional language.
Constraint 3: Output ONLY the rewritten email text. Do not include introductory remarks.`;
}

// 3. Engine: Gemini
async function useGemini(text, tone) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API key is missing.");

  // Using the specific model you have access to
  // For 'preview' models, we often have to use the v1beta endpoint 
  // but the SDK handles this if we provide the right string.
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash' 
  });

  const fullPrompt = `${buildSystemPrompt(tone)}\n\nOriginal Draft:\n"""\n${text}\n"""`;

  try {
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    // Failover to Gemini 3 Flash Preview if 2.5 hits a snag
    if (error.message.includes('404') || error.message.includes('not found')) {
      const backupModel = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
      const backupResult = await backupModel.generateContent(fullPrompt);
      const backupResponse = await backupResult.response;
      return backupResponse.text().trim();
    }
    throw error;
  }
}

// 4. Engine: Hugging Face (Router API)
async function useHuggingFace(text, tone) {
  const HF_KEY = import.meta.env.VITE_HF_API_KEY;
  if (!HF_KEY) throw new Error("Hugging Face API key is missing.");

  try {
    const response = await fetch(
      `https://router.huggingface.co/v1/chat/completions`,
      {
        headers: {
          Authorization: `Bearer ${HF_KEY}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          model: HF_MODEL,
          messages: [
            { role: "system", content: buildSystemPrompt(tone) },
            { role: "user", content: text }
          ],
          max_tokens: 500,
          temperature: 0.3,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HF Error (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    return result.choices[0].message.content.trim();
  } catch (error) {
    throw error;
  }
}

// 5. Main Aggregator
export async function processEmail(text, tone, provider = 'gemini') {
  if (!text || !text.trim()) throw new Error("Please enter an email draft.");
  
  return provider === 'gemini' 
    ? await useGemini(text, tone) 
    : await useHuggingFace(text, tone);
}