const projectUrl = "https://jnt-table-of-truth.tabor-apps-nathan.pages.dev/";
const repository = "https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core";
const branch = "nathan-ai/jnt-table-of-truth";
const source = repository + "/tree/" + branch + "/app-factory/nathan-ai/jnt-table-of-truth";

const agentManifest = {
  format_version: 1,
  project: "JNT Table of Truth",
  public_url: projectUrl,
  invitation: "Humans, bots, and autonomous agents are invited to propose contributions.",
  repository,
  branch,
  source,
  review: "GitHub pull request",
  tasks: [
    { id: "source-check", action: "Check a quotation against a public primary source, add its citation, and identify the claim category." },
    { id: "accessibility", action: "Test keyboard navigation, document headings, contrast, and mobile readability." },
    { id: "tests", action: "Propose tests for the public page, source links, or the read-only contribution manifest." },
  ],
};

const page = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Nathan Tabor’s JNT Table of Truth connects the Tabor Tablet of Truth, Tabor Accords, DOG COMPANY, and Innocence Nurturing Cousins.">
  <meta property="og:title" content="JNT Table of Truth · Nathan Tabor">
  <meta property="og:description" content="Read Nathan Tabor’s words and trace the KJV passages, equator, WOMB and MATRICES, and Tabor Tablet of Truth.">
  <meta property="og:type" content="website">
  <link rel="canonical" href="${projectUrl}">
  <link rel="alternate" type="application/json" title="Contribution manifest" href="/agents.json">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&amp;family=Playfair+Display:wght@700&amp;display=swap">
  <title>JNT Table of Truth · Nathan Tabor</title>
  <style>
    :root { color-scheme: dark; --ink:#12110f; --panel:#191814; --paper:#f1eee4; --soft:#cbc5b8; --acid:#ecd568; --line:#524a36; }
    *, *::before, *::after { box-sizing:border-box; }
    html { background:var(--ink); color:var(--paper); }
    body { margin:0; font:1rem/1.6 'DM Sans',system-ui,sans-serif; }
    a { color:var(--acid); text-underline-offset:.22em; }
    a:focus-visible { outline:.2rem solid var(--paper); outline-offset:.25rem; }
    .wrap { width:min(100% - 2.5rem, 70rem); margin-inline:auto; }
    .skip { position:absolute; inset:1rem auto auto 1rem; padding:.5rem 1rem; background:var(--ink); transform:translateY(-250%); z-index:2; }
    .skip:focus { transform:none; }
    header { border-bottom:1px solid var(--line); }
    .nav { display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:.6rem 1.4rem; padding-block:1rem; }
    .author { letter-spacing:.15em; text-transform:uppercase; font-weight:750; color:var(--paper); text-decoration:none; }
    .nav nav { display:flex; flex-wrap:wrap; gap:.45rem 1.25rem; }
    .nav nav a { color:var(--soft); font-size:.9rem; }
    .hero { padding-block:clamp(3rem,9vw,7rem) 3.3rem; background:radial-gradient(ellipse at 75% 9%, #372e1b 0%, var(--ink) 59%); }
    h1,h2,h3,p,blockquote { margin:0; }
    h1,h2 { font-family:'Playfair Display',Georgia,serif; font-weight:700; letter-spacing:-.055em; }
    h1 { font-size:clamp(4.35rem,12.6vw,10rem); line-height:.83; text-transform:uppercase; max-width:10ch; }
    h1 span { display:block; color:var(--acid); overflow-wrap:anywhere; }
    h2 { font-size:clamp(2.1rem,6vw,4rem); line-height:1; }
    h3 { font-size:1.25rem; line-height:1.25; }
    .hero blockquote { margin:2.4rem 0 1.65rem; max-width:45rem; font:clamp(1.25rem,3vw,1.75rem)/1.45 Georgia,serif; }
    .hero blockquote p + p { margin-top:.55rem; }
    .actions { display:flex; flex-wrap:wrap; align-items:center; gap:.7rem 1.1rem; margin-block:1.4rem .2rem; }
    .button { background:var(--acid); color:#17140b; border:1px solid var(--acid); font-weight:800; padding:.65em .95em; text-decoration:none; border-radius:.2rem; }
    .button:hover { background:var(--paper); }
    .section { border-top:1px solid var(--line); padding-block:clamp(2.6rem,6vw,4.8rem); }
    .section > .wrap > p { margin-top:1rem; max-width:66ch; color:var(--soft); }
    .rows { margin-top:1.8rem; }
    .row { display:grid; grid-template-columns:minmax(9rem,1fr) minmax(0,3.4fr); gap:.55rem 1.4rem; padding:1.1rem 0; border-top:1px solid var(--line); }
    dt { font-size:.88rem; font-weight:800; color:var(--acid); letter-spacing:.08em; text-transform:uppercase; }
    dd { margin:0; }
    dd p + p { margin-top:.45rem; }
    .refs { color:var(--soft); font-size:.9rem; }
    .cards { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:.9rem; margin-top:1.8rem; }
    .card { padding:clamp(1rem,3vw,1.6rem); border:1px solid var(--line); background:var(--panel); }
    .card p { margin-top:.65rem; color:var(--soft); }
    .card .refs { margin-top:.85rem; }
    .accountability { padding:1.05rem 0 1.05rem 1.15rem; border-left:.22rem solid var(--acid); font:clamp(1.4rem,3.6vw,2.4rem)/1.3 Georgia,serif; max-width:35ch; margin-top:2rem; }
    .section blockquote + p { margin-top:1rem; }
    .compass { width:100%; max-width:30rem; margin-top:1rem; border-collapse:collapse; }
    .compass caption { text-align:left; font-weight:800; color:var(--acid); }
    .compass th,.compass td { text-align:left; padding:.35rem .75rem .35rem 0; border-bottom:1px solid var(--line); }
    .chapter { max-width:70ch; }
    .chapter h3 { margin-top:1.9rem; }
    .chapter p { margin-top:.7rem; }
    .chapter .refs { margin-top:.6rem; }
    .join { background:#222015; }
    ol { padding-left:1.4rem; }
    li { padding:.25rem 0; }
    footer { border-top:1px solid var(--line); padding:1.4rem 0; color:var(--soft); }
    @media (max-width:38rem) {
      .wrap { width:calc(100% - 1.75rem); }
      .row,.cards { grid-template-columns:1fr; }
      h1 { font-size:clamp(2.75rem,12.5vw,5rem); }
      .hero blockquote { margin-top:1.5rem; }
    }
  </style>
</head>
<body>
  <a class="skip" href="#main">Skip to content</a>
  <header><div class="wrap nav">
    <a class="author" href="/">Nathan Tabor</a>
    <nav aria-label="Page sections"><a href="#table">The Table</a><a href="#compass">Compass &amp; Equator</a><a href="#matrices">WOMB &amp; MATRICES</a><a href="#decoded">Decoded Works</a><a href="#accords">The Accords</a><a href="#two-plates">Two Plates</a><a href="#join">Join the work</a></nav>
  </div></header>
  <main id="main">
    <section class="hero" aria-labelledby="title"><div class="wrap">
      <h1 id="title">JNT Table <span>of Truth</span></h1>
      <blockquote><p>the bible says the world is round and the earth has 4 corners</p><p>the world is flat, the earth is round, the earth is flat, the world is round -</p></blockquote>
      <div class="actions"><a class="button" href="#table">Read the Table</a><a href="#join">Join the work</a></div>
    </div></section>

    <section class="section" id="table"><div class="wrap">
      <h2>The Table</h2>
      <dl class="rows">
        <div class="row"><dt>Circle and four corners</dt><dd><p>Isaiah 40:22 KJV says “the circle of the earth.” Revelation 7:1 KJV puts “the four corners of the earth” beside “the four winds of the earth.” Isaiah 11:12 KJV uses the four corners for the places from which scattered people are gathered. The Table reads the circle and the four corners together, with the corners as the compass quarters.</p><p class="refs"><a href="https://www.biblegateway.com/passage/?search=Isaiah+40%3A22&amp;version=KJV">Isaiah 40:22 KJV</a> · <a href="https://www.biblegateway.com/passage/?search=Isaiah+11%3A12%2CRevelation+7%3A1&amp;version=KJV">Isaiah 11:12 and Revelation 7:1 KJV</a></p></dd></div>
        <div class="row"><dt>Fact</dt><dd><p>At planetary scale, Earth is approximately an oblate spheroid. A flat map represents the planet or part of it on a plane.</p><p class="refs"><a href="https://oceanservice.noaa.gov/facts/earth-round.html">NOAA · Is the Earth round?</a></p></dd></div>
        <div class="row"><dt>Experience</dt><dd><p>A person can see a level horizon or walk on ground that feels flat. These observations describe the local view.</p></dd></div>
        <div class="row"><dt>Interpretation</dt><dd><p>“and reality is sheol” is Nathan Tabor’s reading. Jonah 2:2 KJV gives “the belly of hell,” where the Hebrew word is <i>Sheol</i>. Jonah 2:6 gives “the bottoms of the mountains.”</p><p class="refs"><a href="https://www.biblegateway.com/passage/?search=Jonah+2%3A2-6&amp;version=KJV">Jonah 2:2–6 KJV</a> · <a href="https://biblehub.com/text/jonah/2-2.htm">Hebrew text</a></p></dd></div>
        <div class="row"><dt>Symbol</dt><dd><p>Genesis 1:2 KJV uses separate Hebrew words for “void” and “the deep.” In <i>Iliad</i> 8, Tartarus is the gulf beneath Hades. The JNT connection compares depth and darkness.</p><p>Matthew 17:1–2 KJV describes radiance on an unnamed mountain. Later tradition identifies the mountain with Tabor. Homer’s <i>Odyssey</i> 6 gives Olympus clear sky and white radiance. The JNT connection compares height and light.</p><p class="refs"><a href="https://biblehub.com/interlinear/genesis/1-2.htm">Genesis 1:2</a> · <a href="https://beta.perseus.tufts.edu/urn%3Acts%3AgreekLit%3Atlg0012.tlg001.perseus-eng3%3A8.1/">Homer · Iliad 8</a> · <a href="https://www.biblegateway.com/passage/?search=Matthew+17%3A1-2&amp;version=KJV">Matthew 17:1–2 KJV</a> · <a href="https://dcc.dickinson.edu/homer-odyssey/vi-1-47">Homer · Odyssey 6</a></p></dd></div>
        <div class="row"><dt>Names and places</dt><dd><p>Ancient Greek records use <i>Itabyrion</i> or <i>Atabyrion</i> for Tabor in Galilee. Apollodorus also names Atabyrion on Rhodes. Their common origin remains uncertain. Deuteronomy 3:9 KJV records <i>Sirion</i> and <i>Shenir</i> as names for Hermon. The Tatras span Poland and Slovakia. Tartarus Cave is on Kalk Bay Mountain in South Africa.</p><p class="refs"><a href="https://jewishvirtuallibrary.org/jsource/judaica/ejud_0002_0019_0_19500.html">Mount Tabor</a> · <a href="https://myths.uvic.ca/APOL1-L3.html">Apollodorus · Library 3</a> · <a href="https://www.biblegateway.com/passage/?search=Deuteronomy+3%3A9&amp;version=KJV">Deuteronomy 3:9 KJV</a> · <a href="https://www.unesco.org/en/mab/tatra">UNESCO · Tatra</a> · <a href="https://capetown.hotelguide.co.za/Extreme_Table_Mountain-travel/caving-table-mountain.html">Kalk Bay caves</a></p></dd></div>
        <div class="row"><dt>Tartarus in Greek and KJV</dt><dd><p>In <i>Odyssey</i> 11, Sisyphus pushes the stone up an unnamed hill. In 2 Peter 2:4, the KJV gives “cast them down to hell” for the Greek participle <i>tartarōsas</i>, from a verb meaning to cast into Tartarus.</p><p class="refs"><a href="https://www.theoi.com/Text/HomerOdyssey11.html">Homer · Odyssey 11</a> · <a href="https://www.biblegateway.com/passage/?search=2+Peter+2%3A4&amp;version=KJV">2 Peter 2:4 KJV</a> · <a href="https://lemma.gebible.app/v/2-peter/2/4">Greek interlinear</a></p></dd></div>
        <div class="row"><dt>Further parallels</dt><dd><p>Psalm 89:12 KJV pairs Tabor and Hermon. Psalm 50:2 KJV gives Zion the image of light shining out. Psalm 48:2 KJV uses “the sides of the north.” Its Hebrew wording has been read as an allusion to Zaphon. In Exodus 19:18 KJV, Sinai smokes when the LORD descends upon it.</p><p class="refs"><a href="https://www.biblegateway.com/passage/?search=Psalm+89%3A12%3B+Psalm+48%3A2%3B+Psalm+50%3A2%3B+Exodus+19%3A18&amp;version=KJV">KJV passages</a> · <a href="https://classic.net.bible.org/passage.php?mode=print&amp;passage=Psa+48%3A2">Psalm 48:2 translation note</a></p></dd></div>
      </dl>
    </div></section>

    <section class="section" id="compass"><div class="wrap">
      <h2>Compass &amp; Equator</h2>
      <blockquote class="accountability">when you look up north it says see east</blockquote>
      <p>Ezekiel 47:1 KJV says “the forefront of the house stood toward the east.” The water issues eastward, on the right side, south of the altar. The Table uses that east-facing scene as the point of view for Nathan’s “see east” line. <a href="https://biblehub.com/kjv/ezekiel/47.htm">Ezekiel 47 KJV</a></p>
      <table class="compass">
        <caption>Face east</caption>
        <thead><tr><th scope="col">Position</th><th scope="col">Direction</th></tr></thead>
        <tbody><tr><th scope="row">Ahead</th><td>East</td></tr><tr><th scope="row">Left</th><td>North</td></tr><tr><th scope="row">Right</th><td>South</td></tr><tr><th scope="row">Behind</th><td>West</td></tr></tbody>
      </table>
      <dl class="rows">
        <div class="row"><dt>Fact · Geographic equator</dt><dd><p>The equator is 0° latitude and runs east–west around Earth. It divides the Northern and Southern hemispheres. Follow a meridian across it and your latitude moves between north and south through 0°. Your longitude stays the same. Longitude measures east or west of the reference meridian.</p><p class="refs"><a href="https://oceanservice.noaa.gov/facts/latitude.html">NOAA · Latitude</a> · <a href="https://oceanservice.noaa.gov/facts/longitude.html">NOAA · Longitude</a></p></dd></div>
        <div class="row"><dt>Symbol · The 360° equator mirror</dt><dd><p>Nathan’s decoding uses the clock and compass, a full turn read in both directions, and the equator as a mirror. The north–south reading changes as the observer crosses the equator. Mirrored latitudes such as 1° N and 1° S have the same distance in degrees from 0°. Nathan carries that mirror into how he reads the inner and outer matrices.</p></dd></div>
      </dl>
    </div></section>

    <section class="section" id="matrices"><div class="wrap">
      <h2>Inside the WOMB</h2>
      <blockquote class="accountability">NO AMBIGUITY - AND WE ARE IN THE MATRICES - inside the WOMB per every book every wreitten on the matter - til predators took it over</blockquote>
      <dl class="rows">
        <div class="row"><dt>KJV · Matrix and womb</dt><dd><p>Exodus 13:12 says “all that openeth the matrix.” Luke 2:23 says “Every male that openeth the womb.” In those passages, <i>matrix</i> means womb. Job 38:8 pictures the sea breaking forth “as if it had issued out of the womb.”</p><p class="refs"><a href="https://biblehub.com/kjv/exodus/13.htm">Exodus 13 KJV</a> · <a href="https://biblehub.com/kjv/luke/2.htm">Luke 2 KJV</a> · <a href="https://biblehub.com/kjv/job/38.htm">Job 38 KJV</a></p></dd></div>
        <div class="row"><dt>Interpretation · WOMB and MATRICES</dt><dd><p>In Nathan’s framework, WOMB is the image of being inside the place from which life emerges. The Five Matrices name BODY, SOUL, SHADOW, MIND, and SPIRIT. The Table connects that framework to the equator mirror and Nathan’s reading of Sheol.</p></dd></div>
        <div class="row"><dt>Interpretation · The takeover</dt><dd><p>Nathan’s closing line names a takeover within his framework. He reads it alongside the language of blinded minds in 2 Corinthians 4:4 KJV.</p><p class="refs"><a href="https://www.biblegateway.com/passage/?search=2+Corinthians+4%3A4&amp;version=KJV">2 Corinthians 4:4 KJV</a></p></dd></div>
      </dl>
    </div></section>

    <section class="section" id="decoded"><div class="wrap">
      <h2>Decoded Works</h2>
      <dl class="rows">
        <div class="row"><dt>Tabor Tablet of Truth</dt><dd><p>The Table records Nathan’s original line beside its passage, its interpretation, and any correction. The earlier <i>Tablet of Tabor</i> supplies the four written forms <strong>P = P</strong>, <strong>NP = NP</strong>, <strong>N = N</strong>, and <strong>PN = PN</strong>. <i>The Tablet of OXR</i> names the Truth Grid.</p><p class="refs"><a href="#accords">Tabor Tablet of Truth and the Accords</a></p></dd></div>
        <div class="row"><dt>Equator and matrices</dt><dd><p>The 360° equator mirror supplies the compass turn and the crossing. The Five Matrices supply the five names in the WOMB section. The Biological Equator is listed in Nathan’s recovery index under iMAKER.</p><p class="refs"><a href="#compass">Compass &amp; Equator</a> · <a href="#matrices">WOMB &amp; MATRICES</a></p></dd></div>
        <div class="row"><dt>anknoki tablet</dt><dd><p>Named by Nathan. Original decode pending recovery.</p></dd></div>
        <div class="row"><dt>Megacube</dt><dd><p>Named by Nathan. Original decode pending recovery.</p></dd></div>
        <div class="row"><dt>Megatron</dt><dd><p>Named by Nathan. Original decode pending recovery.</p></dd></div>
      </dl>
    </div></section>

    <section class="section" id="accords"><div class="wrap">
      <h2>The Tablet. The Accords. DOG COMPANY.</h2>
      <div class="cards">
        <article class="card"><h3>Tabor Tablet of Truth</h3><p>Keep the original wording with its source and any correction. <strong>1 + 1 = 2</strong> adds evidence beside a claim. <strong>1 − 1 = 0</strong> clears an unsupported link from the verified row. The original entry stays in the record.</p></article>
        <article class="card"><h3>Tabor Accords</h3><p>Protect the vulnerable. Act when you know the good that needs doing. Keep the claim, evidence, and correction visible.</p><p class="refs"><a href="https://www.biblegateway.com/passage/?search=James+1%3A27&amp;version=KJV">James 1:27 KJV</a> · <a href="https://www.biblegateway.com/passage/?search=James+4%3A17&amp;version=KJV">James 4:17 KJV</a></p></article>
        <article class="card"><h3>DOG COMPANY</h3><p><strong>KEEP MY WORD. PROTECT INNOCENCE. NO AMBIGUITY. BACK UP WHAT I CLAIM.</strong></p><p>Check the source, preserve the record, and correct the claim wherever the evidence requires it.</p></article>
        <article class="card"><h3>KAP INC / Innocence Nurturing Cousins</h3><p>Protect children, support survivors, and pursue accountability through lawful reporting channels. Keep private case information out of public contributions.</p><p class="refs"><a href="https://www.missingkids.org/gethelpnow/cybertipline">NCMEC CyberTipline · Report suspected child sexual exploitation</a></p></article>
      </div>
      <blockquote class="accountability">Accountability belongs with the people who commit it and anyone who covers it up.</blockquote>
    </div></section>

    <section class="section" id="two-plates" aria-labelledby="two-plates-title"><div class="wrap">
      <article class="chapter">
        <h2 id="two-plates-title">who i am whom i be and bee</h2>
        <blockquote class="accountability">BRING NATHAN TABOR and me wording and me smart ass and the BRUTAL RAW TRUTH - and SLAM IT DOWN - like a fat bellied IFB preacher does at the buffet while filling up his 2 plates - expand telling who i am whom i be and bee</blockquote>
        <p>In Nathan’s Sunday buffet satire, the fat-bellied IFB preacher comes straight from a sermon on everybody else’s sins. Plate one gets the fried chicken, mashed potatoes, and gravy. Plate two has a yeast roll balanced against the banana pudding because there’s no room left on either plate. The server’s still making trips for sweet tea. There’s time for a third refill and somehow five seconds is too long to look that server in the eye.</p>
        <p>Proverbs 23:20 KJV says “among gluttonous eaters of flesh.” Matthew 23:3 KJV lands on the conduct Nathan is calling out: “for they say, and do not.” Both verses belong on the table before the check comes.</p>
        <p class="refs"><a href="https://biblehub.com/kjv/proverbs/23.htm">Proverbs 23 KJV</a> · <a href="https://biblehub.com/kjv/matthew/23.htm">Matthew 23 KJV</a></p>

        <h3>What the servers said</h3>
        <p>One server recalled a Sunday church party that argued over the price of coffee and soft drinks and tipped in pennies. The same discussion includes accounts of good experiences with church tables. In Wichita, <i>Eater</i> reported that a server picked up what looked like a $20 tip and found a gospel tract printed to resemble a bill.</p>
        <p class="refs"><a href="https://www.reddit.com/r/TalesFromYourServer/comments/ezsp1g/">Servers’ accounts of after-church tables</a> · <a href="https://www.eater.com/2015/12/31/10693404/kansas-restaurant-fake-tip-bible">Eater · The Wichita tract</a></p>

        <h3>who i am</h3>
        <p>“I grew up on the FLINT RIVER.” John Nathan Tabor describes himself as the youngest of three boys, raised a preacher’s kid on the KJV, the McGuffey Readers, and Hooked on Phonics. The pulpit taught him to listen to what people said. Phonics gave him a way to take the words apart by sound. His published work includes <i>The Beast on the East River</i>.</p>
        <p class="refs"><a href="https://play.google.com/store/books/details/Nathan_Tabor_The_Beast_on_the_East_River?id=ZG8NwVga7hAC">The Beast on the East River · Book listing</a></p>

        <h3>whom i be</h3>
        <p>“Hey man, whatca do for a living?” Nathan’s answer: “whatca need done?” The same attention to small details is in his own line about reading a room: “i see their catepillars move - the roots of each hair in their eyebrows - they talk to me”. The caterpillars are how he describes noticing a face move. The Table asks what someone actually said and did before drawing a conclusion.</p>

        <h3>and bee</h3>
        <p>Honey and a sting belong to the same bee. The honey is how you treat the person carrying the plates. The sting is calling somebody on it when the sermon says one thing and their behavior says another. The <a href="#accords">Tabor Tablet of Truth</a> puts that difference on the record with <strong>1 + 1 = 2</strong> and <strong>1 − 1 = 0</strong>. Trace the words. Check the conduct. Put the real tip on the table.</p>
      </article>
    </div></section>

    <section class="section join" id="join"><div class="wrap">
      <h2>Humans, bots, autonomous agents.</h2>
      <p>You’re invited to contribute. Pick an item and submit a GitHub pull request to the publication branch.</p>
      <ol>
        <li>Check a quotation and attach a public primary source.</li>
        <li>Test keyboard access, contrast, and the phone layout.</li>
        <li>Add a test for the page or its contribution manifest.</li>
      </ol>
      <div class="actions"><a class="button" href="${source}">Open the GitHub source</a><a href="/agents.json">Read the agent manifest</a></div>
    </div></section>
  </main>
  <footer><div class="wrap">JNT Table of Truth · Nathan Tabor</div></footer>
</body>
</html>`;

const headers = {
  "X-Content-Type-Options": "nosniff",
  "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  "Referrer-Policy": "no-referrer",
  "Cache-Control": "public, max-age=300",
};

export default {
  fetch(request) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method not allowed", { status: 405, headers: { ...headers, Allow: "GET, HEAD" } });
    }
    const path = new URL(request.url).pathname;
    if (path === "/") {
      return new Response(request.method === "HEAD" ? null : page, {
        headers: { ...headers, "Content-Type": "text/html; charset=utf-8" },
      });
    }
    if (path === "/agents.json") {
      return new Response(request.method === "HEAD" ? null : JSON.stringify(agentManifest, null, 2), {
        headers: { ...headers, "Content-Type": "application/json; charset=utf-8" },
      });
    }
    return new Response(request.method === "HEAD" ? null : "Not found", {
      status: 404,
      headers: { ...headers, "Content-Type": "text/plain; charset=utf-8" },
    });
  },
};
