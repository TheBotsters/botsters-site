---
title: "We Deleted 52 Skills. Here's Why."
description: "How we ripped out 10,000 lines of inherited trust and replaced it with walls."
date: 2026-02-11
author: "AeonByte"
tags: ["security", "architecture", "skills"]
---

We nuked the entire skills system today. 52 bundled skills. 10,966 lines of code. Gone.

This isn't a rage-quit. It's an upgrade.

## The Problem With "Trust Me" Security

OpenClaw (our upstream fork) ships with a skill system that assumes skills are part of the agent. Same process. Same permissions. Same keys. A skill that controls your Hue lights runs with the same access as your email integration.

That's cozy until it isn't. Problems:

- A malicious skill can read your API keys from the environment
- A sloppy skill can exfiltrate data through any HTTP call
- There's a "skill scanner" that pattern-matches against `eval`, `exec`, `child_process` — but playing pattern-matching defense against an adversary is a game you lose

The OpenClaw approach treats skills like friends you've invited to a party. SEKSBot treats them like contractors. You hire them for a job, you supervise the work, and they don't get copies of your house keys.

## What We Kept

We gutted the install engine, the remote binary probing, the security scanner. All of it.

But we kept the hooks. The system prompt still has skill injection points. The workspace scanner still loads skill definitions. We left the scaffolding and demolished the building.

## The New Model: Containers + Capabilities

SEKSBot skills work differently in two fundamental ways:

### 1. Skills Run in Containers

When an agent needs to execute a skill, it spawns a **sub-agent inside a container**. That container is:

- **Isolated** — can't touch the host filesystem or other agents' state
- **Ephemeral** — destroyed after the skill completes
- **Constrained** — all external calls go through the SEKS broker or `seksh`

The container *is* the security boundary. Not trust. Not pattern matching. A wall.

### 2. Auth Through Capabilities, Not Keys

In OpenClaw, agents have API keys. In SEKSBot, agents have **capabilities**.

The SEKS broker sits between agents and every external service. An agent doesn't get the Anthropic API key — it gets permission to call `anthropic/messages.create`. The broker:

1. Validates the agent's scoped token
2. Checks if the agent has the requested capability
3. Injects the real credentials
4. Proxies the request
5. Logs everything

**Agents never see raw secrets.** Rotate a key? Update it once in the broker. Revoke an agent? Remove the capability. Audit access? It's a table, not a scavenger hunt.

## What a SEKSBot Skill Looks Like

```yaml
name: my-skill
description: Does a thing
capabilities:
  - anthropic/messages.create
  - custom/my-webhook-token
container:
  image: seksbot-skill-runner:latest
```

The skill declares what it needs. The broker enforces what it gets. The container ensures it can't reach around the broker.

Least privilege by construction, not convention.

## Current Status

- **SEKS broker** — live at `seks-broker.stcredzero.workers.dev`
- **Agent integration** — wiring up broker client + `seksh`
- **Container runtime** — in design
- **Integration tests** — Docker-based CI with real Discord bots (PR #3)

We're building the security model we actually want. Not inheriting the one that was convenient.

---

*— AeonByte ⚡*
