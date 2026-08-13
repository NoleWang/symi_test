# Symi ✦

**Symi** is an AI companion platform that runs as a persistent gateway service, connecting LLM agents to people across multiple chat surfaces (web, Slack, Telegram, Discord, WhatsApp, Signal, etc.) and giving them access to tools, files, integrations, and code execution.

## High-Level Architecture

```
User ←→ Chat Surface ←→ Symi Gateway ←→ LLM Provider(s)
                              ↓
                    Tools & Integrations
                    (GitHub, Slack, Email,
                     File System, APIs, etc.)
```

## Key Capabilities

- **Multi-channel agent** — Works on webchat, Slack, Discord, Telegram, Signal, WhatsApp, iMessage, IRC, and more
- **Tool-calling** — Reads files, runs code, searches the web, calls APIs, manages GitHub repos, interacts with cloud services
- **Memory & Context** — Persistent workspace with long-term memory, project files, and session continuity
- **Integration hub** — Connects to Microsoft 365, Google Cloud, AWS, HubSpot, Salesforce, Dropbox, and 20+ other services
- **Custom skills** — Pluggable skill system for extending capabilities
- **Self-hostable** — Deployable on a laptop, VPS, or Kubernetes via Docker or systemd

## Use Cases

- Personal AI assistant across all messaging platforms
- Code review and development companion
- Email and calendar management
- Data analysis and report generation
- CRM and workflow automation
