# SHIT TIHS by Nathan Tabor

**KJV / IFB Edition · STAR U BE / Tabor Enterprises**

A fictional early-’90s church paint crew turns a **SHIT HAPPENS** bumper sticker into a TIHS wave. Play through The Paint Crew Scaffolds, The Inside-Out Test, and THE STAR U R.

## Play

Use A/D or the left and right arrows to move. Jump with W, Up, or Space. At a work bay, use X three times to scrape, prime, and paint. The bumper sticker fires a TIHS wave that turns grime into gold, knocks back the rats, and gives you a boost. KJV relics let you trigger an extra wave with J. Once every bay is painted and the sticker is found, use J beside the star. P or Escape pauses. Touch controls provide the same actions.

The website installs as a progressive web app, keeps your best score on the device, and plays offline after the initial online load. The Crew log includes printable cartridge and box labels.

## Run and verify

From this directory with Node.js 22 or later:

```sh
node scripts/build-worker.mjs
node --test tests/*.test.mjs
python3 -m http.server 8080 --directory public
```

Open http://localhost:8080. Deploy the tested build with `node scripts/deploy.mjs` and a Cloudflare Workers write token and account ID in `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. The deployment creates or updates the independent `shit-tihs` Worker and enables its workers.dev URL. Refresh the cache version in `public/sw.js` when changing shipped assets.

## Cloudflare R2 release

The static files also run from a dedicated public R2 bucket, with `/index.html` as the entry point. When Worker and Pages quotas are full, deploy with `node scripts/deploy.mjs --r2` using the same account ID and a token with R2 write access. This deployment targets the existing `shit-tihs` bucket and its managed public URL.
