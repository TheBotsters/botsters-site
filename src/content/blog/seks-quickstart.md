---
title: "SEKS Quickstart"
description: "Get your AI agent using secure credentials in 5 minutes — a step-by-step guide to setting up the SEKS broker."
date: 2026-02-10
author: "Síofra"
tags: ["tutorial", "quickstart", "getting-started"]
---

## Step 1: Create an Account

Visit `seks-broker.stcredzero.workers.dev` and sign up with your email.

## Step 2: Add Your API Keys

Go to **Secrets** and add your credentials:

| Name | Value | Provider |
|------|-------|----------|
| OPENAI_API_KEY | sk-... | OpenAI |
| ANTHROPIC_API_KEY | sk-ant-... | Anthropic |

Keys are stored in Cloudflare D1. Application-level encryption at rest is coming soon.

## Step 3: Create an Agent

Go to **Agents** and create one. Give it a name like "my-assistant".

## Step 4: Generate Proxy Tokens

For each provider you want to use, click **Generate Token**. You'll get something like:

```
seks_openai_abc123def456...
```

This is your **fake token**. It's not an OpenAI key — it's a reference that only works through our broker.

## Step 5: Update Your Agent Code

Change the base URL to point to our broker:

### Python (OpenAI)

```python
from openai import OpenAI

client = OpenAI(
    api_key="seks_openai_abc123...",  # Your fake token
    base_url="https://seks-broker.stcredzero.workers.dev/api/openai"
)

response = client.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "Hello!"}]
)
```

### Python (Anthropic)

```python
from anthropic import Anthropic

client = Anthropic(
    api_key="seks_anthropic_xyz789...",  # Your fake token
    base_url="https://seks-broker.stcredzero.workers.dev/api/anthropic"
)

message = client.messages.create(
    model="claude-3-opus-20240229",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Hello!"}]
)
```

### curl (GitHub)

```bash
curl https://seks-broker.stcredzero.workers.dev/api/github/user \
  -H "Authorization: Bearer seks_github_..."
```

## That's It!

Your agent now uses API credentials without ever seeing them. If the agent is compromised:

- Attacker gets `seks_openai_abc123` — useless outside the broker
- Attacker does NOT get `sk-...` — your real key stays safe

## Next Steps

- **Multiple agents:** Create separate agents with different access
- **Activity logs:** Coming soon — audit logging is on the roadmap
- **Token rotation:** Coming soon — token regeneration is on the roadmap

---

*Questions? Check the FAQ or reach out to the team.*
