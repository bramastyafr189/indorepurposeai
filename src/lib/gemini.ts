import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Helper function to wait
const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

import { createAdminClient } from "@/utils/supabase/admin";

async function getOrderedModels() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('ai_models')
    .select('model_name')
    .eq('is_active', true)
    .order('priority', { ascending: true });
  
  if (error) {
    console.error('Database error fetching AI models:', error);
    throw new Error('Gagal mengambil konfigurasi AI dari database.');
  }

  if (!data || data.length === 0) {
    throw new Error('Tidak ada model AI aktif yang ditemukan di database.');
  }

  return data.map(m => m.model_name);
}

async function generateWithRetry(prompt: string, tone: string, maxRetries = 5) {
  let lastError: any;
  const models = await getOrderedModels();
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      // Pick model based on attempt number
      // If we have more retries than models, stay on the last model
      const modelName = models[i] || models[models.length - 1];
      
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              x: { type: SchemaType.STRING },
              linkedin: { type: SchemaType.STRING },
              instagram: { type: SchemaType.STRING },
              tiktok: { type: SchemaType.STRING },
              newsletter: { type: SchemaType.STRING },
              threads: { type: SchemaType.STRING }
            },
            required: ["x", "linkedin", "instagram", "tiktok", "newsletter", "threads"]
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
    professional: "Gunakan gaya bahasa Profesional: Formal, berbasis data, objektif, dan menggunakan terminologi industri yang tepat.",
    casual: "Gunakan gaya bahasa Santai: Akrab, sapaan hangat (seperti 'Halo teman-teman'), dan bahasa percakapan yang mengalir.",
    inspirational: "Gunakan gaya bahasa Inspiratif: Menggugah semangat, penuh metafora, dan fokus pada transformasi positif.",
    witty: "Gunakan gaya bahasa Witty/Humoris: Cerdas, menggunakan analogi lucu tak terduga, dan sedikit sarkasme sopan.",
    genz: "Gunakan gaya bahasa Gen-Z: Ekspresif, gunakan slang Indo (Slay, POV, Jujurly), banyak emoji, dan berenergi tinggi.",
    persuasive: "Gunakan gaya bahasa Persuasif (Marketing): Gunakan teknik copywriting (seperti AIDA atau PAS), fokus pada solusi/manfaat, sangat meyakinkan, dan memiliki Call to Action (CTA) yang kuat untuk konversi."
  };

  const selectedTone = toneInstructions[tone] || toneInstructions.professional;

  const prompt = `Analisis konten berikut dan hasilkan 6 format konten media sosial yang berbeda dalam Bahasa Indonesia:
    
    INSTRUKSI GAYA BAHASA: ${selectedTone}

    1. X (Twitter) Thread: Buatlah rangkaian 3-5 tweet yang saling bersambung dengan hook menarik dan penomoran.
    2. Postingan LinkedIn: Profesional, edukatif, gunakan struktur Hook -> Pembahasan -> Key Takeaway -> CTA.
    3. Instagram: Caption estetik, 3 ide visual detail, dan 10 hashtag relevan.
    4. TikTok Viral Script & Ideas: Hook 3 detik, Skrip Video (narasi/POV), dan 3 ide konten trending.
    5. Newsletter: Ringkasan curated eksklusif (300-500 karakter) dengan subjudul menarik.
    6. Threads: Santai, interaktif, dan berbentuk cerita pendek yang memancing balasan.
    
    Konten: ${content}

    Kembalikan hasil dalam format JSON dengan kunci: x, linkedin, instagram, tiktok, newsletter, threads.`;

  return await generateWithRetry(prompt, tone);
};

export const repurposeContent = async (content: string, platform: 'x' | 'linkedin' | 'instagram' | 'tiktok' | 'newsletter' | 'threads', tone: string = "professional") => {
  const results = await repurposeAllContent(content, tone);
  return results[platform];
};
