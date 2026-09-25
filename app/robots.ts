import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://snaptrace.space';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/login', '/signup', '/privacy', '/terms', '/test', '/demo', '/vs/sentry', '/llms.txt'],
        disallow: ['/dashboard/', '/api/'],
      },
      // Explicitly allow AI Search Engines (ChatGPT, Perplexity, Claude, Bing Copilot)
      {
        userAgent: ['GPTBot', 'PerplexityBot', 'ClaudeBot', 'Claude-Web', 'Google-Extended', 'Bingbot'],
        allow: ['/', '/llms.txt', '/test', '/demo', '/vs/sentry'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}