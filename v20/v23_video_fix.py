import re, pathlib
p=pathlib.Path('app.js')
s=p.read_text(encoding='utf-8')

# Persist the user's declared focus unconditionally through diagnostic completion.
s,n=re.subn(r"function startDiagnostic\(\)\{.*?save\(\);renderDiagnostic\(\)\}",r'''function startDiagnostic(){
  if(typeof onboardingAnswers!=='undefined' && onboardingAnswers[0]!=null){
    state.selfReportedWeak=AREAS[Number(onboardingAnswers[0])];
    state.declaredFocus=state.selfReportedWeak;
  }
  const items=AREAS.flatMap(a=>shuffle(fallbackQuestions.filter(q=>q.area===a)).slice(0,2));
  diagnostic={items:shuffle(items),i:0,answers:[]};
  save();renderDiagnostic()
}''',s,count=1,flags=re.S)
if n!=1: raise SystemExit('startDiagnostic patch failed')

s,n=re.subn(r"function finishDiagnostic\(\)\{.*?\}\nfunction profPanel",r'''function finishDiagnostic(){
  const by={};AREAS.forEach(a=>by[a]=[0,0]);
  diagnostic.items.forEach((q,i)=>{by[q.area][1]++;if(diagnostic.answers[i]===q.c)by[q.area][0]++});
  AREAS.forEach(a=>{if(by[a][1])state.difficultyScores[a]=pct(by[a][0],by[a][1])});
  if(state.declaredFocus) state.selfReportedWeak=state.declaredFocus;
  state.diagnosticDone=true;save();
  const weak=state.selfReportedWeak||AREAS[0];
  app.innerHTML=`<div class="plan-loading"><img src="${mascotUrl}"><div class="spinner"></div><h2>Montando seu plano personalizado… 🐶✨</h2><p>Seu foco principal será <b>${weak}</b>, sem abandonar as outras áreas.</p></div>`;
  setTimeout(()=>{app.innerHTML=shell(`<div class="diag-done"><img src="${mascotUrl}"><h1>Plano personalizado pronto! 🎉</h1><p>Você escolheu <b>${weak}</b> como foco principal. Vou manter essa prioridade e usar seu desempenho apenas para sugerir reforços extras nas demais áreas. 🐾</p><button class="primary" data-action="finish-onboarding">Começar a estudar ✨</button></div>`);bind()},850)
}
function profPanel''',s,count=1,flags=re.S)
if n!=1: raise SystemExit('finishDiagnostic patch failed')

# Home: declared focus always appears first; detected weakness is secondary information only.
s,n=re.subn(r"function home\(\)\{.*?\}\n\nfunction desempenho",r'''function home(){
  const chosen=state.selfReportedWeak||state.declaredFocus||AREAS[0];
  const detected=AREAS.slice().sort((a,b)=>state.difficultyScores[a]-state.difficultyScores[b])[0];
  const ordered=[chosen,...AREAS.filter(a=>a!==chosen).sort((a,b)=>state.difficultyScores[a]-state.difficultyScores[b])];
  const daily=Math.min(100,pct(state.dailyXp,60));
  return `<section class="hero"><span class="eyebrow">${esc(state.goal)}</span><h1>Seu estudo, do seu jeito.</h1><p>O EstudAI mantém o foco que você escolheu e usa seu desempenho apenas para sugerir reforços extras.</p><div class="hero-actions"><button class="primary" data-action="personal-study">▶ Estudo personalizado</button><button class="secondary" data-tab="redacao">✍ Treinar redação</button></div><div class="goal"><div><b>Meta de hoje</b><strong>${daily}%</strong></div><div class="progress"><i style="width:${daily}%"></i></div><small>${state.dailyXp}/60 XP hoje</small></div></section><section><div class="title-row focus-title"><h2>Foco recomendado</h2><span>personalizado para você</span></div><div class="focus-note"><b>🎯 Prioridade escolhida: ${chosen}</b>${detected!==chosen?`<span>🔎 Seu desempenho também indica reforço em ${detected}.</span>`:`<span>Seu desempenho atual confirma essa prioridade.</span>`}</div><div class="focus-grid">${ordered.map((a,i)=>`<article class="focus-card tone-${i}"><div class="focus-icon">${['📖','🌎','🧪','📐'][AREAS.indexOf(a)]}</div><div><small>${i===0?'PRIORIDADE ESCOLHIDA':(a===detected?'PONTO FRACO DETECTADO':'REVISÃO')}</small><h3>${a}</h3><p>${state.difficultyScores[a]}% de domínio estimado</p></div><button data-action="area-study" data-area="${a}">Praticar →</button></article>`).join('')}</div></section>`
}

function desempenho''',s,count=1,flags=re.S)
if n!=1: raise SystemExit('home patch failed')

# Personalized quiz always uses the declared focus as the 4-question priority.
s,n=re.subn(r"async function startPersonalizedQuiz\(\)\{.*?render\(\)\}",r'''async function startPersonalizedQuiz(){
  const weak=state.selfReportedWeak||state.declaredFocus||AREAS[0];
  const ranked=[weak,...AREAS.filter(a=>a!==weak).sort((a,b)=>state.difficultyScores[a]-state.difficultyScores[b])];
  app.innerHTML=shell(`<div class="loading"><div class="spinner"></div><h2>Preparando seu estudo personalizado… 🐶</h2><p>Foco principal: ${weak}. As outras áreas continuam no plano. ✨</p></div>`);
  const plan=[[ranked[0],4],[ranked[1],2],[ranked[2],2],[ranked[3],2]];let items=[];
  for(const [area,n] of plan){const part=await fetchEnemQuestions([area],n);items.push(...part)}
  items=shuffle(items).slice(0,10);
  if(items.length<10){const extra=await fetchEnemQuestions(AREAS,10-items.length);items.push(...extra.filter(q=>!items.some(x=>x.id===q.id)).slice(0,10-items.length))}
  if(!items.length){showToast('Não consegui montar o personalizado agora 😕');setTab('home');return}
  quiz={area:'Personalizado',title:`Personalizado • foco em ${weak}`,items,i:0,answers:Array(items.length).fill(null),checked:Array(items.length).fill(false),started:Date.now(),times:Array(items.length).fill(0),qStart:Date.now(),saved:false};render()
}''',s,count=1,flags=re.S)
if n!=1: raise SystemExit('personalized patch failed')

# Prof. Caramelo: never leave the user stuck in loading. Give an immediate useful local answer;
# try the online answer in the background and replace only if it arrives quickly.
s,n=re.subn(r"async function sendProf\(\)\{.*?renderProfPanel\(\)\}",r'''async function sendProf(){
  const input=document.querySelector('#profInput'),text=input?.value.trim();if(!text)return;
  const allowed=/(enem|redação|redacao|quest|matem|portugu|linguagem|hist[oó]ria|geografia|biologia|qu[ií]mica|f[ií]sica|estud|simulado|prova|conte[uú]do|aprender|explica|nota|compet[eê]ncia|filosofia|sociologia|app|aplicativo|desempenho|dificuldade|ponto fraco|como|usar|melhorar)/i.test(text);
  state.chat.push({role:'user',text});save();renderProfPanel();
  const local=allowed?friendlyAnswer(localProfAnswer(text)):'Eu fico focado em educação, ENEM e no uso do EstudAI. Pode me perguntar sobre matérias, questões, redação, desempenho ou como usar o app. 🐶📚';
  const placeholderId='local-'+Date.now();
  state.chat.push({role:'assistant',text:local,_id:placeholderId});save();setTimeout(renderProfPanel,250);
  if(!allowed)return;
  try{
    const ctl=new AbortController();const timer=setTimeout(()=>ctl.abort(),4500);
    const r=await fetch('https://estudai-app.vercel.app/api/prof-caramelo',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:text,context:{selfReportedWeak:state.selfReportedWeak||state.declaredFocus,difficultyScores:state.difficultyScores,history:state.history.slice(-5).map(h=>({area:h.area,correct:h.correct,total:h.total})),theme:state.theme}}),signal:ctl.signal});clearTimeout(timer);
    if(r.ok){const d=await r.json();if(d.answer){const idx=state.chat.findIndex(m=>m._id===placeholderId);if(idx>=0)state.chat[idx]={role:'assistant',text:friendlyAnswer(d.answer)};save();renderProfPanel()}}
  }catch(e){}
}''',s,count=1,flags=re.S)
if n!=1: raise SystemExit('sendProf patch failed')

# Ensure profile/metrics use mascot image cleanly and keep all copy aligned.
css=r'''
/* v2.3 fixes from user video */
:root{--safe-top:max(env(safe-area-inset-top),18px)}
.topbar{padding-top:calc(var(--safe-top) + 8px)!important;min-height:86px!important}
.topbar .brand img{width:48px!important;height:48px!important;object-fit:cover!important;border-radius:13px!important;image-rendering:auto!important}
.prof-head img,.streak-banner img,.prof-fab img,.diag-top img,.diag-done img,.plan-loading img{object-fit:cover!important;image-rendering:auto!important}
.focus-title{display:flex!important;align-items:flex-end!important;justify-content:space-between!important;gap:10px!important;flex-wrap:nowrap!important}
.focus-title h2{white-space:nowrap!important;margin:0!important;font-size:clamp(1.65rem,7vw,2.15rem)!important}
.focus-title span{font-size:.8rem!important;text-align:right!important;line-height:1.15!important;max-width:38%!important}
.focus-note{display:flex!important;flex-direction:column!important;gap:5px!important;margin:8px 0 14px!important;padding:12px 14px!important;border-radius:16px!important;background:linear-gradient(120deg,#eef7ff,#f3fff6,#fff9dd)!important}
.question-card{padding-bottom:118px!important}
.question-context,.question-command{font-size:1rem!important;line-height:1.58!important;font-weight:500!important;letter-spacing:0!important}
.question-command{font-weight:700!important;margin-top:18px!important}
.question-figure img{width:100%!important;max-height:420px!important;object-fit:contain!important;background:white!important}
.image-zoom{width:100%!important}
.quiz-bar{z-index:50!important}
.prof-panel #profTyping{display:none!important}
.onboarding{overflow-y:auto!important;padding-bottom:30px!important}
.onboard-card{margin-top:calc(var(--safe-top) + 6px)!important}
.avatar-img{image-rendering:auto!important;background-size:400% 300%!important}
'''
s=s+'\n'+css
p.write_text(s,encoding='utf-8')
print('v23 patch applied')
