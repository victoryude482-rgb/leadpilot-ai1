import { NextResponse } from 'next/server';
import { getSupabaseAuthenticatedUser } from '../../../../src/auth/supabase-server';
import { createOfferToken } from '../../../../src/agents/offer-link';

export async function POST(request: Request){
 const user=await getSupabaseAuthenticatedUser(request); if(!user) return NextResponse.json({error:'Sign in to create offer links.'},{status:401});
 const body=await request.json().catch(()=>({})); const leadId=typeof body.leadId==='string'?body.leadId.trim():''; const agentId=typeof body.agentId==='string'?body.agentId.trim():undefined; const offer=typeof body.offer==='string'?body.offer.trim():''; const amount=Number(body.amount); const currency=typeof body.currency==='string'?body.currency.trim().toUpperCase():'NGN';
 if(!leadId||!offer||!Number.isInteger(amount)||amount<=0) return NextResponse.json({error:'leadId, offer and a positive integer amount are required.'},{status:400});
 const token=createOfferToken({leadId,agentId,offer,amount,currency}); const origin=new URL(request.url).origin; return NextResponse.json({url:`${origin}/offer/${encodeURIComponent(token)}`,expiresInSeconds:604800});
}
