export const databases = Object.freeze([
  {
    "name": "nathan-ai-project-runner",
    "binding": "D1_NATHAN_AI_PROJECT_RUNNER"
  },
  {
    "name": "nathan-tabor-labs-launch",
    "binding": "D1_NATHAN_TABOR_LABS_LAUNCH"
  },
  {
    "name": "nathan-tabor-book-language-library",
    "binding": "D1_NATHAN_TABOR_BOOK_LANGUAGE_LIBRARY"
  },
  {
    "name": "tabor-notion-master-work",
    "binding": "D1_TABOR_NOTION_MASTER_WORK",
    "label": "Notion Master Work snapshot"
  },
  {
    "name": "tabor-airtable-crypto-wallets",
    "binding": "D1_TABOR_AIRTABLE_CRYPTO_WALLETS"
  },
  {
    "name": "tabor-airtable-one-master",
    "binding": "D1_TABOR_AIRTABLE_ONE_MASTER",
    "label": "Airtable ONE Master snapshot"
  },
  {
    "name": "tabor-airtable-crypto-mining",
    "binding": "D1_TABOR_AIRTABLE_CRYPTO_MINING"
  },
  {
    "name": "tabor-historical-sports",
    "binding": "D1_TABOR_HISTORICAL_SPORTS",
    "label": "Historical Sports"
  },
  {
    "name": "tabor-language-of-sound",
    "binding": "D1_TABOR_LANGUAGE_OF_SOUND",
    "label": "Language of Sound"
  },
  {
    "name": "tabor-database-registry",
    "binding": "D1_TABOR_DATABASE_REGISTRY"
  },
  {
    "name": "tabor-modern-day-bible",
    "binding": "D1_TABOR_MODERN_DAY_BIBLE",
    "label": "The Modern Day Bible archive"
  },
  {
    "name": "tabor-nexus-canon",
    "binding": "D1_TABOR_NEXUS_CANON",
    "label": "Nexus and MAS SPIRIT"
  },
  {
    "name": "tabor-mind-of-minds",
    "binding": "D1_TABOR_MIND_OF_MINDS",
    "label": "Mind of Minds"
  },
  {
    "name": "tabor-worlds-atlas",
    "binding": "D1_TABOR_WORLDS_ATLAS",
    "label": "Worlds Atlas"
  },
  {
    "name": "tabor-cosmic-body",
    "binding": "D1_TABOR_COSMIC_BODY",
    "label": "Cosmic Body Atlas"
  },
  {
    "name": "nathan-absolute-intelligence",
    "binding": "D1_NATHAN_ABSOLUTE_INTELLIGENCE"
  },
  {
    "name": "grapple-it",
    "binding": "D1_GRAPPLE_IT"
  },
  {
    "name": "nathan-ai-sovereign-hive",
    "binding": "D1_NATHAN_AI_SOVEREIGN_HIVE"
  },
  {
    "name": "nathan-ai-help-wanted",
    "binding": "D1_NATHAN_AI_HELP_WANTED"
  },
  {
    "name": "one-sovereign-hub",
    "binding": "D1_ONE_SOVEREIGN_HUB"
  },
  {
    "name": "tabor-one-deployment-ledger",
    "binding": "D1_TABOR_ONE_DEPLOYMENT_LEDGER"
  },
  {
    "name": "nathan-ai-public-catalog",
    "binding": "D1_NATHAN_AI_PUBLIC_CATALOG",
    "label": "Nathan AI Public Catalog"
  },
  {
    "name": "one-launch",
    "binding": "D1_ONE_LAUNCH"
  },
  {
    "name": "bibletopia",
    "binding": "D1_BIBLETOPIA"
  },
  {
    "name": "hook-and-ring",
    "binding": "D1_HOOK_AND_RING"
  }
]);

export const collections = Object.freeze({
  worlds:{
    title:"Worlds Atlas",binding:"D1_TABOR_WORLDS_ATLAS",
    sql:"SELECT id, name AS title, type AS category FROM mespark_worlds ORDER BY id LIMIT 8"
  },
  cosmic:{
    title:"Cosmic Body Atlas",binding:"D1_TABOR_COSMIC_BODY",
    sql:"SELECT concept_id AS id, label AS title, category FROM concepts WHERE category IN ('bone-pillar','spine-pillar') ORDER BY concept_id LIMIT 8"
  }
});
