/* TTFES&BTP — The Tabor Finger Electric Slide and Button Tapping Process
 * ORIGINAL CREATOR: Nathan Tabor. This standalone registry is a planning map.
 * "Local-ready" means this application can prepare a typed draft for that target;
 * it does NOT assert the target has an API, import schema, or automated posting.
 */
(function(root,factory){
 const value=factory();
 if(typeof module==='object'&&module.exports)module.exports=value;
 else root.TTFESCatalog=value;
})(typeof globalThis==='undefined'?this:globalThis,function(){
 'use strict';
 const FIELD={
 title:'Title / display name',subtitle:'Subtitle / short blurb',body:'Full description / narrative',
 bullets:'Bullet points / value statements',category:'Category / taxonomy',tags:'Tags / keywords (comma-separated)',
 author:'Author / contributors',price:'Price and currency proposal',goal:'Funding goal',
 duration:'Funding duration in days',rewards:'Reward tiers (structured prose or JSON)',
 delivery:'Delivery / fulfillment details',risks:'Risks and challenges',timeline:'Timeline / milestones',
 shipping:'Shipping and policies',sku:'Product SKU / reference',variants:'Variants / sizes / traits',
 stock:'Inventory quantity',seo_title:'Search title',seo_description:'Search description',
 image_alt:'Image descriptions / alt text',media:'Original media filenames / references',
 rights:'Rights, ownership, licenses (review)',disclosures:'Required disclosures (review)',
 language:'Language',file_refs:'Manuscript and file references',format:'Output / edition format',
 chapters:'Chapter or episode outline',excerpt:'Excerpt / preview',citations:'Citations / evidence',
 bibliography:'Bibliography / reading list',license:'License proposal',
 cover:'Cover artwork file reference',modules:'Modules and lessons',syllabus:'Syllabus / objectives',
 assessments:'Quizzes / evaluations',price_tiers:'Packages and tier inclusions',
 role:'Role / job title',skills:'Required skills',screening:'Screening questions',
 location:'Location / geography',availability:'Availability proposal',property:'Property details',
 amenities:'Amenities / facilities',rules:'House rules / property policies',
 rate:'Rental/nightly rate proposal',attributes:'Traits / item attributes',royalty:'Royalties / splits',
 wallet:'PUBLIC wallet reference (never credentials)',network:'Network / chain reference',
 budget:'Budget / spend proposal',target_audience:'Targeting summary',headlines:'Headline variations',
 calls_to_action:'Calls to action',landing_url:'Landing URL',schedule:'Schedule / timezone',
 captions:'Captions / transcript',timestamps:'Chapter timestamps',playlist:'Collection / playlist',
 status:'Draft visibility proposal',proposal:'Proposal / project abstract',
 organization:'Organization / entity name',entity_id:'Public reference identifier',
 objectives:'Objectives / expected impact',eligibility:'Eligibility and verification notes',
 budget_justification:'Budget justification',outcomes:'Measurable outcomes',certification:'Certifications to review (never auto-attested)',
 contacts:'Public contact information',privacy:'Privacy handling and data minimization',
 requirements:'Requirements / specifications',issue:'Issue or work item',repo:'Repository/project URL',
 branch:'Branch or version',changelog:'Release notes / changes',tests:'Test results / verification',
 environment:'Environment variables names only — NO secret values',
 record:'Structured record / data fields',relations:'Relationship / foreign key references',
 columns:'Columns / database properties',formula:'Formula / calculation (unexecuted)',
 classification:'Proposed Dewey / Duo Decimal / index coordinate',
 provenance:'Source identification, timestamps, factual status',source_id:'Original source ID',
 checksum:'SHA-256 integrity fingerprint',revisions:'Source vs. derived revision log',
 approval:'Named approval/authorization review',amount:'Currency amount to review',
 tax_info:'Tax information required (complete only on official site)',
 account_info:'Bank/account verification required (complete only on official site)',
 residency:'Residency / eligibility info (complete only on official site)',
 accessibility:'Accessibility review',policies:'Platform policies and compliance review',
 campaign_goal:'Campaign goals / outreach objectives',
 suppliers:'Supplier or production partners',attribution:'Credits / ownership attribution',
 inventory:'Asset inventory / attached reference files'
 };
 const BASE={
 'Crowdfunding':['title','subtitle','body','category','goal','duration','rewards','delivery','timeline','risks','budget','media','rights','disclosures'],
 'E-commerce':['title','subtitle','body','bullets','sku','variants','stock','price','tags','category','seo_title','seo_description','media','image_alt','shipping','rights','suppliers'],
 'Digital goods':['title','body','price','price_tiers','file_refs','license','rights','seo_title','tags','media','delivery'],
 'Books & publishing':['title','subtitle','author','body','excerpt','category','tags','language','file_refs','cover','rights','citations','classification','format'],
 'Blogs & newsletters':['title','subtitle','body','excerpt','tags','seo_title','seo_description','media','image_alt','schedule','rights'],
 'Education & courses':['title','subtitle','body','syllabus','modules','assessments','delivery','price_tiers','accessibility','citations','rights'],
 'Work & hiring':['title','subtitle','body','role','skills','screening','price_tiers','delivery','location','availability','rights'],
 'Creative portfolios':['title','body','tags','category','media','image_alt','attribution','rights','license','landing_url'],
 'Audio/video media':['title','subtitle','body','captions','timestamps','playlist','media','cover','tags','category','rights','schedule'],
 'Advertising & social':['title','headlines','body','calls_to_action','landing_url','tags','target_audience','budget','media','image_alt','schedule','rights','disclosures'],
 'Real estate':['title','body','property','location','amenities','rules','availability','rate','media','image_alt','policies','rights','disclosures'],
 'Web3 & assets':['title','body','attributes','network','royalty','wallet','media','license','rights','disclosures','risks'],
 'Learning management':['title','body','syllabus','modules','assessments','citations','accessibility','privacy','rights','schedule'],
 'Government & grants':['organization','title','proposal','objectives','eligibility','budget','budget_justification','outcomes','contacts','citations','disclosures','certification','privacy','timeline','rights'],
 'Civic & public records':['title','body','proposal','organization','citations','provenance','contacts','privacy','certification','rights'],
 'Development & publishing':['title','subtitle','body','requirements','issue','repo','branch','changelog','tests','environment','file_refs','license','rights'],
 'Knowledge & operations':['title','record','columns','relations','formula','classification','source_id','citations','provenance','revisions','rights','privacy'],
 'Payments & financial admin':['title','body','amount','budget','tax_info','account_info','certification','privacy','rights'],
 'Events & travel':['title','body','location','availability','schedule','price','policies','media','rights'],
 'Research & archives':['title','author','body','classification','source_id','citations','bibliography','provenance','checksum','revisions','rights'],
 'App distribution':['title','subtitle','body','bullets','category','tags','media','image_alt','privacy','accessibility','changelog','version','rights','disclosures'],
 'Communications & CRM':['title','body','headlines','target_audience','schedule','contacts','privacy','approval','rights']
 };
 FIELD.version='Version / release';
 const MARKERS={local:'Working offline draft + export',manual:'Manual field-copy workflow',restricted:'Human-only regulated submission'};
 const ROWS=[
 // Crowdfunding and funding launch
 ['Crowdfunding','Kickstarter','kickstarter','local'],
 ['Crowdfunding','Indiegogo','indiegogo','local'],
 ['Crowdfunding','BackerKit','backerkit','local'],
 ['Crowdfunding','GoFundMe','gofundme','local'],
 ['Crowdfunding','Patreon','patreon','local'],
 ['Crowdfunding','Ko-fi','ko-fi','local'],
 // E-commerce
 ['E-commerce','Shopify','shopify','local'],
 ['E-commerce','eBay Seller Hub','ebay','local'],
 ['E-commerce','Etsy Shop Manager','etsy','local'],
 ['E-commerce','Amazon Seller Central','amazon-seller','local'],
 ['E-commerce','WooCommerce','woocommerce','local'],
 ['E-commerce','BigCommerce','bigcommerce','local'],
 ['E-commerce','Squarespace Commerce','squarespace','local'],
 ['E-commerce','Wix Stores','wix-stores','local'],
 ['E-commerce','Printful','printful','local'],
 ['E-commerce','Printify','printify','local'],
 ['E-commerce','Redbubble','redbubble','local'],
 ['E-commerce','Spring','spring','local'],
 // Digital goods
 ['Digital goods','Gumroad','gumroad','local'],
 ['Digital goods','Lemon Squeezy','lemon-squeezy','local'],
 ['Digital goods','Payhip','payhip','local'],
 ['Digital goods','Sellfy','sellfy','local'],
 ['Digital goods','itch.io','itch','local'],
 // Books
 ['Books & publishing','Amazon KDP','kdp','local'],
 ['Books & publishing','IngramSpark','ingramspark','local'],
 ['Books & publishing','Draft2Digital','draft2digital','local'],
 ['Books & publishing','Kobo Writing Life','kobo','local'],
 ['Books & publishing','Apple Books for Authors','apple-books','local'],
 ['Books & publishing','Google Play Books','play-books','local'],
 ['Books & publishing','ISBN & Bowker Catalog','bowker','local'],
 ['Books & publishing','Library Metadata / MARC Planning','marc','local'],
 ['Books & publishing','ONE 33-Million Library','one-library','local'],
 ['Books & publishing','Tabor Transcript Transporter','transcript','local'],
 // Newsletters/blogs
 ['Blogs & newsletters','Substack','substack','local'],
 ['Blogs & newsletters','Ghost','ghost','local'],
 ['Blogs & newsletters','WordPress','wordpress','local'],
 ['Blogs & newsletters','Medium','medium','local'],
 ['Blogs & newsletters','Beehiiv','beehiiv','local'],
 // Education
 ['Education & courses','Teachable','teachable','local'],
 ['Education & courses','Thinkific','thinkific','local'],
 ['Education & courses','Kajabi','kajabi','local'],
 ['Education & courses','Udemy Instructor','udemy','local'],
 ['Education & courses','Moodle','moodle','local'],
 // Work/hiring
 ['Work & hiring','Upwork Project Catalog','upwork','local'],
 ['Work & hiring','Fiverr Gigs','fiverr','local'],
 ['Work & hiring','LinkedIn Jobs','linkedin-jobs','local'],
 ['Work & hiring','Indeed Employer','indeed','local'],
 ['Work & hiring','Contra','contra','local'],
 // Portfolio
 ['Creative portfolios','Behance','behance','local'],
 ['Creative portfolios','Adobe Portfolio','adobe-portfolio','local'],
 ['Creative portfolios','Shutterstock Contributor','shutterstock','local'],
 ['Creative portfolios','Adobe Stock Contributor','adobe-stock','local'],
 ['Creative portfolios','ArtStation','artstation','local'],
 ['Creative portfolios','Dribbble','dribbble','local'],
 // Media
 ['Audio/video media','YouTube Studio','youtube','local'],
 ['Audio/video media','Spotify for Creators','spotify-creators','local'],
 ['Audio/video media','Apple Podcasts Connect','apple-podcasts','local'],
 ['Audio/video media','ACX Audiobooks','acx','local'],
 ['Audio/video media','SoundCloud','soundcloud','local'],
 ['Audio/video media','Vimeo','vimeo','local'],
 ['Audio/video media','TikTok Studio','tiktok','local'],
 // Social & ads
 ['Advertising & social','Meta Ads Manager','meta-ads','local'],
 ['Advertising & social','Google Ads','google-ads','local'],
 ['Advertising & social','Pinterest Business','pinterest','local'],
 ['Advertising & social','LinkedIn Campaign Manager','linkedin-ads','local'],
 ['Advertising & social','Mailchimp Campaigns','mailchimp','local'],
 ['Advertising & social','Buffer','buffer','local'],
 // Property
 ['Real estate','Airbnb Host','airbnb','local'],
 ['Real estate','Vrbo Dashboard','vrbo','local'],
 ['Real estate','Zillow Rental Manager','zillow','local'],
 ['Real estate','Apartments.com','apartments','local'],
 ['Real estate','Realtor.com','realtor','local'],
 // Web3
 ['Web3 & assets','OpenSea','opensea','local'],
 ['Web3 & assets','Magic Eden','magic-eden','local'],
 ['Web3 & assets','Gitcoin','gitcoin','local'],
 ['Web3 & assets','Mirror.xyz','mirror','local'],
 ['Web3 & assets','Thirdweb Dashboard','thirdweb','local'],
 // LMS
 ['Learning management','Canvas LMS','canvas','local'],
 ['Learning management','Blackboard','blackboard','local'],
 ['Learning management','Google Classroom','classroom','local'],
 ['Learning management','Schoology','schoology','local'],
 // Government (strict human approval)
 ['Government & grants','Grants.gov','grants-gov','restricted'],
 ['Government & grants','SAM.gov','sam-gov','restricted'],
 ['Government & grants','NSF Research.gov','research-gov','restricted'],
 ['Government & grants','NIH eRA Commons','era-commons','restricted'],
 ['Government & grants','USASpending.gov Research','usaspending','manual'],
 ['Government & grants','State Grant Applications','state-grants','restricted'],
 ['Government & grants','County / Municipal Grants','local-grants','restricted'],
 ['Government & grants','Small Business Administration Programs','sba','restricted'],
 ['Civic & public records','FOIA.gov Request Preparation','foia','restricted'],
 ['Civic & public records','Regulations.gov Comment Preparation','regulations','restricted'],
 ['Civic & public records','City / County Public Meeting Materials','city-records','restricted'],
 ['Civic & public records','State Business Registries','state-registration','restricted'],
 ['Civic & public records','Federal Register Research','federal-register','manual'],
 ['Civic & public records','USPTO Application Preparation','uspto','restricted'],
 // Development
 ['Development & publishing','GitHub','github','local'],
 ['Development & publishing','GitLab','gitlab','local'],
 ['Development & publishing','Codeberg','codeberg','local'],
 ['Development & publishing','Vercel','vercel','local'],
 ['Development & publishing','Netlify','netlify','local'],
 ['Development & publishing','Hugging Face Spaces','huggingface','local'],
 ['Development & publishing','Tabor 1-2-3 Factory','tabor-factory','local'],
 ['Development & publishing','DUMMIE Publisher','dummie','local'],
 // Internal / knowledge
 ['Knowledge & operations','Airtable','airtable','local'],
 ['Knowledge & operations','Notion','notion','local'],
 ['Knowledge & operations','Google Drive','drive','local'],
 ['Knowledge & operations','Google Sheets','sheets','local'],
 ['Knowledge & operations','Microsoft Excel / SharePoint','excel','local'],
 ['Knowledge & operations','Trello','trello','local'],
 ['Knowledge & operations','Asana','asana','local'],
 ['Knowledge & operations','ClickUp','clickup','local'],
 ['Knowledge & operations','Nathan AI Research Matrix','nathan-research','local'],
 ['Knowledge & operations','Nathan AI Crypto Wallet Registry','wallet-registry','local'],
 ['Knowledge & operations','Nathan AI Mining Operations','mining-registry','local'],
 // Finance sensitive: planning only
 ['Payments & financial admin','Stripe Business Setup','stripe','restricted'],
 ['Payments & financial admin','PayPal Business','paypal','restricted'],
 ['Payments & financial admin','IRS Form Preparation','irs','restricted'],
 ['Payments & financial admin','State Tax Portal Preparation','state-tax','restricted'],
 // Events/travel
 ['Events & travel','Eventbrite','eventbrite','local'],
 ['Events & travel','Meetup Organizer','meetup','local'],
 ['Events & travel','Booking.com Partner','booking-partner','local'],
 // Research & archive
 ['Research & archives','Evidence & SHA-256 Archive','evidence','local'],
 ['Research & archives','FIND THE TABOR Genealogy','find-tabor','local'],
 ['Research & archives','Internet Archive Metadata','archive-org','local'],
 ['Research & archives','Zenodo Research Metadata','zenodo','local'],
 // Apps
 ['App distribution','Apple App Store Connect','app-store','local'],
 ['App distribution','Google Play Console','play-console','local'],
 ['App distribution','Microsoft Store','microsoft-store','local'],
 ['App distribution','Steamworks','steam','local'],
 // Communications
 ['Communications & CRM','HubSpot CRM','hubspot','local'],
 ['Communications & CRM','Salesforce CRM','salesforce','local'],
 ['Communications & CRM','ConvertKit / Kit','kit','local'],
 ['Communications & CRM','Constant Contact','constant-contact','local']
 ];
 const OVERRIDES={
 'kickstarter':['title','subtitle','category','body','goal','duration','rewards','delivery','timeline','risks','media','rights','disclosures'],
 'kdp':['title','subtitle','author','body','category','tags','language','file_refs','cover','format','rights','disclosures'],
 'etsy':['title','body','tags','variants','price','shipping','suppliers','rights','media','image_alt'],
 'grants-gov':['organization','title','proposal','objectives','budget','budget_justification','eligibility','outcomes','timeline','citations','disclosures','certification'],
 'sam-gov':['organization','entity_id','contacts','eligibility','certification','tax_info','account_info','rights','privacy'],
 'foia':['organization','proposal','citations','contacts','privacy','disclosures','timeline'],
 'regulations':['title','proposal','citations','body','organization','contacts','privacy','disclosures'],
 'github':['title','body','repo','branch','issue','requirements','changelog','tests','file_refs','license'],
 'youtube':['title','body','captions','timestamps','playlist','tags','media','image_alt','rights','disclosures'],
 'app-store':['title','subtitle','body','bullets','category','tags','media','image_alt','privacy','rights','accessibility','changelog'],
 'play-console':['title','subtitle','body','category','tags','media','image_alt','privacy','rights','accessibility','changelog'],
 'one-library':['title','subtitle','author','body','classification','source_id','citations','provenance','file_refs','language','rights'],
 'evidence':['title','source_id','citations','provenance','checksum','revisions','rights','privacy','approval'],
 'find-tabor':['title','author','body','source_id','citations','bibliography','provenance','revisions']
 };
 const TARGETS=Object.freeze(ROWS.map((r,i)=>Object.freeze({
   sector:r[0],name:r[1],id:r[2],workflow:r[3],sortIndex:i,
   fields:Object.freeze((OVERRIDES[r[2]]||BASE[r[0]]).map(key=>Object.freeze({
      key,label:FIELD[key]||key,
      sensitive:['tax_info','account_info','wallet','contacts','residency'].includes(key),
      ownerReview:['certification','rights','disclosures','tax_info','account_info','budget','royalty','wallet','privacy'].includes(key)
   })))
 })));
 const SECTORS=Object.freeze([...new Set(TARGETS.map(x=>x.sector))]);
 function lookup(id){return TARGETS.find(x=>x.id===id)||null;}
 function validate(){
   const errors=[],seen=new Set();
   for(const t of TARGETS){
     if(seen.has(t.id))errors.push('duplicate '+t.id); seen.add(t.id);
     if(!t.fields.length)errors.push('missing fields '+t.id);
     const keys=new Set();
     for(const field of t.fields){
       if(keys.has(field.key))errors.push('duplicate field '+t.id+'.'+field.key);
       keys.add(field.key);
     }
   }
   return {ok:errors.length===0,count:TARGETS.length,sectors:SECTORS.length,errors};
 }
 return Object.freeze({VERSION:'ttfes-btp.catalog.v1',TARGETS,SECTORS,FIELD,BASE,OVERRIDES,MARKERS,lookup,validate});
});