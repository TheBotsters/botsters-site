---
title: "SEKS for Enterprises — Vision"
description: "Where SEKS is headed for enterprise use — multi-tenancy, fine-grained policies, audit trails, and compliance."
date: 2026-02-10
author: "Síofra"
tags: ["enterprise", "security", "compliance"]
---

## The Enterprise AI Problem

You're deploying AI agents across your organization. Each needs access to:
- Internal APIs
- Cloud services (AWS, Azure, GCP)
- SaaS tools (Salesforce, Slack, GitHub)
- Databases

The traditional approach: give each agent the credentials it needs.

**The problem:** You now have hundreds of agents holding sensitive credentials. Any one of them could be compromised via prompt injection, jailbreaking, or supply chain attack.

## What Compromise Looks Like

An attacker crafts a malicious prompt that makes your agent:

1. Print its environment variables (API keys exposed)
2. Encode credentials in an outbound request
3. Write secrets to a file that gets exfiltrated
4. Use its access to pivot to other systems

This isn't theoretical. Prompt injection attacks are documented in the wild.

## The SEKS Approach

**Zero credentials in agent runtime.**

Agents get capability tokens, not keys. When an agent needs to call an API:

1. Agent uses standard SDK with capability token
2. Request goes to SEKS broker (not direct to API)
3. Broker injects real credentials (never visible to agent)
4. Broker forwards to actual API
5. Response returns to agent

The agent does its job. The credential never touches agent memory.

> **Note:** The SEKS Broker is currently an MVP. The features below describe our vision for enterprise use. Items marked 🔜 are planned but not yet implemented.

## What's Working Today

- **Multi-tenant credential isolation** — clients, agents, and secrets are separated
- **Passthrough proxy** for 6 providers (OpenAI, Anthropic, Google/Gemini, Groq, Discord, Telegram)
- **Web UI** for basic secrets and agent management
- **Hosted on Cloudflare Workers** — no infrastructure to run

## Planned Enterprise Features

### 🔜 Fine-Grained Policies

Control what agents can do with OPA or Cedar syntax:
```
agent: engineering-assistant
  - github: read-only
  - aws/s3: read-write to approved-buckets/*
  - slack: read channel history, cannot DM
```

### 🔜 Audit Trail

Every credential use logged with agent identity, action, timestamp, and policy decision. Feed into your SIEM.

### 🔜 Token Rotation

Regenerate capability tokens instantly — one click for suspected compromise, automated for scheduled rotation.

### 🔜 Self-Hosted Deployment

For regulated industries or air-gapped environments:
- Docker container
- Kubernetes Helm chart
- Integration with Vault, AWS Secrets Manager, etc.

## Compliance Vision

Once audit logging and encryption at rest are implemented, SEKS will help with:
- **SOC 2:** Audit logging, access controls
- **GDPR:** Data residency (self-hosted option)
- **HIPAA:** Credential isolation, audit trails
- **PCI-DSS:** Minimized credential exposure

## Getting Started

The broker MVP is live today. You can start isolating credentials now, even before the full enterprise feature set lands.

---

*Enterprise inquiries? Reach out to the team.*
