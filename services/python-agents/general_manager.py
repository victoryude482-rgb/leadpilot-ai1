from __future__ import annotations

from typing import Any


def choose_agents(query: str, requested: list[str] | None = None) -> list[str]:
    if requested:
        return list(dict.fromkeys(requested))[:3]
    q = query.lower()
    rules = [
        ("competitor-monitor", ("competitor", "rival", "competition")),
        ("trend-finder", ("trend", "trending", "hot")),
        ("tender-finder", ("tender", "procurement", "bid", "contract")),
        ("ecommerce-opportunity", ("ecommerce", "e-commerce", "sell online", "product")),
        ("website-brand", ("website", "brand", "landing page", "rebrand")),
        ("content", ("content", "post", "copy", "blog", "caption")),
        ("outreach", ("outreach", "email", "prospect", "contact")),
        ("gbp-audit", ("google business", "gbp", "google profile", "maps profile")),
        ("workpilot", ("workpilot", "research and solve", "solve this")),
        ("opportunity-finder", ("opportunity", "market research", "business idea")),
        ("lead-finder", ("lead", "business", "company", "restaurant", "customer", "find")),
    ]
    return [agent for agent, words in rules if any(w in q for w in words)][:3] or ["lead-finder"]


def build_response(query: str, agents: list[str], context: dict[str, Any]) -> dict[str, Any]:
    return {
        "message": f"I’ll handle that as your General Manager. I’m going to use {', '.join(agents)} and combine the useful findings into one answer.",
        "agents": agents,
        "query": query,
        "context": context,
        "results": [],
    }
