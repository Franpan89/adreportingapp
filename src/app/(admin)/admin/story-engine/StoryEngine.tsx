'use client';
import { useState, useEffect } from 'react';

/* ─── API proxy (calls our server route, not Anthropic directly) ── */
async function ask(system: string, user: string): Promise<string> {
  const res = await fetch('/api/story-engine/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ system, user }),
  });
  const d = await res.json();
  if (!res.ok) throw new Error(d.error ?? 'Error de API');
  return d.text ?? '';
}

function parseJSON(raw: string) {
  try { return JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? ''); } catch { return null; }
}

/* ─── DESIGN TOKENS ─────────────────────────────────────────── */
const T = {
  bg: '#FFFFFF', surf: '#F9FAFB', hover: '#F3F4F6',
  line: '#E5E7EB', lined: '#D1D5DB',
  ink: '#111827', sub: '#6B7280', ghost: '#9CA3AF',
  blue: '#2563EB', green: '#059669', amber: '#D97706',
  red: '#DC2626', violet: '#7C3AED',
};

/* ─── ATOMS ─────────────────────────────────────────────────── */
const Pill = ({ t, c = T.blue }: { t: string; c?: string }) => (
  <span style={{ fontSize:10, fontWeight:600, padding:'1px 7px', borderRadius:99, border:`1px solid ${c}30`, color:c, background:c+'0d', whiteSpace:'nowrap', letterSpacing:'0.02em' }}>{t}</span>
);
const Spin = ({ size = 13 }: { size?: number }) => (
  <span style={{ display:'inline-block', width:size, height:size, borderRadius:'50%', border:`2px solid ${T.line}`, borderTopColor:T.ink, animation:'spin .6s linear infinite', flexShrink:0 }} />
);
const Dot = ({ c = T.ghost, size = 6 }: { c?: string; size?: number }) => (
  <span style={{ display:'inline-block', width:size, height:size, borderRadius:'50%', background:c, flexShrink:0 }} />
);
const Lbl = ({ children, c }: { children: React.ReactNode; c?: string }) => (
  <div style={{ fontSize:10, fontWeight:600, color:c||T.ghost, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:3 }}>{children}</div>
);
const Hr = () => <div style={{ height:1, background:T.line, margin:'16px 0' }} />;

function Btn({ children, onClick, disabled, variant = 'primary', size = 'md' }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean; variant?: 'primary'|'ghost'|'blue'; size?: 'md'|'sm';
}) {
  const pad = size === 'sm' ? '5px 12px' : '9px 20px';
  const fs  = size === 'sm' ? 12 : 13;
  const styles = {
    primary: { background:T.ink,  color:'#fff',  border:'none' },
    ghost:   { background:'none', color:T.sub,   border:`1px solid ${T.line}` },
    blue:    { background:'none', color:T.blue,  border:`1px solid ${T.blue}30` },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...styles[variant], borderRadius:7, fontFamily:'inherit', fontWeight:600, cursor:disabled?'not-allowed':'pointer', opacity:disabled?.4:1, transition:'opacity .1s', fontSize:fs, padding:pad }}>
      {children}
    </button>
  );
}

function Input({ label, value, onChange, placeholder, type = 'text', suffix }: {
  label?: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; suffix?: string;
}) {
  return (
    <div>
      {label && <Lbl>{label}</Lbl>}
      <div style={{ position:'relative' }}>
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          style={{ width:'100%', padding:suffix?'8px 36px 8px 10px':'8px 10px', border:`1px solid ${T.line}`, borderRadius:6, fontSize:13, color:T.ink, fontFamily:'inherit', background:T.bg, outline:'none', boxSizing:'border-box' }}
        />
        {suffix && <span style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', fontSize:12, color:T.ghost, pointerEvents:'none' }}>{suffix}</span>}
      </div>
    </div>
  );
}

function Textarea({ label, value, onChange, placeholder, rows = 5 }: {
  label?: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <div>
      {label && <Lbl>{label}</Lbl>}
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        style={{ width:'100%', padding:'10px 12px', border:`1px solid ${T.line}`, borderRadius:7, fontSize:13, color:T.ink, fontFamily:'inherit', background:T.surf, outline:'none', resize:'vertical', lineHeight:1.7, boxSizing:'border-box' }}
      />
    </div>
  );
}

function Section({ id, title, count, loading, children, topBorder = true }: {
  id?: string; title: string; count?: number | string | null; loading?: boolean; children?: React.ReactNode; topBorder?: boolean;
}) {
  return (
    <div id={id} style={{ paddingTop:24, borderTop:topBorder?`1px solid ${T.line}`:'none' }}>
      <div style={{ display:'flex', alignItems:'baseline', gap:10, marginBottom:14 }}>
        <h2 style={{ margin:0, fontSize:14, fontWeight:700, color:T.ink, letterSpacing:'-0.01em' }}>{title}</h2>
        {count != null && <span style={{ fontSize:12, color:T.ghost }}>{count}</span>}
        {loading && <Spin />}
      </div>
      {children}
    </div>
  );
}

/* ─── PROMPTS ────────────────────────────────────────────────── */
const P = {
  core: `Senior WMM performance strategist. Return ONLY valid JSON, no markdown:
{"brand":"","tagline":"6-word tagline","valueProposition":"one sentence","saturation":[{"angle":"","level":"HIGH|MED|LOW","note":""}],"gaps":[{"gap":"","why":""}],"angles":[{"id":1,"name":"3-5 words","belief":"belief attacked","counter":"new belief","emotion":"","rational":"","funnel":"TOF|MOF|BOF","risk":"LOW|MED|HIGH","proposition":"one sentence","formats":[""]}]}`,

  tactics: `Senior WMM creative director + media buyer. Return ONLY valid JSON, no markdown:
{"hooks":[{"angleId":1,"text":"max 15 words","pattern":"contrarian|diagnosis|mechanism|proof-first|identity|curiosity|social-proof","format":"video|static|search"}],"channels":[{"name":"","pct":"","objective":"","formats":[""],"kpi":""}],"lp":{"hero":"","sub":"","sections":[{"n":1,"name":"","headline":"","copy":"","cta":"","proof":"","objection":""}]},"ads":[{"id":"AD1","angleId":1,"format":"UGC|Founder|POV|Comparison|Story","funnel":"TOF|MOF|BOF","hook":"","prop":"","beats":["","","","",""],"cta":"","duration":"15s|30s|60s"}]}`,

  journey: `Senior WMM conversion architect. Return ONLY valid JSON, no markdown:
{"stages":[{"id":"s1","name":"","channel":"","type":"AD|PAGE|EMAIL|CALL|SMS","emotion":"","thought":"","message":"","cta":"","friction":[""],"next":"s2","drop":"LOW|MED|HIGH","kpi":""}],"path":["s1","s2"]}`,

  financials: `WMM financial strategist. Return ONLY valid JSON, no markdown:
{"viable":true,"summary":"2-sentence verdict","breakEvenCAC":0,"targetCAC":0,"maxCAC":0,"revenuePerLead":0,"leadsNeeded":0,"alerts":[{"level":"warning|critical","message":""}],"budgetBreakdown":[{"channel":"","amount":0,"pct":"","objective":"","expectedLeads":0,"expectedCPL":0}],"scenarios":[{"name":"Conservative|Base|Optimistic","leadsPerMonth":0,"cpl":0,"closedDeals":0,"revenue":0,"roas":0}],"recommendations":[""],"readinessChecks":[{"item":"","status":"ok|warning|critical","note":""}]}`,

  emailFlow: `You are a senior WMM email strategist and copywriter expert in GoHighLevel automations.
Given the trigger, objective, brand context and ICP, generate a complete email automation flow.
Return ONLY valid JSON, no markdown, no fences:
{"flowName":"","trigger":"","objective":"","totalDuration":"","summary":"","steps":[{"stepNum":1,"type":"email|sms|wait|condition|action","waitDelay":"","conditionLogic":"","ghlAction":"","email":{"subjectLine":"","previewText":"","body":"","ctaText":"","tone":""},"sms":{"message":"","tone":""},"purpose":""}],"ghlSetupNotes":[""],"tagsNeeded":[""],"pipelineStages":[""]}`,

  creativeRequest: `You are a WMM senior media buyer and creative director filling out the official WMM Creative Request template.
Given the campaign context and angles, return ONLY valid JSON, no markdown, no fences.
{"campaignInfo":{"client":"","campaignName":"","dateCreated":"","platform":"Meta|Google|Meta + Google","objective":"Leads|Sales|Traffic|Awareness|Retargeting","funnelStage":"Cold|Warm|Hot"},"conversionPoint":{"type":"Landing Page|Lead Form|Call|Booking|Checkout","url":"","primaryCTA":""},"context":{"icp":"","concept":""},"formats":{"static":["1:1","4:5","9:16"],"video":["9:16","1:1"],"carousel":[],"gdn":[]},"staticAngles":[{"angleNum":"ANGLE01","theme":"T-HOOK|T-CTA|T-VIS|S-HOOK|S-CTA","copyIn":{"headline":"","subheadline":"","ctaText":""},"copyOut":{"primaryText":"","headline":"","description":""}}],"videoAngles":[{"angleNum":"ANGLE01","theme":"","estimatedLength":"30s","format":"UGC|Founder|POV|Comparison|Story","hook":"","beats":[{"beatNum":1,"onScreen":"","vo":""}],"finalCTAFrame":"","copyOut":{"primaryText":"","headline":"","description":""}}],"carouselAngles":[],"landingPage":{"include":true,"conversionAction":"","primaryCTA":"","hero":{"h1":"","sub":"","cta":"","scrollText":""},"benefits":["","",""],"proof":{"type":"","notes":""},"finalCTA":{"line":"","button":"","reassurance":""}},"fileNaming":{"clientCode":"","campShort":"","files":[{"type":"Static","name":""},{"type":"Video","name":""}]}}`,
};

/* ─── STRATEGY DISPLAY COMPONENTS ───────────────────────────── */
const FC: Record<string, string> = { TOF:T.blue, MOF:T.amber, BOF:T.green };
const RISK: Record<string, string> = { LOW:T.green, MED:T.amber, HIGH:T.red };
const PAT: Record<string, string> = { contrarian:T.red, diagnosis:T.amber, mechanism:T.blue, 'proof-first':T.green, identity:T.violet, curiosity:'#F97316', 'social-proof':T.green };
const CHAN_C: Record<string, string> = { Meta:T.blue, Google:T.green, Email:T.amber, YouTube:T.red, TikTok:T.violet };
const FMT_C: Record<string, string> = { UGC:T.green, Founder:T.blue, POV:T.violet, Comparison:T.amber, Story:'#F97316' };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SatView({ core }: { core: any }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:32 }}>
      <div>
        <Lbl c={T.red}>Saturated</Lbl>
        {core.saturation?.map((s: any, i: number) => (
          <div key={i} style={{ display:'flex', gap:10, padding:'8px 0', borderBottom:`1px solid ${T.line}` }}>
            <Pill t={s.level} c={RISK[s.level]||T.ghost} />
            <div><div style={{ fontSize:13, fontWeight:600, color:T.ink }}>{s.angle}</div><div style={{ fontSize:12, color:T.sub, marginTop:1 }}>{s.note}</div></div>
          </div>
        ))}
      </div>
      <div>
        <Lbl c={T.green}>Gaps → Oportunidades</Lbl>
        {core.gaps?.map((g: any, i: number) => (
          <div key={i} style={{ padding:'8px 0', borderBottom:`1px solid ${T.line}` }}>
            <div style={{ fontSize:13, fontWeight:600, color:T.ink }}>{g.gap}</div>
            <div style={{ fontSize:12, color:T.sub, marginTop:1 }}>{g.why}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AnglesView({ angles }: { angles: any[] }) {
  return (
    <div>
      {angles?.map((a: any, i: number) => {
        const fc = FC[a.funnel]||T.blue;
        return (
          <div key={a.id} style={{ display:'grid', gridTemplateColumns:'28px 1fr', gap:'0 16px', padding:'14px 0', borderBottom:i<angles.length-1?`1px solid ${T.line}`:'none' }}>
            <span style={{ fontSize:12, fontWeight:700, color:T.ghost, paddingTop:2 }}>{String(a.id).padStart(2,'0')}</span>
            <div>
              <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:4, flexWrap:'wrap' }}>
                <span style={{ fontSize:14, fontWeight:700, color:T.ink }}>{a.name}</span>
                <Pill t={a.funnel} c={fc} /><Pill t={`risk ${a.risk}`} c={RISK[a.risk]||T.ghost} />
              </div>
              <div style={{ fontSize:13, color:fc, marginBottom:8, lineHeight:1.5 }}>{a.proposition}</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'6px 16px' }}>
                {([['Belief out',a.belief,T.red],['Belief in',a.counter,T.green],['Emotion',a.emotion,T.sub],['Rational',a.rational,T.sub]] as [string,string,string][]).map(([l,v,c]) => (
                  <div key={l}><Lbl>{l}</Lbl><div style={{ fontSize:12, color:c, lineHeight:1.4 }}>{v}</div></div>
                ))}
              </div>
              {a.formats?.length>0 && <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginTop:8 }}>{a.formats.map((f: string, j: number)=><Pill key={j} t={f} c={T.sub}/>)}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function HooksView({ hooks, angles }: { hooks: any[]; angles?: any[] }) {
  const by: Record<string, any[]> = {};
  hooks?.forEach((h: any)=>{ (by[h.angleId]=by[h.angleId]||[]).push(h); });
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {Object.entries(by).map(([aid,hs]) => {
        const ang = angles?.find((a: any)=>a.id==aid);
        return (
          <div key={aid}>
            <div style={{ fontSize:11, fontWeight:700, color:T.sub, marginBottom:8, textTransform:'uppercase', letterSpacing:'0.05em' }}>{ang?.name}</div>
            {hs.map((h: any,i: number)=>(
              <div key={i} style={{ display:'flex', gap:12, alignItems:'baseline', padding:'7px 0', borderBottom:`1px solid ${T.line}` }}>
                <span style={{ fontSize:11, color:T.ghost, minWidth:16, fontWeight:600 }}>{i+1}</span>
                <span style={{ fontSize:13, color:T.ink, flex:1, lineHeight:1.5 }}>"{h.text}"</span>
                <Pill t={h.pattern} c={PAT[h.pattern]||T.ghost}/><Pill t={h.format} c={T.ghost}/>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AdsView({ ads, angles }: { ads: any[]; angles?: any[] }) {
  return (
    <div>
      {ads?.map((ad: any,i: number)=>{
        const ang = angles?.find((a: any)=>a.id==ad.angleId);
        const fc = FC[ad.funnel]||T.blue;
        return (
          <div key={i} style={{ padding:'16px 0', borderBottom:i<ads.length-1?`1px solid ${T.line}`:'none' }}>
            <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:8, flexWrap:'wrap' }}>
              <span style={{ fontSize:11, fontWeight:700, color:T.ghost }}>{ad.id}</span>
              <Pill t={ad.format} c={FMT_C[ad.format]||T.blue}/><Pill t={ad.funnel} c={fc}/><Pill t={ad.duration} c={T.ghost}/>
              {ang&&<span style={{ fontSize:11, color:T.ghost }}>→ {ang.name}</span>}
            </div>
            <div style={{ fontSize:14, fontWeight:700, color:T.ink, fontStyle:'italic', marginBottom:5, lineHeight:1.4 }}>"{ad.hook}"</div>
            <div style={{ fontSize:13, color:T.sub, marginBottom:12, lineHeight:1.5 }}>{ad.prop}</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:6, marginBottom:8 }}>
              {ad.beats?.map((b: string,bi: number)=>(
                <div key={bi} style={{ background:T.surf, borderRadius:6, padding:'8px 10px' }}>
                  <div style={{ fontSize:9, fontWeight:700, color:T.ghost, marginBottom:3 }}>BEAT {bi+1}</div>
                  <div style={{ fontSize:11, color:T.sub, lineHeight:1.4 }}>{b}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize:12, fontWeight:600, color:T.green }}>→ {ad.cta}</div>
          </div>
        );
      })}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function JourneyView({ journey }: { journey: any }) {
  if (!journey?.stages?.length) return null;
  const path = journey.path?.length ? journey.path : journey.stages.map((s: any)=>s.id);
  const stages = path.map((id: string)=>journey.stages.find((s: any)=>s.id===id)).filter(Boolean);
  const CC: Record<string, string> = { Meta:T.blue, Google:T.green, 'Landing Page':T.violet, LP:T.violet, Email:T.amber, WhatsApp:T.green, Phone:T.red, SMS:T.amber };
  const getC = (ch: string) => Object.entries(CC).find(([k])=>ch?.includes(k))?.[1]||T.blue;
  return (
    <div>
      <div style={{ overflowX:'auto', paddingBottom:8 }}>
        <div style={{ display:'flex', minWidth:stages.length*200 }}>
          {stages.map((s: any,i: number)=>{
            const cc=getC(s.channel);
            return (
              <div key={s.id} style={{ display:'flex', alignItems:'flex-start' }}>
                <div style={{ width:188, flexShrink:0 }}>
                  <div style={{ marginBottom:8 }}>
                    <div style={{ display:'flex', gap:6, alignItems:'center', marginBottom:3 }}><Dot c={cc}/><span style={{ fontSize:10, fontWeight:700, color:T.ghost, textTransform:'uppercase', letterSpacing:'0.05em' }}>{s.type}</span></div>
                    <div style={{ fontSize:13, fontWeight:700, color:T.ink }}>{s.name}</div>
                    <Pill t={s.channel} c={cc}/>
                  </div>
                  <div style={{ background:T.surf, borderRadius:6, padding:'8px 10px', marginBottom:8 }}>
                    <Lbl>Feels</Lbl>
                    <div style={{ fontSize:12, color:T.ink }}>{s.emotion}</div>
                    <div style={{ fontSize:11, color:T.sub, fontStyle:'italic' }}>"{s.thought}"</div>
                  </div>
                  <div style={{ fontSize:12, color:T.sub, lineHeight:1.5, marginBottom:5 }}>{s.message}</div>
                  <div style={{ fontSize:12, fontWeight:600, color:cc, marginBottom:5 }}>→ {s.cta}</div>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ fontSize:10, color:T.ghost }}>{s.kpi}</span>
                    <Pill t={`drop ${s.drop}`} c={({LOW:T.green,MED:T.amber,HIGH:T.red} as any)[s.drop]||T.ghost}/>
                  </div>
                </div>
                {i<stages.length-1&&(
                  <div style={{ display:'flex', alignItems:'center', width:24, paddingTop:26, flexShrink:0 }}>
                    <div style={{ width:16, height:1, background:T.lined }}/><span style={{ fontSize:8, color:T.ghost }}>▶</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── MODE 1: STRATEGY ──────────────────────────────────────── */
const STRAT_EX = `BRIEF — NeoBuild, Premium Outdoor Remodeling, Florida
Offer: Custom patios, decks, pergolas for $500K+ homes. Range: $35K–$150K. Decision: 2–6 weeks.
USP: Free 3D design, 10-year guarantee, max 8 projects/month.
Proof: Before/after photos, "+12-18% home value ROI", client testimonials.
Target: Homeowners 40-60, HHI $200K+, South Florida. Budget: $8K/month. KPI: leads ≥$30K.

COMPETITORS
- SunState: cheap angle, no 3D, generic materials
- FloriScape Pro: founder authority, long before/after videos`;

const SNAV = [['sat','Saturación'],['ang','Ángulos'],['hks','Hooks'],['chn','Canales'],['lp','Web/LP'],['ads','Ads'],['jrn','Journey']];

function StrategyMode({ onData }: { onData?: (d: any) => void }) {
  const [phase,setPhase] = useState('input');
  const [brief,setBrief] = useState('');
  const [steps,setSteps] = useState(['idle','idle','idle']);
  const [core,setCore]   = useState<any>(null);
  const [tact,setTact]   = useState<any>(null);
  const [jrn,setJrn]     = useState<any>(null);
  const [nav,setNav]     = useState('sat');
  const [err,setErr]     = useState<string|null>(null);

  const setStep = (i: number,v: string)=>setSteps(s=>{const n=[...s];n[i]=v;return n;});
  const allDone = !!core&&!!tact&&!!jrn;
  const done: Record<string,boolean> = {sat:!!core,ang:!!core,hks:!!tact,chn:!!tact,lp:!!tact,ads:!!tact,jrn:!!jrn};

  async function generate() {
    setPhase('loading'); setCore(null); setTact(null); setJrn(null); setErr(null);
    setSteps(['run','idle','idle']);
    let coreData: any = null;
    try {
      coreData = parseJSON(await ask(P.core, `Brief + competitors:\n\n${brief}`));
      if(coreData){setCore(coreData);setPhase('results');onData&&onData({core:coreData,tact:null,jrn:null,brief});}
      setStep(0,'done');
    } catch(e) { setStep(0,'done'); setErr(e instanceof Error?e.message:'Error'); }
    if(!coreData){setPhase('results');return;}
    setStep(1,'run');setStep(2,'run');
    const [t,j] = await Promise.allSettled([
      ask(P.tactics,`Brief:\n${brief}\n\nAngles:\n${JSON.stringify(coreData.angles)}`),
      ask(P.journey,`Brief:\n${brief}\n\nAngles:\n${JSON.stringify(coreData.angles)}`),
    ]);
    let tactData: any=null,jrnData: any=null;
    if(t.status==='fulfilled'){tactData=parseJSON(t.value);if(tactData)setTact(tactData);}
    if(j.status==='fulfilled'){jrnData=parseJSON(j.value);if(jrnData)setJrn(jrnData);}
    setStep(1,'done');setStep(2,'done');
    onData&&onData({core:coreData,tact:tactData,jrn:jrnData,brief});
  }

  useEffect(()=>{
    if(!core)return;
    const obs=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)setNav(e.target.id);}),{threshold:0.2,rootMargin:'-50px 0px 0px 0px'});
    SNAV.forEach(([id])=>{const el=document.getElementById(id);if(el)obs.observe(el);});
    return()=>obs.disconnect();
  },[core]);

  if(phase==='input'||(phase==='loading'&&!core)) return (
    <div style={{ maxWidth:640, padding:'0 24px' }}>
      {phase==='input'?(
        <>
          <div style={{ fontSize:13, color:T.sub, lineHeight:1.6, marginBottom:16 }}>Pega el brief + inteligencia competitiva. Genera ángulos, hooks, canales, LP, conceptos de ads y mapa de journey.</div>
          <Textarea value={brief} onChange={setBrief} placeholder={STRAT_EX} rows={10}/>
          {err && <div style={{ fontSize:12, color:T.red, marginTop:8 }}>{err}</div>}
          <div style={{ display:'flex', gap:8, marginTop:12 }}>
            <Btn onClick={generate} disabled={!brief.trim()}>Generar estrategia →</Btn>
            <Btn onClick={()=>setBrief(STRAT_EX)} variant="ghost">Cargar ejemplo</Btn>
          </div>
        </>
      ):(
        <div style={{ paddingTop:20 }}>
          <div style={{ fontSize:13, color:T.sub, marginBottom:20 }}>Generando estrategia…</div>
          {['Ángulos y saturación','Hooks, canales, LP, ads','Mapa de journey'].map((l,i)=>(
            <div key={i} style={{ display:'flex', gap:10, alignItems:'center', marginBottom:10 }}>
              {steps[i]==='run'?<Spin/>:steps[i]==='done'?<Dot c={T.green}/>:<Dot c={T.line}/>}
              <span style={{ fontSize:13, color:steps[i]==='run'?T.ink:steps[i]==='done'?T.green:T.ghost }}>{l}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div>
      <div style={{ display:'flex', borderBottom:`1px solid ${T.line}`, overflowX:'auto', background:T.bg }}>
        {SNAV.map(([id,label])=>(
          <a key={id} href={`#${id}`} style={{ display:'flex', alignItems:'center', gap:5, padding:'8px 14px', fontSize:12, fontWeight:nav===id?600:400, color:nav===id?T.ink:T.sub, borderBottom:nav===id?`2px solid ${T.ink}`:'2px solid transparent', textDecoration:'none', whiteSpace:'nowrap' }}>
            {done[id]&&<Dot c={T.green}/>}{label}
          </a>
        ))}
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:8, padding:'0 14px' }}>
          {!allDone&&<><Spin size={11}/><span style={{ fontSize:11, color:T.ghost }}>generando…</span></>}
          {allDone&&<span style={{ fontSize:11, color:T.green, fontWeight:600 }}>✓ listo</span>}
          <Btn size="sm" variant="ghost" onClick={()=>{setPhase('input');setCore(null);setTact(null);setJrn(null);setSteps(['idle','idle','idle']);onData&&onData(null);}}>Nuevo brief</Btn>
        </div>
      </div>
      <div style={{ maxWidth:900, margin:'0 auto', padding:'28px 24px' }}>
        {core&&(
          <div style={{ paddingBottom:20 }}>
            <div style={{ fontSize:24, fontWeight:800, color:T.ink, letterSpacing:'-0.03em', marginBottom:3 }}>{core.brand}</div>
            <div style={{ fontSize:13, color:T.sub, marginBottom:6 }}>{core.tagline}</div>
            <div style={{ fontSize:13, color:T.sub, maxWidth:560, lineHeight:1.6 }}><span style={{ fontWeight:600, color:T.ink }}>Value prop: </span>{core.valueProposition}</div>
          </div>
        )}
        {core&&<><Section id="sat" title="Saturación" count={`${core.saturation?.length||0} saturados · ${core.gaps?.length||0} gaps`}><SatView core={core}/></Section><Section id="ang" title="Ángulos" count={core.angles?.length}><AnglesView angles={core.angles}/></Section></>}
        <Section id="hks" title="Hooks" count={tact?.hooks?.length} loading={!tact&&steps[1]==='run'}>{tact?.hooks?<HooksView hooks={tact.hooks} angles={core?.angles}/>:null}</Section>
        <Section id="chn" title="Estrategia de Canales" count={tact?.channels?.length} loading={!tact&&steps[1]==='run'}>{tact?.channels?<div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:14 }}>{tact.channels.map((ch: any,i: number)=>{const cc=Object.entries(CHAN_C).find(([k])=>ch.name?.includes(k))?.[1]||T.blue;return(<div key={i} style={{ border:`1px solid ${T.line}`,borderRadius:8,padding:'14px 16px' }}><div style={{ display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:8 }}><span style={{ fontSize:14,fontWeight:700 }}>{ch.name}</span><span style={{ fontSize:18,fontWeight:800,color:cc,fontFamily:'monospace' }}>{ch.pct}</span></div><div style={{ fontSize:12,color:T.sub,lineHeight:1.5,marginBottom:8 }}>{ch.objective}</div><div style={{ fontSize:11,fontWeight:600,color:cc }}>KPI: {ch.kpi}</div></div>);})}</div>:null}</Section>
        <Section id="lp" title="Web / Landing Page" count={tact?.lp?.sections?.length} loading={!tact&&steps[1]==='run'}>{tact?.lp?(<div><div style={{ padding:'18px 0 14px',borderBottom:`1px solid ${T.line}`,marginBottom:14 }}><div style={{ fontSize:22,fontWeight:800,color:T.ink,lineHeight:1.2,letterSpacing:'-0.02em',marginBottom:6 }}>{tact.lp.hero}</div><div style={{ fontSize:14,color:T.sub,lineHeight:1.6 }}>{tact.lp.sub}</div></div>{tact.lp.sections?.map((s: any,i: number)=>(<div key={i} style={{ display:'grid',gridTemplateColumns:'100px 1fr',gap:'0 24px',padding:'11px 0',borderBottom:i<tact.lp.sections.length-1?`1px solid ${T.line}`:'none' }}><div style={{ fontSize:10,fontWeight:700,color:T.ghost,textTransform:'uppercase',letterSpacing:'0.05em',paddingTop:2 }}>{String(s.n).padStart(2,'0')} {s.name}</div><div><div style={{ fontSize:14,fontWeight:700,color:T.ink,marginBottom:3 }}>{s.headline}</div><div style={{ fontSize:12,color:T.sub,marginBottom:8,lineHeight:1.5 }}>{s.copy}</div></div></div>))}</div>):null}</Section>
        <Section id="ads" title="Conceptos de Ads" count={tact?.ads?.length} loading={!tact&&steps[1]==='run'}>{tact?.ads?<AdsView ads={tact.ads} angles={core?.angles}/>:null}</Section>
        <Section id="jrn" title="User Journey" count={jrn?.stages?.length} loading={!jrn&&steps[2]==='run'}>{jrn?<JourneyView journey={jrn}/>:null}</Section>
      </div>
    </div>
  );
}

/* ─── MODE 2: FINANCIALS ────────────────────────────────────── */
function FinancialsMode() {
  const [f,setF] = useState({aov:'',margin:'',ltv:'',budget:'',target:'',bookingRate:'',showRate:'',closeRate:'',responseTime:''});
  const [result,setResult] = useState<any>(null);
  const [loading,setLoading] = useState(false);
  const [err,setErr] = useState<string|null>(null);
  const set = (k: string,v: string) => setF(p=>({...p,[k]:v}));
  const ready = f.aov&&f.margin&&f.budget&&f.target;
  const HC: Record<string,string> = {ok:T.green,warning:T.amber,critical:T.red};

  async function run(){
    setLoading(true);setResult(null);setErr(null);
    try{
      const input=`AOV: $${f.aov}, Gross margin: ${f.margin}%, LTV: $${f.ltv||f.aov}, Monthly budget: $${f.budget}, Revenue target: $${f.target}/mo, Booking rate: ${f.bookingRate||'?'}%, Show rate: ${f.showRate||'?'}%, Close rate: ${f.closeRate||'?'}%, Lead response time: ${f.responseTime||'?'}min`;
      setResult(parseJSON(await ask(P.financials,input)));
    }catch(e){setErr(e instanceof Error?e.message:'Error');}finally{setLoading(false);}
  }

  return (
    <div style={{ maxWidth:900, padding:'0 24px' }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:32, marginBottom:28 }}>
        <div>
          <div style={{ fontSize:12, fontWeight:700, color:T.ink, marginBottom:14, textTransform:'uppercase', letterSpacing:'0.05em' }}>Modelo Financiero</div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <Input label="AOV" value={f.aov} onChange={v=>set('aov',v)} placeholder="5000" type="number" suffix="$"/>
            <Input label="Margen bruto" value={f.margin} onChange={v=>set('margin',v)} placeholder="60" type="number" suffix="%"/>
            <Input label="LTV (6-12 meses)" value={f.ltv} onChange={v=>set('ltv',v)} placeholder="8000" type="number" suffix="$"/>
            <Input label="Presupuesto mensual ads" value={f.budget} onChange={v=>set('budget',v)} placeholder="8000" type="number" suffix="$"/>
            <Input label="Objetivo de ingresos/mes" value={f.target} onChange={v=>set('target',v)} placeholder="50000" type="number" suffix="$"/>
          </div>
        </div>
        <div>
          <div style={{ fontSize:12, fontWeight:700, color:T.ink, marginBottom:14, textTransform:'uppercase', letterSpacing:'0.05em' }}>Readiness de Ventas</div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <Input label="Booking rate" value={f.bookingRate} onChange={v=>set('bookingRate',v)} placeholder="40" type="number" suffix="%"/>
            <Input label="Show rate" value={f.showRate} onChange={v=>set('showRate',v)} placeholder="70" type="number" suffix="%"/>
            <Input label="Close rate" value={f.closeRate} onChange={v=>set('closeRate',v)} placeholder="25" type="number" suffix="%"/>
            <Input label="Tiempo de respuesta de leads" value={f.responseTime} onChange={v=>set('responseTime',v)} placeholder="10" type="number" suffix="min"/>
          </div>
          <div style={{ marginTop:20 }}><Btn onClick={run} disabled={!ready||loading}>{loading?'Analizando…':'Correr modelo financiero →'}</Btn></div>
          {err&&<div style={{ fontSize:12, color:T.red, marginTop:8 }}>{err}</div>}
        </div>
      </div>
      {loading&&<div style={{ display:'flex',gap:8,alignItems:'center',color:T.sub,fontSize:13 }}><Spin/>Calculando…</div>}
      {result&&(
        <div>
          <div style={{ padding:'14px 18px', borderRadius:8, marginBottom:24, background:result.viable?T.green+'0d':T.red+'0d', border:`1px solid ${result.viable?T.green:T.red}30` }}>
            <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:6 }}><Dot c={result.viable?T.green:T.red} size={8}/><span style={{ fontSize:13, fontWeight:700, color:result.viable?T.green:T.red }}>{result.viable?'Financieramente viable':'Necesita revisión antes de escalar'}</span></div>
            <div style={{ fontSize:13, color:T.sub, lineHeight:1.6 }}>{result.summary}</div>
          </div>
          {result.alerts?.length>0&&<div style={{ display:'flex', flexDirection:'column', gap:5, marginBottom:24 }}>{result.alerts.map((a: any,i: number)=><div key={i} style={{ display:'flex', gap:10, padding:'9px 12px', borderRadius:7, background:a.level==='critical'?T.red+'0c':T.amber+'0c', border:`1px solid ${a.level==='critical'?T.red:T.amber}25` }}><span style={{ fontSize:12, fontWeight:700, color:a.level==='critical'?T.red:T.amber, minWidth:56 }}>{a.level.toUpperCase()}</span><span style={{ fontSize:12, color:T.sub }}>{a.message}</span></div>)}</div>}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
            {([['Max CAC',`$${result.maxCAC}`,T.ink],['Target CAC',`$${result.targetCAC}`,T.blue],['Revenue/Lead',`$${result.revenuePerLead}`,T.green],['Leads necesarios',result.leadsNeeded,T.ink]] as [string,string,string][]).map(([l,v,c])=>(
              <div key={l} style={{ border:`1px solid ${T.line}`, borderRadius:8, padding:'12px 14px' }}>
                <div style={{ fontSize:22, fontWeight:800, color:c, fontFamily:'monospace' }}>{v}</div>
                <div style={{ fontSize:11, color:T.ghost, marginTop:3 }}>{l}</div>
              </div>
            ))}
          </div>
          <Section title="Escenarios" topBorder>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
              {result.scenarios?.map((s: any,i: number)=>(
                <div key={i} style={{ border:`1px solid ${T.line}`, borderRadius:8, padding:'12px 14px' }}>
                  <div style={{ fontSize:11, fontWeight:700, color:T.ghost, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>{s.name}</div>
                  {([['Leads/mes',s.leadsPerMonth],['CPL',`$${s.cpl}`],['Deals cerrados',s.closedDeals],['Revenue',`$${s.revenue}`],['ROAS',`${s.roas}x`]] as [string,string][]).map(([l,v])=>(
                    <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:`1px solid ${T.line}` }}>
                      <span style={{ fontSize:12, color:T.sub }}>{l}</span>
                      <span style={{ fontSize:12, fontWeight:600, color:T.ink, fontFamily:'monospace' }}>{v}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Section>
          <Section title="Recomendaciones">
            {result.recommendations?.map((r: string,i: number)=>(
              <div key={i} style={{ display:'flex', gap:10, padding:'7px 0', borderBottom:`1px solid ${T.line}` }}>
                <span style={{ fontSize:12, color:T.ghost, minWidth:20, fontWeight:700 }}>{i+1}.</span>
                <span style={{ fontSize:13, color:T.sub, lineHeight:1.5 }}>{r}</span>
              </div>
            ))}
          </Section>
        </div>
      )}
    </div>
  );
}

/* ─── MODE 3: CREATIVE REQUEST ──────────────────────────────── */
function CreativeRequestMode({ strategyData }: { strategyData?: any }) {
  const [source,setSource] = useState<'strategy'|'manual'>(strategyData?'strategy':'manual');
  const [form,setForm] = useState({client:'',offer:'',usp:'',proof:'',icp:'',budget:'',kpi:'',platform:'Meta',objective:'Leads',funnel:'Cold'});
  const [result,setResult] = useState<any>(null);
  const [loading,setLoading] = useState(false);
  const [copied,setCopied] = useState(false);
  const [err,setErr] = useState<string|null>(null);
  const setF = (k: string,v: string) => setForm(p=>({...p,[k]:v}));
  const ready = source==='strategy'?!!strategyData:(form.client&&form.offer&&form.icp);

  async function generate(){
    setLoading(true);setResult(null);setErr(null);
    try{
      let ctx = '';
      if(source==='strategy'&&strategyData){
        ctx = `Brief: ${strategyData.brief}\n\nCore angles:\n${JSON.stringify(strategyData.core?.angles?.slice(0,3))}`;
      } else {
        ctx = `Client: ${form.client}\nOffer: ${form.offer}\nUSP: ${form.usp}\nProof: ${form.proof}\nICP: ${form.icp}\nBudget: $${form.budget}/mo\nKPI: ${form.kpi}\nPlatform: ${form.platform}\nObjective: ${form.objective}\nFunnel: ${form.funnel}`;
      }
      setResult(parseJSON(await ask(P.creativeRequest,ctx)));
    }catch(e){setErr(e instanceof Error?e.message:'Error');}finally{setLoading(false);}
  }

  function copyText(){
    if(!result)return;
    const lines: string[] = ['# CREATIVE REQUEST\n'];
    const ci=result.campaignInfo;
    lines.push(`Client: ${ci?.client}\nCampaign: ${ci?.campaignName}\nPlatform: ${ci?.platform} | Objective: ${ci?.objective} | Stage: ${ci?.funnelStage}\n`);
    result.staticAngles?.forEach((a: any)=>{
      lines.push(`### ${a.angleNum} [${a.theme}]\nHeadline: ${a.copyIn?.headline}\nPrimary text: ${a.copyOut?.primaryText}\n`);
    });
    result.videoAngles?.forEach((a: any)=>{
      lines.push(`### ${a.angleNum} ${a.format} ${a.estimatedLength}\nHook: ${a.hook}\n${a.beats?.map((b: any)=>`Beat ${b.beatNum}: ${b.vo}`).join('\n')}\n`);
    });
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);setTimeout(()=>setCopied(false),2000);
  }

  return (
    <div style={{ maxWidth:900, padding:'0 24px' }}>
      {!result&&(
        <div>
          <div style={{ display:'flex', gap:0, marginBottom:20, border:`1px solid ${T.line}`, borderRadius:7, overflow:'hidden', width:'fit-content' }}>
            {([['strategy','Desde Strategy'] as const,['manual','Manual'] as const]).map(([v,l])=>(
              <button key={v} onClick={()=>setSource(v)} style={{ padding:'7px 16px', fontSize:12, fontWeight:600, border:'none', cursor:'pointer', background:source===v?T.ink:'none', color:source===v?'#fff':T.sub, fontFamily:'inherit' }}>{l}</button>
            ))}
          </div>
          {source==='strategy'&&strategyData?(
            <div style={{ padding:'12px 14px', background:T.surf, borderRadius:7, border:`1px solid ${T.line}`, marginBottom:16 }}>
              <div style={{ fontSize:12, fontWeight:600, color:T.green, marginBottom:4 }}>✓ Datos de estrategia disponibles</div>
              <div style={{ fontSize:12, color:T.sub }}>{strategyData.core?.brand} · {strategyData.core?.angles?.length} ángulos</div>
            </div>
          ):source==='strategy'?(
            <div style={{ fontSize:13, color:T.amber, marginBottom:16 }}>Genera primero una estrategia en la pestaña Strategy.</div>
          ):(
            <div style={{ display:'flex', flexDirection:'column', gap:10, maxWidth:520 }}>
              <Input label="Cliente / Brand" value={form.client} onChange={v=>setF('client',v)} placeholder="NeoBuild"/>
              <Textarea label="Oferta / Producto" value={form.offer} onChange={v=>setF('offer',v)} placeholder="Premium outdoor remodeling…" rows={2}/>
              <Textarea label="USP" value={form.usp} onChange={v=>setF('usp',v)} placeholder="Free 3D design, 10-year guarantee…" rows={2}/>
              <Textarea label="ICP" value={form.icp} onChange={v=>setF('icp',v)} placeholder="Homeowners 40-60, HHI $200K+…" rows={2}/>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
                <div><Lbl>Platform</Lbl><select value={form.platform} onChange={e=>setF('platform',e.target.value)} style={{ width:'100%',padding:'8px 10px',border:`1px solid ${T.line}`,borderRadius:6,fontSize:13,fontFamily:'inherit' }}>{['Meta','Google','Meta + Google'].map(o=><option key={o}>{o}</option>)}</select></div>
                <div><Lbl>Objective</Lbl><select value={form.objective} onChange={e=>setF('objective',e.target.value)} style={{ width:'100%',padding:'8px 10px',border:`1px solid ${T.line}`,borderRadius:6,fontSize:13,fontFamily:'inherit' }}>{['Leads','Sales','Traffic','Awareness'].map(o=><option key={o}>{o}</option>)}</select></div>
                <div><Lbl>Funnel</Lbl><select value={form.funnel} onChange={e=>setF('funnel',e.target.value)} style={{ width:'100%',padding:'8px 10px',border:`1px solid ${T.line}`,borderRadius:6,fontSize:13,fontFamily:'inherit' }}>{['Cold','Warm','Hot'].map(o=><option key={o}>{o}</option>)}</select></div>
              </div>
            </div>
          )}
          {err&&<div style={{ fontSize:12, color:T.red, marginTop:8 }}>{err}</div>}
          <div style={{ marginTop:16 }}>
            <Btn onClick={generate} disabled={!ready||loading}>{loading?'Generando…':'Generar Creative Request →'}</Btn>
          </div>
          {loading&&<div style={{ display:'flex',gap:8,alignItems:'center',color:T.sub,fontSize:13,marginTop:12 }}><Spin/>Escribiendo brief completo…</div>}
        </div>
      )}
      {result&&(
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, paddingBottom:16, borderBottom:`2px solid ${T.ink}` }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:T.ghost, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>Creative Request</div>
              <div style={{ fontSize:20, fontWeight:800, color:T.ink }}>{result.campaignInfo?.campaignName||'Campaign'}</div>
              <div style={{ display:'flex', gap:6, marginTop:6 }}>
                {result.campaignInfo?.platform&&<Pill t={result.campaignInfo.platform} c={T.blue}/>}
                {result.campaignInfo?.objective&&<Pill t={result.campaignInfo.objective} c={T.green}/>}
                {result.campaignInfo?.funnelStage&&<Pill t={result.campaignInfo.funnelStage} c={T.amber}/>}
              </div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <Btn variant="ghost" size="sm" onClick={copyText}>{copied?'Copiado ✓':'Copiar como texto'}</Btn>
              <Btn variant="ghost" size="sm" onClick={()=>setResult(null)}>Nuevo</Btn>
            </div>
          </div>
          {result.staticAngles?.length>0&&(
            <div style={{ marginBottom:28 }}>
              <div style={{ fontSize:11, fontWeight:700, color:T.ghost, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:12, paddingBottom:6, borderBottom:`2px solid ${T.line}` }}>Ads Estáticos</div>
              {result.staticAngles.map((a: any,i: number)=>(
                <div key={i} style={{ marginBottom:16, background:T.surf, borderRadius:8, padding:'14px 16px' }}>
                  <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:10 }}><span style={{ fontSize:12, fontWeight:700, color:T.ink }}>{a.angleNum}</span><Pill t={a.theme} c={T.blue}/></div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                    <div><Lbl c={T.blue}>Copy In</Lbl><div style={{ fontSize:13, color:T.ink, fontWeight:600 }}>{a.copyIn?.headline}</div>{a.copyIn?.subheadline&&<div style={{ fontSize:12, color:T.sub }}>{a.copyIn.subheadline}</div>}</div>
                    <div><Lbl c={T.green}>Copy Out</Lbl><div style={{ fontSize:12, color:T.sub, lineHeight:1.5 }}>{a.copyOut?.primaryText}</div><div style={{ fontSize:13, color:T.ink, fontWeight:600, marginTop:4 }}>{a.copyOut?.headline}</div></div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {result.videoAngles?.length>0&&(
            <div style={{ marginBottom:28 }}>
              <div style={{ fontSize:11, fontWeight:700, color:T.ghost, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:12, paddingBottom:6, borderBottom:`2px solid ${T.line}` }}>Video Ads</div>
              {result.videoAngles.map((a: any,i: number)=>(
                <div key={i} style={{ marginBottom:16, background:T.surf, borderRadius:8, padding:'14px 16px' }}>
                  <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:8 }}><span style={{ fontSize:12, fontWeight:700, color:T.ink }}>{a.angleNum}</span><Pill t={a.format} c={FMT_C[a.format]||T.blue}/><Pill t={a.estimatedLength} c={T.ghost}/></div>
                  <div style={{ fontSize:13, fontWeight:700, color:T.ink, fontStyle:'italic', marginBottom:8 }}>"{a.hook}"</div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6, marginBottom:8 }}>
                    {a.beats?.map((b: any,bi: number)=>(
                      <div key={bi} style={{ background:T.bg, border:`1px solid ${T.line}`, borderRadius:6, padding:'8px 10px' }}>
                        <div style={{ fontSize:9, fontWeight:700, color:T.ghost, marginBottom:2 }}>BEAT {b.beatNum}</div>
                        <div style={{ fontSize:11, color:T.sub }}>{b.vo}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize:12, color:T.sub, lineHeight:1.5 }}>{a.copyOut?.primaryText}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── MODE 4: EMAIL FLOWS ───────────────────────────────────── */
const EMAIL_TYPES = [
  { id:'welcome',   label:'Welcome Sequence',    desc:'New lead / opt-in' },
  { id:'nurture',   label:'Nurture Sequence',     desc:'Cold to warm' },
  { id:'noshow',    label:'No-Show Recovery',     desc:'Missed call/demo' },
  { id:'winback',   label:'Win-Back',             desc:'Ghosted leads' },
  { id:'onboard',   label:'Onboarding',           desc:'New client' },
  { id:'reactivate',label:'Reactivation',         desc:'Churned clients' },
];

function EmailFlowsMode({ strategyData }: { strategyData?: any }) {
  const [selected,setSelected] = useState<string|null>(null);
  const [form,setForm] = useState({brand:'',offer:'',valueProposition:'',icp:'',trigger:''});
  const [result,setResult] = useState<any>(null);
  const [loading,setLoading] = useState(false);
  const [err,setErr] = useState<string|null>(null);
  const [copied,setCopied] = useState(false);
  const setF = (k: string,v: string) => setForm(p=>({...p,[k]:v}));
  const ready = selected&&form.brand&&form.offer;

  async function generate(){
    if(!selected)return;
    setLoading(true);setResult(null);setErr(null);
    const type = EMAIL_TYPES.find(t=>t.id===selected);
    try{
      let ctx = `Trigger: ${type?.label}\nObjective: ${type?.desc}\nBrand: ${form.brand}\nOffer: ${form.offer}\nValue proposition: ${form.valueProposition}\nICP: ${form.icp}`;
      if(strategyData?.core) ctx += `\n\nBrand context from strategy:\n${JSON.stringify({brand:strategyData.core.brand,tagline:strategyData.core.tagline,valueProposition:strategyData.core.valueProposition})}`;
      setResult(parseJSON(await ask(P.emailFlow,ctx)));
    }catch(e){setErr(e instanceof Error?e.message:'Error');}finally{setLoading(false);}
  }

  function copyFlow(){
    if(!result)return;
    const lines=[`# ${result.flowName}`,`Trigger: ${result.trigger}`,`Duration: ${result.totalDuration}`,``,result.summary,``];
    result.steps?.forEach((s: any)=>{
      lines.push(`── Step ${s.stepNum}: ${s.type.toUpperCase()} (${s.waitDelay}) ──`);
      if(s.email?.subjectLine) lines.push(`Subject: ${s.email.subjectLine}\nPreview: ${s.email.previewText}\n\n${s.email.body}`);
      if(s.sms?.message) lines.push(`SMS: ${s.sms.message}`);
      lines.push(`Purpose: ${s.purpose}`,``);
    });
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);setTimeout(()=>setCopied(false),2000);
  }

  if(!selected) return (
    <div style={{ maxWidth:700, padding:'0 24px' }}>
      <div style={{ fontSize:13, color:T.sub, marginBottom:20 }}>Selecciona el tipo de flujo a generar:</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
        {EMAIL_TYPES.map(t=>(
          <button key={t.id} onClick={()=>setSelected(t.id)} style={{ padding:'14px 16px', border:`1px solid ${T.line}`, borderRadius:8, background:T.surf, cursor:'pointer', textAlign:'left', fontFamily:'inherit' }}>
            <div style={{ fontSize:13, fontWeight:700, color:T.ink, marginBottom:3 }}>{t.label}</div>
            <div style={{ fontSize:11, color:T.ghost }}>{t.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );

  const type = EMAIL_TYPES.find(t=>t.id===selected);

  return (
    <div style={{ maxWidth:900, padding:'0 24px' }}>
      {!result&&(
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20 }}>
            <button onClick={()=>setSelected(null)} style={{ fontSize:12, color:T.ghost, background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}>← Volver</button>
            <span style={{ fontSize:14, fontWeight:700, color:T.ink }}>{type?.label}</span>
            <Pill t={type?.desc||''} c={T.blue}/>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10, maxWidth:520 }}>
            <Input label="Brand" value={form.brand} onChange={v=>setF('brand',v)} placeholder="NeoBuild"/>
            <Textarea label="Oferta" value={form.offer} onChange={v=>setF('offer',v)} placeholder="Premium outdoor remodeling…" rows={2}/>
            <Textarea label="Value Proposition" value={form.valueProposition} onChange={v=>setF('valueProposition',v)} placeholder="Free 3D design, 10-year guarantee…" rows={2}/>
            <Textarea label="ICP" value={form.icp} onChange={v=>setF('icp',v)} placeholder="Homeowners 40-60, HHI $200K+…" rows={2}/>
          </div>
          {err&&<div style={{ fontSize:12, color:T.red, marginTop:8 }}>{err}</div>}
          <div style={{ marginTop:16 }}><Btn onClick={generate} disabled={!ready||loading}>{loading?'Generando…':'Generar flujo →'}</Btn></div>
          {loading&&<div style={{ display:'flex',gap:8,alignItems:'center',color:T.sub,fontSize:13,marginTop:12 }}><Spin/>Construyendo flujo de automatización…</div>}
        </div>
      )}
      {result&&(
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
            <div>
              <div style={{ fontSize:18, fontWeight:800, color:T.ink, marginBottom:4 }}>{result.flowName}</div>
              <div style={{ fontSize:13, color:T.sub }}>{result.summary}</div>
              <div style={{ display:'flex', gap:8, marginTop:8 }}><Pill t={`${result.steps?.length} pasos`} c={T.blue}/><Pill t={result.totalDuration} c={T.ghost}/></div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <Btn variant="ghost" size="sm" onClick={copyFlow}>{copied?'Copiado ✓':'Copiar flujo'}</Btn>
              <Btn variant="ghost" size="sm" onClick={()=>{setResult(null);setSelected(null);}}>Nuevo</Btn>
            </div>
          </div>
          <Hr/>
          {result.steps?.map((s: any,i: number)=>(
            <div key={i} style={{ display:'grid', gridTemplateColumns:'120px 1fr', gap:'0 20px', padding:'14px 0', borderBottom:i<result.steps.length-1?`1px solid ${T.line}`:'none' }}>
              <div>
                <div style={{ fontSize:10, fontWeight:700, color:T.ghost, textTransform:'uppercase', marginBottom:3 }}>Paso {s.stepNum}</div>
                <Pill t={s.type} c={s.type==='email'?T.blue:s.type==='sms'?T.green:s.type==='wait'?T.ghost:T.amber}/>
                <div style={{ fontSize:11, color:T.sub, marginTop:4 }}>{s.waitDelay}</div>
              </div>
              <div>
                {s.email?.subjectLine&&(
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:T.ink, marginBottom:2 }}>{s.email.subjectLine}</div>
                    <div style={{ fontSize:11, color:T.ghost, marginBottom:8 }}>Preview: {s.email.previewText}</div>
                    <div style={{ fontSize:12, color:T.sub, lineHeight:1.7, background:T.surf, borderRadius:6, padding:'10px 12px', whiteSpace:'pre-wrap', maxHeight:120, overflow:'auto' }}>{s.email.body?.slice(0,300)}{s.email.body?.length>300?'…':''}</div>
                  </div>
                )}
                {s.sms?.message&&<div style={{ fontSize:12, color:T.ink, background:'#dcfce7', borderRadius:6, padding:'8px 12px' }}>{s.sms.message}</div>}
                {s.conditionLogic&&<div style={{ fontSize:12, color:T.amber }}>{s.conditionLogic}</div>}
                {s.ghlAction&&<div style={{ fontSize:12, color:T.violet }}>GHL: {s.ghlAction}</div>}
                <div style={{ fontSize:11, color:T.ghost, marginTop:6 }}>{s.purpose}</div>
              </div>
            </div>
          ))}
          {result.tagsNeeded?.length>0&&<div style={{ marginTop:16 }}><Lbl>Tags GHL necesarios</Lbl><div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>{result.tagsNeeded.map((t: string,i: number)=><Pill key={i} t={t} c={T.violet}/>)}</div></div>}
        </div>
      )}
    </div>
  );
}

/* ─── MODE 5: ATTRACTION MATRIX ─────────────────────────────── */
const DIMENSIONS = [
  { id:'tension',   name:'Curiosity Gap',  tagline:'¿Los hace seguir leyendo?',        color:'#2563EB' },
  { id:'gravity',   name:'Desire Pull',    tagline:'¿Los atrae hacia una mejor vida?', color:'#7C3AED' },
  { id:'lightness', name:'Clarity',        tagline:'¿Se entiende en 3 segundos?',      color:'#059669' },
  { id:'ritual',    name:'Timing Fit',     tagline:'¿El ask es correcto para el momento?', color:'#D97706' },
  { id:'otherness', name:'Human Proof',    tagline:'¿Aparece una persona real?',       color:'#DC2626' },
];

const ATTRACT_PROMPT = `You are a senior performance marketing analyst. Evaluate the creative across 5 dimensions.
Return ONLY valid JSON, no markdown:
{"subject":"","channel":"ad|web|email","overallScore":0,"verdict":"","dimensions":[{"id":"tension|gravity|lightness|ritual|otherness","score":1,"diagnosis":"","evidence":"","recommendation":""}],"changes":[{"priority":1,"element":"","dimension":"","impact":"HIGH|MEDIUM|LOW","before":"","after":"","why":""}],"rewrite":{"hook":"","body":"","cta":"","rationale":""},"insightQuote":"","archetype":"","archetypeDesc":""}`;

function AttractionMatrixMode() {
  const [channel,setChannel] = useState('ad');
  const [input,setInput] = useState('');
  const [context,setContext] = useState('');
  const [result,setResult] = useState<any>(null);
  const [loading,setLoading] = useState(false);
  const [copied,setCopied] = useState(false);
  const [err,setErr] = useState<string|null>(null);

  async function analyze(){
    setLoading(true);setResult(null);setErr(null);
    try{
      const userMsg=`Channel: ${channel.toUpperCase()}\n${context?`Context: ${context}\n`:''}\nCreative:\n---\n${input}\n---`;
      setResult(parseJSON(await ask(ATTRACT_PROMPT,userMsg)));
    }catch(e){setErr(e instanceof Error?e.message:'Error');}finally{setLoading(false);}
  }

  const overallColor = result?(result.overallScore>=4?T.green:result.overallScore>=3?T.amber:T.red):T.ghost;

  return (
    <div style={{ maxWidth:900, padding:'0 24px' }}>
      <div style={{ marginBottom:20, padding:'14px 16px', background:T.surf, borderRadius:8, border:`1px solid ${T.line}` }}>
        <div style={{ fontSize:11, fontWeight:700, color:T.ghost, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>5 dimensiones que predicen si un creativo convierte</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10 }}>
          {DIMENSIONS.map(d=>(
            <div key={d.id}><div style={{ fontSize:11, fontWeight:700, color:d.color, marginBottom:2 }}>{d.name}</div><div style={{ fontSize:10, color:T.ghost, lineHeight:1.4 }}>{d.tagline}</div></div>
          ))}
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, marginBottom:20 }}>
        <div>
          <div style={{ display:'flex', gap:0, marginBottom:12, border:`1px solid ${T.line}`, borderRadius:7, overflow:'hidden', width:'fit-content' }}>
            {([['ad','Ad'],['web','Web/LP'],['email','Email']] as [string,string][]).map(([v,l])=>(
              <button key={v} onClick={()=>setChannel(v)} style={{ padding:'6px 14px', fontSize:12, fontWeight:600, border:'none', cursor:'pointer', background:channel===v?T.ink:'none', color:channel===v?'#fff':T.sub, fontFamily:'inherit' }}>{l}</button>
            ))}
          </div>
          <Textarea label="Creativo a analizar" value={input} onChange={setInput} placeholder="Pega aquí el copy del ad, LP o email…" rows={10}/>
        </div>
        <div>
          <Textarea label="Contexto brand/audiencia (opcional)" value={context} onChange={setContext} placeholder="Brand: NeoBuild. Audience: homeowners 40-60…" rows={4}/>
          <div style={{ marginTop:10 }}><Btn onClick={analyze} disabled={!input.trim()||loading}>{loading?'Analizando…':'Analizar →'}</Btn></div>
          {err&&<div style={{ fontSize:12, color:T.red, marginTop:8 }}>{err}</div>}
        </div>
      </div>
      {loading&&<div style={{ display:'flex',gap:8,alignItems:'center',color:T.sub,fontSize:13 }}><Spin/>Analizando creativo en 5 dimensiones…</div>}
      {result&&(
        <div>
          <Hr/>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
            <div>
              <div style={{ fontSize:20, fontWeight:800, color:overallColor, fontFamily:'monospace', marginBottom:4 }}>{result.overallScore}/5</div>
              <div style={{ fontSize:14, fontWeight:700, color:T.ink, marginBottom:4 }}>{result.archetype}</div>
              <div style={{ fontSize:13, color:T.sub, maxWidth:480, lineHeight:1.5 }}>{result.verdict}</div>
            </div>
            <Btn variant="ghost" size="sm" onClick={()=>setResult(null)}>Analizar otro</Btn>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:14, marginBottom:24 }}>
            {result.dimensions?.map((d: any,i: number)=>{
              const dim=DIMENSIONS.find(x=>x.id===d.id);
              return(
                <div key={i} style={{ border:`1px solid ${T.line}`, borderRadius:8, padding:'14px 16px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}><span style={{ fontSize:13, fontWeight:700, color:dim?.color }}>{dim?.name}</span><Pill t={dim?.tagline||''} c={dim?.color||T.ghost}/></div>
                    <span style={{ fontSize:16, fontWeight:800, color:d.score>=4?T.green:d.score>=3?T.amber:T.red, fontFamily:'monospace' }}>{d.score}/5</span>
                  </div>
                  <div style={{ fontSize:13, color:T.sub, lineHeight:1.5, marginBottom:6 }}>{d.diagnosis}</div>
                  <div style={{ fontSize:12, color:T.ghost, fontStyle:'italic', marginBottom:6 }}>"{d.evidence}"</div>
                  <div style={{ fontSize:12, fontWeight:600, color:T.ink }}>→ {d.recommendation}</div>
                </div>
              );
            })}
          </div>
          {result.rewrite&&(
            <Section title="Reescritura sugerida">
              <div style={{ background:T.surf, borderRadius:8, padding:'16px 18px' }}>
                <div style={{ marginBottom:10 }}><Lbl>Hook</Lbl><div style={{ fontSize:13, color:T.ink, fontStyle:'italic', lineHeight:1.5 }}>"{result.rewrite.hook}"</div></div>
                <div style={{ marginBottom:10 }}><Lbl>Body</Lbl><div style={{ fontSize:13, color:T.sub, lineHeight:1.6 }}>{result.rewrite.body}</div></div>
                <div style={{ marginBottom:10 }}><Lbl>CTA</Lbl><div style={{ fontSize:13, color:T.green, fontWeight:600 }}>→ {result.rewrite.cta}</div></div>
                <div style={{ fontSize:12, color:T.ghost, fontStyle:'italic' }}>{result.rewrite.rationale}</div>
              </div>
            </Section>
          )}
          {result.insightQuote&&<div style={{ marginTop:20, padding:'14px 18px', background:T.surf, borderRadius:8, borderLeft:`3px solid ${T.violet}` }}><div style={{ fontSize:13, color:T.ink, fontStyle:'italic', lineHeight:1.6 }}>"{result.insightQuote}"</div></div>}
        </div>
      )}
    </div>
  );
}

/* ─── ROOT ──────────────────────────────────────────────────── */
const MODES = [
  { id:'strategy',  label:'Strategy',         desc:'Brief → sistema completo' },
  { id:'financials',label:'Financials',        desc:'Modelo de viabilidad' },
  { id:'creative',  label:'Creative Request',  desc:'Brief formato WMM' },
  { id:'email',     label:'Email Flows',       desc:'Automatizaciones GHL' },
  { id:'matrix',    label:'Attraction Matrix', desc:'Han × performance' },
];

export function StoryEngine() {
  const [mode,setMode]               = useState('strategy');
  const [strategyData,setStrategyData] = useState<any>(null);

  return (
    <div style={{ fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif', background:T.bg, minHeight:'100vh' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}`}</style>

      {/* Header */}
      <div style={{ borderBottom:`1px solid ${T.line}`, background:T.bg, position:'sticky', top:0, zIndex:10 }}>
        <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 24px', height:48, display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ fontSize:13, fontWeight:800, color:T.ink, letterSpacing:'-0.01em' }}>Story Engine</div>
          <div style={{ width:1, height:16, background:T.line }} />
          <div style={{ display:'flex', gap:0, flex:1, overflowX:'auto', height:48 }}>
            {MODES.map(m=>(
              <button key={m.id} onClick={()=>setMode(m.id)} style={{
                padding:'0 16px', height:'100%', background:'none', border:'none',
                borderBottom:mode===m.id?`2px solid ${T.ink}`:'2px solid transparent',
                fontSize:13, fontWeight:mode===m.id?600:400,
                color:mode===m.id?T.ink:T.sub, cursor:'pointer', fontFamily:'inherit',
                display:'flex', alignItems:'center', gap:7, whiteSpace:'nowrap',
              }}>
                {m.label}
                {mode===m.id&&<span style={{ fontSize:11, color:T.ghost, fontWeight:400 }}>{m.desc}</span>}
                {(m.id==='creative'||m.id==='email')&&strategyData&&mode!==m.id&&(
                  <span style={{ width:5, height:5, borderRadius:'50%', background:T.green, display:'inline-block' }} />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ paddingTop:28, paddingBottom:60 }}>
        {mode==='strategy'   && <StrategyMode   key="strategy"   onData={setStrategyData}/>}
        {mode==='financials' && <FinancialsMode key="financials"/>}
        {mode==='creative'   && <CreativeRequestMode key="creative" strategyData={strategyData}/>}
        {mode==='email'      && <EmailFlowsMode key="email" strategyData={strategyData}/>}
        {mode==='matrix'     && <AttractionMatrixMode key="matrix"/>}
      </div>
    </div>
  );
}
