# EstudAI 🇧🇷

Aplicativo gamificado de preparação para o ENEM, inspirado em mecânicas de aprendizagem diária e com identidade visual brasileira.

## Funcionalidades

- Dashboard com XP, sequência, corações e meta diária
- Trilhas por Linguagens, Humanas, Natureza, Matemática e Redação
- Banco inicial de questões com explicação imediata
- Simulados por área e quantidade
- Histórico de desempenho
- Catálogo de provas anteriores do ENEM de 2009 a 2025 com acesso ao INEP
- Resumos rápidos por área
- Laboratório de redação com temas sugeridos e sorteio
- Aulas de redação e checklist das 5 competências
- Avaliação local estimada da redação
- Perfil, conquistas e Liga Brasil
- Persistência local com `localStorage`
- PWA instalável e cache offline

## Rodar localmente

```bash
npm install
npm run dev
```

Abra o endereço mostrado pelo Vite no navegador.

## Build de produção

```bash
npm run build
npm run preview
```

## Observações importantes

O app já roda sem backend. O banco interno contém uma base inicial de questões para demonstrar toda a experiência de estudo. O catálogo de provas anteriores direciona para a página oficial do INEP. Para uma operação em produção com milhares de questões oficiais, contas sincronizadas e correção por IA real, conecte um banco de dados e uma API de IA no backend.
