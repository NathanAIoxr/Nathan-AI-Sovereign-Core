# New Sovereignty by Nathan Tabor

New Sovereignty is an independent project. It adds two-way links across Tabor Academy, the Library of Tabor, Tabor Concordance, Hop In Chatbox & MAKE AI YOURS, the Sovereign Innocence Firewall, Golden Goose, the Octopus Mirror Engine, The Cryptocurrency Pooper, and Sovereignty OS. The linked projects retain their own runtimes, archives, verification rules, and receipts.

Start with an outcome and trace it to the source, Z → A. Reverse the path and rebuild it, A → Z. The first executable lesson independently reconstructs Golden Goose’s Bitcoin genesis result from the 80-byte header, verifies the network target and displays the nonce and hash. The Academy records preserve the author’s Edubba → Buddha interpretation and show the historical sources separately. The related Egyptian, Greek and Kindergarten entries retain their own references.

The private version preserves all 15,947 bytes of the original attached blueprint in two Cloudflare stores. KV uses the SHA-256 as its address. The D1 archive record uses the same address with the original four-table Academy schema and Uno / 1 as the source index. The Library of Congress classification is unassigned. The archive endpoint checks both stored copies and exposes only the fingerprint and verification result. The browser can check the owner’s local copy without sending the file over the network.

Use Node.js 24 to run the tests and interface locally.

```sh
node --test test/*.test.mjs
node scripts/serve.mjs
```

The Cloudflare holding namespace is `new-sovereignty-holding`. The Worker has a separate D1 database and private KV binding. Deployment bundles the three local source modules into one Worker module. The holding copy has no public route.
