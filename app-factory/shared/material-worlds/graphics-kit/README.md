# Tabor graphics and animation workshop

Shared creative direction: Nathan Tabor. New code/vector assets authored for this request. This is a source-delivered standalone tool; no production app has been modified by this addition.

## Included
- 44 SVG assets: 26 labeled icons (including all nine foundations), five elemental shield gems, twelve isometric building variants (four buildings, three tiers), and a decorative Bethlehem scene.
- Standalone responsive HTML workshop: three palettes, particle auditions, a 7 × 5 visual board, reduced motion controls, optional chimes, settings import/export, editable keyframe director, and the 63-option search catalogue.
- Four editable animation cues: idle, cut-in, impact, reveal. Linear interpolation uses smoothstep easing. Cue export provides data; browser playback is an audition, not a skeletal rig.
- Local PNG atlas packer: numbered stable frame IDs, duplicate filenames allowed, 2px transparent gutters, PNG plus JSON export. Maximum 32 PNG inputs, 1 MiB each, 16 million decoded pixels total, 4096 × 4096 atlas. No automatic trimming, edge extrusion, WebP/KTX conversion, or skeletal animation exporter.
- Optional host effect adapter with configurable particle caps, resize support, visibility/reduced-motion handling, and teardown. It consumes confirmed display events, not scoring or combat commands.

## Open
Download this directory with its relative files and open index.html in a current browser. No installation or server is required. Assets and the catalogue are local; no external fonts, telemetry, APIs, uploads, or authentication. Browser file and canvas support still require QA on actual targets.

For a static host, publish this complete directory after testing. The hosted Bethlehem game is not changed by merely committing these files.

## Host integration
Load graphics-core.js and host-adapter.js. Supply a separate overlay canvas sized with CSS, pointer-events:none and aria-hidden=true. Keep its positioning scoped to the game container; do not steal pointer input. Initialize via TaborGraphicsFX.attach(canvas,{motion:false,particles:true,budget:96}). Only after a consumer enables motion, call configure({motion:true}). The OS reduced-motion preference still overrides it.

After a confirmed match, call emit('match',{x:120,y:80,element:'fire'}). Other accepted cues are star, heal, impact. Call destroy() when the host screen unmounts. Do not submit combat scores, modify saved game arrays, or open network connections from the presentation adapter. Adapters must be integrated and engine/community checks rerun per app before deployment.

## Validation actually performed
graphics-core.js was executed in the available JavaScript tool runtime. graphics.test.cjs passed 8,976 checks covering 40 seeded packing/particle scenarios, rectangle overlap/bounds, keyframe interpolation, deterministic streams, expiry, invalid inputs, and reduced-motion samples. studio.js and host-adapter.js passed JavaScript syntax compilation there.

No Node shell, DOM browser, visual screenshot, mobile GPU, audio device, PNG decoder, native Swift compiler, or live Site deployment was available. Those behaviors are source-reviewed but unverified. The effect adapter is not yet imported by a host app. PNG packing's geometry is checked; browser file decoding/export is not.

## Scope still outstanding
Production-painted character sets, layered PSD/Clip Studio sources, complete Spine/Live2D rigs, large world map art, production audio mastering, native adapters, a full 63-option implementation, remote raids, authenticated human wars, economy services, weather services, neural training, and live app rollout are not delivered by this source kit. Generated art, if shown in chat, is a separate concept illustration until imported and tested.

The star and Bethlehem skyline here are decorative, not verified ephemeris coordinates or historical proof. The original game saves and private master data remain separate. No paid tokens or purchase gates.
