export type DesignPattern = {
  id: string;
  industries: string[];
  personality: string[];
  layout: string[];
  tone: string;
  sections: string[];
};

// Design references are patterns, not copied templates. The renderer builds original pages from these patterns.
export const DESIGN_PATTERNS: DesignPattern[] = [
  { id:'local-service', industries:['plumbing','hvac','roofing','construction','cleaning','home service'], personality:['practical','trustworthy','direct'], layout:['problem-first hero','services grid','proof','service area','contact CTA'], tone:'plainspoken and reassuring', sections:['navbar','hero','services','why-us','service-area','faq','contact','footer'] },
  { id:'hospitality', industries:['restaurant','cafe','bar','hotel','food'], personality:['warm','inviting','visual'], layout:['visual hero','menu/services','story','gallery','booking CTA'], tone:'warm, sensory and concise', sections:['navbar','hero','menu','story','gallery','location','booking','footer'] },
  { id:'professional', industries:['law','accounting','consulting','insurance','finance','real estate'], personality:['credible','calm','confident'], layout:['clear promise','services','proof','process','contact'], tone:'confident without hype', sections:['navbar','hero','services','process','proof','faq','contact','footer'] },
  { id:'creative', industries:['photography','design','agency','marketing','fashion','beauty'], personality:['expressive','editorial','human'], layout:['visual hero','work showcase','story','services','contact'], tone:'specific, conversational and visual', sections:['navbar','hero','work','services','about','contact','footer'] },
  { id:'software', industries:['saas','software','ai','app','technology','startup'], personality:['clear','smart','focused'], layout:['product promise','demo','benefits','how it works','pricing/contact'], tone:'clear and outcome-focused', sections:['navbar','hero','product','benefits','how-it-works','pricing','faq','footer'] },
  { id:'community', industries:['school','church','nonprofit','community','event','fitness'], personality:['welcoming','active','people-first'], layout:['welcome','what happens here','schedule','people','join CTA'], tone:'friendly and inclusive', sections:['navbar','hero','programs','schedule','people','faq','contact','footer'] },
  { id:'commerce', industries:['shop','ecommerce','fashion','retail','beauty','product'], personality:['confident','visual','helpful'], layout:['product hero','collections','benefits','reviews','shop CTA'], tone:'useful and product-specific', sections:['navbar','hero','collections','featured','benefits','faq','footer'] },
];

function normalize(q:string){ return q.toLowerCase(); }
export function selectDesign(query:string): DesignPattern {
  const q=normalize(query);
  const hit=DESIGN_PATTERNS.find(p=>p.industries.some(x=>q.includes(x)));
  if(hit) return hit;
  return { id:'custom-business', industries:['general'], personality:['human','clear'], layout:['clear promise','services','proof','contact'], tone:'natural and specific', sections:['navbar','hero','services','about','faq','contact','footer'] };
}

export function buildHumanCopy(query:string, pattern:DesignPattern){
  const name=query.trim() || 'your business';
  const first={
    'local-service':[`Need a hand with something at home?`,`Tell us what’s going on. We’ll help you figure out the next step.`],
    hospitality:[`Good food, good company, no fuss.`,`Come as you are. Take a look at the menu, find a time that works, and we’ll take care of the rest.`],
    professional:[`Straight answers. Practical help.`,`You should know what you’re getting, what it costs, and what happens next. That’s how we work.`],
    creative:[`Good work should feel like you.`,`We take the time to understand the idea, then turn it into something people remember.`],
    software:[`Make the work easier, not more complicated.`,`See what it does, decide if it fits, and get moving without a long sales pitch.`],
    community:[`You’re welcome here.`,`Find out what’s happening, meet the people involved, and come along when it suits you.`],
    commerce:[`Find something you’ll actually use.`,`Simple choices, useful details, and products selected for a reason.`],
    'custom-business':[`A website that makes it easy to choose you.`,`Tell people what you do, why it matters, and how they can reach you without making them hunt for it.`]
  }[pattern.id] || [`What can we help with?`,`Clear information, useful details, and an easy next step.`];
  return { name, headline:first[0], subheadline:first[1], cta: pattern.id==='hospitality'?'Book a table':pattern.id==='commerce'?'Shop now':pattern.id==='local-service'?'Get help':pattern.id==='software'?'See how it works':pattern.id==='community'?'Join us':'Let’s talk' };
}

export const HUMAN_COPY_RULES = [
  'Write for the customer first, not for search engines.',
  'Use concrete nouns and verbs. Prefer short sentences mixed with occasional longer ones.',
  'Mention a real customer problem when evidence supports it; otherwise do not invent one.',
  'Never invent testimonials, awards, years in business, prices, addresses, clients, statistics or guarantees.',
  'Do not use generic AI filler such as cutting-edge, seamless, revolutionary, unlock, elevate, leverage or game-changing.',
  'Avoid repeating the company name in every sentence.',
  'Use contractions naturally where appropriate.',
  'Keep calls to action specific to the next step.',
  'If business details are unknown, leave the detail out or use a neutral prompt for the owner to fill in.',
  'Vary page structure and tone according to industry and audience; never use one universal template.'
];
