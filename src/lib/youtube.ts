import { YoutubeTranscript } from 'youtube-transcript';

export const getYoutubeTranscript = async (url: string) => {
  try {
    // Extract video ID from URL
    const videoIdMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?(.+)/);
    const videoId = videoIdMatch ? videoIdMatch[1] : url;

    const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
    const fullText = transcriptItems.map(item => item.text).join(' ');
    
    return fullText;
  } catch (error) {
    console.error('Error fetching transcript:', error);
    throw new Error('Gagal mengambil transkrip video. Pastikan video memiliki subtitle/transkrip.');
  }
};
