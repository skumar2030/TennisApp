const express = require('express');
const router = express.Router();
const cheerio = require('cheerio');

// In-memory cache
let cachedArticles = [];
let lastFetchTime = null;
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

const NEWS_URL = 'https://www.tennis.com/news';

async function scrapeArticles() {
  const res = await fetch(NEWS_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });
  if (!res.ok) throw new Error(`Failed to fetch tennis.com: ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  const articles = [];

  // Find all links to news articles
  $('a[href*="/news/articles/"]').each((_, el) => {
    const $link = $(el);
    const href = $link.attr('href') || '';
    const title = $link.find('[class*="title"]').text().trim();
    const excerpt = $link.find('[class*="headline"]').text().trim();
    const img = $link.find('img');
    const thumbnail = img.attr('src') || img.attr('data-src') || '';

    if (title && href) {
      const fullUrl = href.startsWith('http') ? href : `https://www.tennis.com${href}`;
      // Avoid duplicates
      if (!articles.some(a => a.url === fullUrl)) {
        articles.push({
          title,
          excerpt: excerpt || null,
          category: null,
          thumbnail: (thumbnail && !thumbnail.startsWith('data:')) ? thumbnail : null,
          url: fullUrl,
        });
      }
    }
  });

  return articles.slice(0, 10);
}

async function getArticles() {
  const now = Date.now();
  if (cachedArticles.length > 0 && lastFetchTime && (now - lastFetchTime) < CACHE_DURATION_MS) {
    return cachedArticles;
  }

  try {
    cachedArticles = await scrapeArticles();
    lastFetchTime = now;
  } catch (err) {
    console.error('News scrape failed:', err.message);
    // Return stale cache if available, otherwise empty
    if (cachedArticles.length === 0) {
      throw err;
    }
  }

  return cachedArticles;
}

// GET /api/news
router.get('/', async (req, res) => {
  try {
    const articles = await getArticles();
    const { q } = req.query;

    if (q) {
      const query = q.toLowerCase();
      const filtered = articles.filter(a =>
        a.title.toLowerCase().includes(query) ||
        (a.excerpt && a.excerpt.toLowerCase().includes(query)) ||
        (a.category && a.category.toLowerCase().includes(query))
      );
      return res.json(filtered);
    }

    res.json(articles);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch news articles.' });
  }
});

// POST /api/news/refresh — force cache refresh
router.post('/refresh', async (req, res) => {
  try {
    lastFetchTime = null;
    const articles = await getArticles();
    res.json({ message: 'Cache refreshed', count: articles.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to refresh news.' });
  }
});

module.exports = router;
