import * as cheerio from 'cheerio';

export const getArticleContent = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Gagal mengakses halaman web: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove unwanted elements
    $('script, style, nav, footer, header, aside, noscript, iframe, ad, .ads, .sidebar').remove();

    // Strategy 1: Look for common article containers
    const articleSelectors = [
      'article',
      '[role="main"]',
      'main',
      '.post-content',
      '.entry-content',
      '.article-content',
      '.content-post',
      '#article-body',
      '.blog-post',
    ];

    let content = '';

    for (const selector of articleSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        // Get text and join with spaces to avoid words sticking together
        content = element.find('h1, h2, h3, h4, p, li').map((_, el) => $(el).text()).get().join('\n\n');
        if (content.trim().length > 300) break; // If we found a substantial amount of text, stop
      }
    }

    // Strategy 2: Fallback to body content if no article container found
    if (!content || content.trim().length < 300) {
      content = $('body').find('p, h1, h2, h3, h4').map((_, el) => $(el).text()).get().join('\n\n');
    }

    const cleanContent = content
      .trim()
      .replace(/\n\s*\n/g, '\n\n') // Normalize multiple newlines
      .replace(/\t/g, ' ')         // Remove tabs
      .slice(0, 10000);            // Limit to avoid context window explosion

    if (cleanContent.length < 100) {
      throw new Error('Gagal mengekstrak konten yang bermakna dari artikel ini. Situs tersebut mungkin diproteksi atau memerlukan login.');
    }

    return cleanContent;
  } catch (error: any) {
    console.error('Scraping error:', error);
    throw new Error(`Error saat membaca artikel: ${error.message}`);
  }
};
