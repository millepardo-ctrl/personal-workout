# Mi Plan – entrenamiento y alimentación (PWA)

App personal de Milena: rutina del coach (A, B, C, E, F), plan alimenticio con ciclado de carbohidratos, refeed cada 10 días,
registro de series/pesos con cronómetro de descanso, InBody y gráficas. Funciona sin internet y guarda todo en el teléfono (IndexedDB).

## Desarrollo
```
npm install
npm run dev        # servidor local
npm test           # lógica de dominio y base de datos
npm run build      # typecheck + build PWA
npm run e2e        # recorrido en Chromium (requiere build previo)
npm run images     # vuelve a descargar las fotos de ejercicios (free-exercise-db, dominio público)
```

## Instalar en el iPhone
1. Publica con GitHub Pages (Settings → Pages → Source: *GitHub Actions*; el workflow corre al hacer push a `main`).
2. Abre `https://millepardo-ctrl.github.io/personal-workout/` en Safari → Compartir → **Añadir a pantalla de inicio**.
3. Exporta un respaldo (Ajustes) cada semana.

## Cómo se calculan las metas
TDEE = TMB (último InBody) × 1.55; promedio = TDEE − 200 kcal; proteína 2.1 g/kg; grasa 52 g; los carbos son el resto,
con +30 g en días de pierna (A, C, F). Refeed = TDEE. Todo editable en Ajustes y recalculado al registrar un InBody nuevo.

Las sugerencias de entrenamiento son generales y no sustituyen consejo médico.
