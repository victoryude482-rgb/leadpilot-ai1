'use client';

import { useEffect } from 'react';
import { classifyLeadScore } from '@/agents/quality-summary';

const styles = `
.quality-overlay-badge{display:inline-flex;align-items:center;gap:5px;margin-left:8px;padding:3px 7px;border-radius:999px;font-size:9px;font-weight:800;letter-spacing:.08em;vertical-align:middle;border:1px solid}
.quality-overlay-badge::before{content:'';width:6px;height:6px;border-radius:50%;display:inline-block}
.quality-overlay-good{color:#7ee7c4;background:#0d2921;border-color:#315f50}.quality-overlay-good::before{background:#42d69e}
.quality-overlay-medium{color:#f2d36b;background:#2a2410;border-color:#6d5b27}.quality-overlay-medium::before{background:#e9c84a}
.quality-overlay-bad{color:#ff9da5;background:#2b1418;border-color:#71343d}.quality-overlay-bad::before{background:#ff5966}
.quality-overlay-filter{display:flex;gap:7px;flex-wrap:wrap;margin:0 0 14px}.quality-overlay-filter button{border:1px solid #2a4051;background:#13222d;color:#9cb0c0;border-radius:8px;padding:7px 10px;font-size:10px;cursor:pointer}.quality-overlay-filter button.active{border-color:#7ee7c4;color:#7ee7c4}.quality-overlay-filter .good{color:#7ee7c4}.quality-overlay-filter .medium{color:#f2d36b}.quality-overlay-filter .bad{color:#ff9da5}
`;

export default function QualityOverlay(){
  useEffect(()=>{
    const style=document.createElement('style'); style.dataset.qualityOverlay='true'; style.textContent=styles; document.head.appendChild(style);
    const root=document.querySelector('.shell') || document.body;
    let active:'ALL'|'GOOD'|'MEDIUM'|'BAD'='ALL';
    const decorate=()=>{
      const scores=Array.from(root.querySelectorAll<HTMLElement>('.lead .score'));
      scores.forEach(scoreEl=>{
        const raw=Number(scoreEl.textContent?.trim());
        if(!Number.isFinite(raw)) return;
        const quality=classifyLeadScore(raw);
        scoreEl.dataset.quality=quality;
        const card=scoreEl.closest<HTMLElement>('.lead');
        if(card) card.dataset.quality=quality;
        if(!scoreEl.parentElement?.querySelector('.quality-overlay-badge')){
          const badge=document.createElement('span');
          badge.className=`quality-overlay-badge quality-overlay-${quality.toLowerCase()}`;
          badge.textContent=quality;
          scoreEl.insertAdjacentElement('afterend',badge);
        }
      });
      const results=root.querySelector('.results');
      const grid=results?.querySelector('.grid');
      if(!results || !grid) return;
      let toolbar=results.querySelector<HTMLElement>('.quality-overlay-filter');
      if(!toolbar){
        toolbar=document.createElement('div'); toolbar.className='quality-overlay-filter';
        const labels:[typeof active,string][]=[['ALL','All'],['GOOD','🟢 Good'],['MEDIUM','🟡 Medium'],['BAD','🔴 Bad']];
        labels.forEach(([value,label])=>{const b=document.createElement('button');b.dataset.qualityFilter=value;b.textContent=label;b.onclick=()=>{active=value;toolbar!.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x.dataset.qualityFilter===active));decorate();};toolbar!.appendChild(b);});
        results.insertBefore(toolbar,grid);
      }
      toolbar.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.qualityFilter===active));
      grid.querySelectorAll<HTMLElement>('.lead').forEach(card=>{card.style.display=active==='ALL'||card.dataset.quality===active?'':'none';});
      const cards=Array.from(grid.querySelectorAll<HTMLElement>('.lead')).filter(c=>c.dataset.quality);
      const counts=cards.reduce((a,c)=>{a[c.dataset.quality as 'GOOD'|'MEDIUM'|'BAD']++;return a},{GOOD:0,MEDIUM:0,BAD:0});
      const stats=results.querySelector('.stats');
      if(stats && cards.length){stats.innerHTML=`<span><b>${cards.length}</b> FOUND</span><span class="good"><b>${counts.GOOD}</b> GOOD</span><span class="medium"><b>${counts.MEDIUM}</b> MEDIUM</span><span class="bad"><b>${counts.BAD}</b> BAD</span>`;}
    };
    const observer=new MutationObserver(decorate); observer.observe(root,{subtree:true,childList:true}); decorate();
    return()=>{observer.disconnect();style.remove();};
  },[]);
  return null;
}
