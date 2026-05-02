import { YoutubeTranscript } from 'youtube-transcript';

export const getYoutubeTranscript = async (url: string) => {
  try {
    // Better regex for video ID
    const videoIdMatch = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([0-9A-Za-z_-]{11})/);
    const videoId = videoIdMatch ? videoIdMatch[1] : url;

    let transcriptItems;
    try {
      // First attempt (usually defaults to English or first available)
      transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
    } catch (firstError) {
      try {
        // Second attempt: specifically try Indonesian (id)
        transcriptItems = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'id' });
      } catch (secondError) {
        // Third attempt: specifically try English as backup
        transcriptItems = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' });
      }
    }

    if (!transcriptItems || transcriptItems.length === 0) {
      throw new Error('Transkrip kosong');
    }

    const formatTime = (ms: number) => {
      const seconds = Math.floor(ms / 1000);
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `[${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}]`;
    };

    const fullTextWithTimestamps = transcriptItems
      .map(item => `${formatTime(item.offset)} ${item.text}`)
      .join(' ');
      
    return fullTextWithTimestamps;
  } catch (error) {
    console.error('Error fetching transcript:', error);
    throw new Error('Gagal mengambil transkrip video. Pastikan video memiliki subtitle/transkrip yang tersedia secara publik.');
  }
};
