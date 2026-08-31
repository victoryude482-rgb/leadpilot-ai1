from __future__ import annotations

import json
import os
import urllib.request
from typing import Any

AGENT_RULES = [
    ("competitor-monitor", ("competitor", "rival", "competition")),
    ("trend-finder", ("trend", "trending", "hot", "growing")),
    ("tender-finder", ("tender", "procurement", "bid", "contract")),
    ("ecommerce-opportunity", ("ecommerce", "e-commerce", "sell online", "product")),
    ("website-brand", ("website", "brand", "landing page", "rebrand")),
    ("content", ("content", "post", "copy", "blog", "caption")),
    ("outreach", ("outreach", "email", "prospect", "contact", "message")),
    ("gbp-audit", ("google business", "gbp", "google profile", "maps profile")),
    ("workpilot", ("workpilot", "freelance", "job", "work opportunity")),
    ("opportunity-finder", ("opportunity", "market research", "business idea", "need")),
    ("lead-finder", ("lead", "business", "company", "restaurant", "customer", "find", "prospect")),
]


def choose_agents(query: str, requested: list[str] | None = None) -> list[str]:
    if requested:
        return list(dict.fromkeys(requested))[:5]
    q = query.lower()
    selected = [agent for agent, words in AGENT_RULES if any(word in q for word in words)]
    return selected[:5] or ["lead-finder"]


def _llm_config() -> tuple[str, str, str] | None:
    key = os.getenv("GENERAL_MANAGER_API_KEY") or os.getenv("TOGETHER_API_KEY") or os.getenv("OPENAI_API_KEY")
    if not key:
        return None
    url = os.getenv("GENERAL_MANAGER_API_URL") or os.getenv("OPENAI_BASE_URL") or "https://api.together.xyz/v1/chat/completions"
    model = os.getenv("GENERAL_MANAGER_MODEL") or "meta-llama/Llama-3.3-70B-Instruct-Turbo"
    return url.rstrip("/"), key, model


def _llm_answer(query: str, agents: list[str], findings: list[Any], context: dict[str, Any]) -> str | None:
    config = _llm_config()
    if not config:
        return None
    url, key, model = config
    safe_findings = findings[:40]
    prompt = {
        "user_request": query,
        "agents_used": agents,
        "context": context,
        "findings": safe_findings,
    }
    system = (
        "You are LeadPilot's General Manager. Talk to the user like a capable business assistant, not a form. "
        "Use only evidence in the supplied findings; never invent businesses, contacts, numbers, or facts. "
        "Explain what was checked at a high level, summarize the strongest evidence, problems/opportunities and practical next actions. "
        "Do not reveal hidden chain-of-thought. Do not claim an agent did work that is absent from findings. "
        "If evidence is weak, say so and suggest a broader next search. Keep the answer concise but useful."
    )
    body = {"model": model, "temperature": 0.2, "messages": [{"role": "system", "content": system}, {"role": "user", "content": json.dumps(prompt, ensure_ascii=False)}]}
    try:
        req = urllib.request.Request(url, data=json.dumps(body).encode(), headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json", "User-Agent": "LeadPilot-General-Manager/1.0"}, method="POST")
        with urllib.request.urlopen(req, timeout=25) as response:
            data = json.loads(response.read().decode("utf-8", errors="replace"))
        content = data.get("choices", [{}])[0].get("message", {}).get("content")
        return content.strip() if isinstance(content, str) and content.strip() else None
    except Exception:
        return None


def build_response(query: str, agents: list[str], context: dict[str, Any], results: list[Any] | None = None) -> dict[str, Any]:
    items = results or []
    llm = _llm_answer(query, agents, items, context)
    message = llm or _fallback_message(query, agents, items)
    steps = [
        {"agent": "general-manager", "status": "complete", "label": "Understood your request"},
        *[{"agent": agent, "status": "complete", "label": f"Checked {agent}"} for agent in agents],
        {"agent": "general-manager", "status": "complete", "label": "Combined the findings"},
    ]
    return {"message": message, "agents": agents, "query": query, "context": context, "results": items, "steps": steps, "conversation": True, "aiReasoning": bool(llm)}


def _fallback_message(query: str, agents: list[str], results: list[Any]) -> str:
    if results:
        return f"I checked {', '.join(agents)} and combined {len(results)} result(s). I can use the evidence above to help you decide what to do next."
    return f"I understand the request. I checked the available path for {', '.join(agents)}, but I don't have enough evidence yet. I can broaden the search rather than invent an answer."
