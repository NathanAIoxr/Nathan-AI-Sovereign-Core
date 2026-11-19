import { sites } from './sites.mjs';
import { bibliography, traditions } from './traditions.mjs';
import { escapeHtml, page, hero, section, cards, html, json } from './ui.mjs';

const readings = [
  ['genesis-1', 'Genesis 1', 'KJV · Biblical', 'The account opens with the creation of heaven and earth and describes light, land, living things, and humanity in a sequence of days.', 'https://www.biblegateway.com/passage/?search=Genesis%201&version=KJV'],
  ['genesis-2', 'Genesis 2', 'KJV · Biblical', 'The chapter recounts the formation of the man, the garden of Eden, and the formation of the woman.', 'https://www.biblegateway.com/passage/?search=Genesis%202&version=KJV'],
  ['enuma-elish', 'Enūma Eliš', 'Babylonian', 'Apsu and Tiamat appear amid primeval waters. Marduk defeats Tiamat and uses her body to establish features of the world.', 'https://www.worldhistory.org/article/225/enuma-elish---the-babylonian-epic-of-creation---fu/'],
  ['mesopotamia', 'Creation accounts of Mesopotamia', 'Sumerian and Akkadian', 'Different cuneiform accounts describe beginnings for the gods, the world, and humanity. The museum essay identifies several texts and their contexts.', 'https://www.metmuseum.org/essays/epic-of-creation-mesopotamia'],
  ['purusha', 'Puruṣa Sūkta', 'Vedic · Rigveda 10.90', 'The gods sacrifice the cosmic person Puruṣa. Parts of his body correspond to features of the world and society.', 'https://www.loc.gov/exhibits/world/accounts.html#obj24'],
  ['izanagi-izanami', 'Izanagi and Izanami', 'Japanese', 'The two deities descend and bring forth the Japanese islands in the account summarized by the Library of Congress.', 'https://www.loc.gov/exhibits/world/accounts.html#obj13'],
  ['popol-vuh', 'Popol Vuh', 'Kʼicheʼ Maya', 'Successive attempts to make humans precede the creation of people from maize.', 'https://samnoblemuseum.ou.edu/collections-and-research/ethnology/mayan-textiles/mayan-textiles-background/mayan-history/creation/'],
  ['chilam-balam', 'Chilam Balam', 'Yucatec Maya', 'The museum’s account identifies the books of Chilam Balam as another source for Maya creation traditions.', 'https://samnoblemuseum.ou.edu/collections-and-research/ethnology/mayan-textiles/mayan-textiles-background/mayan-history/creation/'],
  ['rangi-papa', 'Ranginui and Papatūānuku', 'Māori', 'Sky and earth are joined in darkness. Their children debate separating them, and Tāne pushes them apart.', 'https://teara.govt.nz/en/maori-creation-traditions'],
  ['te-kore', 'Te Kore, Te Pō and Te Ao', 'Māori', 'Te Ara describes themes that recur across versions, including the movement from nothingness to something and from darkness to light.', 'https://teara.govt.nz/en/maori-creation-traditions'],
  ['haudenosaunee', 'Sky Woman and the earth diver', 'Haudenosaunee', 'In the account introduced by this University Press anthology, a woman descends from the sky world and land begins amid water.', 'https://web.ung.edu/media/university-press/becoming-america-v2.pdf'],
  ['cherokee', 'How the World Was Made', 'Cherokee', 'An earth-diver account in which a water beetle brings up the mud that spreads to form land.', 'https://web.ung.edu/media/university-press/becoming-america-v2.pdf'],
  ['pangu', 'Pangu', 'Chinese', 'Pangu is discussed as a primordial figure whose body contributes to the world.', 'https://academic.oup.com/book/44435/chapter-abstract/377431577'],
  ['ymir', 'Ymir', 'Norse', 'The cosmos is formed from the body of the primordial giant Ymir.', 'https://academic.oup.com/book/44435/chapter-abstract/377431577'],
  ['geb-nut', 'Geb and Nut', 'Egyptian', 'The earth and sky are personified as Geb and Nut and are separated in an Egyptian creation tradition.', 'https://academic.oup.com/book/44435/chapter-abstract/377431577'],
];

const steps = [
  ['/222', 'YEAR 222', 'Keep the names, versions, and sources with each account.', 'Read next', '/69'],
  ['/69', 'YEAR 69', 'Skip backward. Return to an account and follow the source before moving on.', 'Go to Year 3333', '/3333'],
  ['/3333', 'YEAR 3333', 'One last numbered chapter. The next page has no year labels or calendar navigation.', 'Erase time and calendars', '/beyond'],
];

const nav = [['Creation stories', '/stories'], ['Begin at Year Zero', '/']];
const storyURL = id => '/stories/' + id;

export function creation(site, path) {
  if (path === '/api/stories') {
    return json({ reading_count: readings.length, index_count: traditions.length, bibliography,
      readings: readings.map(([id, title, tradition, summary, source]) => ({ id, title, tradition, summary, source })),
      traditions });
  }
  if (path === '/') {
    return html(page(site, hero(site, '<a class="button" href="/stories">Explore creation stories</a>') +
      section('Follow the sequence', '<p>YEAR ZERO → YEAR 222 → YEAR 69 → YEAR 3333 → Origins</p><a class="button" href="/222">Go to Year 222</a>'), { nav }));
  }
  if (path === '/beyond') {
    const final = { ...site, headline: 'ORIGINS', description: 'Choose an account or search the research index.', line: 'Creation stories' };
    return html(page(site, hero(final, '<a class="button" href="/origins">Explore creation stories</a>') +
      section('Next publication', '<a class="button" href="/launch">Launch FUCK THE POLICE</a>'), { hideYear: true }));
  }
  if (path === '/launch') {
    const next = { ...site, title: 'FUCK THE POLICE', headline: 'FUCK THE POLICE', description: 'A public editorial about police accountability and peaceful civic action.', line: 'Nathan Tabor · Editorial' };
    return html(page(next, hero(next, '<a class="button" href="' + sites['police-accountability'].url + '/">Open the publication</a>'), { hideYear: true, title: next.title }));
  }
  const step = steps.find(item => item[0] === path);
  if (step) {
    const [, headline, description, label, href] = step;
    return html(page(site, hero({ ...site, headline, description }, `<a class="button" href="${href}">${label}</a>`), { title: headline, nav }));
  }
  if (path === '/stories' || path === '/origins') {
    const hideYear = path === '/origins';
    const storyLinks = readings.map(([id, title, label, description]) => ({
      title, label, description, href: hideYear ? '/origins/' + id : storyURL(id), action: 'Read account',
    }));
    return html(page(site, section('Creation stories', cards(storyLinks)) +
      section('Search the research index', `<p>${traditions.length} reference headings. A heading may cover multiple accounts. The index links to the reference’s table of contents.</p>
      <p><a href="${bibliography}">David A. Leeming’s encyclopedia · bibliographic source</a></p>
      <div class="controls"><label>Find a tradition<input data-filter type="search"></label><span data-count role="status">${traditions.length} matching entries</span></div>
      <ul class="story-list">${traditions.map(name => `<li data-item>${escapeHtml(name)}</li>`).join('')}</ul>`),
    { title: 'Creation stories', hideYear, nav: hideYear ? [] : nav }));
  }
  if (path.startsWith('/stories/') || path.startsWith('/origins/')) {
    const hideYear = path.startsWith('/origins/');
    const record = readings.find(([id]) => path.endsWith('/' + id));
    if (!record || path.split('/').length !== 3) return null;
    const [, title, tradition, summary, source] = record;
    return html(page(site, section(title, `<p class="eyebrow">${escapeHtml(tradition)}</p><p>${escapeHtml(summary)}</p><p><a href="${escapeHtml(source)}">Open source</a></p><p><a href="${hideYear ? '/origins' : '/stories'}">Back to creation stories</a></p>`),
      { title, hideYear, nav: hideYear ? [] : nav }));
  }
  return null;
}

export function police(site) {
  return html(page(site, hero(site, '<a class="button" href="#resources">Find public resources</a>') +
    section('Public records and civil rights', cards([
      { title: 'Report a civil rights violation', description: 'Use the U.S. Department of Justice Civil Rights Division’s official reporting portal.', href: 'https://civilrights.justice.gov/report/', action: 'Open reporting portal' },
      { title: 'Find federal records', description: 'Find out how to request records from a federal agency.', href: 'https://www.foia.gov/', action: 'Open FOIA.gov' },
      { title: 'Find the appropriate agency', description: 'Use the Justice Department’s directory for different types of complaints.', href: 'https://www.justice.gov/action-center/report-crime-or-submit-complaint', action: 'Open complaint directory' },
    ]), 'resources'), { nav: [['Resources', '#resources']] }));
}
