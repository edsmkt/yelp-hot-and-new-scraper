import { Actor, log } from 'apify';

await Actor.init();

const { yelpUrl, scrapeDoApiKey } = await Actor.getInput();

if (!yelpUrl || !scrapeDoApiKey) {
  throw new Error('Both yelpUrl and scrapeDoApiKey are required inputs');
}

const snippetBase = yelpUrl.replace('yelp.com/search?', 'yelp.com/search/snippet?');

const allBusinesses = [];
let start = 0;
let totalResults = null;

function nameFromAlias(alias) {
  if (!alias) return null;
  return alias
    .replace(/-\d+$/, '')
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function extractAlias(url) {
  if (!url) return null;
  const match = url.match(/\/biz\/([^?&#]+)/);
  return match ? match[1] : null;
}

while (true) {
  let snippetUrl = snippetBase;
  if (start > 0) {
    snippetUrl += (snippetUrl.includes('?') ? '&' : '?') + 'start=' + start;
  }

  const encodedUrl = encodeURIComponent(snippetUrl);
  const apiUrl = `http://api.scrape.do/?url=${encodedUrl}&token=${scrapeDoApiKey}`;

  log.info(`Fetching page at offset ${start}...`);

  let data;
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      log.warning(`HTTP ${response.status} at offset ${start}, stopping.`);
      break;
    }
    data = await response.json();
  } catch (e) {
    log.warning(`Request failed at offset ${start}: ${e.message}`);
    break;
  }

  if (!data?.searchPageProps) {
    log.warning('No searchPageProps found, stopping.');
    break;
  }

  const components = data.searchPageProps.mainContentComponentsListProps || [];
  const bizResults = components.filter(c => c.bizId);

  log.info(`Found ${bizResults.length} businesses on this page.`);

  for (const result of bizResults) {
    const biz = result.searchResultBusiness;
    const tags = result.tags || [];
    const snippet = result.snippet;
    const rawUrl = biz?.businessUrl || result.businessUrl || null;
    const alias = biz?.alias || extractAlias(rawUrl);
    const highlights = result.searchResultBusinessHighlights?.businessHighlights || [];
    const actions = result.searchActions || [];
    const responseInfo = actions[0]?.content || null;

    allBusinesses.push({
      rank: biz?.ranking || result.ranking || null,
      name: biz?.name || nameFromAlias(alias),
      alias,
      yelpUrl: alias ? `https://www.yelp.com/biz/${alias}` : null,
      rating: biz?.rating ?? null,
      reviewCount: biz?.reviewCount ?? null,
      priceRange: biz?.priceRange || null,
      categories: (biz?.categories || []).map(c => c.title).join(', '),
      location: biz?.formattedAddress || (biz?.neighborhoods || [])[0] || null,
      phone: biz?.phone || null,
      photoUrl: result.scrollablePhotos?.photoList?.[0]?.src || null,
      reviewSnippet: (snippet?.text || '')
        .replace(/\[\[HIGHLIGHT\]\]|\[\[ENDHIGHLIGHT\]\]/g, '')
        .replace(/<[^>]*>/g, ''),
      isHotAndNew: tags.some(t => (t.label?.text || '').toLowerCase().includes('hot and new')),
      isSponsored: biz?.isAd === true || result.isAd === true,
      responseTime: responseInfo?.responseTimeText?.text || null,
      recentRequests: responseInfo?.subtitleText?.text || null,
      highlights: highlights.map(h => h.title.replace(/&amp;/g, '&')).join(', '),
      badges: tags
        .map(t => (t.label?.text || '').replace(/<[^>]*>/g, ''))
        .filter(t => !t.toLowerCase().includes('hot and new'))
        .join(', '),
    });
  }

  const pagination = components.find(c => c.type === 'pagination');
  if (!pagination?.props) break;

  const { totalResults: total, resultsPerPage } = pagination.props;
  if (totalResults === null) totalResults = total;

  start += resultsPerPage;
  if (start >= totalResults) break;

  // Rate limiting delay
  await new Promise(r => setTimeout(r, 2000));
}

log.info(`Scraping complete. Total businesses: ${allBusinesses.length}`);

await Actor.pushData(allBusinesses);

await Actor.exit();
