import {questions,summaries,essayThemes,essayLessons,exams} from './data.js';

const app=document.querySelector('#app');
const KEY='estudai_state_v3';
const defaultState={name:'Estudante',xp:180,streak:3,hearts:5,dailyGoal:60,completed:[],history:[],essays:[],theme:null,tab:'home'};
let state={...defaultState,...JSON.parse(localStorage.getItem(KEY)||'{}')};
let quiz=null;
let splashDone=false;

const save=()=>localStorage.setItem(KEY,JSON.stringify(state));
const pct=(n,d)=>Math.round((n/d)*100)||0;
const letter=i=>String.fromCharCode(65+i);
const escapeHtml=s=>(s||'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

function setTab(t){
  if(quiz) quiz=null;
  state.tab=t; save(); render();
  window.scrollTo({top:0,behavior:'smooth'});
}

function navButtons(){
  return [['home','🏠 Início'],['trilha','🗺️ Trilha'],['simulados','📝 Simulados'],['provas','📚 Provas ENEM'],['redacao','✍️ Redação'],['resumos','🧠 Resumos'],['progresso','📊 Progresso'],['perfil','👤 Perfil']]
    .map(([k,l])=>`<button data-tab="${k}" class="${state.tab===k?'active':''}">${l}</button>`).join('');
}
function bottomNav(){
  return `<div class="bottomnav">${[['home','🏠','Início'],['trilha','🗺️','Trilha'],['simulados','📝','Quiz'],['redacao','✍️','Redação'],['perfil','👤','Perfil']]
    .map(([k,i,l])=>`<button data-tab="${k}" class="${state.tab===k?'active':''}"><b>${i}</b>${l}</button>`).join('')}</div>`;
}
function shell(content){
  return `<div class="shell">
    <header class="topbar"><div class="topbar-inner"><div class="brand"><div class="brand-mark">🇧🇷</div>EstudAI</div><div class="stat-row"><span class="pill">🔥 ${state.streak} dias</span><span class="pill">⭐ ${state.xp} XP</span><span class="pill">❤️ ${state.hearts}/5</span></div></div></header>
    <div class="layout"><aside class="nav">${navButtons()}</aside><main class="main">${content}</main></div>
    ${bottomNav()}<footer>EstudAI • preparação gamificada para o ENEM</footer>
  </div>`;
}

function splash(){
  return `<div class="splash" id="splash">
    <div class="splash-sun"></div>
    <div class="splash-logo"><span>AI</span></div>
    <h1>EstudAI</h1><p>Seu caminho até a aprovação 🇧🇷</p>
    <div class="splash-dots"><i></i><i></i><i></i></div>
  </div>`;
}

function home(){
  const daily=Math.min(100,pct(state.xp%60,60));
  return `<section class="hero"><div><span class="badge">ENEM 2026</span><h1>Seu caminho inteligente até a aprovação.</h1><p>Estude em trilhas curtas, resolva questões, treine redação e acompanhe sua evolução todos os dias.</p><div class="row"><button class="cta" data-action="quick">Começar missão diária</button><button class="cta secondary" data-tab="redacao">Treinar redação</button></div></div><div class="card"><b>Meta diária</b><div class="metric">${daily}%<small>progresso de hoje</small></div><div class="progress"><div style="width:${daily}%"></div></div><p class="muted">Complete questões e redações para ganhar XP.</p></div></section>
  <div class="section-title"><h2>Hoje no EstudAI</h2></div><div class="grid cols3"><div class="card"><h3>🔥 Sequência</h3><div class="metric">${state.streak}<small>dias seguidos</small></div></div><div class="card"><h3>✅ Questões concluídas</h3><div class="metric">${state.completed.length}<small>no total</small></div></div><div class="card"><h3>✍️ Redações</h3><div class="metric">${state.essays.length}<small>treinos salvos</small></div></div></div>
  <div class="section-title"><h2>Recomendado para você</h2></div><div class="grid cols2"><div class="card"><h3>Matemática essencial</h3><p class="muted">Porcentagem, razão, estatística e geometria.</p><button class="cta yellow" data-action="area" data-area="Matemática">Praticar agora</button></div><div class="card"><h3>Redação em foco</h3><p class="muted">Escolha um tema, escreva e receba uma análise por competência.</p><button class="cta secondary" data-tab="redacao">Abrir treino</button></div></div>`;
}
function trail(){
  const groups=[['Linguagens','📖'],['Humanas','🌎'],['Natureza','🧪'],['Matemática','📐'],['Redação','✍️']];
  return `<div class="section-title"><h2>Trilha de aprendizagem</h2><span class="muted">missões curtas e progressivas</span></div><div class="trail">${groups.map(([g,ic])=>{const count=state.completed.filter(id=>questions.find(q=>q.id===id)?.area===g).length;return `<div class="lesson ${count>=2?'done':''}"><div class="icon">${ic}</div><div><h3>${g}</h3><p class="muted">${g==='Redação'?'Estrutura, repertório e intervenção':'Treinos focados com questões e explicações.'}</p><div class="progress"><div style="width:${Math.min(100,count*25)}%"></div></div></div><button class="cta" ${g==='Redação'?'data-tab="redacao"':`data-action="area" data-area="${g}"`}>Continuar</button></div>`}).join('')}</div>`;
}
function simulados(){
  return `<div class="section-title"><h2>Simulados</h2><span class="muted">treine do seu jeito</span></div><div class="card"><div class="grid cols2"><div><label>Área</label><select id="areaSelect" class="field"><option>Todas</option><option>Linguagens</option><option>Humanas</option><option>Natureza</option><option>Matemática</option></select></div><div><label>Quantidade</label><select id="qtySelect" class="field"><option>5</option><option selected>10</option><option>15</option><option>20</option></select></div></div><div class="toolbar"><button class="cta" data-action="generate">Gerar simulado</button></div></div><div class="section-title"><h2>Histórico</h2></div>${state.history.length?`<div class="grid cols3">${state.history.slice().reverse().map(h=>`<div class="card"><span class="badge">${h.area}</span><h3>${h.correct}/${h.total} acertos</h3><p class="muted">${h.date}</p><b>${pct(h.correct,h.total)}% de aproveitamento</b></div>`).join('')}</div>`:`<div class="card muted">Você ainda não concluiu simulados.</div>`}`;
}
function provas(){
  return `<div class="section-title"><h2>Provas anteriores do ENEM</h2><span class="muted">2009–2025</span></div><div class="notice">Acesse os cadernos e gabaritos oficiais do INEP por ano.</div><div class="exam-grid" style="margin-top:14px">${exams.map(e=>`<div class="exam"><span class="badge">${e.status}</span><strong>${e.year}</strong><p class="muted">Cadernos e gabaritos oficiais</p><a class="cta secondary" href="${e.url}" target="_blank" rel="noopener">Abrir INEP</a></div>`).join('')}</div>`;
}
function redacao(){
  const t=state.theme||essayThemes[0];
  return `<div class="section-title"><h2>Laboratório de Redação</h2><span class="muted">modelo ENEM</span></div>
  <div class="grid cols2"><div class="card"><h3>Tema atual</h3><p class="essay-theme">${t}</p><div class="toolbar"><button class="cta yellow" data-action="random-theme">🎲 Sortear tema</button><select id="themeSelect" class="field">${essayThemes.map(x=>`<option ${x===t?'selected':''}>${x}</option>`).join('')}</select></div></div><div class="card"><h3>O que será analisado</h3><p>📝 Norma-padrão<br>🎯 Atendimento ao tema<br>🧠 Argumentação<br>🔗 Coesão<br>🤝 Proposta de intervenção</p><p class="muted small">A nota é uma estimativa pedagógica local, não uma correção oficial do INEP.</p></div></div>
  <div class="section-title"><h2>Escreva sua redação</h2></div><div class="card"><textarea id="essayText" placeholder="Escreva sua redação completa aqui...">${escapeHtml(state.essayDraft||'')}</textarea><div class="essay-actions"><span id="wordCount" class="muted">${(state.essayDraft||'').trim()?(state.essayDraft||'').trim().split(/\s+/).length:0} palavras</span><div class="row"><button class="cta" data-action="evaluate">Avaliar redação</button><button class="cta secondary" data-action="save-essay">Salvar rascunho</button></div></div><div id="essayResult"></div></div>
  <div class="section-title"><h2>Aulas de redação</h2></div><div class="grid cols2">${essayLessons.map(([tt,d])=>`<div class="card"><h3>${tt}</h3><p class="muted">${d}</p></div>`).join('')}</div>`;
}
function resumos(){return `<div class="section-title"><h2>Resumos rápidos</h2><span class="muted">revisão de alta frequência</span></div><div class="tabs">${['Todos','Matemática','Natureza','Humanas','Linguagens','Redação'].map(x=>`<button class="tab" data-filter="${x}">${x}</button>`).join('')}</div><div id="summaryGrid" class="grid cols2" style="margin-top:12px">${summaries.map(([a,t,d])=>`<div class="card summary" data-area="${a}"><span class="badge">${a}</span><h3>${t}</h3><p class="muted">${d}</p></div>`).join('')}</div>`}
function progresso(){const done=state.completed.length;const correctHist=state.history.reduce((s,h)=>s+h.correct,0),totalHist=state.history.reduce((s,h)=>s+h.total,0);const p=totalHist?pct(correctHist,totalHist):0;return `<div class="section-title"><h2>Seu progresso</h2></div><div class="grid cols3"><div class="card"><div class="score-ring" style="--p:${p*3.6}deg"><b>${p}%</b></div><p class="muted">Aproveitamento em simulados</p></div><div class="card"><div class="metric">${state.xp}<small>XP total</small></div><hr><div class="metric">${done}<small>questões já praticadas</small></div></div><div class="card"><h3>Conquistas</h3><p>🏅 Primeiro passo ${done>0?'✅':'🔒'}</p><p>🔥 Sequência de 3 dias ${state.streak>=3?'✅':'🔒'}</p><p>✍️ Primeira redação ${state.essays.length?'✅':'🔒'}</p><p>💯 500 XP ${state.xp>=500?'✅':'🔒'}</p></div></div><div class="section-title"><h2>Liga Brasil</h2></div><div class="card">${[['Marina',980],['João',860],[state.name,state.xp],['Caio',640],['Bia',590]].sort((a,b)=>b[1]-a[1]).map((r,i)=>`<div class="rank"><b>${i+1}º</b><span>${r[0]}</span><b>${r[1]} XP</b></div>`).join('')}</div>`}
function perfil(){return `<div class="section-title"><h2>Perfil</h2></div><div class="card"><div class="row"><div class="avatar">🎓</div><div><h2>${escapeHtml(state.name)}</h2><p class="muted">Candidato(a) ao ENEM</p></div></div><hr><label>Seu nome</label><input id="nameInput" class="field" value="${escapeHtml(state.name)}"><div class="toolbar"><button class="cta" data-action="save-profile">Salvar perfil</button><button class="cta secondary" data-action="reset">Resetar progresso</button></div></div>`}

function quizView(){
  const q=quiz.items[quiz.i], chosen=quiz.answers[quiz.i], checked=quiz.checked[quiz.i];
  const answerButtons=q.a.map((a,i)=>{
    let cls='answer';
    if(chosen===i) cls+=' selected';
    if(checked && i===q.c) cls+=' correct';
    if(checked && chosen===i && i!==q.c) cls+=' wrong';
    return `<button class="${cls}" data-answer="${i}" ${checked?'disabled':''}><b>${letter(i)})</b> ${a}</button>`;
  }).join('');
  const feedback=checked?`<div class="feedback-card ${chosen===q.c?'success':'danger'}"><div class="feedback-title">${chosen===q.c?'✅ Resposta correta!':'❌ Resposta incorreta'}</div>${chosen!==q.c?`<div class="correct-answer">Resposta correta: <b>${letter(q.c)}) ${q.a[q.c]}</b></div>`:''}<p>${q.e}</p></div>`:'';
  return `<div class="quiz-head"><button class="icon-btn" data-action="exit-quiz" aria-label="Sair do simulado">✕</button><div><h2>${quiz.title}</h2><span class="badge">Questão ${quiz.i+1}/${quiz.items.length}</span></div></div>
  <div class="card quiz-card"><div class="progress"><div style="width:${pct(quiz.i,quiz.items.length)}%"></div></div><p><span class="badge">${q.area} • ${q.topic}</span></p><div class="question">${q.q}</div><div class="answers">${answerButtons}</div>${feedback}</div>
  <div class="quiz-actionbar">${checked?`<button class="cta wide" data-action="next-question">${quiz.i===quiz.items.length-1?'Ver resultado':'Próxima questão →'}</button>`:`<button class="cta wide" data-action="confirm-answer" ${chosen===undefined?'disabled':''}>Confirmar resposta</button><button class="cta yellow compact" data-action="eliminate">✨ Facilitar</button>`}</div>`;
}
function finishQuiz(){
  const correct=quiz.answers.filter((a,i)=>a===quiz.items[i].c).length,total=quiz.items.length;
  state.xp+=correct*10; state.hearts=Math.max(0,state.hearts-(total-correct));
  quiz.items.forEach(q=>{if(!state.completed.includes(q.id))state.completed.push(q.id)});
  state.history.push({area:quiz.area,correct,total,date:new Date().toLocaleDateString('pt-BR')}); save(); quiz=null;
  return `<div class="card result-card"><h1>Simulado concluído! 🎉</h1><div class="metric">${correct}/${total}<small>acertos</small></div><h2>${pct(correct,total)}% de aproveitamento</h2><p class="muted">Você ganhou ${correct*10} XP.</p><button class="cta" data-tab="simulados">Ver histórico</button></div>`;
}

function startQuiz(area='Todas',qty=10){
  let pool=area==='Todas'?questions:questions.filter(q=>q.area===area); pool=[...pool].sort(()=>Math.random()-.5);
  while(pool.length<qty) pool=[...pool,...pool];
  quiz={title:area==='Todas'?'Simulado misto':`Treino de ${area}`,area,items:pool.slice(0,qty),i:0,answers:[],checked:[],finished:false};
  history.pushState({quiz:true},''); render(); window.scrollTo(0,0);
}

const STOPWORDS=new Set('a o os as um uma uns umas de da do das dos em no na nos nas por para com sem que e ou se ao aos à às como mais menos muito pouco já ainda também não sim sua seu suas seus essa esse isso isto aquele aquela entre sobre sob até desde contra após antes depois porque pois porém contudo entretanto portanto assim então quando onde quem qual quais cujo cuja ser estar ter haver fazer poder dever brasil brasileira brasileiro sociedade jovens pessoas país problema desafios caminhos importância impacto impactos combate reduzir ampliar garantir preservar valorização educação saúde ambiente trabalho digital escolar crianças adolescentes'.split(/\s+/));
const CONNECTORS=['além disso','ademais','portanto','porém','entretanto','contudo','dessa forma','desse modo','assim','nesse sentido','diante disso','em primeiro lugar','em segundo lugar','por conseguinte','sobretudo','ainda que','uma vez que','visto que','porque','pois'];
const ARGUMENT_MARKERS=['segundo','de acordo com','dados','pesquisa','estudo','constituição','onu','ibge','inep','história','filósofo','sociólogo','obra','filme','livro','exemplo','evidencia','demonstra','consequência','causa'];
const AGENTS=['governo','estado','ministério','escola','família','sociedade','mídia','empresas','ong','organizações','poder público','secretaria','município','congresso'];
const ACTIONS=['deve','devem','promover','criar','implementar','ampliar','garantir','fiscalizar','investir','oferecer','desenvolver','realizar','combater','reduzir','incentivar'];
const MEANS=['por meio','através','mediante','com campanhas','com investimentos','por intermédio','via','a partir de'];
const PURPOSE=['a fim de','para que','com o objetivo','com a finalidade','visando','de modo a'];
const round40=n=>Math.max(0,Math.min(200,Math.round(n/40)*40));

function normalize(s){return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s]/g,' ')}
function themeKeywords(theme){return normalize(theme).split(/\s+/).filter(w=>w.length>4&&!STOPWORDS.has(w));}
function scoreEssay(text,theme){
  const clean=text.trim(), words=clean?clean.split(/\s+/):[], wc=words.length, low=normalize(clean), paragraphs=clean.split(/\n\s*\n|\n+/).map(x=>x.trim()).filter(Boolean);
  const sentences=clean.split(/[.!?]+/).map(s=>s.trim()).filter(Boolean);
  const uniq=new Set(words.map(w=>normalize(w))).size;
  const longNonsense=words.filter(w=>{const n=normalize(w);return n.length>11 && !/[aeiou]{1,}/.test(n)}).length;
  const vowelWords=words.filter(w=>/[aeiouáéíóúâêôãõ]/i.test(w)).length;
  const repeatedGibberish=/(.)\1{4,}/i.test(clean) || /\b([a-z]{2,5})\1{2,}\b/i.test(low);
  const functionHits=words.filter(w=>STOPWORDS.has(normalize(w))).length;
  const gibberish=wc<8 || repeatedGibberish || (wc>8 && (vowelWords/wc<.55 || functionHits/wc<.08 || longNonsense/wc>.08));
  if(gibberish) return {total:0,comp:[0,0,0,0,0],wc,flags:['O texto não apresenta estrutura suficiente de uma redação em português.'],summary:'Não foi possível identificar uma redação válida. Escreva um texto dissertativo-argumentativo completo para receber uma avaliação.'};

  const themeKs=themeKeywords(theme); const themeHits=themeKs.filter(k=>low.includes(k)).length;
  const connHits=CONNECTORS.filter(c=>low.includes(normalize(c))).length;
  const argHits=ARGUMENT_MARKERS.filter(c=>low.includes(normalize(c))).length;
  const agentHits=AGENTS.filter(c=>low.includes(normalize(c))).length;
  const actionHits=ACTIONS.filter(c=>low.includes(normalize(c))).length;
  const meansHits=MEANS.filter(c=>low.includes(normalize(c))).length;
  const purposeHits=PURPOSE.filter(c=>low.includes(normalize(c))).length;
  const punctuation=(clean.match(/[.,;:!?]/g)||[]).length;
  const caps=sentences.filter(s=>/^[A-ZÁÉÍÓÚÂÊÔÃÕÇ]/.test(s)).length;
  const avgSentence=sentences.length?wc/sentences.length:wc;

  let c1=80;
  if(wc>=160)c1+=40;if(wc>=240)c1+=20;if(sentences.length>=8)c1+=20;if(punctuation>=Math.max(6,wc/25))c1+=20;if(sentences.length&&caps/sentences.length>.7)c1+=20;if(avgSentence>8&&avgSentence<35)c1+=20;if(/\bi\b|\bvc\b|\bpq\b|\bnao\b/i.test(low))c1-=40;
  let c2=40;if(themeHits>=1)c2+=40;if(themeHits>=2)c2+=40;if(wc>=120)c2+=40;if(wc>=200)c2+=20;if(paragraphs.length>=3)c2+=20;
  let c3=40;if(paragraphs.length>=3)c3+=40;if(paragraphs.length>=4)c3+=20;if(argHits>=1)c3+=40;if(argHits>=2)c3+=20;if(wc>=180)c3+=20;if(uniq/Math.max(wc,1)>.45)c3+=20;
  let c4=40;if(connHits>=2)c4+=40;if(connHits>=4)c4+=40;if(connHits>=6)c4+=40;if(paragraphs.length>=3)c4+=20;if(sentences.length>=8)c4+=20;
  let c5=0;if(agentHits)c5+=40;if(actionHits)c5+=40;if(meansHits)c5+=40;if(purposeHits)c5+=40;if(agentHits&&actionHits&&meansHits&&purposeHits)c5+=40;

  let comp=[round40(c1),round40(c2),round40(c3),round40(c4),round40(c5)];
  if(wc<60) comp=comp.map((v,i)=>Math.min(v,i===0?80:40));
  else if(wc<120) comp=comp.map(v=>Math.min(v,120));
  if(themeHits===0) {comp[1]=Math.min(comp[1],40); comp[2]=Math.min(comp[2],80);}
  const total=comp.reduce((a,b)=>a+b,0);
  const flags=[];
  if(wc<160)flags.push(`Seu texto tem ${wc} palavras; desenvolva mais os argumentos.`);
  if(themeHits===0)flags.push('A relação com o tema escolhido ficou pouco evidente.');
  if(paragraphs.length<4)flags.push('Organize o texto em introdução, dois desenvolvimentos e conclusão.');
  if(connHits<3)flags.push('Use mais conectivos para ligar ideias e parágrafos.');
  if(c5<160)flags.push('Complete a proposta com agente, ação, meio e finalidade.');
  if(argHits<1)flags.push('Inclua repertório, evidência ou exemplo produtivo para sustentar os argumentos.');
  return {total,comp,wc,flags,summary: total>=800?'Texto bem estruturado. Agora refine repertório, precisão linguística e detalhamento da intervenção.':total>=600?'Há uma base consistente, mas ainda existem pontos claros para elevar a nota.':total>=400?'O texto apresenta elementos de redação, porém precisa de mais desenvolvimento e organização.':'A estrutura ainda está incompleta para o padrão ENEM. Foque primeiro em tema, argumentos e conclusão.'};
}
function essayResultHtml(r){
  const names=['Competência 1 • Norma-padrão','Competência 2 • Tema e repertório','Competência 3 • Argumentação','Competência 4 • Coesão','Competência 5 • Intervenção'];
  return `<div class="essay-result"><div class="essay-score"><span>Nota estimada</span><strong>${r.total}</strong><small>/ 1000</small></div><p>${r.summary}</p><div class="competence-grid">${r.comp.map((v,i)=>`<div class="competence"><span>${names[i]}</span><b>${v}/200</b><div class="mini-progress"><i style="width:${v/2}%"></i></div></div>`).join('')}</div>${r.flags.length?`<div class="feedback-list"><b>O que melhorar agora</b>${r.flags.map(x=>`<p>• ${x}</p>`).join('')}</div>`:''}</div>`;
}

function bind(){
  document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>setTab(b.dataset.tab));
  document.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>action(b.dataset.action,b));
  document.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>{if(quiz&&!quiz.checked[quiz.i]){quiz.answers[quiz.i]=Number(b.dataset.answer);render();}});
  const ta=document.querySelector('#essayText');
  if(ta) ta.oninput=()=>{state.essayDraft=ta.value; save(); document.querySelector('#wordCount').textContent=`${ta.value.trim()?ta.value.trim().split(/\s+/).length:0} palavras`;};
  const ts=document.querySelector('#themeSelect'); if(ts)ts.onchange=()=>{state.theme=ts.value;save();render()};
  document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{const f=b.dataset.filter;document.querySelectorAll('.summary').forEach(c=>c.style.display=(f==='Todos'||c.dataset.area===f)?'block':'none')});
}
function action(a,b){
  if(a==='quick')startQuiz('Todas',5);
  else if(a==='area')startQuiz(b.dataset.area,5);
  else if(a==='generate')startQuiz(document.querySelector('#areaSelect').value,Number(document.querySelector('#qtySelect').value));
  else if(a==='exit-quiz'){quiz=null;state.tab='simulados';save();render();window.scrollTo(0,0);}
  else if(a==='confirm-answer'){if(quiz.answers[quiz.i]!==undefined){quiz.checked[quiz.i]=true;render();setTimeout(()=>document.querySelector('.feedback-card')?.scrollIntoView({behavior:'smooth',block:'nearest'}),40)}}
  else if(a==='next-question'){if(quiz.i===quiz.items.length-1){quiz.finished=true;render()}else{quiz.i++;render();window.scrollTo({top:0,behavior:'smooth'})}}
  else if(a==='eliminate'){
    const q=quiz.items[quiz.i], chosen=quiz.answers[quiz.i]; const wrong=q.a.map((_,i)=>i).filter(i=>i!==q.c&&i!==chosen).slice(0,2);
    document.querySelectorAll('[data-answer]').forEach(btn=>{if(wrong.includes(Number(btn.dataset.answer))){btn.disabled=true;btn.classList.add('eliminated')}});
  }
  else if(a==='random-theme'){state.theme=essayThemes[Math.floor(Math.random()*essayThemes.length)];save();render()}
  else if(a==='save-essay'){const text=document.querySelector('#essayText').value;state.essayDraft=text;state.essays.push({theme:state.theme||essayThemes[0],text,date:new Date().toLocaleDateString('pt-BR')});save();showToast('Rascunho salvo ✓')}
  else if(a==='evaluate'){
    const ta=document.querySelector('#essayText'), text=ta.value, theme=state.theme||essayThemes[0], r=scoreEssay(text,theme);
    document.querySelector('#essayResult').innerHTML=essayResultHtml(r); state.essayDraft=text; save(); document.querySelector('#essayResult').scrollIntoView({behavior:'smooth',block:'start'});
  }
  else if(a==='save-profile'){state.name=document.querySelector('#nameInput').value.trim()||'Estudante';save();showToast('Perfil salvo ✓');render()}
  else if(a==='reset'){if(confirm('Tem certeza que deseja apagar todo o progresso?')){localStorage.removeItem(KEY);state={...defaultState};quiz=null;render()}}
}
function showToast(text){const el=document.createElement('div');el.className='toast';el.textContent=text;document.body.appendChild(el);setTimeout(()=>el.remove(),1800)}

function render(){
  let content;
  if(quiz) content=quiz.finished?finishQuiz():quizView();
  else content=({home,trail,simulados,provas,redacao,resumos,progresso,perfil}[state.tab]||home)();
  app.innerHTML=shell(content); bind();
}

window.addEventListener('popstate',()=>{if(quiz){quiz=null;state.tab='simulados';save();render();window.scrollTo(0,0)}});

function boot(){
  app.innerHTML=splash();
  setTimeout(()=>{splashDone=true;render();},1500);
}
boot();

if('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));
