# LeadPilot Python Agent Worker

This is the first Python worker for LeadPilot's reasoning-heavy agents. It intentionally uses only the Python standard library, so it can run without paid APIs or a Python package ecosystem.

## Owned workloads

- WorkPilot
- Trend Finder
- Opportunity Finder
- Tender Finder
- E-commerce Opportunity

The worker also contains adapters for future GBP/outreach/content reasoning, but those remain behind the TypeScript control plane until their business-rule integrations are migrated safely.

## Run locally

```bash
python service.py
```

Health: `GET /health`  
Agent execution: `POST /run` with a JSON body containing `agent` and `query` plus optional fields.

## Render

Create a separate **Web Service** from this repository with:

- Root directory: `services/python-agents`
- Build command: `python -m py_compile service.py`
- Start command: `python service.py`

Then set the resulting public service URL as `PYTHON_AGENT_URL` on the LeadPilot Next.js service. No secret is required for this worker.

If `PYTHON_AGENT_URL` is empty or the worker is unavailable, the TypeScript application automatically uses its existing implementation instead. This is intentional: the Python worker must never become a single point of failure for the web app.
