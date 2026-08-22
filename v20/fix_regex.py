from pathlib import Path
p=Path('v20/patch.py')
s=p.read_text(encoding='utf-8')
repls={
    "home+'\\n\\nfunction desempenho'":"(lambda m: home+'\\n\\nfunction desempenho')",
    "quiz+'\\nfunction finishQuiz'":"(lambda m: quiz+'\\nfunction finishQuiz')",
    "essay+'\\nfunction themePanel'":"(lambda m: essay+'\\nfunction themePanel')",
    "prof+'\\n'":"(lambda m: prof+'\\n')",
}
for old,new in repls.items():
    s=s.replace(old,new)
p.write_text(s,encoding='utf-8')
print('regex replacement callbacks enabled')
