import re,pathlib
p=pathlib.Path('app.js')
s=p.read_text(encoding='utf-8')
stable=r'''function render(){document.body.classList.toggle('quiz-active',!!(quiz&&!quiz.saved));let content=quiz?(quiz.saved?finishQuiz():quizView()):({home,desempenho,simulados,redacao,perfil}[state.tab]||home)();app.innerHTML=shell(content);bind();if(!state.diagnosticDone&&!quiz){app.insertAdjacentHTML('beforeend',diagnosticOverlay());bind()}}
async function initStatusBar(){try{await StatusBar.setOverlaysWebView({overlay:false});await StatusBar.setBackgroundColor({color:'#0B67B2'});await StatusBar.setStyle({style:Style.Light})}catch{document.documentElement.classList.add('status-fallback')}}
app.innerHTML=splash();'''
s,n=re.subn(r'function render\(\)\{.*?app\.innerHTML=splash\(\);',stable,s,count=1,flags=re.S)
if n!=1: raise SystemExit('tail cleanup failed')
p.write_text(s,encoding='utf-8')
print('tail syntax cleaned')
