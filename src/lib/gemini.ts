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
              threads: { type: SchemaType.STRING },
              highlights: { type: SchemaType.STRING },
              blog: { type: SchemaType.STRING }
            },
            required: ["x", "linkedin", "instagram", "tiktok", "newsletter", "threads", "highlights", "blog"]
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
    professional: "Gunakan gaya bahasa Profesional yang LUWES. Hindari kata-kata kaku seperti 'Selain itu' atau 'Terlebih lagi'. Gunakan istilah industri secara natural seperti seorang ahli yang sedang berbicara di podcast.",
    casual: "Gunakan gaya bahasa Santai seperti sedang ngobrol di warkop. Gunakan sapaan akrab, jangan kaku, boleh gunakan kata 'kita' atau 'lo/gue' jika cocok. Fokus pada keakraban.",
    inspirational: "Gunakan gaya bahasa Inspiratif yang tulus (bukan klise). Fokus pada emosi dan cerita, gunakan metafora yang segar, dan hindari kata-kata motivasi yang sudah terlalu umum.",
    witty: "Gunakan gaya bahasa Witty/Humoris yang cerdas. Gunakan sarkasme halus, analogi yang 'out of the box', dan jokes yang relevan dengan tren di Indonesia saat ini.",
    genz: "Gunakan gaya bahasa Gen-Z yang autentik. Gunakan slang seperti 'Slay', 'POV', 'Jujurly', 'Back burner', dll secara natural. Gunakan lowercase di beberapa bagian jika itu menambah estetika Threads/X.",
    persuasive: "Gunakan gaya bahasa Marketing yang 'nggak jualan banget'. Gunakan teknik soft-selling, fokus pada rasa penasaran (curiosity), dan buat pembaca merasa butuh tanpa merasa dipaksa."
  };

  const humanTouch = "PENTING: HINDARI gaya bahasa template AI. Jangan gunakan kata pembuka seperti 'Di era digital ini', 'Penting untuk diingat', atau 'Kesimpulannya'. Gunakan variasi panjang kalimat (pendek-panjang-pendek) agar enak dibaca. Jadilah kreatif, berani, dan miliki karakter unik dalam setiap tulisan.";

  const selectedTone = (toneInstructions[tone] || toneInstructions.professional) + " " + humanTouch;

  const prompt = `Analisis konten berikut dan hasilkan 8 format konten media sosial yang berbeda dalam Bahasa Indonesia:
    
    INSTRUKSI GAYA BAHASA: ${selectedTone}

    1. X (Twitter) Thread: Buatlah rangkaian 3-5 tweet LENGKAP yang saling bersambung. Wajib tuliskan isi Tweet 1, Tweet 2, dst. secara berurutan dalam satu teks panjang. Pastikan ada hook di tweet pertama.
    2. Postingan LinkedIn: Profesional dan berbobot. Gunakan struktur: Hook menarik -> Konteks/Masalah -> Solusi/Pembahasan mendalam -> 3-5 Key Takeaways (bullet points) -> Pertanyaan penutup (CTA).
    3. Instagram: Buat caption yang bercerita (storytelling), sertakan 3 ide visual yang sangat mendetail untuk setiap slide, dan 10 hashtag strategis.
    4. TikTok Viral Script: Script lengkap dengan Hook 3 detik yang memicu rasa penasaran, Narasi VO yang cepat dan padat, serta petunjuk visual/transisi yang menarik.
    5. Newsletter: Buat email yang hangat dan personal. Berikan ringkasan materi yang memberikan nilai tambah (value) bagi pembaca, bukan sekadar rangkuman biasa.
    6. Threads: Tulis dalam gaya 'storytelling' pendek yang mengundang diskusi aktif. Gunakan pertanyaan yang menggugah opini di akhir teks.
    7. Video Highlights: Identifikasi segmen paling penting atau viral (3-15 segmen, sesuaikan dengan durasi dan kepadatan isi konten). Gunakan format: [MM:SS - MM:SS] | Judul Segmen | Penjelasan. BERIKAN JARAK 2 BARIS (DOUBLE NEWLINE) di antara setiap segmen agar tampilan sangat rapi dan mudah dibaca.
    8. SEO Blog Post: Tulis artikel blog profesional yang mendalam (minimal 800 kata). Wajib gunakan struktur HTML (H1, H2, H3), berikan paragraf pembuka yang kuat, pembahasan poin demi poin, dan kesimpulan. Sertakan Meta Description dan Target Keywords.
    
    Konten: ${content}

    Kembalikan hasil dalam format JSON murni dengan kunci: x, linkedin, instagram, tiktok, newsletter, threads, highlights, blog.`;

  return await generateWithRetry(prompt, tone);
};

export const repurposeContent = async (content: string, platform: 'x' | 'linkedin' | 'instagram' | 'tiktok' | 'newsletter' | 'threads' | 'highlights' | 'blog', tone: string = "professional") => {
  const results = await repurposeAllContent(content, tone);
  return results[platform];
};
