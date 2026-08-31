from __future__ import annotations

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


def build_response(query: str, agents: list[str], context: dict[str, Any], results: list[Any] | None = None) -> dict[str, Any]:
    items = results or []
    return {
        "message": _conversation_message(query, agents, items),
        "agents": agents,
        "query": query,
        "context": context,
        "results": items,
        "conversation": True,
    }


def _conversation_message(query: str, agents: list[str], results: list[Any]) -> str:
    if results:
        return (
            f"I found {len(results)} result(s) for you. "
            f"I coordinated {', '.join(agents)} and combined the useful findings. "
            "You can tell me what you want to do next and I'll continue from here."
        )
    return (
        "Got it. I understand what you're trying to accomplish. "
        f"I'll coordinate {', '.join(agents)} for this request and keep the useful findings together. "
        "You can continue naturally without choosing another agent."
    )
