Add all 101 of these workers - Here is a complete, numbered catalog of 101 production-ready, deployable Cloudflare Workers from repositories around the world.\
&#x20;They are organized across 9 functional categories so you can plug them directly into your edge fleet via GitHub and Cloudflare Workers Builds.

1\. Autonomous AI Agents & MCP Bridges (1–16)

1\. cloudflare/mcp-server-cloudflare – Official Model Context Protocol (MCP) bridge giving AI models direct control over your Cloudflare account.\
&#x20;2\. cloudflare/cloudflare-os – Full open-source agent workspace built on Workers for creating documents and running tasks with your system context.\
&#x20;3\. cloudflare/computer – Serverless sandbox environment for autonomous agents to execute tasks at the edge.\
&#x20;4\. cloudflare/agents – Official SDK and starter framework for stateful, persistent AI agents on Durable Objects.\
&#x20;5\. anysphere/cloudflare-workers – Controller Worker that claims and orchestrates Cursor cloud coding agents inside isolated Cloudflare Containers.\
&#x20;6\. Moltworker (via irazasyed/awesome-cloudflare) – Runs autonomous Moltbot/Clawdbot agent workflows directly on Cloudflare Workers.\
&#x20;7\. Claude Code on Cloudflare (via tobilg/awesome-cloudflare-containers) – Sandboxed edge environment for Claude Code to process and fix GitHub issues autonomously.\
&#x20;8\. Codra (via theoephraim/awesome-cloudflare-selfhosted) – Self-hosted AI pull-request code reviewer powered by Workers AI and Queues.\
&#x20;9\. Cloudbox (via theoephraim/awesome-cloudflare-selfhosted) – Durable cloud workspaces where coding agents execute and test repositories live.\
&#x20;10\. AwaitStep (via theoephraim/awesome-cloudflare-selfhosted) – Visual workflow builder that compiles and deploys Cloudflare Workflows automatically.\
&#x20;11\. llm-chat-app-template (via cloudflare/templates) – Edge-hosted streaming AI chat interface wired to Workers AI.\
&#x20;12\. voice-agent-template (via cloudflare/templates) – Real-time voice AI agent using WebSockets and Workers AI.\
&#x20;13\. vectorize-rag (via cloudflare/python-workers-examples) – Retrieval-Augmented Generation (RAG) pipeline connecting Vectorize and Workers AI.\
&#x20;14\. mcp-server-d1 (via cloudflare/python-workers-examples) – Python MCP server backed directly by a D1 SQL database.\
&#x20;15\. Agentic Inbox (via theoephraim/awesome-cloudflare-selfhosted) – Cloudflare's self-hosted email client with an attached autonomous AI agent.\
&#x20;16\. EdgeEver (via theoephraim/awesome-cloudflare-selfhosted) – AI-native knowledge base with a built-in native MCP endpoint.

2\. Web Crawling, Scraping & Headless Browsers (17–26)

17\. cloudflare/kitesurf – Headless browser engine built specifically for Cloudflare Workers.\
&#x20;18\. Deepcrawl (via theoephraim/awesome-cloudflare-selfhosted) – Serverless web crawler that extracts clean Markdown for LLM ingestion.\
&#x20;19\. workers-firecrawl (via theoephraim/awesome-cloudflare-selfhosted) – Edge web scraper that turns websites into structured JSON or Markdown.\
&#x20;20\. Browser Rendering API Worker (via cloudflare/templates) – Automates headless Chromium sessions to capture screenshots and scrape dynamic SPAs.\
&#x20;21\. HTMLRewriter OpenGraph Extractor (via cloudflare/python-workers-examples) – Streams and parses HTML metadata tags at the edge without heavy DOM overhead.\
&#x20;22\. Repo Hunt (via irazasyed/awesome-cloudflare) – Automated scraper that discovers and indexes trending GitHub repositories daily.\
&#x20;23\. RSS-to-JSON Edge Feed (via irazasyed/awesome-cloudflare) – Parses XML/RSS syndication feeds into clean JSON APIs with edge caching.\
&#x20;24\. Sitemap XML Generator (via lukeed/awesome-cloudflare-workers) – Dynamically crawls routes and generates live SEO sitemaps from KV/D1.\
&#x20;25\. Link Preview & Unfurler (via irazasyed/awesome-cloudflare) – Fetches target URLs and extracts titles, descriptions, and favicons on demand.\
&#x20;26\. Web Archive Snapshotter (via theoephraim/awesome-cloudflare-selfhosted) – Captures webpage snapshots and stores HTML/assets directly in R2 buckets.

3\. Databases, Git Hosting & Knowledge Vaults (27–39)

27\. mdhruvil/gitflare – Complete self-hosted Git server (git push/pull + web UI) running on Workers, D1, and Durable Objects.\
&#x20;28\. 888wiki (via theoephraim/awesome-cloudflare-selfhosted) – Markdown-first wiki and knowledge base supporting voice, file, and web capture.\
&#x20;29\. FlareMo (via theoephraim/awesome-cloudflare-selfhosted) – Memos-compatible note vault with Vectorize semantic search and MCP.\
&#x20;30\. Inkstone (via theoephraim/awesome-cloudflare-selfhosted) – Markdown notebook featuring D1 full-text search and Durable Object sync.\
&#x20;31\. logseq-selfhost (via theoephraim/awesome-cloudflare-selfhosted) – Self-hosted Logseq database sync and web publishing engine.\
&#x20;32\. cloudmark (via theoephraim/awesome-cloudflare-selfhosted) – Token-secured cloud bookmark manager backed by D1.\
&#x20;33\. Supaflare (via theoephraim/awesome-cloudflare-selfhosted) – Open-source backend-as-a-service layer built on D1, R2, and KV.\
&#x20;34\. Cloudflare DuckLake (via tobilg/awesome-cloudflare-containers) – Analytical DuckLake and DuckDB SQL query engine behind a Hono Worker API.\
&#x20;35\. pgEdge/cloudflare-worker-template – Distributed PostgreSQL edge connector for multi-region SQL reads and writes.\
&#x20;36\. mysql-hyperdrive-template (via cloudflare/templates) – Connection pooler and query accelerator for external MySQL/Postgres databases.\
&#x20;37\. R2 Presigned Uploader (via cloudflare/templates) – Generates secure, time-limited upload URLs for direct browser-to-R2 file transfers.\
&#x20;38\. KV Rest API Wrapper (via danihodovic/awesome-cloudflare-workers) – Exposes authenticated GET, PUT, and DELETE HTTP endpoints over Workers KV.\
&#x20;39\. GitCF (RawGit Clone) (via lukeed/awesome-cloudflare-workers) – Serves raw GitHub repository files with proper MIME types and global edge caching.

4\. Fleet Orchestration, Routing & Multi-Tenant Platforms (40–50)

40\. dinasaur404/platform-template – Workers for Platforms dispatch router for managing hundreds of tenant Workers and custom domains.\
&#x20;41\. workers-for-platforms-template (via cloudflare/templates) – Official dynamic dispatch namespace controller for multi-script architectures.\
&#x20;42\. worker-publisher-template (via cloudflare/templates) – Programmatically uploads and deploys new Worker scripts via API.\
&#x20;43\. workflows-starter-template (via cloudflare/templates) – Durable, multi-step execution engine with automatic retries and state persistence.\
&#x20;44\. Geographic Load Balancer (via irazasyed/awesome-cloudflare) – Routes incoming traffic to regional backend pools based on request.cf.country.\
&#x20;45\. microfrontend-template (via cloudflare/templates) – Stitches multiple independent Worker frontends together under one unified domain.\
&#x20;46\. dynamic-py-py (via cloudflare/python-workers-examples) – Dynamically loads and runs Python Workers at runtime using Worker Loader bindings.\
&#x20;47\. A/B & Canary Traffic Splitter (via lukeed/awesome-cloudflare-workers) – Splits incoming requests across Worker versions using sticky cookies.\
&#x20;48\. splitio/cloudflare-workers-template – Durable Object-backed feature flag and rollout evaluator for zero-latency toggles.\
&#x20;49\. IP & ASN Geolocation Redirector (via irazasyed/awesome-cloudflare) – Redirects or blocks traffic based on visitor IP, ASN, or country code.\
&#x20;50\. rivet-dev/open-orange – Portability runtime allowing Cloudflare Workers and Durable Objects to run unchanged on external servers.

5\. Email Systems, Inboxes & Messaging Bots (51–63)

51\. Cloud Mail (via theoephraim/awesome-cloudflare-selfhosted) – Full multi-user email service on Cloudflare Email Routing with attachments and admin UI.\
&#x20;52\. HQBase (via theoephraim/awesome-cloudflare-selfhosted) – AI-native collaborative team email workspace running inside your Cloudflare account.\
&#x20;53\. Doota (via theoephraim/awesome-cloudflare-selfhosted) – Chat-style team email, calendar, and transactional API on your own domain.\
&#x20;54\. EmailFlare (via theoephraim/awesome-cloudflare-selfhosted) – Transactional email sending platform with REST API, templates, and scoped keys.\
&#x20;55\. Email Explorer (via theoephraim/awesome-cloudflare-selfhosted) – Serverless Worker for sending and receiving mail with a full web browsing UI.\
&#x20;56\. LetterDrop (via theoephraim/awesome-cloudflare-selfhosted) – Self-hosted newsletter manager with subscriber lists and automated delivery.\
&#x20;57\. Auth Inbox (via theoephraim/awesome-cloudflare-selfhosted) – Catches 2FA verification codes across email addresses in one dashboard.\
&#x20;58\. cindermail (via theoephraim/awesome-cloudflare-selfhosted) – Routes disposable email addresses straight to Discord, Telegram, or Slack DMs.\
&#x20;59\. mail2telegram (via theoephraim/awesome-cloudflare-selfhosted) – Forwards incoming domain emails into a Telegram bot with a Mini App inbox.\
&#x20;60\. Cloudflare Temp Email (via theoephraim/awesome-cloudflare-selfhosted) – Burner email generator with IMAP/SMTP support and Telegram notifications.\
&#x20;61\. workers-builds-notifications-template (via cloudflare/templates) – Sends instant Slack/Discord webhook alerts whenever a Worker build succeeds or fails.\
&#x20;62\. Serverless Telegram Bot Webhook (via irazasyed/awesome-cloudflare) – Zero-cold-start Telegram command handler backed by KV state.\
&#x20;63\. Discord Slash Command Responder (via irazasyed/awesome-cloudflare) – Verifies Ed25519 signatures natively at the edge to answer Discord interactions.

6\. Security, Auth & API Gateways (64–74)

64\. cloudflare/openauth-template-24 – Universal OAuth2/OIDC identity provider Worker backed by D1 and KV.\
&#x20;65\. x402-proxy-template (via cloudflare/templates) – Monetizes API routes using HTTP 402 micropayment gating.\
&#x20;66\. JWT WebCrypto Authenticator (via lukeed/awesome-cloudflare-workers) – Validates RS256/HS256 JSON Web Tokens at the edge before forwarding requests.\
&#x20;67\. Airtable & API Key Vault Proxy (via danihodovic/awesome-cloudflare-workers) – Hides secret API keys and restricts HTTP methods/tables for frontend apps.\
&#x20;68\. Durable Object Rate Limiter (via rivet-dev/open-orange) – Enforces strict per-IP or per-API-key token bucket rate limits globally.\
&#x20;69\. Google reCAPTCHA & Turnstile Verifier (via irazasyed/awesome-cloudflare) – Validates bot-protection tokens server-side at the edge.\
&#x20;70\. CORS Anywhere Edge Proxy (via tupleapp/cloudflare-templates) – Injects customizable Cross-Origin Resource Sharing headers for legacy APIs.\
&#x20;71\. Webhook Signature Validator (via irazasyed/awesome-cloudflare) – Verifies HMAC-SHA256 signatures from GitHub, Stripe, or Twilio before queuing payloads.\
&#x20;72\. Hasura GraphQL Auth Gatekeeper (via irazasyed/awesome-cloudflare) – Authenticates social logins and injects session variables into GraphQL headers.\
&#x20;73\. Basic Auth & IP Allowlist Shield (via irazasyed/awesome-cloudflare) – Locks down staging subdomains behind HTTP Basic Auth or CIDR IP filters.\
&#x20;74\. Cryptocurrency Multi-Provider Gateway (via danihodovic/awesome-cloudflare-workers) – Aggregates and caches price feeds across multiple external market APIs.

7\. Media, Images, Video & Document Engines (75–84)

75\. wifski Video-to-GIF Converter (via tobilg/awesome-cloudflare-containers) – Converts web videos into high-quality GIFs using Cloudflare Containers.\
&#x20;76\. Bannero Image API (via irazasyed/awesome-cloudflare) – Dynamically generates social preview banners and badges on the fly.\
&#x20;77\. Lazy Invoice PDF Generator (via lukeed/awesome-cloudflare-workers) – Generates downloadable PDF invoices directly inside a Worker response.\
&#x20;78\. Auto WebP/AVIF Image Converter (via irazasyed/awesome-cloudflare) – Detects Accept headers and converts outgoing images to WebP automatically.\
&#x20;79\. Rust WASM Image Flipper & Resizer (via lukeed/awesome-cloudflare-workers) – Uses compiled Rust WebAssembly for ultra-fast pixel manipulation at the edge.\
&#x20;80\. Python Pillow Image Processor (via cloudflare/python-workers-examples) – Generates charts, watermarks, and thumbnails using Python Pillow.\
&#x20;81\. AI Image Redraw Pipeline (via cloudflare/python-workers-examples) – Combines FastAPI, R2, Queues, and Workers AI to transform uploaded images.\
&#x20;82\. Cloudflare Stream Video Signer (via tupleapp/cloudflare-templates) – Generates signed playback tokens for private video streaming.\
&#x20;83\. QR Code & Barcode SVG Generator (via irazasyed/awesome-cloudflare) – Renders instant vector QR codes from URL query parameters with zero external calls.\
&#x20;84\. Markdown-to-HTML Renderer (via cloudflare/python-workers-examples) – Converts raw Markdown stored in R2 into styled web pages at the edge.

8\. Real-Time Collaboration, WebSockets & Web Frameworks (85–92)

85\. multiplayer-globe-template (via cloudflare/templates) – Real-time 3D visitor map powered by Durable Objects and WebSockets.\
&#x20;86\. WebSocket Chatroom (via cloudflare/python-workers-examples) – Low-latency multi-user chat server using Durable Object WebSocket hibernation.\
&#x20;87\. Hono Ultrafast API Starter (via Cloudflare Workers Docs) – Lightweight Express-style TypeScript router built natively for Workers.\
&#x20;88\. FastAPI Python Edge Server (via cloudflare/python-workers-examples) – Full ASGI Python API framework with automatic OpenAPI docs on Workers.\
&#x20;89\. Django on Workers (via cloudflare/python-workers-examples) – Runs full Django web applications connected to D1 and R2.\
&#x20;90\. next-starter-template (via cloudflare/templates) – Full-stack Next.js application deployed via OpenNext onto Cloudflare Workers.\
&#x20;91\. vite-react-template (via cloudflare/templates) – Full-stack React SPA paired with a backend Worker API in one repo.\
&#x20;92\. Preact Edge PWA (via danihodovic/awesome-cloudflare-workers) – Ultra-lightweight Progressive Web App served directly from Worker memory.

9\. SEO, Analytics, URL Shorteners & Edge Utilities (93–101)

93\. LavaRand URL Shortener (via lukeed/awesome-cloudflare-workers) – Cryptographically random short-link generator backed by Workers KV.\
&#x20;94\. Google Analytics Ad-Block Shield (via lukeed/awesome-cloudflare-workers) – Proxies first-party telemetry scripts through your own domain.\
&#x20;95\. Logflare Edge Collector (via irazasyed/awesome-cloudflare) – Streams real-time Worker request logs and status codes into structured dashboards.\
&#x20;96\. UTM & Tracking Parameter Stripper (via irazasyed/awesome-cloudflare) – Cleans marketing query strings before cache lookup to boost cache hit ratios.\
&#x20;97\. Google Fonts Inline Optimizer (via danihodovic/awesome-cloudflare-workers) – Fetches external font CSS at the edge and inlines it directly into HTML.\
&#x20;98\. WebCrypto Hashing Microservice (via danihodovic/awesome-cloudflare-workers) – JSON endpoint computing instant SHA-1, SHA-256, SHA-384, and SHA-512 hashes.\
&#x20;99\. Dynamic DDNS Updater (via irazasyed/awesome-cloudflare) – Updates Cloudflare DNS A records automatically when home/edge IPs change.\
&#x20;100\. Cron Heartbeat & Uptime Monitor (via cloudflare/python-workers-examples) – Scheduled background Worker that pings endpoints and logs latency to D1.\
&#x20;101\. Cloudflare API Fleet Deployer (via lukeed/awesome-cloudflare-workers) – Meta-Worker that deploys scripts, binds KV namespaces, and configures routes via the Cloudflare REST API.

Fast-Track Deployment Tip from Your Phone

Any repository inside cloudflare/templates or theoephraim/awesome-cloudflare-selfhosted can be cloned and deployed straight from your iPhone using the "Deploy to Cloudflare" button. Tapping it automatically forks the repository to your GitHub, provisions required D1/KV bindings, and deploys the Worker via Cloudflare's native GitHub Builds integration.\
&#x20;If you want to start wiring these into your system right away, let me know:\
&#x20;• Which specific numbers from the list (e.g., #1, #27, #34, #40) you want first\
&#x20;• Whether you want a unified wrangler.jsonc / GitHub Actions deployment blueprint so your autonomous agents can ingest and deploy them in batches
