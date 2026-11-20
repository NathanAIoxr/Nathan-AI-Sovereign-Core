const endpoint = 'https://en.wikipedia.org/w/api.php';
const agent = 'TaborAcademyCardGames/1.1 (https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core)';
const categoryNames = [
  'Card games', 'Card games for children', 'Historical card games', 'Trick-taking games',
  'Trick-taking card games', 'Rummy', 'Shedding-type card games', 'Fishing card games',
  'Patience games', 'Dedicated deck card games', 'Collectible card games',
  'Card game terminology',
];
const categoryLimit = 4;
const refWords = /^(?:list of\b)|(?:glossary|terminology|equipment|strategy|card counting|(?:card|playing card) shuffling)/i;

async function api(parameters, { fetcher, token, retry }) {
  const url = new URL(endpoint);
  url.search = new URLSearchParams({action:'query',format:'json',formatversion:'2',maxlag:'5',...parameters});
  for (let attempt = 0; attempt < 3; attempt++) {
    const headers = {'User-Agent':agent,Accept:'application/json'};
    if (token) headers.Authorization = 'Bearer ' + token;
    const result = await fetcher(url, {headers, redirect:'error', signal:AbortSignal.timeout(15000)});
    if (result.status === 429 || result.status === 503) {
      if (attempt === 2) throw Error('Wikimedia asked the importer to slow down (' + result.status + ')');
      const requested = Number(result.headers.get('retry-after')) || 5;
      await retry(Math.max(5,Math.min(25,requested)) * 1000);
      continue;
    }
    if (!result.ok) throw Error('Wikimedia Action API returned HTTP ' + result.status);
    const data = await result.json();
    if (data.error?.code === 'maxlag' && attempt < 2) {
      await retry(5000);
      continue;
    }
    if (data.error) throw Error('Wikimedia Action API error: ' + data.error.code);
    return data;
  }
  throw Error('Wikimedia did not return a completed query');
}

function fromPage(page, category) {
  const revision = page.revisions?.[0];
  if (page.ns !== 0 || page.missing || page.redirect || page.pageprops?.disambiguation !== undefined ||
    !Number.isSafeInteger(page.pageid) || page.pageid <= 0 || !Number.isSafeInteger(revision?.revid) ||
    revision.revid <= 0 || typeof page.title !== 'string' || !page.title.trim() || page.title.length > 255) return null;
  return {
    id:'enwiki:' + page.pageid,
    pageId:page.pageid,
    title:page.title,
    recordType:category === 'Card game terminology' || refWords.test(page.title) || page.title === 'Card game' ?
      'reference' : 'game-lead',
    url:'https://en.wikipedia.org/?curid=' + page.pageid,
    revision:revision.revid,
    revisionUrl:'https://en.wikipedia.org/?oldid=' + revision.revid,
    categories:[category],
  };
}

export async function collectWikipedia({ fetcher = fetch, token = '', retry = (ms) => new Promise((done) => setTimeout(done,ms)),
    categories = categoryNames } = {}) {
  const pages = new Map();
  const coverage = [];
  for (const category of categories) {
    let continuation = {};
    let requests = 0;
    let received = 0;
    do {
      // Explicitly constrain continuation to the MediaWiki cursor fields.
      const data = await api({
        generator:'categorymembers',gcmtitle:'Category:' + category,gcmnamespace:'0',gcmtype:'page',gcmlimit:'100',
        prop:'info|pageprops|revisions',ppprop:'disambiguation',rvprop:'ids',...continuation,
      }, {fetcher,token,retry});
      for (const page of data.query?.pages ?? []) {
        const incoming = fromPage(page,category);
        if (!incoming) continue;
        received++;
        const old = pages.get(incoming.id);
        if (old) {
          const categories = [...new Set([...old.categories,category])];
          const recordType = old.recordType === 'reference' || incoming.recordType === 'reference' ? 'reference' : 'game-lead';
          pages.set(incoming.id,{...(incoming.revision >= old.revision ? incoming : old),categories,recordType});
        } else pages.set(incoming.id,incoming);
      }
      if (data.continue) {
        continuation = Object.fromEntries(Object.entries(data.continue)
          .filter(([key,value]) => ['continue','gcmcontinue','rvcontinue'].includes(key) && typeof value === 'string'));
        if (Object.keys(continuation).length < 2) throw Error('Unexpected Wikimedia continuation');
      } else continuation = {};
      requests++;
    } while (Object.keys(continuation).length && requests < categoryLimit);
    coverage.push({category,requests,received,capped:Object.keys(continuation).length > 0});
  }
  return { pages:[...pages.values()].sort((a,b) => a.pageId - b.pageId), coverage, access:token ? 'oauth-bearer' : 'public' };
}
