/**
 * Shared Notification Utilities
 */

/**
 * Send notification to Telegram Admin
 */
export async function sendTelegramNotification(text: string, photoUrl?: string, buttonUrl?: string, buttonText?: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

  if (!token || !chatId) {
    console.warn('[Telegram] Token or Chat ID not found in .env');
    return;
  }

  try {
    const endpoint = photoUrl ? 'sendPhoto' : 'sendMessage';
    const url = `https://api.telegram.org/bot${token}/${endpoint}`;
    
    const payload: any = {
      chat_id: chatId,
      parse_mode: 'HTML',
    };

    if (photoUrl) {
      payload.photo = photoUrl;
      payload.caption = text;
    } else {
      payload.text = text;
    }

    // Add button if URL is provided and it's not a localhost URL (Telegram rejects localhost)
    if (buttonUrl && buttonText) {
      const isLocalhost = buttonUrl.includes('localhost') || buttonUrl.includes('127.0.0.1');
      
      if (!isLocalhost) {
        payload.reply_markup = {
          inline_keyboard: [
            [{ text: buttonText, url: buttonUrl }]
          ]
        };
      } else {
        // Append URL to text instead of button for localhost testing
        if (photoUrl) {
          payload.caption += `\n\n🔗 Admin Link: ${buttonUrl}`;
        } else {
          payload.text += `\n\n🔗 Admin Link: ${buttonUrl}`;
        }
      }
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (!result.ok) {
      console.error('[Telegram Error]:', result.description);
      // Fallback: If sendPhoto fails, try sending as a simple message
      if (endpoint === 'sendPhoto') {
        console.log('[Telegram] Falling back to sendMessage...');
        const fallbackText = `${text}\n\n🖼 <b>Bukti:</b> ${photoUrl}`;
        await sendTelegramNotification(fallbackText, undefined, buttonUrl, buttonText);
      }
    }
  } catch (err) {
    console.error('[Telegram Fetch Error]:', err);
  }
}
