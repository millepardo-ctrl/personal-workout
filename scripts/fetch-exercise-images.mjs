// Descarga las fotos de free-exercise-db (Unlicense / dominio público) usadas en la rutina.
// Uso: npm run images
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs'

const src = readFileSync('src/data/routine.seed.ts', 'utf8')
const ids = [...new Set([...src.matchAll(/imageId: '([^']+)'/g)].map((m) => m[1]))]
const BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises'
let ok = 0
for (const id of ids) {
  for (const n of [0, 1]) {
    const out = `public/exercises/${id}/${n}.jpg`
    if (existsSync(out)) continue
    const res = await fetch(`${BASE}/${id}/${n}.jpg`)
    if (!res.ok) { console.warn(`✗ ${id}/${n}.jpg (${res.status})`); continue }
    mkdirSync(`public/exercises/${id}`, { recursive: true })
    writeFileSync(out, Buffer.from(await res.arrayBuffer()))
    ok++
  }
}
console.log(`Descargadas ${ok} imágenes para ${ids.length} ejercicios`)
