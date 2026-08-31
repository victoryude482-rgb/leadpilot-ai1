from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Any
from .general_manager import choose_agents, build_response

router = APIRouter()

class GeneralManagerRequest(BaseModel):
    query: str
    agents: list[str] = Field(default_factory=list)
    location: str | None = None
    city: str | None = None
    country: str | None = None
    industry: str | None = None
    limit: int = 25
    account_id: str | None = None

@router.post('/v1/agents/general-manager')
def general_manager(request: GeneralManagerRequest) -> dict[str, Any]:
    agents = choose_agents(request.query, request.agents)
    context = request.model_dump(exclude={'query', 'agents', 'account_id'})
    return build_response(request.query, agents, context)
