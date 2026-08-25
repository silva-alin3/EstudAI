// EstudAI v2.3 - fixes from 177202.mp4
startDiagnostic=function(){
  if(typeof onboardingAnswers!=='undefined' && onboardingAnswers[0]!=null){
    state.selfReportedWeak=AREAS[Number(onboardingAnswers[0])];
    state.declaredFocus=state.selfReportedWeak;
  }
  const items=AREAS.flatMap(a=>shuffle(fallbackQuestions.filter(q=>q.area===a)).slice(0,2));
  diagnostic={items:shuffle(items),i:0,answers:[]};save();renderDiagnostic();
};

finishDiagnostic=function(){
  const by={};AREAS.forEach(a=>by[a]=[0,0]);
  diagnostic.items.forEach((q,i)=>{by[q.area][1]++;if(diagnostic.answers[i]===q.c)by[q.area][0]++});
  AREAS.forEach(a=>{if(by[a][1])state.difficultyScores[a]=pct(by[a][0],by[a][1])});
  if(state.declaredFocus)state.selfReportedWeak=state.declaredFocus;
  state.diagnosticDone=true;save();
  const weak=state.selfReportedWeak||AREAS[0];
  app.innerHTML=`<div class="plan-loading"><img src="${mascotUrl}"><div class="spinner"></div><h2>Montando seu plano personalizado… 🐶✨</h2><p>Seu foco principal será <b>${weak}</b>, sem abandonar as outras áreas.</p></div>`;
  setTimeout(()=>{app.innerHTML=shell(`<div class="diag-done"><img src="${mascotUrl}"><h1>Plano personalizado pronto! 🎉</h1><p>Você escolheu <b>${weak}</b> como foco principal. Essa prioridade será mantida; o desempenho servirá para sugerir reforços secundários. 🐾</p><button class="primary" data-action="finish-onboarding">Começar a estudar ✨</button></div>`);bind()},850);
};

home=function(){
  const chosen=state.selfReportedWeak||state.declaredFocus||AREAS[0];
  const detected=AREAS.slice().sort((a,b)=>state.difficultyScores[a]-state.difficultyScores[b])[0];
  const ordered=[chosen,...AREAS.filter(a=>a!==chosen).sort((a,b)=>state.difficultyScores[a]-state.difficultyScores[b])];
  const daily=Math.min(100,pct(state.dailyXp,60));
  return `<section class="hero"><span class="eyebrow">${esc(state.goal)}</span><h1>Seu estudo, do seu jeito.</h1><p>O EstudAI mantém o foco que você escolheu e usa o desempenho apenas para sugerir reforços extras.</p><div class="hero-actions"><button class="primary" data-action="personal-study">▶ Estudo personalizado</button><button class="secondary" data-tab="redacao">✍ Treinar redação</button></div><div class="goal"><div><b>Meta de hoje</b><strong>${daily}%</strong></div><div class="progress"><i style="width:${daily}%"></i></div><small>${state.dailyXp}/60 XP hoje</small></div></section><section><div class="title-row focus-title"><h2>Foco recomendado</h2><span>personalizado para você</span></div><div class="focus-note"><b>🎯 Prioridade escolhida: ${chosen}</b>${detected!==chosen?`<span>🔎 Seu desempenho também indica reforço em ${detected}.</span>`:`<span>Seu desempenho confirma essa prioridade.</span>`}</div><div class="focus-grid">${ordered.map((a,i)=>`<article class="focus-card tone-${i}"><div class="focus-icon">${['📖','🌎','🧪','📐'][AREAS.indexOf(a)]}</div><div><small>${i===0?'PRIORIDADE ESCOLHIDA':(a===detected?'PONTO FRACO DETECTADO':'REVISÃO')}</small><h3>${a}</h3><p>${state.difficultyScores[a]}% de domínio estimado</p></div><button data-action="area-study" data-area="${a}">Praticar →</button></article>`).join('')}</div></section>`;
};

startPersonalizedQuiz=async function(){
  const weak=state.selfReportedWeak||state.declaredFocus||AREAS[0];
  const ranked=[weak,...AREAS.filter(a=>a!==weak).sort((a,b)=>state.difficultyScores[a]-state.difficultyScores[b])];
  app.innerHTML=shell(`<div class="loading"><div class="spinner"></div><h2>Preparando seu estudo personalizado… 🐶</h2><p>Foco principal: <b>${weak}</b>. As outras áreas continuam no plano. ✨</p></div>`);
  const plan=[[ranked[0],4],[ranked[1],2],[ranked[2],2],[ranked[3],2]];let items=[];
  for(const [area,n] of plan){items.push(...await fetchEnemQuestions([area],n))}
  items=shuffle(items).filter((q,i,a)=>a.findIndex(x=>x.id===q.id)===i).slice(0,10);
  if(items.length<10){const extra=await fetchEnemQuestions(AREAS,10-items.length);items.push(...extra.filter(q=>!items.some(x=>x.id===q.id)).slice(0,10-items.length))}
  if(!items.length){showToast('Não consegui montar o personalizado agora 😕');setTab('home');return}
  quiz={area:'Personalizado',title:`Personalizado • foco em ${weak}`,items,i:0,answers:Array(items.length).fill(null),checked:Array(items.length).fill(false),started:Date.now(),times:Array(items.length).fill(0),qStart:Date.now(),saved:false};render();
};

sendProf=async function(){
  const input=document.querySelector('#profInput'),text=input?.value.trim();if(!text)return;
  const allowed=/(enem|redação|redacao|quest|matem|portugu|linguagem|hist[oó]ria|geografia|biologia|qu[ií]mica|f[ií]sica|estud|simulado|prova|conte[uú]do|aprender|explica|nota|compet[eê]ncia|filosofia|sociologia|app|aplicativo|desempenho|dificuldade|ponto fraco|como|usar|melhorar)/i.test(text);
  state.chat.push({role:'user',text});
  const answer=allowed?friendlyAnswer(localProfAnswer(text)):'Eu fico focado em educação, ENEM e no uso do EstudAI. Pode me perguntar sobre matérias, questões, redação, desempenho ou como usar o app. 🐶📚';
  state.chat.push({role:'assistant',text:answer});save();renderProfPanel();
  // Optional online enhancement: never blocks the visible answer.
  if(!allowed)return;
  try{const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),3500);const r=await fetch('https://estudai-app.vercel.app/api/prof-caramelo',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:text,context:{selfReportedWeak:state.selfReportedWeak||state.declaredFocus,difficultyScores:state.difficultyScores,history:state.history.slice(-5).map(h=>({area:h.area,correct:h.correct,total:h.total})),theme:state.theme}}),signal:ctl.signal});clearTimeout(timer);if(r.ok){const d=await r.json();if(d.answer){state.chat[state.chat.length-1]={role:'assistant',text:friendlyAnswer(d.answer)};save();renderProfPanel()}}}catch(e){}
};
