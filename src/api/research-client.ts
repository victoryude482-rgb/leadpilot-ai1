export type ResearchSource = { title: string; url: string; source: string; snippet?: string; publishedAt?: string };
export type ResearchResponse = { answer?: string; sources?: ResearchSource[]; queries?: string[]; warnings?: string[]; error?: string };

export async function researchQuestion(question: string): Promise<ResearchResponse> {
  const response = await fetch('/api/research', { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body:JSON.stringify({question}) });
  const body = await response.json().catch(()=>({})) as ResearchResponse;
  if (!response.ok) throw new Error(body.error || `Research failed (${response.status})`);
  return body;
}
