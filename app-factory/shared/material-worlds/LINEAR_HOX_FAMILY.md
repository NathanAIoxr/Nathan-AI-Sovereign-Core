# Linear Hox family: optional pattern studies

Framework attribution: Nathan Tabor's Tabor Decimal System. These helpers are game abstractions, not evidence that biology, cosmology, and hardware pipelines obey one exact structural law.

## Draft module
`linear_hox_patterns.py` supplies:
- Exponential strength falloff by distance, with explicit nonnegative finite inputs. Spatial distance does not become a clock unless a separate movement/time rule is defined.
- Finite modular combinations: one V and J, optionally one D. Three V, two D, two J give twelve VDJ profiles and six VJ profiles. This replaces the proposed contiguous slice, which could return multiple V or D segments.
- Bounded, configurable evenly spaced map coordinates. This is a level-design choice.

## Scientific limits
Retinoic acid is synthesized and degraded in regulated, tissue-dependent patterns. A single tail-source gradient with universal high=head/low=tail behavior is inaccurate. See White et al. (2007), https://pmc.ncbi.nlm.nih.gov/articles/PMC2080651/ and https://pmc.ncbi.nlm.nih.gov/articles/PMC1765950/.

V(D)J recombination joins selected gene segments under biological constraints; diversity also includes junctional processes. Cutting out an arbitrary contiguous interval does not model it, and diversity is not infinite. This toy omits those mechanisms. See https://pmc.ncbi.nlm.nih.gov/articles/PMC4914699/.

Baryon acoustic oscillations create a preferred statistical separation in large-scale clustering, not exact equal spacing or predetermined positions for individual galaxies. See the 6dF Galaxy Survey primary paper, https://openresearch-repository.anu.edu.au/server/api/core/bitstreams/d4dbf728-b55d-46ea-9c1b-eb3a1b7c6dfd/content.

## Consumer-facing application proposal
For Find the Star of Bethlehem: distance falloff can control lantern reach; modular combinations can assemble an astronomical instrument from a lens, mount, and sight; spacing can support an optional route puzzle. These are proposals, not enabled features. Preserve the Christmas theme, existing gameplay, free access, and consumer control. Do not portray a fabricated puzzle route as a verified historical star location.

## Validation and availability
The module and test cases are draft source only. They are not imported by the browser games, Swift app, or live services. The current execution environment was unavailable, so these new Python tests have not been run. Run `python3 app-factory/shared/material-worlds/linear_hox_patterns_test.py` before runtime integration, followed by the existing engine/community checks. No claim of deployment to all apps is made.
