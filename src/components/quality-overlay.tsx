'use client';

import { useEffect } from 'react';
import { classifyLeadScore } from '@/src/agents/quality-summary';

const styles = `
.quality-overlay-badge{display:inline-flex;align-items:center;gap:5px;margin-left:8px;padding:3px 7px;border-radius:999px;font-size:9px;font-weight:800;letter-spacing:.08em;vertical-align:middle;border:1px solid}
.quality-overlay-good{color:#7ee7c4;background:#0d2921;border-color:#315f50}.quality-overlay-good::before{content:'';width:6px;height:6px;border-radius:50%;display:inline-block;background:#42d69e}
.quality-overlay-medium{color:#f2d36b;background:#2a2410;border-color:#6d5b27}.quality-overlay-medium::before{content:'';width:6px;height:6px;border-radius:50%;display:inline-block;background:#e9c84a}
.quality-overlay-bad{color:#ff9da5;background:#2b1418;border-color:#71343d}.quality-overlay-bad::before{content:'';width:6px;height:6px;border-radius:50%;display:inline-block;background:#ff5966}
.quality-overlay-filter{display:flex;gap:7px;flex-wrap:wrap;margin:0 0 14px}.quality-overlay-filter button{border:1px solid #2a4051;background:#13222d;color:#9cb0c0;border-radius:8px;padding:7px 10px;font-size:10px;cursor:pointer}.quality-overlay-filter button.active{border-color:#7ee7c4;color:#7ee7c4}.quality-overlay-filter .good{color:#7ee7c4}.quality-overlay-filter .medium{color:#f2d36b}.quality-overlay-filter .bad{color:#ff9da5}
`;

type Quality = 'GOOD' | 'MEDIUM' | 'BAD';
type Filter = 'ALL' | Quality;

export default function QualityOverlay(){
  useEffect(()=>{
    const style=document.createElement('style');
    style.dataset.qualityOverlay='true';
    style.textContent=styles;
    document.head.appendChild(style);

    const root=document.querySelector('.shell') || document.body;
    let active:Filter='ALL';
    let decorating=false;

    const decorate=()=>{
      if(decorating) return;
      decorating=true;
      try{
        const scores=Array.from(root.querySelectorAll<HTMLElement>('.lead .score'));
        scores.forEach(scoreEl=>{
          const raw=Number(scoreEl.textContent?.trim());
          if(!Number.isFinite(raw)) return;
          const quality=classifyLeadScore(raw) as Quality;
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
          toolbar=document.createElement('div');
          toolbar.className='quality-overlay-filter';
          const labels:[Filter,string][]=[['ALL','All'],['GOOD','🟢 Good'],['MEDIUM','🟡 Medium'],['BAD','🔴 Bad']];
          labels.forEach(([value,label])=>{
            const b=document.createElement('button');
            b.type='button';
            b.dataset.qualityFilter=value;
            b.textContent=label;
            b.onclick=()=>{
              active=value;
              decorate();
            };
            toolbar!.appendChild(b);
          });
          results.insertBefore(toolbar,grid);
        }

        toolbar.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.qualityFilter===active));
        grid.querySelectorAll<HTMLElement>('.lead').forEach(card=>{
          const nextDisplay=active==='ALL'||card.dataset.quality===active?'':'none';
          if(card.style.display!==nextDisplay) card.style.display=nextDisplay;
        });

        const cards=Array.from(grid.querySelectorAll<HTMLElement>('.lead')).filter(c=>c.dataset.quality);
        const counts=cards.reduce((a,c)=>{
          a[c.dataset.quality as Quality]++;
          return a;
        },{GOOD:0,MEDIUM:0,BAD:0});
        const stats=results.querySelector('.stats');
        if(stats && cards.length){
          const html=`<span><b>${cards.length}</b> FOUND</span><span class="good"><b>${counts.GOOD}</b> GOOD</span><span class="medium"><b>${counts.MEDIUM}</b> MEDIUM</span><span class="bad"><b>${counts.BAD}</b> BAD</span>`;
          if(stats.innerHTML!==html) stats.innerHTML=html;
        }
      } finally {
        decorating=false;
      }
    };

    const observer=new MutationObserver(decorate);
    observer.observe(root,{subtree:true,childList:true});
    decorate();

    return()=>{
      observer.disconnect();
      style.remove();
    };
  },[]);

  return null;
}
