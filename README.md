# Elite CrossFit Tracker (SPA)

Aplicação SPA em React + Tailwind (via CDN), pronta para testar sem setup de build.

## Como testar (100% funcional)

1. Inicia servidor local na pasta do projeto:

```bash
python3 -m http.server 4173
```

2. Abre no browser:

- http://127.0.0.1:4173/index.html

## O que validar

- Dashboard com PRs e foco do mês.
- Calendário semanal de Fevereiro a Junho.
- Blocos de treino por dia (Warm-up / Strength / Conditioning / Cool-down).
- Cálculo automático de % e carga em kg para os movimentos de força.
- Modal de `Log` por exercício com campos:
  - Carga Realizada
  - RPE (1-10)
  - Tempo
  - Notas de Ombro
- Persistência dos logs após refresh (localStorage).

## Estrutura

- `index.html`: shell da SPA, carrega React, Tailwind, Babel e monta a app.
- `EliteTrainingTracker.jsx`: componente único com toda a lógica e UI.
