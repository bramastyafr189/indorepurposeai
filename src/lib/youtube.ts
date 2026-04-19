import { YoutubeTranscript } from 'youtube-transcript';

export const getYoutubeTranscript = async (url: string) => {
  try {
    // Extract video ID from URL (handles watch?v=ID, youtu.be/ID, and extra parameters like &pp=...)
    const videoIdMatch = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11}).*/);
    const videoId = videoIdMatch ? videoIdMatch[1] : url;

    const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
    const fullText = transcriptItems.map(item => item.text).join(' ');
    
    return fullText;
  } catch (error) {
    console.error('Error fetching transcript:', error);
    throw new Error('Gagal mengambil transkrip video. Pastikan video memiliki subtitle/transkrip.');
  }
};
