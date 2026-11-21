# International and Global AI Agent Discovery — Verified Write Receipt

Date: 2026-11-20

## Destination
- Existing D1 database: `tabor-fleet-registry`
- Logical zone: `nathan-ai/fleet/global`
- New table: `fleet_public_agent_projects_v1`
- Verified SQL result: **25 inserted records**, **25 records counted**.

## Scope and semantics
These are public software-project references, not deployed agents, operational bots, or evidence of global geographic provenance. `integration_status=not_installed`, `verified_runtime=0`, and `geographic_origin=unverified` are the defaults. Public web directories are discovery leads; individual repository availability, license, and trust need separate verification before use. No third-party infrastructure was accessed beyond public search. No Workers were created, and no code was executed from these projects.

## Recorded projects
langchain-ai/langgraph; crewAIInc/crewAI; microsoft/autogen; microsoft/agent-framework; google/adk-python; openai/openai-agents-python; huggingface/smolagents; camel-ai/camel; agentscope-ai/AgentTeams; langchain-ai/langchain; mastra-ai/mastra; kyegomez/swarms; MervinPraison/PraisonAI; i-am-bee/beeai-framework; langchain-ai/langgraph-swarm-py; ag2ai/ag2; microsoft/semantic-kernel; deepset-ai/haystack; pydantic/pydantic-ai; OpenHands/OpenHands; langgenius/dify; FlowiseAI/Flowise; Significant-Gravitas/AutoGPT; e2b-dev/E2B; google-gemini/gemini-cli.

## Source directories
- https://github.com/awesome-llms-labs/awesome-ai-agents
- https://github.com/kaushikb11/awesome-llm-agents
- https://github.com/thinkjones/agentic-tools
- https://github.com/aloth/awesome-ai-agents
- https://github.com/agentscope-ai/AgentTeams

## Verification query
```sql
SELECT COUNT(*) AS n FROM fleet_public_agent_projects_v1;
SELECT repo_full_name,category,integration_status,verified_runtime
FROM fleet_public_agent_projects_v1 ORDER BY repo_full_name;
```

## Outstanding
The user's originally supplied 16,000+ dataset has **not** been recovered or reimported. Prior `unified_catalog` contains 43,913 mixed records, primarily workflow evidence, not unique agents. Continue catalog reconciliation and individual repository verification; do not inflate agent counts or represent indexed entries as installed.
