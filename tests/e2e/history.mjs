// Verifica Historial: siembra 2 semanas de datos en IndexedDB y revisa calendario, detalle, semana y cardio.
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
import assert from 'node:assert/strict'

const out = process.env.SHOTS_DIR ?? 'test-results'
const server = spawn('npx', ['vite', 'preview', '--port', '4174', '--strictPort'], { stdio: 'ignore' })
await new Promise((r) => setTimeout(r, 2500))
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium' })
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const ago = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return iso(d) }
const codeFor = { 1: 'A', 2: 'B', 3: 'C', 4: 'E', 5: 'F' }

try {
  await page.goto('http://localhost:4174/')
  await page.getByRole('heading', { name: /Hola, Milena/ }).waitFor()

  // Sembrar: últimos 14 días; el 2.º día de gym se omite (✖) y el 4.º queda sin terminar (🟡); hoy no se siembra
  await page.evaluate(async ({ dates, codeFor }) => {
    const open = () => new Promise((res, rej) => { const r = indexedDB.open('mi-plan'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error) })
    const db = await open()
    const put = (store, v) => new Promise((res, rej) => { const tx = db.transaction(store, 'readwrite'); tx.objectStore(store).add(v); tx.oncomplete = res; tx.onerror = () => rej(tx.error) })
    const putKey = (store, v) => new Promise((res, rej) => { const tx = db.transaction(store, 'readwrite'); tx.objectStore(store).put(v); tx.oncomplete = res; tx.onerror = () => rej(tx.error) })
    let k = 0
    let g = 0
    // dates viene de la más reciente a la más antigua: gymFromEnd cuenta hacia atrás desde ayer
    for (const [i, date] of dates.entries()) {
      const dow = new Date(date + 'T12:00:00').getDay()
      const code = codeFor[dow]
      const gymFromEnd = code && date !== dates[0] ? ++g : 0
      if (code && date !== dates[0] && gymFromEnd !== 2) {
        const weight = 30 + i
        await put('workouts', { date, code, done: gymFromEnd !== 3, sets: [{ exerciseId: 'a-curl-sentado', index: 0, type: 'STD', weight, reps: 10 + (k++ % 3) }, { exerciseId: 'b-triceps', index: 0, type: 'STD', weight: 20, reps: 12 }] })
      }
      await putKey('days', { date, water: 6 + (i % 3), mobility: true, abs: false, calves: false, creatine: true, cardioMin: !code ? 35 : 0, refeed: false, meals: { desayuno: { done: true }, pre: { done: true }, post: { done: true }, almuerzo: { done: true }, snack: { done: true }, cena: { done: i % 2 === 0 } }, free: [] })
    }
    // planStart anterior a los datos para que los incumplimientos cuenten
    const s = await new Promise((res) => { const r = db.transaction('settings').objectStore('settings').get('main'); r.onsuccess = () => res(r.result) })
    await putKey('settings', { ...s, planStart: dates.at(-1) })
  }, { dates: Array.from({ length: 14 }, (_, i) => ago(13 - i)).reverse(), codeFor })
  await page.reload()

  // Hoy: tarjeta Ayer + cardio
  await page.getByRole('heading', { name: 'Ayer' }).waitFor()
  await page.getByRole('button', { name: '+30' }).click()
  await page.getByText(/Cardio: 30 min/).waitFor()
  await page.screenshot({ path: `${out}/h1-hoy.png`, fullPage: true })

  // Historial: calendario
  await page.getByRole('link', { name: /Historial/ }).click()
  await page.getByRole('heading', { name: 'Historial' }).waitFor()
  await page.getByRole('gridcell').first().waitFor()
  const read = () => page.getByRole('gridcell').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')))
  let labels = await read()
  await page.getByRole('button', { name: 'Mes anterior' }).click()
  labels = labels.concat(await read())
  await page.getByRole('button', { name: 'Mes siguiente' }).click()
  assert.ok(labels.some((l) => l.endsWith('sesión hecha')), 'debe haber días de sesión hecha')
  assert.ok(labels.some((l) => l.endsWith('no hecho')), 'debe haber días no hechos')
  assert.ok(labels.some((l) => l.endsWith('sesión parcial')), 'debe haber una sesión parcial')
  assert.ok(labels.some((l) => l.endsWith('cardio hecho')), 'debe haber cardio hecho')
  await page.screenshot({ path: `${out}/h2-calendario.png`, fullPage: true })

  // Detalle de un día hecho
  const done = page.getByRole('gridcell', { name: /sesión hecha/ }).last()
  await done.click()
  await page.getByText(/Volumen \d+ kg/).first().waitFor()
  await page.getByText('Curl de femoral sentado').first().waitFor()
  await page.screenshot({ path: `${out}/h3-detalle.png`, fullPage: true })

  // Semana
  await page.getByRole('tab', { name: 'Semana' }).click()
  await page.getByText('Sesiones de gym').waitFor()
  await page.getByRole('button', { name: 'Semana anterior' }).click()
  await page.getByText('Racha de días cumplidos').waitFor()
  await page.screenshot({ path: `${out}/h4-semana.png`, fullPage: true })

  // Sin desborde horizontal con 6 pestañas
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  assert.equal(overflow, false, 'hay desborde horizontal')
  assert.deepEqual(errors, [], 'errores de página')
  console.log('OK: historial, detalle, semana, cardio y sin desborde')
} catch (e) {
  await page.screenshot({ path: `${out}/h-error.png`, fullPage: true }).catch(() => {})
  console.error(e)
  process.exitCode = 1
} finally {
  await browser.close()
  server.kill()
}
