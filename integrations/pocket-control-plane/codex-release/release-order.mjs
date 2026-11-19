export const catalogGroups = [
  ['numbered', 'Numbered Codex series'],
  ['kodex', 'Kodex'],
  ['codex', 'Named Codex editions'],
  ['nodes', 'Nodes and AI nodes'],
  ['recovery', 'Original-source recovery'],
  ['standalone-apps', 'Standalone apps'],
];

export const crosshairs = {
  id: 'codex-crosshairs',
  worker: 'tabor-codex-crosshairs',
  path: '/work/codex-crosshairs/',
  views: 9,
};

const numberedIds = Array.from({ length: 10 }, (_, index) => 'codex-0' + index);

export function validateCatalogOrder(manifest) {
  const expected = [...numberedIds, 'codex-01-it'];
  if (manifest.filter(row => row.group === 'numbered').map(row => row.id).join(',') !== expected.join(',')) {
    throw new Error('The numbered Codex originals must run from 0 through 9, followed by the separate IT edition.');
  }
  let lastGroup = -1;
  for (const project of manifest) {
    const group = catalogGroups.findIndex(([id]) => id === project.group);
    if (group < 0 || group < lastGroup || project.id === crosshairs.id || project.worker === crosshairs.worker) {
      throw new Error('Invalid Pocket Codex release order at ' + project.id);
    }
    lastGroup = group;
  }
}

export function orderedRelease(projects) {
  return {
    groups: catalogGroups.map(([id, title]) => ({
      id, title, projects: projects.filter(project => project.group === id).map(project => project.id),
    })),
    crosshairs: { ...crosshairs, sources: [...numberedIds] },
    jobs: [
      { id: 'validate-and-build', runner: 'GitHub Actions', job: 'Validate catalog order and build the separate Worker modules' },
      { id: 'verify-published', runner: 'GitHub Actions', job: 'Check the published order and Workers, then sign the build receipt' },
      { id: 'verify-hourly', runner: 'Cloudflare Worker', job: 'Verify ordered stations, Crosshairs, and connected standalone apps', cron: '11 * * * *' },
    ],
  };
}

export function verifyCrosshairs(payload, ids = numberedIds) {
  const entries = payload?.entries;
  const views = payload?.views;
  const anchors = payload?.anchors;
  if (!Array.isArray(entries) || entries.map(row => row?.id).join(',') !== ids.join(',') ||
      !Array.isArray(anchors) || anchors.map(row => row?.id).join(',') !== 'mother-earth,human-mind' ||
      anchors.map(row => Array.isArray(row?.origin) ? row.origin.join(',') : '').join(';') !== '0,0,0;0,0' ||
      !Array.isArray(views) || views.length !== crosshairs.views) return false;
  const directions = ['forward', 'backward', 'upside-down'];
  const mirrors = ['this-side', 'as-mirror', 'other-side'];
  return directions.every(direction => mirrors.every(mirror => {
    const view = views.find(row => row?.id === direction + ':' + mirror);
    if (!view || view.direction !== direction || view.mirror !== mirror ||
        view.rotation !== (direction === 'upside-down' ? 180 : 0) ||
        view.flipGlyphs !== (mirror === 'other-side') || !Array.isArray(view.positions)) return false;
    const reverse = (direction !== 'forward') !== (mirror === 'other-side');
    const expected = reverse ? [...ids].reverse() : ids;
    return view.positions.map(position => position?.id).join(',') === expected.join(',');
  }));
}


export function verifyCrosshairsCollections(payload, release) {
  const ids = release.groups.flatMap(group => group.projects);
  const groups = [
    ['originals', release.crosshairs.sources],
    ['all', ids],
    ...release.groups.map(group => [group.id, group.projects]),
  ];
  if (!Array.isArray(payload?.collections) || !Array.isArray(payload.entries)) return false;
  const membership = payload.collections.map(group => [group?.id, group?.projects]);
  return JSON.stringify(membership) === JSON.stringify(groups) &&
    payload.entries.map(entry => entry?.id).join(',') === ids.join(',');
}
