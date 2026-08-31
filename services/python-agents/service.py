"""LeadPilot optional Python reasoning workforce."""
from __future__ import annotations
import html,json,os,re,urllib.parse,urllib.request
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
from typing import Any
from general_manager import choose_agents, build_response

REASONING_AGENTS={"lead-finder","trend-finder","opportunity-finder","tender-finder","ecommerce-opportunity","workpilot","content","competitor-monitor","outreach","website-brand","gbp-audit","gbp-outreach","gbp-fix"}

def words(text:str)->list[str]: return [x for x in re.split(r"[^a-zA-Z0-9+#.]+",text.lower()) if len(x)>2]
def score(text:str,query:str)->int:
 q,t=set(words(query)),set(words(text)); return max(25,min(98,45+len(q&t)*9))
def fetch_rss(query:str,limit:int=12):
 url=f"https://news.google.com/rss/search?q={urllib.parse.quote(query)}&hl=en-US&gl=US&ceid=US:en"
 try:
  req=urllib.request.Request(url,headers={"User-Agent":"LeadPilot Python Agent/1.0"})
  with urllib.request.urlopen(req,timeout=8) as r: raw=r.read().decode("utf-8",errors="replace")
  items=[]
  for block in re.findall(r"<item[\s\S]*?</item>",raw,re.I)[:limit]:
   def tag(name):
    m=re.search(rf"<{name}[^>]*>([\s\S]*?)</{name}>",block,re.I); return html.unescape(re.sub(r"<[^>]+>"," ",m.group(1))).replace("<![CDATA[","").replace("]]>","").strip() if m else ""
   x={"title":tag("title"),"description":tag("description"),"url":tag("link"),"posted":tag("pubDate")}
   if x["title"] and x["url"]: items.append(x)
  return items,[]
 except Exception as exc:return [],[f"Public indexed research was unavailable: {type(exc).__name__}"]

def lead_finder(payload:dict[str,Any])->dict[str,Any]:
 businesses=payload.get("businesses") if isinstance(payload.get("businesses"),list) else []
 query=str(payload.get("query","")).strip(); out=[]
 for b in businesses:
  if not isinstance(b,dict): continue
  name=str(b.get("name") or "business"); industry=str(b.get("industry") or payload.get("industry") or "business"); city=str(b.get("city") or payload.get("city") or ""); website=str(b.get("website") or "")
  signals=[]; missing=[]
  if website: signals.append("public website")
  else: missing.append("website")
  if b.get("phone") or b.get("email"): signals.append("direct contact")
  else: missing.append("direct contact")
  text=f"{name} {industry} {city} {website} {b.get('address','')}"
  out.append({"businessId":b.get("id"),"enrichmentSummary":f"{name} is a {industry}{(' in '+city) if city else ''}. Evidence-backed enrichment found {', '.join(signals) if signals else 'limited public signals'}.","signals":signals,"missing":missing,"recommendedOffer":"AI lead generation and follow-up automation" if website else "AI-powered website and lead-capture automation","enrichmentScore":score(text,query or industry),"confidence":"medium" if signals else "low"})
 return {"agent":"lead-finder","results":out,"warnings":[]}

def website_brand(payload:dict[str,Any])->dict[str,Any]:
 query=str(payload.get("query","")).strip() or "business website"; q=query.lower()
 industry="hospitality" if re.search(r"restaurant|food|cafe|bar|hotel",q) else "professional services" if re.search(r"real estate|property|realtor",q) else "local service" if re.search(r"plumb|hvac|roof|contractor|construction|cleaning",q) else "creative" if re.search(r"agency|marketing|photograph|design|beauty|fashion",q) else "software" if re.search(r"saas|software|app|ai|tech",q) else "business"
 personality={"hospitality":["warm","inviting","visual"],"professional services":["credible","clear","confident"],"local service":["practical","trustworthy","direct"],"creative":["distinctive","human","expressive"],"software":["clear","modern","focused"],"business":["professional","human","clear"]}[industry]
 return {"agent":"website-brand","results":[{"name":query,"industry":industry,"brandDirection":{"personality":personality,"tone":"conversational, specific and customer-first"},"websitePlan":{"pages":["Home","Services","About","FAQ","Contact"],"mobileFirst":True},"copy":{"headline":f"A clearer way to choose {query}","cta":"Talk to us"}}],"warnings":[]}

def generic(payload):
 agent=str(payload.get("agent")); query=str(payload.get("query",""))
 if agent in {"outreach","gbp-outreach"}: return {"agent":agent,"results":[{"draft":f"Hi — I noticed an opportunity around {query}. I can help review it and outline practical improvements for your business. If useful, I can send over the details for your review."}],"warnings":[]}
 if agent=="content": return {"agent":agent,"results":[{"title":f"Content plan for {query}","items":["Customer problem post","Useful educational post","Proof/evidence post","Clear next-step post"]}],"warnings":[]}
 return {"agent":agent,"results":[{"title":f"Python analysis for {query}","summary":"Reasoning worker response; TypeScript retains business rules and side effects."}],"warnings":[]}

def research(payload):
 agent=str(payload["agent"]); query=str(payload.get("query","")); terms={"trend-finder":f"current emerging trends {query} market demand news","opportunity-finder":f"{query} business opportunity customer demand pain points market gap companies","tender-finder":f"{query} public tender procurement contract request for proposal government bid","ecommerce-opportunity":f"{query} product demand customer buying intent ecommerce market opportunity"}[agent]; items,warnings=fetch_rss(terms,int(payload.get("limit") or 20)); return {"agent":agent,"results":[{"id":f"{agent}-{abs(hash(x['url']))}","title":x["title"],"description":x["description"],"url":x["url"],"source":"Google News indexed evidence","posted":x["posted"],"score":score(x["title"]+" "+x["description"],query)} for x in items],"warnings":warnings}

def run(payload):
 if payload.get("agent")=="general-manager":
  agents=choose_agents(str(payload.get("query","")),payload.get("agents") or [])
  return build_response(str(payload.get("query","")),agents,{k:v for k,v in payload.items() if k not in {"query","agents","account_id"}})
 agent=payload.get("agent")
 if agent not in REASONING_AGENTS:return {"error":f"Python worker does not own agent: {agent}"}
 if agent=="lead-finder":return lead_finder(payload)
 if agent=="website-brand":return website_brand(payload)
 if agent in {"trend-finder","opportunity-finder","tender-finder","ecommerce-opportunity"}:return research(payload)
 return generic(payload)

class Handler(BaseHTTPRequestHandler):
 def send_json(self,status,body):
  data=json.dumps(body).encode();self.send_response(status);self.send_header("Content-Type","application/json");self.send_header("Content-Length",str(len(data)));self.end_headers();self.wfile.write(data)
 def do_GET(self): self.send_json(200,{"status":"ok","service":"leadpilot-python-agents"}) if self.path=="/health" else self.send_json(404,{"error":"not found"})
 def do_POST(self):
  if self.path!="/run":return self.send_json(404,{"error":"not found"})
  try:
   n=int(self.headers.get("Content-Length","0"));payload=json.loads(self.rfile.read(n) or b"{}");result=run(payload);self.send_json(200 if "error" not in result else 400,result)
  except Exception as exc:self.send_json(500,{"error":"python agent failed safely","detail":str(exc)})
 def log_message(self,fmt,*args):return
if __name__=="__main__":ThreadingHTTPServer(("0.0.0.0",int(os.environ.get("PORT","8000"))),Handler).serve_forever()
