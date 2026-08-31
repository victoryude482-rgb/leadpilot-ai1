"""LeadPilot's optional Python agent workforce.

The worker is deliberately dependency-free. TypeScript remains the control plane:
authentication, CRM transitions, approval gates, persistence and outbound sends.
Python owns reasoning-heavy transformations and returns structured JSON only.
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
    "workpilot", "content", "website-brand", "competitor-monitor",
    "gbp-audit", "gbp-outreach", "gbp-fix", "outreach",
}


def words(text: str) -> list[str]:
    return [x for x in re.split(r"[^a-zA-Z0-9+#.]+", text.lower()) if len(x) > 2]


def score(text: str, query: str) -> int:
    q = set(words(query))
    t = set(words(text))
    hits = len(q & t)
    return max(25, min(98, 45 + hits * 9 + (8 if re.search(r"remote|worldwide|flexible", text, re.I) else 0)))


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
    return {
        "problem": problem,
        "solution": solution,
        "plan": ["Clarify requirements and acceptance criteria", "Audit the existing work and constraints", "Build the first working version", "Test against client requirements", "Deliver, document and request approval"],
    }


def workpilot(payload: dict[str, Any]) -> dict[str, Any]:
    query = str(payload.get("query", "")).strip()
    sources = [
        ("Indeed", "indeed.com/jobs"), ("Upwork", "upwork.com/freelance-jobs"),
        ("Freelancer", "freelancer.com/projects"), ("Fiverr", "fiverr.com/categories"),
    ]
    results: list[dict[str, Any]] = []
    warnings: list[str] = []
    for source, domain in sources:
        rss_query = urllib.parse.quote(f"site:{domain} {query}")
        url = f"https://news.google.com/rss/search?q={rss_query}&hl=en-US&gl=US&ceid=US:en"
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "LeadPilot Python Agent/1.0"})
            with urllib.request.urlopen(req, timeout=8) as response:
                raw = response.read().decode("utf-8", errors="replace")
            for block in re.findall(r"<item[\s\S]*?</item>", raw, re.I)[:12]:
                def tag(name: str) -> str:
                    m = re.search(rf"<{name}[^>]*>([\s\S]*?)</{name}>", block, re.I)
                    return html.unescape(re.sub(r"<[^>]+>", " ", m.group(1))).replace("<![CDATA[", "").replace("]]>", "").strip() if m else ""
                title, desc, link, posted = tag("title"), tag("description"), tag("link"), tag("pubDate")
                if not title or not link:
                    continue
                solved = solve(title, desc)
                match = score(f"{title} {desc}", query)
                results.append({"id": f"{source}-{abs(hash(link))}", "title": title, "description": desc,
                                "url": link, "source": source, "posted": posted,
                                "location": payload.get("location"), "matchScore": match,
                                "label": "GOOD" if match >= 75 else "MEDIUM" if match >= 55 else "BAD",
                                "skills": list(dict.fromkeys(re.findall(r"\b(?:react|next\.js|typescript|javascript|python|node\.js|wordpress|shopify|figma|seo|marketing|sales|design|php|java|flutter|aws|sql|ai|automation|copywriting)\b", f"{title} {desc}", re.I)))[:8],
                                **solved,
                                "proposal": f"Hi — I reviewed your project and understand that you need {solved['problem'].lower()} I can approach it by {solved['solution'].lower()} I would start with a quick requirements and audit pass, then deliver the work in clear milestones with testing before handoff."})
        except Exception as exc:
            warnings.append(f"{source}: public indexed discovery was unavailable; use the official search link. ({type(exc).__name__})")
    results = list({x["url"]: x for x in results}.values())
    results.sort(key=lambda x: x["matchScore"], reverse=True)
    if not results:
        warnings.append("No indexed listings were returned. The agent did not invent jobs; use the official source search links.")
    return {"agent": "workpilot", "results": results[: int(payload.get("limit") or 20)], "warnings": warnings,
            "strategy": ["Python worker performs research and structured problem solving.", "No private marketplace endpoint is used.", "No listing is fabricated when indexed discovery fails."]}


def gbp_audit(payload: dict[str, Any]) -> dict[str, Any]:
    businesses = payload.get("businesses") or []
    audits = []
    for b in businesses:
        issues = []
        if not b.get("website"): issues.append({"code": "NO_WEBSITE", "issue": "No public website is listed."})
        if not b.get("phone"): issues.append({"code": "NO_PHONE", "issue": "No phone number is listed."})
        if not b.get("address") and not b.get("city"): issues.append({"code": "NO_ADDRESS", "issue": "No address is listed."})
        if not b.get("industry") and not b.get("category"): issues.append({"code": "NO_CATEGORY", "issue": "No category/industry is available."})
        if not issues: continue
        score_value = max(0, 100 - len(issues) * 20)
        audits.append({"business": b, "score": score_value,
                       "grade": "GOOD" if score_value >= 80 else "NEEDS_WORK" if score_value >= 55 else "POOR",
                       "issues": issues,
                       "evidenceBasis": "Inferred from supplied/public directory data; this is not a direct read of the business's Google Business Profile."})
    return {"agent": "gbp-audit", "results": audits, "warnings": [],
            "strategy": ["Python analyzes only supplied evidence.", "It does not claim Google Business Profile verification without Google Places evidence."]}


def generic(payload: dict[str, Any]) -> dict[str, Any]:
    agent = payload.get("agent", "python-agent")
    query = payload.get("query", "")
    if agent in {"outreach", "gbp-outreach"}:
        issues = payload.get("issues") or []
        issue_text = "; ".join(str(i.get("issue", i)) for i in issues) or "the specific listing issues identified in the audit"
        return {"agent": agent, "results": [{"draft": f"Hi — I noticed {issue_text.lower()} on your public listing. I can help review these areas and outline practical fixes. If useful, I can send over the details for your review."}], "warnings": []}
    if agent == "gbp-fix":
        issues = payload.get("issues") or []
        return {"agent": agent, "results": [{"plan": [f"Resolve: {i.get('issue', i)}" for i in issues] or ["Review the supplied listing evidence and define the missing fixes."]}], "warnings": []}
    return {"agent": agent, "results": [{"title": f"Python analysis for {query}", "summary": "The Python worker is available for reasoning-heavy analysis; the TypeScript control plane remains responsible for business rules and side effects."}], "warnings": []}


def run(payload: dict[str, Any]) -> dict[str, Any]:
    agent = payload.get("agent")
    if agent not in REASONING_AGENTS:
        return {"error": f"Python worker does not own agent: {agent}"}
    if agent == "workpilot": return workpilot(payload)
    if agent == "gbp-audit": return gbp_audit(payload)
    return generic(payload)


class Handler(BaseHTTPRequestHandler):
    def send_json(self, status: int, body: dict[str, Any]) -> None:
        data = json.dumps(body).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self) -> None:
        if self.path == "/health": self.send_json(200, {"status": "ok", "service": "leadpilot-python-agents"})
        else: self.send_json(404, {"error": "not found"})

    def do_POST(self) -> None:
        if self.path != "/run": self.send_json(404, {"error": "not found"}); return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(length) or b"{}")
            result = run(payload)
            self.send_json(200 if "error" not in result else 400, result)
        except Exception as exc:
            self.send_json(500, {"error": "python agent failed safely", "detail": str(exc)})

    def log_message(self, fmt: str, *args: Any) -> None:
        return


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8000"))
    ThreadingHTTPServer(("0.0.0.0", port), Handler).serve_forever()
