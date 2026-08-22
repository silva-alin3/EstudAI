export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Método não permitido'});
  const {message,context={}}=req.body||{};
  if(!message||typeof message!=='string') return res.status(400).json({error:'Mensagem inválida'});
  const educational=/(enem|redação|quest|matem|portugu|linguagem|hist[oó]ria|geografia|biologia|qu[ií]mica|f[ií]sica|estud|simulado|prova|conte[uú]do|aprender|explica|nota|compet[eê]ncia|filosofia|sociologia)/i.test(message);
  if(!educational) return res.status(200).json({answer:'Eu sou o Prof. Caramelo e fico focado em educação, ENEM e no EstudAI. Pergunte sobre matérias, questões, redação, desempenho ou como usar o app.'});
  if(!process.env.OPENAI_API_KEY) return res.status(503).json({error:'Prof. Caramelo ainda não foi conectado à chave da IA.'});
  try{
    const prompt=`Você é o Prof. Caramelo, tutor educacional do aplicativo EstudAI, voltado ao ENEM. Responda em português do Brasil, com linguagem clara, acolhedora e objetiva. Só responda perguntas relacionadas a educação, ENEM, vestibulares, estudo, redação e uso do aplicativo. Se a pergunta fugir disso, recuse brevemente e redirecione. Personalize usando estes dados quando forem úteis: ${JSON.stringify(context)}. Não invente desempenho nem notas. Pergunta do estudante: ${message}`;
    const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${process.env.OPENAI_API_KEY}`},body:JSON.stringify({model:'gpt-5.6',input:prompt,store:false})});
    const data=await r.json();
    if(!r.ok) return res.status(502).json({error:data?.error?.message||'Erro ao consultar IA'});
    const answer=data.output_text||data.output?.flatMap(x=>x.content||[]).map(x=>x.text).filter(Boolean).join('\n')||'Não consegui responder agora.';
    return res.status(200).json({answer});
  }catch(e){return res.status(500).json({error:'Falha temporária no Prof. Caramelo'});}
}
