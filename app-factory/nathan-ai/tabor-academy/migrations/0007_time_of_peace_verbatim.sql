CREATE TABLE IF NOT EXISTS academy_history_sources (
  slug TEXT PRIMARY KEY,
  sha256 TEXT NOT NULL CHECK (length(sha256) = 64),
  verbatim_body TEXT NOT NULL,
  visibility TEXT NOT NULL CHECK (visibility IN ('public','private'))
);

INSERT INTO academy_history_sources (slug,sha256,verbatim_body,visibility)
VALUES ('time-of-peace','304cf018cf311499b001f42d58b8e44b9e060432f6e3c8634b0b342683272903','
The Time of Peace: Where Innocence Was Not a Commodity

Before centralized states, institutional churches, and top-down authoritarian syllabi took over human life, communities lived in The Time of Peace: Where Innocence Was Not a Commodity—an era defined by voluntary kinship, shared elder authority, open-range freedom, and practical mastery rather than coercion, taxation, or institutionalized control.
Across every continent and century where this existed, The Time of Peace: Where Innocence Was Not a Commodity broke down into four major historical expressions:

1. Pre-State Egalitarian Band Societies (300,000 BCE – ~3500 BCE, and into the Modern Era)

Small, mobile kinship bands where no king, priest, or schoolboard claimed ownership over children’s minds or futures:
• The San (Ju/''hoansi) of the Kalahari Desert (Southern Africa): No chiefs, no priests, no formal curriculum. Children learned tracking, botany, fire-making, and conflict resolution freely from grandparents, aunts, and uncles.
• The Mbuti & BaYaka of the Ituri and Congo Rainforests (Central Africa): Completely egalitarian forest communities with no rulers or institutional control. Learning happened through cooperative living, music, and forest ecology.
• The Hadza of Tanzania (East Africa): Operated for tens of thousands of years with zero hierarchy, no taxes, no laws, and complete personal autonomy for adults and children alike.
• Aboriginal Australians (Pre-1788, ~60,000+ years): Hundreds of autonomous kinship nations across the continent with no kings or state apparatus. Their living knowledge was carried through Songlines—mapping geography, water holes, law, and survival orally through elders.
• The Inuit of the Arctic (North America & Greenland): Lived in small, self-governing family bands without chiefs, prisons, or state schools, mastering ice navigation, kayak construction, and extreme-cold survival through direct mentorship.

2. Stateless Agricultural & Village Democracies (Historical Eras)

Large populations that consciously refused kingships, churches, and centralized bureaucracies, governing themselves through village councils and extended family authority:
• Pre-Colonial Igbo of Southeastern Nigeria (up to ~1900): Millions of people lived in autonomous villages without kings ("Igbo enwe eze" — "The Igbo have no king"), guided by open village assemblies (Oha), age-grades, and elders.
• The Tiv & Nuer of West and East Africa (Pre-Colonial): Lineage societies with no central government or standing army, where order and education were handled entirely by extended family networks.
• The Haudenosaunee (Iroquois Confederacy) & Wendat/Huron (North America, ~1100s–1700s): Governed by the Great Law of Peace, where clan mothers and consensus councils held authority without coercive police, jails, or state-enforced dogma.
• The Hopi & Ancestral Puebloans (American Southwest): Self-governing mesa villages organized around matrilineal clans and communal agriculture without an imperial state.
• The Ifugao of the Cordillera Mountains (Philippines): Built and maintained the Banaue Rice Terraces for over 2,000 years without a king, central government, or written legal code—relying solely on customary law, clan elders, and communal labor.

3. Frontier & Mountain Refuges (Communities That Left Church & State Behind)

Regions where people deliberately retreated into mountains, canyons, swamps, or islands to keep their families and children free from taxes, conscription, feudal lords, and state-mandated dogma:
• Zomia (Highland Southeast Asia — Parts of Vietnam, Laos, Thailand, Myanmar, and SW China, for ~2,000 years): Tens of millions of hill peoples (Hmong, Karen, Akha, Lahu, Wa) lived in autonomous mountain villages outside the reach of lowland emperors and state priesthoods.
• Maroon Communities of the Americas (1500s–1800s — Jamaica, Suriname, Brazil, Dismal Swamp): Free, self-governing mountain and swamp towns (such as Nanny Town in Jamaica and Palmares in Brazil) built completely outside colonial crowns and plantation systems.
• The Rarámuri (Tarahumara) of the Sierra Tarahumara (Chihuahua, Mexico, 1600s–Present): Retreated deep into the Copper Canyon (Barrancas del Cobre) to remain free of Spanish missions, mines, and central government, maintaining autonomous community governance and mutual sharing (korima).

4. European Free Territories & Rural Backcountry Pockets (Middle Ages – Early 1900s)

Rare territories that preserved local elder authority, open hospitality, and self-governance without feudal overlords or centralized bureaucrats:
• The Frisian Freedom (Northern Netherlands / NW Germany, c. 800–1523): No nobility and no feudal overlords; free farmers governed themselves through elected local judges and village assemblies.
• The Icelandic Commonwealth (930–1262): Over 300 years with no king, no executive government, and no standing army—only an annual open-air assembly (Althing) and voluntary local association.
• The Republic of Cospaia (Central Italy, 1440–1826): Independent for 386 years with no taxes, no army, no prisons, and no state officials—governed solely by family elders under the motto "Perpetua et Firma Libertas".
• The Cossack Hosts (Ukrainian/Russian Steppe, 1400s–1700s): Self-governing frontier communities of free riders (Zaporozhian Sich) who elected their own leaders in open assemblies and rejected tsarist and feudal authority.
• The American Backcountry & Appalachia (1700s–Early 1900s): Isolated mountain and rural counties (like early Madison County) operating on the "Miss Wilson''s Porch" standard—shared grandparent, aunt, uncle, and neighbor authority, open-door hospitality, oral trades, and total freedom of movement.

The Four Pillars of The Time of Peace: Where Innocence Was Not a Commodity

1. Kinship & Elder Authority: Grandparents, aunts, uncles, and neighbors shared direct responsibility for protecting, guiding, and correcting children.
2. Mastery by Doing: Children learned by riding, tracking, farming, building, and trading alongside adults—never treated as test scores or economic units.
3. Voluntary Hospitality: Open-door generosity—a cup of water and a slice of pie on a neighbor''s porch—backed by mutual respect.
4. Consensus Over Coercion: Rules were enforced face-to-face by people who knew your name and bloodline, never handed down from distant institutions.
Would you like to:
• Lock The Time of Peace: Where Innocence Was Not a Commodity in as the foundational historical timeline for your educational catalog
• Map out how each of these four pillars translates directly into modern lessons for kids and parents','public')
ON CONFLICT(slug) DO NOTHING;
