export const mountRoot = '/tabor-sites/';
export const publicOrigin = 'https://unified-operations-cockpit.nathantaboract.workers.dev';
const definitions = [
  ['conductor', 'nathan-ai-conductor', 'The Conductor', 'The Conductor', 'Nathan AI · Operations', 'Verify a release, review jobs, and approve checked-in deployments.', 'pine'],
  ['zeros-and-ones', 'nathan-ai-zeros-and-ones', 'Zeros and Ones', 'Zeros and Ones', 'Nathan AI · GitHub and Cloudflare', 'Apply D1 migrations, deploy the Worker, and verify the running commit.', 'pine'],
  ['handling-life', 'handling-life-worker', 'Handling Life', 'Handling Life', 'Good Samaritan', 'Empathy → Sympathy → Compassion → The One.', 'pine'],
  ['christmas-toy-drive', 'christmas-toy-drive-worker', 'ChristmasToyDrive.com', 'Christmas is more than one day.', 'Christmas Toy Drive · 24 / 7 / 365', 'Find a tangible gift for the year-round toy drive. Browse books, art supplies, building sets and more.', 'pine'],
  ['cup-of-hope', 'daily-cup-of-hope-worker', 'The Daily Cup of Hope', 'The Daily Cup of Hope', 'Handling Life · Daily aid', 'Start with a cup. Browse practical ways to give water or a warm drink.', 'blue'],
  ['plate-of-love', 'daily-plate-of-love-worker', 'The Daily Plate of Love', 'The Daily Plate of Love', 'Handling Life · Daily aid', 'Put a meal on a plate. Browse practical ways to give a meal, fresh food or pantry staples.', 'brick'],
  ['site-builder', 'tabor-site-builder-worker', 'TABOR WEBSITE BUILDER', 'TABOR WEBSITE BUILDER', 'Nathan Tabor · The Conservative Voice', 'A browser-first publishing system built around short forms, an editorial queue, and pages with permanent article links.', 'ink'],
  ['year-zero', 'tabor-year-zero-worker', 'YEAR ZERO', 'YEAR ZERO', 'Nathan Tabor · Creation stories', 'Read creation accounts across cultures, then follow the sequence Nathan Tabor set.', 'night'],
  ['police-accountability', 'tabor-fuck-the-police-worker', 'FUCK THE POLICE', 'FUCK THE POLICE', 'Nathan Tabor · Police accountability', 'A public editorial project about police accountability, freedom of speech, and peaceful civic action.', 'brick'],
];
export const sites = Object.fromEntries(definitions.map(([id, name, title, headline, line, description, theme]) => [id, {
  id, name, title, headline, line, description, theme, url: `${publicOrigin}${mountRoot}${id}`,
}]));
export const aidIds = ['christmas-toy-drive', 'cup-of-hope', 'plate-of-love'];
export const projectOrder = ['handling-life', ...aidIds, 'site-builder', 'year-zero', 'police-accountability'];
export const legacy = {
  'handling-life': 'https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/tree/main/app-factory/sites/handling-life',
  'christmas-toy-drive': 'https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/tree/main/app-factory/christmas-toy-drive',
  'site-builder': 'https://cbn.com/article/not-selected/regent-leaders-world-nathan-tabor',
};
export const examples = {
  'christmas-toy-drive': [
    ['picture-book', 'Reading', 'Picture book', 'A new illustrated book for shared reading.', 1200],
    ['art-kit', 'Creative play', 'Art kit', 'Paper, washable markers, and coloring supplies.', 1800],
    ['building-set', 'Building', 'Building set', 'A new age-labeled construction toy with its instructions.', 2500],
    ['family-game', 'Shared play', 'Family game', 'A new game that can be played together.', 2000],
  ],
  'cup-of-hope': [
    ['warm-drink', 'Hot drinks', 'Warm drink', 'A serving of tea, coffee, or cocoa distributed by a local partner.', 300],
    ['drinking-water', 'Water', 'Drinking water', 'Water for a community distribution point.', 500],
    ['drink-station', 'Community', 'Community drink station', 'A starter supply of cups, water, and warm drinks for a gathering.', 3000],
  ],
  'plate-of-love': [
    ['hot-meal', 'Prepared meals', 'Hot meal', 'One prepared meal provided through a community partner.', 1000],
    ['produce-bag', 'Fresh food', 'Fresh produce bag', 'A bag of seasonal fruits and vegetables.', 1800],
    ['pantry-box', 'Pantry', 'Pantry staples box', 'Shelf-stable staples for several meals.', 3000],
  ],
};
