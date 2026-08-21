export interface EmailMessage { to:string; subject:string; text:string; }
export interface EmailProvider { send(message:EmailMessage):Promise<{id:string}>; }
export class ResendEmailProvider implements EmailProvider {
 constructor(private readonly apiKey:string,private readonly from:string){}
 async send(message:EmailMessage){const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${this.apiKey}`,'Content-Type':'application/json'},body:JSON.stringify({from:this.from,to:[message.to],subject:message.subject,text:message.text})});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(typeof data?.message==='string'?data.message:`Email provider failed (${response.status})`);return {id:String(data?.id??'unknown')};}
}
export function configuredEmailProvider():EmailProvider|null{const key=process.env.RESEND_API_KEY?.trim();const from=process.env.OUTREACH_FROM_EMAIL?.trim();return key&&from?new ResendEmailProvider(key,from):null}
