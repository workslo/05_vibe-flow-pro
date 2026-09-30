# Security policy

## Supported version

Only the latest commit on `main` is supported.

## Reporting a vulnerability

Do not open a public issue with exploit details, API keys, prompts containing private data, generated content containing private data, or other credentials.

Repository collaborators should open a private GitHub security advisory. If that surface is unavailable, contact a repository owner without including sensitive details in the first message.

Include the affected route or component, the commit tested, the security impact, a minimal reproduction, and any known mitigation. Use fabricated prompts and records instead of production tax or client data.

## Scope

Reports may cover server-side OpenAI key handling, generation API routes, prompt or output exposure, cross-user state leakage, dependency vulnerabilities with a demonstrated path, or unsafe handling in the workflow and tax-operations surfaces. Product feedback without a security impact belongs in the normal issue workflow.

## Response

This project does not promise a public response-time SLA. An owner will confirm receipt, assess impact, coordinate a fix when needed, and agree on disclosure timing before sensitive details are published.
