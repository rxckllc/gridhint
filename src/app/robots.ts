import { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Default — allow everything (Google, Bing, AI engines like GPTBot,
      // ClaudeBot, PerplexityBot, ChatGPT-User, OAI-SearchBot, Google-Extended).
      {
        userAgent: '*',
        allow: '/',
      },
      // Block SEO-tool scrapers that consume bandwidth without providing value.
      // These bots scrape competitive intelligence — we don't need them indexed.
      {
        userAgent: [
          'AhrefsBot',
          'SemrushBot',
          'MJ12bot',
          'DotBot',
          'PetalBot',
          'BLEXBot',
          'DataForSeoBot',
          'ZoominfoBot',
        ],
        disallow: '/',
      },
    ],
    sitemap: 'https://gridhint.com/sitemap.xml',
    host: 'https://gridhint.com',
  };
}
