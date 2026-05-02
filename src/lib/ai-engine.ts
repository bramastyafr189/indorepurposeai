import { createAdminClient } from "@/utils/supabase/admin";
import { sendTelegramNotification } from "@/lib/notifications";

// Helper function to wait
const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

async function getOrderedModels() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('ai_models')
    .select('id, model_name')
    .eq('is_active', true)
    .order('priority', { ascending: true });
  
  if (error) {
    console.error('Database error fetching AI models:', error);
    throw new Error('Gagal mengambil konfigurasi AI dari database.');
  }

  if (!data || data.length === 0) {
    throw new Error('Tidak ada model AI aktif yang ditemukan di database.');
  }

  return data;
}

export const logAIError = async (modelName: string, errorMessage: string, inputPreview: string, userId?: string, rawOutput?: string) => {
  try {
    const supabase = createAdminClient();
    await supabase.from('ai_errors').insert([
      {
        model_name: modelName,
        error_message: errorMessage,
        input_preview: inputPreview,
        user_id: userId,
        raw_output: rawOutput // This will be stored if the column exists
      }
    ]);
    
    // Broadcast to Admin Dashboard
    await supabase.channel('admin-global-updates').send({
      type: 'broadcast',
      event: 'new-ai-error',
      payload: { modelName, errorMessage }
    });

    // Send to Telegram Bot
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://indorepurposeai.com';
    const tgMessage = `⚠️ <b>AI ERROR DETECTED</b>\n\n` +
      `<b>Model:</b> ${modelName}\n` +
      `<b>Error:</b> ${errorMessage}\n` +
      `<b>User ID:</b> ${userId || 'Guest'}\n\n` +
      `<i>Segera cek dashboard admin untuk detail output mentah.</i>`;

    await sendTelegramNotification(tgMessage, undefined, `${siteUrl}/admin`, '🚀 Buka Admin');
  } catch (err) {
    console.error('[AI Engine] Failed to log error to database:', err);
  }
}

async function generateWithRetry(prompt: string, tone: string, userId?: string) {
  let lastError: any;
  const models = await getOrderedModels();
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY tidak ditemukan di environment variables.');
  }
  
  // Try each model one by one based on priority
  for (let i = 0; i < models.length; i++) {
    const modelConfig = models[i];
    const modelName = modelConfig.model_name;
    const modelId = modelConfig.id;
    let content = "";
    
    try {
      console.log(`[AI Engine] Attempting with model (${i + 1}/${models.length}): ${modelName}`);

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
          "X-Title": "IndoRepurpose AI",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": modelName,
          "messages": [{ "role": "user", "content": prompt }],
          // Some free models on OpenRouter error out if JSON mode is forced
          "response_format": modelName.includes('gemini') || modelName.includes('gpt') 
            ? { "type": "json_object" } 
            : undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const remoteError = errorData.error?.message || `HTTP ${response.status}`;
        throw new Error(`Provider Error: ${remoteError}`);
      }

      const data = await response.json();
      
      if (!data.choices || data.choices.length === 0 || !data.choices[0].message) {
        throw new Error("OpenRouter tidak mengembalikan hasil yang valid.");
      }

      content = data.choices[0].message.content;

      if (!content) {
        throw new Error("Model AI mengembalikan respon kosong.");
      }

      try {
        // More robust JSON extraction
        let jsonContent = content.trim();
        
        // Remove markdown code blocks if present
        if (jsonContent.includes("```")) {
          // Try to extract content between ```json and ``` or just ``` and ```
          const match = jsonContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          if (match) {
            jsonContent = match[1];
          }
        }

        const firstBrace = jsonContent.indexOf('{');
        const lastBrace = jsonContent.lastIndexOf('}');
        
        if (firstBrace === -1 || lastBrace === -1) {
          throw new Error("Teks hasil tidak mengandung format JSON yang valid.");
        }
        
        const rawJson = jsonContent.slice(firstBrace, lastBrace + 1);
        
        // Try to fix common JSON issues only INSIDE the string values
        const safeJson = rawJson.replace(/":\s*"([\s\S]*?)"\s*(,|\s*})/g, (match, p1, p2) => {
          // p1 is the content of the string.
          const cleanedContent = p1
            .replace(/(?<!\\)"/g, "'") // Replace unescaped " with '
            .replace(/\n/g, "\\n")    // Escape real newlines inside strings
            .replace(/\r/g, "");
          return `": "${cleanedContent}"${p2}`;
        });

        const results = JSON.parse(safeJson);
        
        console.log(`[AI Engine] Success using ${modelName}`);
        return {
          results,
          modelUsed: modelName,
          modelId: modelId
        };
      } catch (parseError) {
        console.error("[AI Engine] JSON Parse Error. Raw content:", content);
        // We don't log here because the outer catch will handle it
        // Show a snippet of the raw response to help debugging
        const snippet = content.length > 100 ? content.substring(0, 100) + "..." : content;
        throw new Error(`Model AI memberikan respon yang tidak bisa dibaca sebagai data: "${snippet}"`);
      }

    } catch (error: any) {
      lastError = error;
      console.warn(`[AI Engine] Model ${modelName} failed: ${error.message}`);
      
      // Log the individual model error to database
      await logAIError(modelName, error.message, prompt, userId, content || "");
      
      // If this was the last model, we stop and throw the error
      if (i === models.length - 1) {
        break;
      }
      
      // Otherwise, we continue to the next model immediately
      console.log(`[AI Engine] Falling back to the next model...`);
      continue;
    }
  }

  throw new Error("Maaf, semua sistem AI kami sedang sibuk karena trafik tinggi. Tenang, kredit Anda tetap utuh. Silakan coba lagi dalam beberapa saat.");
}

export const repurposeAllContent = async (content: string, tone: string = "professional", userId?: string) => {
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

    1. X (Twitter) Thread: Buatlah rangkaian minimal 5 tweet yang mendalam dan saling bersambung. WAJIB gunakan format penomoran yang jelas seperti [1/5], [2/5], dst. Pastikan Tweet 1 adalah Hook yang sangat menarik, Tweet 2-4 adalah inti pembahasan detail, dan Tweet 5 adalah kesimpulan/CTA. JANGAN berikan hasil yang pendek atau hanya satu tweet.
    2. Postingan LinkedIn: Profesional dan berbobot. Gunakan struktur: Hook menarik -> Konteks/Masalah -> Solusi/Pembahasan mendalam -> 3-5 Key Takeaways (bullet points) -> Pertanyaan penutup (CTA).
    3. Instagram: Buat caption yang bercerita (storytelling), sertakan 3 ide visual yang sangat mendetail untuk setiap slide, dan 10 hashtag strategis.
    4. TikTok Viral Script: Script lengkap dengan Hook 3 detik yang memicu rasa penasaran, Narasi VO yang cepat dan padat, serta petunjuk visual/transisi yang menarik.
    5. Newsletter: Buat email yang hangat dan personal. Berikan ringkasan materi yang memberikan nilai tambah (value) bagi pembaca, bukan sekadar rangkuman biasa.
    6. Threads: Tulis dalam gaya 'storytelling' yang sangat personal dan autentik. Mulailah dengan opini yang kuat, keresahan, atau POV (Point of View) yang unik terkait konten. Berikan pembahasan singkat yang 'ngena' dan diakhiri dengan pertanyaan terbuka yang memancing perdebatan atau diskusi panjang. JANGAN gunakan gaya bahasa yang terlalu kaku atau formal.
    7. Video Highlights: Identifikasi dan tuliskan SEMUA segmen yang mengandung poin penting, informasi kunci, atau momen menarik dari seluruh isi konten (JANGAN membatasi jumlah segmen). Gunakan penanda waktu [MM:SS] ASLI yang ada di transkrip (WAJIB AKURAT). Gunakan format: [MM:SS - MM:SS] | Judul Segmen | Penjelasan. Berikan jarak 2 baris di antara setiap segmen agar sangat rapi.
    8. SEO Blog Post: Tulis artikel blog profesional yang mendalam (400-600 kata). Wajib gunakan struktur HTML (H1, H2, H3), berikan paragraf pembuka yang kuat, pembahasan poin demi poin, dan kesimpulan. Sertakan Meta Description dan Target Keywords.
    
    Konten: ${content}

    ATURAN OUTPUT (WAJIB - JANGAN DILANGGAR):
    1. Kembalikan HASIL HANYA DALAM FORMAT JSON MURNI.
    2. JANGAN sertakan teks pembuka, penjelasan, atau penutup apa pun di luar blok JSON.
    3. Kunci JSON: x, linkedin, instagram, tiktok, newsletter, threads, highlights, blog.
    4. PENTING: Setiap nilai harus berupa SATU STRING TUNGGAL. 
    5. JANGAN gunakan baris baru (newline) asli di tengah teks. Gunakan karakter "\\n" untuk pindah baris agar JSON tetap valid.
    6. JANGAN gunakan markdown code blocks di dalam nilai JSON.
    7. Gunakan single quote (') untuk tanda kutip di dalam teks agar tidak merusak double quote (") milik JSON.`;

  return await generateWithRetry(prompt, tone, userId);
};

export const repurposeContent = async (content: string, platform: 'x' | 'linkedin' | 'instagram' | 'tiktok' | 'newsletter' | 'threads' | 'highlights' | 'blog', tone: string = "professional", userId?: string) => {
  const { results } = await repurposeAllContent(content, tone, userId);
  return results[platform];
};
