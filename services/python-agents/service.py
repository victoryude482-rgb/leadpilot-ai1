"""LeadPilot's optional Python agent workforce.

TypeScript remains the control plane: authentication, CRM transitions, approvals,
persistence, revenue and outbound side effects. This worker owns reasoning-heavy
research and planning and returns structured JSON. It uses only the stdlib.
"""
from __future__ import annotations

import html
import json
import os
import re
import urllib.parse
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any

REASONING_AGENTS = {
    "trend-finder", "opportunity-finder", "tender-finder", "ecommerce-opportunity",
    "workpilot", "content", "competitor-monitor", "outreach",
    "gbp-audit", "gbp-outreach", "gbp-fix",
}


def words(text: str) -> list[str]:
    return [x for x in re.split(r"[^a-zA-Z0-9+#.]+", text.lower()) if len(x) > 2]


def score(text: str, query: str) -> int:
    q, t = set(words(query)), set(words(text))
    hits = len(q & t)
    return max(25, min(98, 45 + hits * 9 + (8 if re.search(r"remote|worldwide|flexible", text, re.I) else 0)))


def fetch_rss(query: str, limit: int = 12) -> tuple[list[dict[str, str]], list[str]]:
    url = f"https://news.google.com/rss/search?q={urllib.parse.quote(query)}&hl=en-US&gl=US&ceid=US:en"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "LeadPilot Python Agent/1.0"})
        with urllib.request.urlopen(req, timeout=8) as response:
            raw = response.read().decode("utf-8", errors="replace")
        items: list[dict[str, str]] = []
        for block in re.findall(r"<item[\s\S]*?</item>", raw, re.I)[:limit]:
            def tag(name: str) -> str:
                m = re.search(rf"<{name}[^>]*>([\s\S]*?)</{name}>", block, re.I)
                if not m: return ""
                value = html.unescape(re.sub(r"<[^>]+>", " ", m.group(1)))
                return value.replace("<![CDATA[", "").replace("]]>", "").strip()
            item = {"title": tag("title"), "description": tag("description"), "url": tag("link"), "posted": tag("pubDate")}
            if item["title"] and item["url"]: items.append(item)
        return items, []
    except Exception as exc:
        return [], [f"Public indexed research was unavailable: {type(exc).__name__}"]


def solve(title: str, description: str) -> dict[str, Any]:
    text = f"{title} {description}".lower()
    if re.search(r"website|web|shopify|wordpress|landing", text):
        problem = "The client needs a stronger or functioning web presence."
        solution = "Audit the current experience, define the required pages, implement the highest-impact changes, test mobile and performance, and deliver the site."
    elif re.search(r"logo|brand|design|ui|ux", text):
        problem = "The client needs a clearer visual identity or user experience."
        solution = "Create a small brand system, produce concepts, validate the chosen direction, and deliver reusable assets."
    elif re.search(r"bug|error|fix|broken|issue", text):
        problem = "The client has a technical problem that needs diagnosis and a verified fix."
        solution = "Reproduce the issue, isolate the root cause, implement the smallest safe fix, add a regression check, and verify the result."
    elif re.search(r"marketing|seo|sales|lead", text):
        problem = "The client needs more qualified attention, traffic or customers."
        solution = "Define the target audience, audit the current funnel, create measurable improvements, and report the resulting signals."
    else:
        problem = "The client has a business task that needs a defined deliverable and execution plan."
        solution = "Clarify requirements, split the work into milestones, build the smallest complete solution, test it, and hand over documentation."
    return {"problem": problem, "solution": solution,
            "plan": ["Clarify requirements and acceptance criteria", "Audit the existing work and constraints", "Build the first working version", "Test against client requirements", "Deliver, document and request approval"]}


def workpilot(payload: dict[str, Any]) -> dict[str, Any]:
    query = str(payload.get("query", "")).strip()
    sources = [("Indeed", "indeed.com/jobs"), ("Upwork", "upwork.com/freelance-jobs"), ("Freelancer", "freelancer.com/projects"), ("Fiverr", "fiverr.com/categories")]
    results, warnings = [], []
    for source, domain in sources:
        items, source_warnings = fetch_rss(f"site:{domain} {query}")
        warnings.extend(f"{source}: {w}" for w in source_warnings)
        for item in items:
            solved = solve(item["title"], item["description"])
            match = score(f"{item['title']} {item['description']}", query)
            results.append({"id": f"{source}-{abs(hash(item['url']))}", "title": item["title"], "description": item["description"], "url": item["url"], "source": source, "posted": item["posted"], "location": payload.get("location"), "matchScore": match, "label": "GOOD" if match >= 75 else "MEDIUM" if match >= 55 else "BAD", "skills": list(dict.fromkeys(re.findall(r"\b(?:react|next\.js|typescript|javascript|python|node\.js|wordpress|shopify|figma|seo|marketing|sales|design|php|java|flutter|aws|sql|ai|automation|copywriting)\b", f"{item['title']} {item['description']}", re.I)))[:8], **solved, "proposal": f"Hi — I reviewed your project and understand that you need {solved['problem'].lower()} I can approach it by {solved['solution'].lower()} I would start with a quick requirements and audit pass, then deliver the work in clear milestones with testing before handoff."})
    results = list({x["url"]: x for x in results}.values())
    results.sort(key=lambda x: x["matchScore"], reverse=True)
    if not results: warnings.append("No indexed listings were returned. The agent did not invent jobs; use the official source search links.")
    return {"agent": "workpilot", "results": results[: int(payload.get("limit") or 20)], "warnings": warnings, "strategy": ["Python worker performs multi-source public discovery and structured problem solving.", "No private marketplace endpoint is used.", "No listing is fabricated when indexed discovery fails."]}


def research(payload: dict[str, Any]) -> dict[str, Any]:
    agent = str(payload["agent"])
    query = str(payload.get("query", "")).strip()
    terms = {
        "trend-finder": f"current emerging trends {query} market demand news",
        "opportunity-finder": f"{query} business opportunity customer demand pain points market gap companies",
        "tender-finder": f"{query} public tender procurement contract request for proposal government bid",
        "ecommerce-opportunity": f"{query} product demand customer buying intent ecommerce market opportunity",
    }[agent]
    items, warnings = fetch_rss(terms, int(payload.get("limit") or 20))
    results = [{"id": f"{agent}-{abs(hash(x['url']))}", "title": x["title"], "description": x["description"], "url": x["url"], "source": "Google News indexed evidence", "posted": x["posted"], "evidenceType": "publicly indexed research signal", "score": score(f"{x['title']} {x['description']}", query)} for x in items]
    return {"agent": agent, "results": results, "warnings": warnings, "strategy": ["Python performs evidence-oriented research from public indexed sources.", "Results are research evidence, not fabricated businesses or verified private facts.", "Provider failures are returned as warnings rather than hidden."]}


def gbp_audit(payload: dict[str, Any]) -> dict[str, Any]:
    audits = []
    for business in payload.get("businesses") or []:
        issues = []
        if not business.get("website"): issues.append({"code": "NO_WEBSITE", "issue": "No public website is listed."})
        if not business.get("phone"): issues.append({"code": "NO_PHONE", "issue": "No phone number is listed."})
        if not business.get("address") and not business.get("city"): issues.append({"code": "NO_ADDRESS", "issue": "No address is listed."})
        if not business.get("industry") and not business.get("category"): issues.append({"code": "NO_CATEGORY", "issue": "No category/industry is available."})
        if issues:
            health = max(0, 100 - len(issues) * 20)
            audits.append({"business": business, "score": health, "grade": "GOOD" if health >= 80 else "NEEDS_WORK" if health >= 55 else "POOR", "issues": issues, "evidenceBasis": "Inferred from supplied/public directory data; not a direct read of the business's Google Business Profile."})
    return {"agent": "gbp-audit", "results": audits, "warnings": [], "strategy": ["Python analyzes only supplied evidence.", "No Google Business Profile fact is claimed without Google Places evidence."]}


def generic(payload: dict[str, Any]) -> dict[str, Any]:
    agent, query = str(payload.get("agent")), str(payload.get("query", ""))
    if agent in {"outreach", "gbp-outreach"}:
        issues = payload.get("issues") or []
        issue_text = "; ".join(str(i.get("issue", i)) for i in issues) or "the specific listing issues identified in the audit"
        return {"agent": agent, "results": [{"draft": f"Hi — I noticed {issue_text.lower()} on your public listing. I can help review these areas and outline practical fixes. If useful, I can send over the details for your review."}], "warnings": []}
    if agent == "gbp-fix":
        issues = payload.get("issues") or []
        return {"agent": agent, "results": [{"plan": [f"Resolve: {i.get('issue', i)}" for i in issues] or ["Review the supplied listing evidence and define the missing fixes."]}], "warnings": []}
    if agent == "content":
        return {"agent": agent, "results": [{"title": f"Content plan for {query}", "items": ["Customer problem post", "Useful educational post", "Proof/evidence post", "Clear next-step post"]}], "warnings": []}
    return {"agent": agent, "results": [{"title": f"Python analysis for {query}", "summary": "Reasoning worker response; TypeScript retains all business rules and side effects."}], "warnings": []}


def run(payload: dict[str, Any]) -> dict[str, Any]:
    agent = payload.get("agent")
    if agent not in REASONING_AGENTS: return {"error": f"Python worker does not own agent: {agent}"}
    if agent == "workpilot": return workpilot(payload)
    if agent in {"trend-finder", "opportunity-finder", "tender-finder", "ecommerce-opportunity"}: return research(payload)
    if agent == "gbp-audit": return gbp_audit(payload)
    return generic(payload)


class Handler(BaseHTTPRequestHandler):
    def send_json(self, status: int, body: dict[str, Any]) -> None:
        data = json.dumps(body).encode("utf-8")
        self.send_response(status); self.send_header("Content-Type", "application/json"); self.send_header("Content-Length", str(len(data))); self.end_headers(); self.wfile.write(data)
    def do_GET(self) -> None:
        self.send_json(200, {"status": "ok", "service": "leadpilot-python-agents"}) if self.path == "/health" else self.send_json(404, {"error": "not found"})
    def do_POST(self) -> None:
        if self.path != "/run": self.send_json(404, {"error": "not found"}); return
        try:
            length = int(self.headers.get("Content-Length", "0")); payload = json.loads(self.rfile.read(length) or b"{}"); result = run(payload); self.send_json(200 if "error" not in result else 400, result)
        except Exception as exc: self.send_json(500, {"error": "python agent failed safely", "detail": str(exc)})
    def log_message(self, fmt: str, *args: Any) -> None: return


if __name__ == "__main__":
    ThreadingHTTPServer(("0.0.0.0", int(os.environ.get("PORT", "8000"))), Handler).serve_forever()
