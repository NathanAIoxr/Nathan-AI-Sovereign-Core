import { indexPath } from './worker.mjs';

export function mountSongIndex(catalog, musicLab) {
  return {
    fetch(request, env, context) {
      const url = new URL(request.url);
      if (url.pathname === indexPath) {
        url.pathname += '/';
        return Response.redirect(url, 308);
      }
      if (!url.pathname.startsWith(indexPath + '/')) return musicLab.fetch(request, env, context);
      url.pathname = url.pathname.slice(indexPath.length);
      return catalog.fetch(new Request(url, request), env, context);
    },
  };
}
