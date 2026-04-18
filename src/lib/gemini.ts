import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const repurposeAllContent = async (content: string) => {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
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
  } as any); // Use 'as any' if SchemaType enum causes typing issues in older SDK versions

  const prompt = `Analisis konten berikut dan hasilkan 3 variasi postingan media sosial dalam Bahasa Indonesia:
    
    1. X (Twitter) Thread: Kasual, informatif, maksimal 5 tweet, ada hook kuat.
    2. Pesan WhatsApp: Singkat, padat, gunakan poin-poin/bullet, tambahkan emoji, fokus pada manfaat.
    3. Postingan LinkedIn: Profesional, inspiratif, gunakan struktur Hook -> Pembahasan -> Key Takeaway -> CTA.

    Konten: ${content}

    Kembalikan hasil dalam format JSON.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return JSON.parse(response.text());
};

// Keep old function for compatibility if needed, but refactor to use newer model or combined call
export const repurposeContent = async (content: string, platform: 'x' | 'whatsapp' | 'linkedin') => {
  const results = await repurposeAllContent(content);
  return results[platform];
};
