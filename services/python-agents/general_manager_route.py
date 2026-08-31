from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Any
from .general_manager import choose_agents, build_response

router = APIRouter()

class GeneralManagerRequest(BaseModel):
    query: str
    agents: list[str] = Field(default_factory=list)
    findings: list[dict[str, Any]] = Field(default_factory=list)
    location: str | None = None
    city: str | None = None
    country: str | None = None
    industry: str | None = None
    limit: int = 25
    account_id: str | None = None

@router.post('/v1/agents/general-manager')
def general_manager(request: GeneralManagerRequest) -> dict[str, Any]:
    agents = choose_agents(request.query, request.agents)
    context = request.model_dump(exclude={'query', 'agents', 'findings', 'account_id'})
    if not request.findings:
        return build_response(request.query, agents, context)
    total = sum(len(f.get('results', [])) for f in request.findings if isinstance(f, dict))
    usable = [f for f in request.findings if f.get('results') or f.get('message')]
    message = f"I checked {', '.join(agents)} and combined the available findings. I found {total} result{'s' if total != 1 else ''}."
    message += " I ranked the useful results below so you can decide what to act on next." if total else " I didn't get a strong match yet, so I can broaden the search."
    combined: list[Any] = []
    for finding in usable:
        combined.extend(finding.get('results', []))
    return {"message": message, "agents": agents, "results": combined, "agent_findings": usable, "context": context}
