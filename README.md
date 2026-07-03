# Ravvedimento Operoso F24EP

Strumento di calcolo del ravvedimento operoso per Enti Pubblici (modello F24EP):

- Calcolo sanzioni ridotte (sprint, breve, intermedio, lungo) con distinzione tra regime
  pre e post Riforma D.Lgs 87/2024 (violazioni commesse dal 01/09/2024).
- Calcolo interessi legali pro-rata temporis in base ai tassi storici (dal 2010).
- Sanzioni per tardivo invio CU / Modello 770.
- Anteprima fac-simile F24EP con aggregazione delle sanzioni ed export CSV / PDF.

## Avvio locale

**Prerequisiti:** Node.js 18+

```bash
npm install
npm run dev
```

## Script

- `npm run dev` — server di sviluppo (porta 3000)
- `npm run build` — type-check e build di produzione
- `npm run preview` — anteprima della build
- `npm test` — test unitari sulla logica di calcolo (Vitest)

## Note

I calcoli sono un supporto operativo e non sostituiscono le verifiche ufficiali.
I tassi legali e i termini dichiarativi sono definiti in `constants.ts`.
