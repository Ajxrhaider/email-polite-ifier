import { GoogleGenAI } from '@google/genai';

// 1. Initializations
const ai = new GoogleGenAI({ 
  apiKey: import.meta.env.VITE_GEMINI_API_KEY 
});

// We'll use Qwen 2.5 7B, which is officially supported on the new Serverless Router
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
Constraint 3: Output ONLY the rewritten email text. Do not include any introductory or concluding remarks like "Here is your email:".`;
}

// 3. Engine: Gemini
async function useGemini(text, tone) {
  if (!import.meta.env.VITE_GEMINI_API_KEY) {
    throw new Error("Gemini API key is missing. Please check your .env file.");
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Original Draft:\n"""\n${text}\n"""`,
    config: {
      systemInstruction: buildSystemPrompt(tone),
      temperature: 0.3,
    }
  });

  return response.text.trim();
}

// 4. Engine: Hugging Face (NEW Router API)
async function useHuggingFace(text, tone) {
  const HF_KEY = import.meta.env.VITE_HF_API_KEY;
  if (!HF_KEY) {
    throw new Error("Hugging Face API key is missing.");
  }

  try {
    // Note the new URL: router.huggingface.co/v1/chat/completions
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
    
    // The new OpenAI-compatible format returns text here:
    if (result.choices && result.choices.length > 0) {
      return result.choices[0].message.content.trim();
    }
    
    throw new Error("Unexpected response format from Hugging Face.");
  } catch (error) {
    if (error.message === 'Failed to fetch') {
      throw new Error("Network Blocked: Please disable Ad-Blockers/Shields for localhost.");
    }
    throw error;
  }
}

// 5. Main Aggregator
export async function processEmail(text, tone, provider = 'gemini') {
  if (!text || !text.trim()) {
    throw new Error("Please enter an email draft to process.");
  }

  if (provider === 'gemini') {
    return await useGemini(text, tone);
  } else {
    return await useHuggingFace(text, tone);
  }
}