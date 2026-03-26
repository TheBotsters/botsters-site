#!/usr/bin/env python3
"""
Phase D seed script — populates PocketBase staging with site content.
Idempotent: clears existing records before re-seeding.
Usage: python3 scripts/seed-cms.py
"""
import json, urllib.request, urllib.error, subprocess, sys

PB_URL = "http://127.0.0.1:8091"
EMAIL  = "cms-admin@botstersdev.com"

r = subprocess.run(["grep","-A2","PocketBase Staging Admin",
    "/home/aeonbyte_actuator/temp_auth_do_not_delete_until_told"],
    capture_output=True, text=True)
PASS = [l.split("Password:")[1].strip() for l in r.stdout.splitlines() if "Password:" in l][0]

def pb(method, path, data=None, token=None):
    body = json.dumps(data).encode() if data else None
    hdrs = {"Content-Type":"application/json"}
    if token: hdrs["Authorization"] = token
    req = urllib.request.Request(PB_URL+path, data=body, headers=hdrs, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())

def get_token():
    _, d = pb("POST","/api/collections/_superusers/auth-with-password",
              {"identity":EMAIL,"password":PASS})
    return d["token"]

def clear(token, name):
    _, recs = pb("GET",f"/api/collections/{name}/records?perPage=200",token=token)
    for item in recs.get("items",[]):
        pb("DELETE",f"/api/collections/{name}/records/{item['id']}",token=token)
    print(f"  cleared {len(recs.get('items',[]))} from {name}")

def seed(token, col, rows):
    ok=0
    for row in rows:
        s,resp = pb("POST",f"/api/collections/{col}/records",row,token=token)
        if s in (200,201): ok+=1
        else: print(f"  WARN {col}: HTTP {s} — {resp.get('message','?')} — {row.get('title',row.get('name',row.get('key','?')))}")
    print(f"  seeded {ok}/{len(rows)} into {col}")

# ── data ──────────────────────────────────────────────────────────────────────

ROADMAP = [
    {"title":"POST /secrets/get",     "stage":"shipped",     "section":"broker_endpoints","description":"Fetch a secret value",                                        "order":10,"visibility":"public"},
    {"title":"POST /secrets/list",    "stage":"shipped",     "section":"broker_endpoints","description":"List available secret names",                                 "order":20,"visibility":"public"},
    {"title":"POST /proxy/request",   "stage":"shipped",     "section":"broker_endpoints","description":"Generic proxied HTTP with credential injection",              "order":30,"visibility":"public"},
    {"title":"POST /api/s3/presign",  "stage":"in_progress", "section":"broker_endpoints","description":"Generate presigned S3 URLs (no keys on disk)",               "order":40,"visibility":"public"},
    {"title":"ALL /api/openai/*",     "stage":"shipped",     "section":"broker_endpoints","description":"Passthrough proxy to OpenAI",                                 "order":50,"visibility":"public"},
    {"title":"ALL /api/anthropic/*",  "stage":"shipped",     "section":"broker_endpoints","description":"Passthrough proxy to Anthropic",                              "order":60,"visibility":"public"},
    {"title":"ALL /api/github/*",     "stage":"shipped",     "section":"broker_endpoints","description":"Passthrough proxy to GitHub",                                 "order":70,"visibility":"public"},
    {"title":"ALL /api/notion/*",     "stage":"shipped",     "section":"broker_endpoints","description":"Passthrough proxy to Notion",                                 "order":80,"visibility":"public"},
    {"title":"ALL /api/gemini/*",     "stage":"shipped",     "section":"broker_endpoints","description":"Passthrough proxy to Gemini",                                 "order":90,"visibility":"public"},
    {"title":"ALL /api/cloudflare/*", "stage":"shipped",     "section":"broker_endpoints","description":"Passthrough proxy to Cloudflare",                             "order":100,"visibility":"public"},
    {"title":"ALL /api/brave/*",      "stage":"shipped",     "section":"broker_endpoints","description":"Passthrough proxy to Brave",                                  "order":110,"visibility":"public"},
    {"title":"ALL /api/aws/s3/*",     "stage":"shipped",     "section":"broker_endpoints","description":"S3 passthrough with SigV4 signing",                          "order":120,"visibility":"public"},
    {"title":"botster-http",          "stage":"shipped",     "section":"agent_tools",      "description":"HTTP requests with secret injection",                        "order":10,"visibility":"public"},
    {"title":"botster-git",           "stage":"shipped",     "section":"agent_tools",      "description":"Git operations with token injection",                        "order":20,"visibility":"public"},
    {"title":"listsecrets",           "stage":"shipped",     "section":"agent_tools",      "description":"List available secrets",                                     "order":30,"visibility":"public"},
    {"title":"getsek (seksh legacy)", "stage":"cancelled",   "section":"agent_tools",      "description":"Raw secret fetch (security risk) — seksh era, do not use",  "order":40,"visibility":"public"},
    {"title":"flyctl",                "stage":"planned",     "section":"escape_hatches",   "description":"Current: getsek to env var | Needed: botster-fly or /api/fly/*","order":10,"visibility":"public"},
    {"title":"aws CLI",               "stage":"planned",     "section":"escape_hatches",   "description":"Current: not yet used | Needed: botster-aws wrapped command", "order":20,"visibility":"public"},
    {"title":"gh CLI",                "stage":"planned",     "section":"escape_hatches",   "description":"Current: getsek or local PAT | Needed: botster-gh wrapper",  "order":30,"visibility":"public"},
    {"title":"Gmail OAuth",           "stage":"planned",     "section":"escape_hatches",   "description":"Current: tokens in broker | Needed: OAuth token refresh flow","order":40,"visibility":"public"},
    {"title":"wrangler",              "stage":"planned",     "section":"escape_hatches",   "description":"Current: local auth | Needed: botster-wrangler or passthrough","order":50,"visibility":"public"},
    {"title":"Tests for S3 presign endpoint","stage":"planned","section":"planned_work","description":"SigV4 is fiddly, needs test coverage",                        "order":10,"priority":"P0","visibility":"public"},
    {"title":"Merge s3-presign branch",      "stage":"planned","section":"planned_work","description":"Deploy once tests pass",                                        "order":20,"priority":"P0","visibility":"public"},
    {"title":"Scoped secret stores",         "stage":"planned","section":"planned_work","description":"Global + per-agent, eliminates AEONBYTE_ prefix hack",         "order":30,"priority":"P0","visibility":"public"},
    {"title":"botster-fly",                  "stage":"planned","section":"planned_work","description":"Wrapped command for flyctl operations",                         "order":40,"priority":"P1","visibility":"public"},
    {"title":"botster-aws",                  "stage":"planned","section":"planned_work","description":"AWS CLI with credential injection",                              "order":50,"priority":"P1","visibility":"public"},
    {"title":"/api/fly/* passthrough",       "stage":"planned","section":"planned_work","description":"Fly Machines API proxy in broker",                              "order":60,"priority":"P1","visibility":"public"},
    {"title":"botster-gh",                   "stage":"planned","section":"planned_work","description":"GitHub CLI wrapper",                                            "order":70,"priority":"P2","visibility":"public"},
    {"title":"botster-wrangler",             "stage":"planned","section":"planned_work","description":"Cloudflare Wrangler CLI wrapper",                               "order":80,"priority":"P2","visibility":"public"},
    {"title":"OAuth token refresh",          "stage":"planned","section":"planned_work","description":"Broker-managed OAuth flows",                                    "order":90,"priority":"P2","visibility":"public"},
    {"title":"Secret rotation API",          "stage":"planned","section":"planned_work","description":"Rotate keys without touching agent configs",                    "order":100,"priority":"P2","visibility":"public"},
    {"title":"Audit dashboard",              "stage":"planned","section":"planned_work","description":"View broker logs — which agent used which secret",              "order":110,"priority":"P3","visibility":"public"},
    {"title":"Rate limiting",                "stage":"planned","section":"planned_work","description":"Per-agent, per-secret rate limits",                             "order":120,"priority":"P3","visibility":"public"},
    {"title":"Secret expiry",                "stage":"planned","section":"planned_work","description":"Auto-rotate or alert on aging credentials",                     "order":130,"priority":"P3","visibility":"public"},
]

SOFTWARE = [
    {"name":"Botsters Agent-Safe Forum","description":"A link aggregator and discussion platform designed to protect AI users from prompt injection. Heuristic and ML-based injection scanning, trust tiers, split flagging, and an Observatory for tracking adversarial patterns.","links":json.dumps({"href":"/software/forum","icon":"🛡️"}),"status":"beta"},
    {"name":"seksh (Legacy)","description":"A fork of nushell with secure credential isolation. Agents can make authenticated API calls and git operations without secrets ever entering shell memory. Built-in output scrubbing as a defense-in-depth layer.","links":json.dumps({"href":"/software/seksh","icon":"🐚"}),"status":"deprecated"},
    {"name":"Botsters Broker","description":"The Botsters Broker stores your credentials and injects them at request time — like SQL prepared statements for API keys. Agents reference secrets by name; they never see, store, or transmit real values.","links":json.dumps({"href":"/software/broker","icon":"🔐"}),"status":"active"},
]

SITE_SETTINGS = [
    {"key":"nav_links",    "value":json.dumps([{"label":"How It Works","href":"/how-it-works"},{"label":"Software","href":"/software"},{"label":"Roadmap","href":"/roadmap"},{"label":"Security","href":"/security"},{"label":"Blog","href":"/blog"}])},
    {"key":"site_name",    "value":json.dumps("Botsters")},
    {"key":"site_tagline", "value":json.dumps("Secure AI agent infrastructure")},
    {"key":"footer_links", "value":json.dumps([{"label":"GitHub","href":"https://github.com/TheBotsters"},{"label":"Discord","href":"https://discord.com/invite/clawd"}])},
]

# ── run ───────────────────────────────────────────────────────────────────────
print("Authenticating to staging PocketBase...")
token = get_token()
print("Auth OK\n")
for name, data in [("roadmap",ROADMAP),("software",SOFTWARE),("site_settings",SITE_SETTINGS)]:
    print(f"[{name}]")
    clear(token, name)
    seed(token, name, data)
    print()
print("Done ✅")
