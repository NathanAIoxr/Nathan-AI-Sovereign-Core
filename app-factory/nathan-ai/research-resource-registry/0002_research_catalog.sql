INSERT INTO research_references (id, title, kind, url) VALUES
    ('sovereign', 'Nathan AI Sovereign Supercomputer', 'workspace', 'https://nathan-ai-sovereign-core.nathantaboract.workers.dev/'),
    ('supercomputer', 'Cloud Slayer Supercomputer catalog', 'workspace', 'https://tabor-apps-nathan.pages.dev/cloud-slayer/supercomputer'),
    ('hypercomputer', 'Cloud Slayer Hypercomputer catalog', 'workspace', 'https://tabor-apps-nathan.pages.dev/cloud-slayer/hypercomputer'),
    ('github', 'Nathan AI Sovereign Core', 'source', 'https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core'),
    ('cloud-slayer-tools', 'Cloud Slayer software and tool library', 'source', 'https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/tree/main/app-factory/nathan-ai/digital-flubber/cloud-slayer/tool-library'),
    ('clay-rules', 'Clay Mathematics Institute prize rules', 'rules', 'https://www.claymath.org/millennium-problems/rules/'),
    ('lean', 'Lean theorem prover', 'software', 'https://lean-lang.org/'),
    ('pytorch', 'PyTorch', 'software', 'https://pytorch.org/'),
    ('scroll-data', 'Vesuvius Challenge data', 'dataset', 'https://scrollprize.org/data'),
    ('offline', 'Service Worker API', 'software', 'https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API'),
    ('disclosure', 'HackerOne disclosure guidelines', 'disclosure_policy', 'https://www.hackerone.com/terms/disclosure-guidelines')
ON CONFLICT(id) DO NOTHING;

INSERT INTO research_opportunities
    (id, title, sponsor, status, award_usd, award_basis, deadline_local,
     deadline_timezone, status_note, official_url, checked_on)
VALUES
    ('clay-p-np', 'P vs NP', 'Clay Mathematics Institute', 'unsolved', 1000000, 'per_problem', NULL,
     NULL, 'See the Clay publication and acceptance rules.', 'https://www.claymath.org/millennium-problems/', '2026-11-19'),
    ('clay-riemann', 'Riemann Hypothesis', 'Clay Mathematics Institute', 'unsolved', 1000000, 'per_problem', NULL,
     NULL, 'See the Clay publication and acceptance rules.', 'https://www.claymath.org/millennium-problems/', '2026-11-19'),
    ('clay-yang-mills', 'Yang–Mills and the Mass Gap', 'Clay Mathematics Institute', 'unsolved', 1000000, 'per_problem', NULL,
     NULL, 'See the Clay publication and acceptance rules.', 'https://www.claymath.org/millennium-problems/', '2026-11-19'),
    ('clay-hodge', 'Hodge Conjecture', 'Clay Mathematics Institute', 'unsolved', 1000000, 'per_problem', NULL,
     NULL, 'See the Clay publication and acceptance rules.', 'https://www.claymath.org/millennium-problems/', '2026-11-19'),
    ('clay-bsd', 'Birch and Swinnerton-Dyer Conjecture', 'Clay Mathematics Institute', 'unsolved', 1000000, 'per_problem', NULL,
     NULL, 'See the Clay publication and acceptance rules.', 'https://www.claymath.org/millennium-problems/', '2026-11-19'),
    ('clay-navier-stokes', 'Navier–Stokes existence and smoothness', 'Clay Mathematics Institute', 'claim_under_review',
     1000000, 'per_problem', NULL, NULL, 'Clay announced an apparent solution on September 11, 2026. Its evaluation process is ongoing.',
     'https://www.claymath.org/year_type/2026/', '2026-11-19'),
    ('xprize-learning-moonshot', 'Accelerate Learning Moonshot Track', 'XPRIZE', 'open', 1000000, 'pool',
     '2027-02-15', NULL, 'Preliminary registration and qualifying submission date.', 'https://www.xprize.org/competitions/accelerate-learning', '2026-11-19'),
    ('xprize-learning-core', 'Accelerate Learning Core Track', 'XPRIZE', 'open', 5000000, 'pool',
     '2027-03-15', NULL, 'Preliminary registration and qualifying submission date.', 'https://www.xprize.org/competitions/accelerate-learning', '2026-11-19'),
    ('vesuvius-grand', 'Vesuvius Challenge 2027 Grand Prize', 'Vesuvius Challenge', 'open', 1000000, 'pool',
     '2027-06-25T23:59', 'America/Los_Angeles', 'Grand Prize awards total $1 million, including $800,000 for first place.',
     'https://scrollprize.org/prizes', '2026-11-19'),
    ('vesuvius-first-letters', 'Vesuvius Challenge First Letters', 'Vesuvius Challenge', 'open', 50000, 'per_scroll',
     '2027-06-25T23:59', 'America/Los_Angeles', 'See the eligible scrolls and open-source terms.',
     'https://scrollprize.org/prizes', '2026-11-19'),
    ('breakthrough-math', 'Breakthrough Prize in Mathematics', 'Breakthrough Prize', 'nomination_closed',
     3000000, 'per_award', NULL, NULL, 'The 2027 public nomination window closed. This is an annual nomination prize.',
     'https://breakthroughprize.org/News/100', '2026-11-19'),
    ('xprize-quantum', 'Quantum Applications', 'XPRIZE', 'check_track', 5000000, 'pool', NULL, NULL,
     'The main competition is in finals. Check the organizer for separate track eligibility and dates.',
     'https://www.xprize.org/competitions/qc-apps', '2026-11-19')
ON CONFLICT(id) DO NOTHING;

INSERT INTO compute_profiles (id, name, kind, state, capacity_note, workspace_id) VALUES
    ('classic-fp64', 'Sovereign Supercomputer · Classic FP64', 'cloud_cpu', 'verified',
     'Cloudflare Worker with a replay-verified 64-term dot-product receipt. This executor runs the existing dot-product kernel.', 'sovereign'),
    ('fabric-fp64', 'Sovereign Supercomputer · Expanded FP64', 'cloud_cpu', 'verified',
     'Cloudflare Worker with a replay-verified 64-term dot-product receipt. This executor runs the existing dot-product kernel.', 'sovereign'),
    ('physical-hpc', 'Physical HPC cluster', 'physical_hpc', 'requires_registration',
     'Register an owned or allocated cluster and its scheduler before running HPC workloads.', 'supercomputer'),
    ('hyper-gpu', 'Hypercomputer · GPU workspace', 'gpu', 'requires_registration',
     'Register a GPU allocation and its memory and storage limits before running training workloads.', 'hypercomputer'),
    ('hyper-quantum', 'Hypercomputer · Quantum workspace', 'quantum', 'requires_registration',
     'Register an authorized simulator or quantum provider allocation and its limits.', 'hypercomputer'),
    ('owner-device', 'Development workstation and device lab', 'owner_device', 'requires_registration',
     'Register the development machine and offline test devices.', NULL)
ON CONFLICT(id) DO NOTHING;

INSERT INTO research_assignments (id, opportunity_id, compute_id, reference_id, deliverable) VALUES
    ('p-np-examples', 'clay-p-np', 'owner-device', 'lean', 'Formalize finite SAT examples and existing reductions as reusable Lean exercises.'),
    ('riemann-examples', 'clay-riemann', 'owner-device', 'clay-rules', 'Prepare a reproducible small numerical notebook and document its precision limits.'),
    ('yang-mills-notes', 'clay-yang-mills', 'owner-device', 'clay-rules', 'Annotate the official problem statement and reproduce a published toy example.'),
    ('hodge-examples', 'clay-hodge', 'owner-device', 'lean', 'Prepare elementary worked examples and document prerequisites for formalization.'),
    ('bsd-examples', 'clay-bsd', 'owner-device', 'clay-rules', 'Build a small table of documented elliptic-curve examples.'),
    ('navier-numeric', 'clay-navier-stokes', 'fabric-fp64', 'sovereign', 'Record a deterministic FP64 round-trip as infrastructure validation for later numerical work.'),
    ('navier-review', 'clay-navier-stokes', 'owner-device', 'clay-rules', 'Follow Clay’s official evaluation updates and record references.'),
    ('learning-moonshot', 'xprize-learning-moonshot', 'owner-device', 'offline', 'Prototype offline literacy or numeracy exercises with synthetic test inputs.'),
    ('learning-core', 'xprize-learning-core', 'owner-device', 'offline', 'Build a low-bandwidth and offline test matrix for the learning prototype.'),
    ('scroll-grand', 'vesuvius-grand', 'hyper-gpu', 'pytorch', 'Benchmark a baseline ink detector on a documented public labeled scroll segment.'),
    ('scroll-first', 'vesuvius-first-letters', 'hyper-gpu', 'scroll-data', 'Record a public-data baseline with fixed train and validation splits.'),
    ('quantum-reproduction', 'xprize-quantum', 'hyper-quantum', NULL, 'Reproduce a published small quantum-algorithm example in a simulator.')
ON CONFLICT(id) DO NOTHING;
