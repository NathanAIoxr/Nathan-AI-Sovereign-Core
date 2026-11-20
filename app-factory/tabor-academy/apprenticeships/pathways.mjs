const slug = value => value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function group(id, title, status, era, description, sources, entries) {
  const programs = entries.trim().split("\n").map(line => {
    const [name, project] = line.trim().split(" | ");
    if (!name || !project) throw new Error("Incomplete pathway in " + id);
    return { id: slug(name), name, project };
  });
  if (new Set(programs.map(program => program.id)).size !== programs.length) throw new Error("Duplicate pathway in " + id);
  return { id, title, status, era, description, sources, programs };
}

export const labels = {
  current: "Current college example",
  retired: "Documented past offering",
  reconstruction: "Evidence-based reconstruction",
  documented: "Documented historical record",
  living: "Living tradition",
  proposed: "Proposed Academy pathway",
};

export const schools = [
  group("community-college", "Community college and employer models", "current", "Present day",
    "Harper pairs college courses with structured job learning. GTCC publishes certificate and AAS pathways. North Seattle shows how a college can teach a specialized bench craft. The named provider establishes the type of program and any credential. Ask the provider about openings.",
    ["harper", "harperFaq", "harperHealth", "gtcc", "gap", "seattle", "nc"], `
Precision machining · Harper College | With a mentor, read a part drawing and build a sample inspection plan.
Industrial maintenance · Harper College | Make a preventive maintenance checklist for an isolated training rig.
Electromechanical technician · Harper College | Trace a de-energized signal path and explain the input, process and output.
Welding technology · Harper College | Review weld coupons supplied by an instructor and classify visual defects.
General insurance · Harper College | Compare two fictional coverage summaries and document questions for a supervisor.
Banking and finance · Harper College | Reconcile a training ledger and explain one discrepancy to a reviewer.
Supply chain management and logistics · Harper College | Plan a small delivery under changing inventory and transport conditions.
IT generalist · Harper College | Document and resolve a help-desk ticket in an authorized practice environment.
Graphic arts print production · Harper College | Prepare a proof, check registration and record corrections.
Health careers · Harper College | Build a mock patient handoff using fictional records and the mentor’s privacy checklist.
Manufacturing technology machining · GTCC | Compare the college’s certificate and AAS course sequences and read a sample drawing.
Mechatronics · Guilford Apprenticeship Partners | Map sensors and actuators on a low-voltage classroom demo.
Watch technology · North Seattle College | Inventory parts of a training movement, map its assemblies and use an instructor’s service log.
`),
  group("dropped", "Documented college and trade-school withdrawals", "retired", "1980s to 2026",
    "Butler County Community College’s October 21, 2026 board action retired specific programs. North Bennet Street School documents its 1980s trade-school changes. The exercises below are Academy restoration designs. North Seattle’s watch technology example appears in Current college examples.",
    ["bc3", "bennet", "seattle"], `
Apprenticeship Technology certificate 082 · Butler County Community College | Reconstruct the link between related instruction and employer training in a modern pathway plan.
Basic Manufacturing certificate 081 · Butler County Community College | Document a supervised process from material receipt to inspection.
Machine Tool Technology workplace certificate 042 · Butler County Community College | Produce a dimensioned inspection sheet using sample parts.
Energy Technology workplace certificate 080 · Butler County Community College | Map energy inputs and losses from a mock facility’s readings.
Applied Industrial Technology 326 · Butler County Community College | Build a quality-control plan for a classroom production line.
Architectural Design & Drafting 304 · Butler County Community College | Draw a measured room plan and reconcile two revisions.
Computer Aided Machining Technology 340 · Butler County Community College | Translate a sample part drawing into a simulated inspection sequence.
Photography 277 · Butler County Community College | Archive a contact sheet and document exposure choices.
Camera Repair · North Bennet Street School | Identify components and document a fault on a nonpowered training camera.
Offset Printing · North Bennet Street School | Inspect registration, ink coverage and the order of operations on sample proofs.
Watch & Clock Repair · North Bennet Street School | Create a movement condition map using a training clock.
`),
  group("before-caves", "Before the Cave · Deep-time skills", "reconstruction", "Early archaeological record",
    "Lomekwi 3 provides approximately 3.3-million-year-old stone-tool evidence. Artifacts can support conclusions about manufacture and use. These safe teaching exercises reconstruct tasks from evidence and make their assumptions visible.",
    ["lomekwi", "stone", "shelters"], `
Stone selection and fracture evidence | Mark striking surfaces and fracture features on photographs and compare clay models.
Hammerstone and pounding surfaces | Compare wear patterns on reference images and explain two possible uses.
Cutting-edge comparison | Match replica tool profiles to sample classroom tasks and document where the inference breaks down.
Material sourcing and mobility | Plot hypothetical stone sources and camps and compare two plausible travel routes.
Landscape reading | Build a map with water, shade, wind and travel constraints from an imaginary site.
Tracking from traces | Identify direction from safe model footprints and describe the limits of the evidence.
Ground vibration and listening | Compare how taps travel through two tabletop materials and record what a listener can tell.
Shelter placement | Compare tabletop shelter sites by wind, drainage, access and likely archaeological preservation.
Cooperative carrying | Use a lightweight classroom model to compare one-person and team workflows.
Archaeological interpretation | Give a second learner an artifact photo and ask them to reproduce your observation before revealing your interpretation.
`),
  group("caves-and-camps", "Cave, rockshelter and open-air camp", "reconstruction", "Hearths, shelters and portable skills",
    "The archaeology of caves, open-air sites and shelters preserves different traces. Model techniques with classroom-safe materials and identify which evidence survives for each case.",
    ["shelters", "stone", "intangible"], `
Hearth evidence and heat management | Sort simulated hearth records by burning, disturbance and uncertainty.
Shelter framing and insulation | Compare airflow through two tabletop shelters under matching conditions.
Pigment and visual storytelling | Reconstruct a visual story on paper using non-toxic classroom colors and record interpretive alternatives.
Acoustics and echo | Draw two paths for a reflected sound and test in a supervised indoor space.
Cordage and knot comparison | Compare equal yarn lengths under a light classroom load and record slippage.
Basketry and carrying | Weave a paper or plant-fiber sample with a mentor and test its handling with light objects.
Hide-working interpretation | Compare documented tool marks and reproduce the geometry on fabric.
Bone and antler tools | Compare replica profiles using card or clay and record tradeoffs by task.
Sewing and clothing repair | Repair a practice seam and repeat under a change of fabric.
Food storage and seasonality | Make a dated, simulated supply ledger and compare seasonal storage options.
Water location and evidence | Map candidate water sources and explain what independent testing would still be needed.
Campsite sanitation | Design a model camp and explain how waste and clean supplies remain separate.
Oral transfer and storytelling | Teach an ordered procedure aloud and check the learner’s delayed recall against the source.
Wayfinding by sky and terrain | Compare a tabletop route found by landmarks with one found by a paper sky guide.
`),
  group("farm-and-city", "Farm, village, ancient city and library", "reconstruction", "Agriculture and early settlements",
    "These pathways connect evidence of farming, records and water infrastructure with modern exercises. Each community and site has its own chronology and documentary record.",
    ["crops", "writing", "qanat", "intangible"], `
Seed selection and crop records | Compare labeled samples and build a growing-season journal.
Soil and compost stewardship | Test simulated soils for drainage and record what changes after amendment.
Irrigation and qanat modeling | Build a tabletop water channel and write a shared maintenance agreement.
Terracing and drainage | Compare runoff from two small classroom slope models under equal water input.
Animal care and herd records | Build a fictional care, feed and health-check log.
Granary and inventory | Track model grain lots through intake, storage, spoilage and issue.
Fermentation and preservation history | Compare historical records with current food guidance using sample labels.
Pottery and kiln history | Make a cold-clay vessel model and record shape, wall thickness and intended use.
Brick and earth construction | Compare drying and cracking in safe small material samples.
Spindle and fiber preparation | Compare two fiber samples with a mentor and record twist, consistency and breakage.
Loom weaving | Record an over-under sequence and have a second learner repeat the sample.
Dyeing and color recording | Compare safe classroom dyed swatches and write a repeatable batch record.
Scribal apprenticeship and tablets | Copy a published sample inscription drawing and record accuracy and interpretation separately.
Weights, measures and trade | Reconcile a sample merchant ledger with independently counted goods.
Surveying and geometry | Measure a classroom boundary and estimate how marking error affects the total.
Archive and organized memory | Build an index that lets another learner retrieve the original item and edition.
`),
  group("guild-and-workshop", "Guilds, indentures and workshop trades", "documented", "Historical apprentices and masters",
    "Archival records document some formal apprenticeships. Many family and informal arrangements left fewer records. Study the craft and compare who controlled pay, instruction, access and exit in the agreement.",
    ["archives", "intangible", "redlist"], `
Apprenticeship agreement and labor history | Annotate a public indenture and compare its obligations with a modern sponsor agreement.
Masonry and architectural carving | Copy a documented detail into a plaster-free clay model.
Journeyman carpentry and joinery | Identify the purpose of three prefabricated joint models and compare fit.
Cabinetmaking and veneering | Lay out a case on paper and check squareness on a classroom kit.
Coopering | Compare barrel profiles and use paper staves to model changing curvature.
Bookbinding and paper repair | Bind a blank practice booklet and document page order and materials.
Typesetting and letterpress | Lay out a mock page and troubleshoot spacing and register.
Foundry pattern history | Build a foam pattern model and explain how the original artifact shows manufacturing steps.
Artisan metal finishing | Use supplied samples to diagnose polishing and finishing differences.
Tailoring and pattern cutting | Adapt a practice pattern to a changed measurement and record fit.
Shoemaking and cobbling | Map the parts of a shoe and draft a repair intake note.
Saddlery and harness repair | Compare sample leather joints and write an inspection and replacement record.
Baking and shop accounts | Schedule a mock production day and reconcile ingredients and waste.
Compounding and apothecary history | Compare a historical label and a current official label without mixing or administering materials.
Instrument and navigation workshops | Compare historical instrument readouts with reference values and record uncertainty.
Merchant Navy indenture records | Review archived agreement fields and map the difference between written duties and inferred experience.
`),
  group("living-crafts", "Living crafts and community-held knowledge", "living", "Continuing traditions",
    "Join a practitioner-led pathway when invited and respect the community’s teaching and permission rules. These public projects use descriptive materials or ordinary craft samples. The UK Red List describes UK conditions for particular skills.",
    ["intangible", "canoe", "boat", "drystone", "redlist", "dine"], `
Carolinian wayfinding and canoe building | Compare a community-approved public description with a generic classroom navigation model and identify what requires practitioner permission.
Carriacou and Petite Martinique wooden boatbuilding | Read the UNESCO account and document stages and mentor roles from the public material.
Dry-stone construction | Compare small tabletop layouts and document where ties and drainage influence stability.
Diné learning, land and community | Summarize Diné College’s public educational philosophy in its own context and note which questions a community educator should answer.
Oral histories and community archives | Draft consent and withdrawal choices before recording a volunteered practice story.
Basketwork and chair seating | Compare repair materials on a loose sample and preserve a labeled reference pattern.
Coppice management and green woodworking | Map a mock rotation and compare wood moisture and movement in samples.
Thatching and roof heritage | Compare photographs and build a lightweight roof-covering model to observe runoff.
Lime plastering and traditional finishes | Examine cured conservation samples and document surface conditions before proposing treatment.
Stained-glass conservation | Make a paper design and record condition from museum images.
Tapestry and rug repair | Match weave structure and color to a practice patch.
Heritage ceramics | Label forming marks in reference photographs and document firing history from museum records.
Hand papermaking | Make a classroom pulp sheet and compare surface, thickness and mark-making.
Embroidery, quilting and lace | Teach a repeatable small sample and record the pattern and material.
Millinery and hat blocking | Compare brim and crown models and document the pattern for a finished sample.
Instrument repair and tuning | Document tuning changes using a classroom instrument and a tuner.
Signwriting and gilding | Produce a paper layout and compare samples under changing viewing distance.
Lettercutting and stone conservation | Trace a public inscription image and document legibility and surface damage.
`),
];

export const proposals = [
  group("industry-and-repair", "Industry, infrastructure and repair", "proposed", "Industrial to present",
    "Academy lab and mentoring pathways. Use the federal catalog for approved occupations and ask a sponsor to confirm current placement, eligibility, hours and credentials.",
    ["dol", "rap", "gtcc", "harper"], `
Electrical maintenance | Trace a diagram and document isolation steps on a de-energized training board.
Plumbing and pipefitting | Identify valves and diagnose a simulated leak on a nonpressurized board.
Heating, ventilation and refrigeration | Record airflow and temperature across a classroom ventilation model.
Industrial automation and robotics | Evaluate the sequence of a simulated robot cell and its interlocks.
Precision tooling and inspection | Compare sample readings from a gauge and write a tolerance report.
Construction and carpentry | Build a scale framing plan and check load assumptions with a qualified mentor.
Historic building restoration | Record conditions on a permitted site or case file and rank reversible repair options.
Machinery repair and rebuilding | Troubleshoot a de-energized training assembly and write a parts and reassembly record.
Electronics repair | Diagnose a low-voltage classroom board from a diagram and document the replacement.
Bicycle and mobility device repair | Inspect a training assembly with the maker’s checklist and record the service.
Appliance service and repair | Interpret a training appliance service diagram and classify faults without energizing it.
Textile machinery restoration | Document the parts and movement of a disconnected loom using a sample runbook.
Additive manufacturing and metrology | Compare a classroom printed component with its model and measure deviation.
Semiconductor cleanroom operations | Design a simulated material-flow and contamination-control checklist.
Water and wastewater operations | Read simulated water logs and distinguish sample handling from treatment decisions.
`),
  group("land-food-climate", "Land, food, ecology and climate", "proposed", "Present and future",
    "Mentor-guided work on food production, field records, habitat, water and resilient infrastructure. Exercise designs support safe classrooms and authorized field placements.",
    ["crops", "water", "qanat", "intangible"], `
Horticulture and plant propagation | Grow a labeled classroom sample and compare germination under two conditions.
Soil conservation and erosion control | Measure runoff from two small soil trays and record the intervention.
Forestry and habitat stewardship | Map succession and stewardship needs from a permitted walk or photo set.
Seed saving and community seed banks | Write a lot-label and storage plan with consent for exchange.
Beekeeping and pollinator habitat | Map flowering periods and monitor pollinator visits from a safe distance.
Aquaculture and water monitoring | Read a mock pond dataset and identify when a qualified operator should intervene.
Food pantry and supply continuity | Build a FIFO inventory and test a three-day outage scenario.
Institutional food service | Map receiving, allergen controls and service flow for a mock kitchen.
Watershed monitoring | Compare time-stamped observations and record likely sources of sampling bias.
Permaculture and site planning | Diagram flows of shade, water and human activity on a model site.
Urban agriculture and market logistics | Price a mock harvest and plan delivery and storage.
Stormwater mapping and flood readiness | Compare the runoff routes of two tabletop plans and locate bottlenecks.
Renewable energy and storage monitoring | Analyze a simulated production and load log to plan energy use.
Disaster recovery and community logistics | Map an evacuation, accessible shelter routes and inventory handoffs.
`),
  group("care-and-relationships", "Care, relationship skills and access", "proposed", "Present and future",
    "Public practice uses fictional scenarios. Professional care, clinical tasks and crisis response require the relevant training, supervision and authorization.",
    ["harperHealth", "pedagogy", "rap"], `
Emergency communication and first-aid readiness | Practice describing an incident to a qualified instructor and review when to call for help.
Patient navigation | Use a mock referral to assemble an appointment and follow-up checklist.
Home-care coordination | Prepare a fictional handoff and identify which tasks require trained providers.
Disability access assessment | Audit a practice route for mobility, hearing and visual access and test changes with consent.
Assistive-technology support | Compare two simulated accessibility setups and document the user’s preferences.
Peer support and referral | Role-play listening, boundaries and referral decisions with anonymous scenarios.
Kinship mentoring and boundaries | Respond to a fictional consent conflict and write a safe follow-up plan.
Child and family safeguarding | Practice recording observable facts and identify the reporting channel in a fictional case.
Elder companionship and accessibility | Build a practice visit plan with choices, consent and a communication fallback.
Youth mentoring and peer teaching | Prepare a monitored skills demonstration and test whether another learner can repeat it.
Inclusive recreation | Adapt a game rule to an accessibility need and run a consent-based trial.
`),
  group("community-and-enterprise", "Household, enterprise, and civic stewardship", "proposed", "Present and future",
    "Practice the work that keeps households, cooperatives and communities operating. Each pathway ends with a document that another person can check or use.",
    ["foia", "nc", "pedagogy", "rap"], `
Household bookkeeping and debt literacy | Reconcile three months of fictional statements and explain a changed balance.
Contract reading and plain language | Extract duties, charges, renewals and exit terms from a fictional agreement.
Cooperative governance | Write a decision log, voting checklist and conflict-of-interest policy for a mock co-op.
Records requests and records stewardship | Draft a narrow request and identify its actual custodian.
Civic meeting reporting | Compare meeting minutes, agenda, adopted text and an observer’s notes.
Tenant and housing navigation | Compare sample lease terms and identify questions to take to a local adviser.
Business intake and pricing | Estimate labor and material costs and compare them to a fictional quote and invoice.
Family archives and genealogy | Link a claim to a public record and mark whether the identification is certain.
Event and mutual-aid coordination | Allocate volunteer roles and practise a failed handoff with a contingency plan.
Consumer product verification | Use a test sheet to compare a seller’s claims against a product sample and its manual.
`),
  group("arts-and-communication", "Arts, language, media and preservation", "proposed", "Present and future",
    "Practice making, documenting and teaching with source references and permission for media or knowledge shared by others.",
    ["intangible", "redlist", "writing", "pedagogy"], `
Field recording and audio editing | Record approved sample sounds and write a clean edit log.
Phonetics and pronunciation mentoring | Compare two recorded pronunciations and check a learner’s delayed reproduction.
Live captioning and accessible publishing | Caption a short authorized clip and verify timing, names and readability.
Translation and interpretation practice | Compare a short authorized original and a translation and record disputed wording.
Museum collections care | Build a condition report and object location log for training replicas.
Digitization and cultural archive stewardship | Create a metadata record, checksum and permission label for a sample item.
Textile design and costume repair | Document fit and repair a fabric sample while preserving the source pattern.
Stage lighting and live sound | Diagram a supervised classroom cue sequence and test communication.
Print and digital visual design | Compare two versions of a proof and document the corrections.
Oral facilitation and teach-back | Teach one procedure using two accessible formats and measure transfer.
`),
  group("digital-and-frontier", "Digital systems, field science and future work", "proposed", "Edge and future",
    "Hands-on training in owned or authorized environments. Each pathway uses measurable outcomes, human supervision and a recoverable procedure.",
    ["dol", "ai", "pedagogy"], `
Software support and quality assurance | Reproduce an ordinary feature error in a demo and write a regression check.
Systems reliability and incident response | Recover an authorized training service from an outage using a status log.
Cybersecurity defense and privacy | Review permissions in an owned demo and document fixes and access rules.
Data stewardship and lineage | Trace a dataset through collection, cleaning, publication and correction.
AI oversight and evaluation | Test a small system for inaccurate output, record limits and define a human review point.
Digital accessibility engineering | Use keyboard navigation and assistive-tech checks on a demo interface.
Geospatial surveying and mapping | Produce a map from a permitted or public dataset and report position uncertainty.
Remote sensing and instrument calibration | Compare a photo, thermal reading and known reference condition.
Space systems ground operations | Run a simulated telemetry pass and document one lost signal.
Human factors and mission coordination | Run a tabletop handoff under changed conditions and compare error rates.
Microgrid and resilient infrastructure | Allocate power among simulated loads and document interruption priorities.
Knowledge recovery and long-term retention | Restore a sample archive from backup and have a second team verify the result.
`),
];

export const pathwayGroups = [...schools, ...proposals];
export const model = [
  ["Choose a path", "Start with a first project. Ask about daytime or evening hours, part-time study, accessibility, prior learning, transport, equipment and tuition."],
  ["Talk to a mentor or sponsor", "Get the contact, application process, expectations and eligibility in writing. For paid placements confirm starting pay, wage steps and who provides related instruction."],
  ["Build a stack", "Start with an orientation or short lab. Build toward a portfolio and certificate-level skills. Verify directly with a college whether any credit applies toward an approved certificate, diploma or associate degree."],
  ["Practice and document", "Pair related instruction with supervised work. Log tasks, hours or demonstrated competencies, feedback, safety needs and the date of the next review."],
  ["Demonstrate and transfer", "Show a mentor that you can repeat the skill under a changed condition. Ask which credentials, credits or records belong to which institution and what can travel with you."],
];
