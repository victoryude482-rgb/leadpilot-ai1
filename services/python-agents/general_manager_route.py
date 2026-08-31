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
    combined: list[Any] = []
    usable: list[dict[str, Any]] = []
    for finding in request.findings:
        if not isinstance(finding, dict):
            continue
        results = finding.get('results', [])
        if isinstance(results, list):
            combined.extend(results)
        if results or finding.get('message'):
            usable.append(finding)
    total = len(combined)
    message = (
        f"I checked {', '.join(agents)} and combined the available findings. "
        f"I found {total} result{'s' if total != 1 else ''}."
    )
    if total:
        message += " I've kept the findings together so we can continue from here."
    else:
        message += " I don't have a strong match yet, so I can broaden the search."
    return {
        'message': message,
        'agents': agents,
        'results': combined,
        'agent_findings': usable,
        'context': context,
        'conversation': True,
    }
