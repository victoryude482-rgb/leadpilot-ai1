from __future__ import annotations

from typing import Any


def choose_agents(query: str, requested: list[str] | None = None) -> list[str]:
    if requested:
        return list(dict.fromkeys(requested))[:5]
    q = query.lower()
    rules = [
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
    selected = [agent for agent, words in rules if any(w in q for w in words)]
    return selected[:5] or ["lead-finder"]


def build_response(query: str, agents: list[str], context: dict[str, Any], results: list[Any] | None = None) -> dict[str, Any]:
    results = results or []
    return {
        "message": (
            "I understand. I'll coordinate this for you. "
            f"I'm using {', '.join(agents)} and I'll combine their useful findings instead of making you manage each agent separately."
        ),
        "agents": agents,
        "query": query,
        "context": context,
        "results": results,
        "conversation": True,
    }
