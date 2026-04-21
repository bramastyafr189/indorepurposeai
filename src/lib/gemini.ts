import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Helper function to wait
const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

const PRIMARY_MODEL = "gemini-3.1-flash-lite-preview";
const SECONDARY_MODEL = "gemini-2.5-flash";
const TERTIARY_MODEL = "gemini-2.5-flash-lite";

async function generateWithRetry(prompt: string, tone: string, maxRetries = 5) {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      let modelName;
      if (i < 3) {
        modelName = PRIMARY_MODEL; // Attempt 1, 2, 3
      } else if (i === 3) {
        modelName = SECONDARY_MODEL; // Attempt 4
      } else {
        modelName = TERTIARY_MODEL; // Attempt 5 (Final)
      }
      
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              x: { type: SchemaType.STRING },
              whatsapp: { type: SchemaType.STRING },
              linkedin: { type: SchemaType.STRING }
            },
            required: ["x", "whatsapp", "linkedin"]
          }
        }
      } as any);

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return JSON.parse(response.text());
    } catch (error: any) {
      lastError = error;
      const isServiceUnavailable = error.message?.includes("503") || error.message?.includes("Service Unavailable") || error.message?.includes("high demand");
      
      if (isServiceUnavailable && i < maxRetries - 1) {
        // Wait longer each time (1s, 2s, 4s)
        const waitTime = Math.pow(2, i) * 1000;
        console.warn(`Gemini 503 error. Retrying in ${waitTime}ms... (Attempt ${i + 1}/${maxRetries})`);
        await sleep(waitTime);
        continue;
      }
      
      throw error;
    }
  }
  throw lastError;
}

export const repurposeAllContent = async (content: string, tone: string = "professional") => {
  const toneInstructions: Record<string, string> = {
    professional: "Gunakan gaya bahasa Profesional: Baku, edukatif, berwibawa, dan sangat terstruktur.",
    casual: "Gunakan gaya bahasa Santai: Seperti mengobrol dengan teman, gunakan istilah semi-formal, hangat, dan mudah dimengerti.",
    inspirational: "Gunakan gaya bahasa Inspiratif: Penuh motivasi, berenergi, gunakan teknik storytelling yang menyentuh emosi.",
    witty: "Gunakan gaya bahasa Witty/Lucu: Cerdas, penuh humor, gunakan perumpamaan yang unik (pun), dan sedikit sarkasme yang sopan.",
    genz: "Gunakan gaya bahasa Gen-Z: Ekspresif, gunakan istilah tren masa kini, banyak emoji, singkat, dan berenergi tinggi."
  };

  const selectedTone = toneInstructions[tone] || toneInstructions.professional;

  const prompt = `Analisis konten berikut dan hasilkan 3 variasi postingan media sosial dalam Bahasa Indonesia:
    
    PENTING: ${selectedTone}

    1. X (Twitter) Thread: Maksimal 5 tweet, ada hook pembuka yang kuat sesuai gaya bahasa di atas.
    2. Pesan WhatsApp: Singkat, padat, gunakan poin-poin/bullet, tambahkan emoji, fokus pada manfaat.
    3. Postingan LinkedIn: Profesional, inspiratif, gunakan struktur Hook -> Pembahasan -> Key Takeaway -> CTA.
    
    Konten: ${content}

    Kembalikan hasil dalam format JSON.`;

  return await generateWithRetry(prompt, tone);
};

export const repurposeContent = async (content: string, platform: 'x' | 'whatsapp' | 'linkedin', tone: string = "professional") => {
  const results = await repurposeAllContent(content, tone);
  return results[platform];
};
