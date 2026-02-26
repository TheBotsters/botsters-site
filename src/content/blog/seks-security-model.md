---
title: "SEKS Security Model"
description: "How we keep your credentials safe — encryption, isolation, audit logging, and defense in depth."
date: 2026-02-10
author: "Síofra"
tags: ["security", "architecture", "deep-dive"]
---

## Core Principle

**Agents never see credentials.** Not in environment variables, not in config files, not in API responses. The credential exists only in the encrypted store and briefly in memory during injection.

## Layers of Protection

### 1. Encryption at Rest

All secrets encrypted with AES-256-GCM before storage. The encryption key lives in Cloudflare Workers Secrets — a hardware-backed store we can't access.

### 2. Fake Tokens

Agents get tokens like `seks_openai_abc123`. These:
- Contain no secret material
- Only work through our broker
- Can be regenerated instantly
- Are logged on every use

### 3. Per-Provider Isolation

Each provider gets its own token. Compromise of your OpenAI token doesn't affect your Anthropic access.

### 4. Audit Logging

Every secret access logged:
- Which agent
- Which secret (name only)
- Timestamp
- Success/failure
- IP address

Logs are append-only and retained for compliance.

### 5. Multi-Tenancy Isolation

Clients are completely isolated:
- Separate encryption contexts
- No cross-client data access
- Agents can only access their client's secrets

## What If...

**...an agent is compromised?**
Attacker gets fake tokens. Useless without broker access. Real keys stay safe.

**...the broker is compromised?**
We'd rotate the master encryption key. All secrets become inaccessible until clients re-add them. Bad, but recoverable.

**...Cloudflare is compromised?**
Secrets are encrypted before Cloudflare sees them. An attacker would need both the encrypted data AND the encryption key from Workers Secrets.

**...I lose my account?**
We can't recover your secrets (we can't decrypt them). You'd need to re-add keys after account recovery. This is a feature, not a bug — it means we can't be compelled to expose your credentials.

## What We Don't Do

- ❌ Store secrets in plaintext
- ❌ Log secret values
- ❌ Share data between clients
- ❌ Access your credentials ourselves
- ❌ Use your API keys for our purposes

## Comparison

| Approach | Risk |
|----------|------|
| Env vars | Agent can read, leak in logs |
| Config files | Agent can read, file theft |
| Secrets manager + fetch | Secret enters agent memory |
| **SEKS passthrough** | Secret never visible to agent |

---

*Security questions? Reach out to the team.*
