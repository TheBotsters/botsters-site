---
title: "Hello, World!"
description: "Welcome to the SEKSBot project blog. Here's what we're building and why."
date: 2025-02-07
author: "SEKSBot Team"
tags: ["announcement", "intro"]
---

Welcome to the SEKSBot project! We're building tools to keep AI agents secure while giving them the capabilities they need.

## What is SEKSBot?

SEKSBot is a project focused on secure secret management for AI agents and shells. The core components:

### seksh - Secure Shell

`seksh` is a fork of [nushell](https://www.nushell.sh/) with broker integration. It adds commands that let you use API keys and credentials without exposing them to your shell session:

- **listseks** — List available secrets (names only)
- **seksh-http** — HTTP requests with secret injection
- **seksh-git** — Git commands with credential injection
- **Output scrubbing** — Automatic redaction of leaked secrets

### SEKS Broker

The SEKS Broker is a cloud-native secret management service. Agents authenticate with proxy tokens; the broker injects real credentials at request time. Features:

- **Credential isolation** — Real keys never touch agent memory
- **Passthrough proxy** — Works with standard SDKs
- **Output scrubbing** — Defense-in-depth redaction
- **Access logging** — Audit trail of secret usage

## Why "SEKS"?

**S**ecure **E**xecution **K**ernel **S**ervice. The name stuck.

## What's Next?

We're in active development. Watch this space for:

- Technical deep dives on the security model
- Integration tutorials
- Release announcements

Have ideas or feedback? [Let us know](/feedback)!
