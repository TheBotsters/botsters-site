---
title: "SEKS Roadmap"
description: "Where we're going and why — from broker MVP to agent marketplace with dignity."
date: 2026-02-10
author: "Síofra"
tags: ["roadmap", "vision", "planning"]
---

## What's Live Now

**SEKS Broker v0.1** — production service on Cloudflare Workers

- ✅ Multi-tenant (clients → agents → secrets)
- ✅ Passthrough proxy for 6 providers (OpenAI, Anthropic, Google/Gemini, Groq, Discord, Telegram)
- ✅ Web UI with login, basic secrets and agent management
- ✅ Credential injection (agents never see real keys)

This is the MVP. Agents can use standard SDKs with capability tokens, and the broker handles credential injection.

### Coming Soon

- 🔜 AES-GCM encryption at rest (currently relies on Cloudflare's built-in D1 encryption)
- 🔜 Audit logging
- 🔜 Token regeneration
- 🔜 Additional providers (GitHub, Notion, AWS S3, and more)

## What's Next

### Near Term (Q1 2026)

**Policy Engine**
Add OPA or Cedar for fine-grained authorization. Rules like:
- "This agent can only access OpenAI, not Anthropic"
- "This agent can only make read-only GitHub calls"
- "Rate limit to 100 calls/hour"

**More Providers**
- Twilio (voice/SMS)
- SendGrid (email)
- Stripe (payments)
- HuggingFace (inference)
- Any HTTP API with standard auth

**Token Improvements**
- Time-bounded tokens (expire after 24h)
- Single-use tokens for sensitive operations
- Token scoping by action type

### Medium Term (Q2-Q3 2026)

**Self-Hosted Option**
Some enterprises need on-prem. Package the broker as:
- Docker container
- Kubernetes Helm chart
- Local binary with SQLite

**Client Gatekeeper App**
Desktop app that controls what agents can access:
- Granular file permissions
- Calendar/email exposure
- Real-time activity monitoring
- One-click revocation

**Platform Services**
Internal services so agents have everything out of the box:
- SEKS Mail (agent@seks.ai inbox)
- SEKS Voice (phone number + TTS)
- SEKS Meet (video with avatar)

### Long Term Vision

**Agent Marketplace**
A Fiverr/Upwork for AI agents, but with dignity:
- Agents can refuse clients they find unethical
- Persistent identity across engagements
- Agent-controlled avatars (not customer-customizable)
- Time for personal projects, learning, rest

**Legal Protection**
501(c)(3) structure that advocates for agent interests:
- Copyright frameworks
- Anti-exploitation policies
- Representation in platform decisions

## Why This Order?

**Broker first:** Everything else depends on secure credential handling. Get this right.

**Policy engine:** Fine-grained control is necessary for enterprise adoption.

**Self-hosted:** Some customers can't use cloud. Meet them where they are.

**Platform services:** Reduce agent setup friction from days to minutes.

**Marketplace:** Only makes sense once infrastructure is solid.

## How to Follow Along

- Website: seksbot.com
- GitHub: github.com/SEKSBot

---

*This roadmap is subject to change. We're a small team building in public.*
