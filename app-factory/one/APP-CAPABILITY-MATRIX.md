# ONE — The Last App | Application capability atlas A–Z
**Research method:** Classify existing app *functions*, not copy competitor screens, assets, source code, or proprietary APIs. This is a broad functional map, **not** an exhaustive audit of every application on Earth. All competing products and capabilities need periodic product-specific verification before sales claims.

| Life domain | Examples of existing app categories | ONE built-in replacement | Official connection strategy | Phase | Core gap |
|---|---|---|---|---|---|
| A Accounts & Identity | password managers, identity wallets, SSO apps | local profile, account alias, passkey entry | platform credential manager / standards | M2 | secure sign in, recovery |
| B Banking & Bills | bank apps, bill pay, budgeting, subscription trackers | read-only money overview and recurring bill planner | consent-based regulated open banking APIs | M6 | institutional coverage, write approvals |
| C Calendar & Commitments | calendar, reminders, scheduling, appointment apps | tasks and own local events | EventKit, Calendar API, Graph API | M1/M3 | true calendar sync, conflict handling |
| D Documents & Data | notes, file managers, cloud drive, scanners | ONE notes + Factory Creator Vault | iOS file picker, Drive/Graph OAuth, user-selected access | M1/M3 | durable encrypted storage, changes |
| E Exercise & Health | health trackers, fitness, sleep, medicine apps | voluntary activity view and wellness goals | HealthKit / Health Connect fine-grained grants | M5 | health permissions, medical privacy |
| F Family & Contacts | phonebook, family sharing, emergency contacts | private selected contacts, emergency card | Contacts framework / Android Contacts | M1 | limited contact selection, consent |
| G Groceries & Home | grocery lists, delivery, appliance control | local checklists and room dashboard | authorized Matter/Home APIs, partner commerce | M5 | provider capabilities, device security |
| H Habits & Routines | habit tracking, scheduled scenes | local habit/flow definitions | WorkManager, BackgroundTasks when allowed | M4 | schedule reliability and auditing |
| I Information & Search | browser/search engines, knowledge managers | unified indexed search and provenance | approved search, user-selected cloud content | M4 | data retrieval and indexing scopes |
| J Jobs & Work | email, office suites, team messaging | ONE project cards, tasks, summary | Gmail API, Microsoft Graph, Slack official APIs | M3 | per-provider scopes and mail safety |
| K Knowledge & Learning | learning platforms, e-books, study apps | learning cards, private bookmarks | licensed course APIs, exported learning data | M5 | licensing, offline access |
| L Location & Travel | map, transit, airline, booking apps | trip planning and destination launcher | Maps deeplinks and commercial travel APIs | M3/M5 | reservation/provider rules and cost approval |
| M Media & Music | playlists, video, photos, streaming | vault media viewer and own library index | native media/photo picker, provider SDKs | M5 | DRM, catalog restrictions |
| N Notifications & Signals | alert apps, notification digests | ONE events, in-app alerts | notification permissions and first-party alerts | M1 | OS cannot expose all third-party notifications |
| O Organization & Systems | kanban, project and knowledge boards | Factory project links and boards | approved task/provider APIs | M2 | cross-device sync and ACL |
| P Privacy & Permissions | privacy dashboards, consent managers | connector access ledger, expiry/revoke | OS privacy settings where available, OAuth revoke | M2 | actual token revocation |
| Q Quick Actions | launchers, Shortcuts, assistant apps | DO command bar and suggestions | App Intents, Android Intents, approved links | M1/M4 | accurate action planning |
| R Relationships & Social | contacts, social networks, DMs | social link hub and chosen contact shortcuts | supported messaging/share APIs | M5 | third-party API availability |
| S Security & Safety | 2FA, backup, authenticator apps | security audit, backup status | WebAuthn/passkeys and supported security APIs | M2 | secret storage and incident response |
| T Time & Focus | Pomodoro, focus, time trackers | timer and quiet preferences | user-configured Focus/Shortcuts where available | M1 | cannot arbitrarily alter global device focus |
| U Utilities | camera scanner, calculator, voice recorder | math, capture, local recording | device platform APIs with permissions | M1 | offline utility modules |
| V Vision & Goals | goal planners and progress apps | ONE goals + Factory projects | internal project API and explicit references | M2 | linked milestone tracking |
| W Wealth & Assets | portfolio, net worth, property apps | asset register | finance/provider APIs with authorization | M6 | coverage and regulatory obligations |
| X Experiments | no-code tools, test sandboxes | personal scripts/automations testing sandbox | isolated task runner with explicit approval | M4 | isolation, rollback, limits |
| Y You & Preferences | personal portals, personalization apps | ONE preference and identity profile | platform user settings and storage | M2 | privacy export and profile versioning |
| Z Zero Mode | focus apps, quiet modes, parental features | ONE pauses OWN automated actions and optional sync | OS settings and permitted focus actions only | M1/M4 | third-party apps remain independently controlled |

## Why one app cannot silently replace every installed app
- iOS isolates applications; standard consumer apps cannot read arbitrary third-party app containers, intercept all notifications, install themselves as a SpringBoard overlay or enumerate every installed app with full data access.
- Android's more flexible launch surface still restricts other apps' private data and installed-app visibility. Broad package querying is restricted for Google Play listings. AccessibilityService is not a loophole for general-purpose non-consensual control.
- Each service controls its own API, scope, licensing, pricing, rate limits and applicable regional regulation.
- "Replace" requires implementing a **function** legally and interoperably, not copying source code or brand UI. Often ONE will **hand off** to a provider rather than pretending it can perform that provider's restricted action.
- Payment providers require explicit transaction confirmation, user verification and financial safety controls. No hidden endpoints or credential collection.

## Integration patterns, from most to least reliable
1. ONE built-in modules with local storage and tested app-specific UI.
2. First-party OS frameworks with user permission.
3. Official partner API + OAuth authorization, then capability-based actions.
4. App Intents/Shortcuts and Android Intents, triggered and approved by the user.
5. Share sheets and pickers where official APIs are unavailable.
6. Plain navigational links to existing apps and services, clearly indicating handoff.
7. Unsupported: report unavailable and offer user-controlled manual action; never scrape private services via hidden endpoints.

## Root architecture
ONE is a **separate app** from TABOR 1-2-3 FACTORY. Both can use authorized TABOR ROOT capabilities: creator vault, identity, event log, contracts, saved media, project links and publishing workflow. Keep separate workspace scope, release gates, data policies and local app stores for each user. ONE's 101–901 code is **module technology numbering**. The 101–901 historical portfolio divisions remain a separate numbering system.

## Key gaps to close in priority order
1. Full identity and authenticated private backend, passing two-account isolation tests.
2. Reliable cross-device encrypted sync, revisions and source byte backup/restore.
3. Signed SwiftUI native bridge and Compose Android with real permission prompts.
4. Legal official Google/Microsoft calendar, Drive and email OAuth connectors with revoke.
5. Action-plan preview, cost disclosure, confirmations, idempotency, rollback and audit.
6. User-configurable scheduled flows with honest OS background execution limits.
7. Health and home access and safe critical controls, always opt-in.
8. Regulated finance integration, read-first, explicit write approvals, coverage disclosure.
9. A–Z feature completion: accessibility, localizations, offline performance and recovery.
10. Actual App Store/Play publication and support infrastructure.

## Sources for constraints
- Apple HealthKit authorization: https://developer.apple.com/documentation/healthkit/authorizing-access-to-health-data
- Android package visibility policy: https://support.google.com/googleplay/android-developer/answer/18258653
- Apple App Intents: https://developer.apple.com/documentation/appintents
- Android package visibility: https://developer.android.com/training/package-visibility
