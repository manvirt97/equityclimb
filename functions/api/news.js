// EquityClimb news endpoint v2
// Route: /api/news?scope=local|national|global&city=Calgary&region=Alberta&country=CA
// Uses several RSS sources. If one publisher blocks an automated request, the others still load.

const CBC_REGIONAL = {
  calgary: 'https://www.cbc.ca/webfeed/rss/rss-canada-calgary',
  edmonton: 'https://www.cbc.ca/webfeed/rss/rss-canada-edmonton',
  vancouver: 'https://www.cbc.ca/webfeed/rss/rss-canada-britishcolumbia',
  victoria: 'https://www.cbc.ca/webfeed/rss/rss-canada-britishcolumbia',
  toronto: 'https://www.cbc.ca/webfeed/rss/rss-canada-toronto',
  ottawa: 'https://www.cbc.ca/webfeed/rss/rss-canada-ottawa',
  montreal: 'https://www.cbc.ca/webfeed/rss/rss-canada-montreal',
  winnipeg: 'https://www.cbc.ca/webfeed/rss/rss-canada-manitoba',
  regina: 'https://www.cbc.ca/webfeed/rss/rss-canada-saskatchewan',
  saskatoon: 'https://www.cbc.ca/webfeed/rss/rss-canada-saskatoon',
  halifax: 'https://www.cbc.ca/webfeed/rss/rss-canada-novascotia',
  fredericton: 'https://www.cbc.ca/webfeed/rss/rss-canada-newbrunswick',
  charlottetown: 'https://www.cbc.ca/webfeed/rss/rss-canada-pei',
};

const RELEVANT = [
  'real estate', 'housing', 'home', 'homes', 'mortgage', 'rent', 'rental',
  'condo', 'construction', 'development', 'zoning', 'property', 'properties',
  'interest rate', 'rates', 'inflation', 'bank of canada', 'federal reserve',
  'bond', 'yield', 'economy', 'economic', 'employment', 'unemployment',
  'population', 'immigration', 'oil', 'tariff', 'recession', 'gdp'
];

export async function onRequestGet({ request }) {
  const p = new URL(request.url).searchParams;
  const scope = clean(p.get('scope') || 'national', 12);
  const city = clean(p.get('city') || 'Calgary', 60);
  const region = clean(p.get('region') || 'Alberta', 60);
  const countryCode = clean(p.get('country') || 'CA', 3).toUpperCase();
  const country = countryCode === 'CA' ? 'Canada' : countryCode;

  const sources = sourceList(scope, city, region, country);
  const results = await Promise.allSettled(sources.map(s => fetchFeed(s)));

  const all = [];
  const diagnostics = [];
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      all.push(...r.value.items);
      diagnostics.push({ source: sources[i].name, ok: true, count: r.value.items.length });
    } else {
      diagnostics.push({ source: sources[i].name, ok: false, error: String(r.reason).slice(0, 140) });
    }
  });

  const items = rankAndDedupe(all, scope, city, region).slice(0, 14);
  const status = items.length ? 200 : 502;
  return json({
    scope,
    items,
    fetched: new Date().toISOString(),
    sourceStatus: diagnostics,
    error: items.length ? undefined : 'All configured news feeds were unavailable or returned no usable items.'
  }, status, items.length ? 900 : 60);
}

function sourceList(scope, city, region, country) {
  const gl = country === 'Canada' ? 'CA' : 'US';
  let q;
  if (scope === 'local') {
    q = `\"${city || region}\" (real estate OR housing OR mortgage OR rent OR development) when:14d`;
  } else if (scope === 'global') {
    q = `(central bank OR inflation OR bond yields OR housing OR mortgage OR oil prices) when:7d`;
  } else {
    q = `${country} (housing OR mortgage OR interest rates OR home sales OR rent) when:14d`;
  }

  const google = {
    name: 'Google News',
    url: `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-${gl}&gl=${gl}&ceid=${gl}:en`
  };

  if (scope === 'local') {
    const key = city.toLowerCase().replace(/[^a-z]/g, '');
    return [
      google,
      { name: `CBC ${city}`, url: CBC_REGIONAL[key] || 'https://www.cbc.ca/webfeed/rss/rss-canada' },
      { name: 'CBC Business', url: 'https://www.cbc.ca/webfeed/rss/rss-business' },
      { name: 'Global News', url: 'https://globalnews.ca/feed/' },
    ];
  }

  if (scope === 'global') {
    return [
      google,
      { name: 'CBC World', url: 'https://www.cbc.ca/webfeed/rss/rss-world' },
      { name: 'CBC Business', url: 'https://www.cbc.ca/webfeed/rss/rss-business' },
      { name: 'Global News World', url: 'https://globalnews.ca/world/feed/' },
    ];
  }

  return [
    google,
    { name: 'CBC Business', url: 'https://www.cbc.ca/webfeed/rss/rss-business' },
    { name: 'CBC Canada', url: 'https://www.cbc.ca/webfeed/rss/rss-canada' },
    { name: 'Global News Canada', url: 'https://globalnews.ca/canada/feed/' },
  ];
}

async function fetchFeed(source) {
  const response = await fetch(source.url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; EquityClimb/2.0; +https://equityclimb.pages.dev)',
      'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
      'Accept-Language': 'en-CA,en;q=0.9',
      'Cache-Control': 'no-cache'
    },
    redirect: 'follow'
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  const text = await response.text();
  if (!text.includes('<item') && !text.includes('<entry')) throw new Error('Response was not an RSS/Atom feed');
  return { items: parseFeed(text, source.name) };
}

function parseFeed(xml, fallbackSource) {
  const itemBlocks = [...xml.matchAll(/<(?:item|entry)(?:\s[^>]*)?>([\s\S]*?)<\/(?:item|entry)>/gi)].map(m => m[1]);
  return itemBlocks.map(block => {
    const source = value(block, 'source') || fallbackSource;
    let title = value(block, 'title');
    if (source && title.endsWith(' - ' + source)) title = title.slice(0, -(source.length + 3));
    const link = linkValue(block);
    const date = value(block, 'pubDate') || value(block, 'published') || value(block, 'updated') || new Date().toUTCString();
    const description = stripHtml(value(block, 'description') || value(block, 'summary') || '');
    return { title, link, source, date, description };
  }).filter(x => x.title && /^https?:\/\//i.test(x.link));
}

function rankAndDedupe(items, scope, city, region) {
  const seen = new Set();
  return items
    .map(item => {
      const hay = `${item.title} ${item.description}`.toLowerCase();
      let score = RELEVANT.reduce((n, word) => n + (hay.includes(word) ? 2 : 0), 0);
      if (scope === 'local' && city && hay.includes(city.toLowerCase())) score += 8;
      if (scope === 'local' && region && hay.includes(region.toLowerCase())) score += 3;
      const ageHours = Math.max(0, (Date.now() - new Date(item.date).getTime()) / 36e5);
      if (Number.isFinite(ageHours)) score += Math.max(0, 5 - ageHours / 48);
      return { ...item, score };
    })
    .sort((a, b) => b.score - a.score || new Date(b.date) - new Date(a.date))
    .filter(item => {
      const key = item.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 80);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map(({ score, description, ...item }) => item);
}

function value(block, tag) {
  const m = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return decode((m && m[1]) || '').trim();
}

function linkValue(block) {
  const text = value(block, 'link');
  if (/^https?:\/\//i.test(text)) return text;
  const m = block.match(/<link[^>]+href=["']([^"']+)["'][^>]*\/?\s*>/i);
  return decode((m && m[1]) || '').trim();
}

function stripHtml(s) {
  return decode(s).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function decode(s) {
  return String(s || '')
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#x2F;/gi, '/');
}

function clean(value, max) {
  return String(value || '').replace(/[<>]/g, '').trim().slice(0, max);
}

function json(data, status = 200, ttl = 900) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': `public, max-age=${ttl}`,
      'access-control-allow-origin': '*'
    }
  });
}
