// Recorrido de humo en Chromium con viewport de iPhone. Uso: npm run build && npm run e2e
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
import assert from 'node:assert/strict'

const out = process.env.SHOTS_DIR ?? 'test-results'
const server = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], { stdio: 'ignore' })
await new Promise((r) => setTimeout(r, 2500))
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium' })
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
const shot = (n) => page.screenshot({ path: `${out}/${n}.png`, fullPage: true })

try {
  await page.goto('http://localhost:4173/')
  await page.getByRole('heading', { name: /Hola, Milena/ }).waitFor()
  await shot('01-hoy')

  // Entrenar → sesión A
  await page.getByRole('link', { name: /Entrenar/ }).click()
  await shot('02-entrenar')
  await page.goto('http://localhost:4173/#/entrenar/A')
  await page.getByRole('heading', { name: 'Entrenamiento A' }).waitFor()
  await page.getByLabel('Peso (kg)').first().fill('35')
  await page.getByLabel('Reps').first().fill('12')
  await page.getByRole('button', { name: 'Terminar serie 1' }).first().click()
  await page.getByRole('timer').waitFor()
  await shot('03-sesion')

  // Comer
  await page.getByRole('link', { name: /Comer/ }).click()
  await page.getByRole('heading', { name: 'Comer' }).waitFor()
  // el checkbox es controlado por la base (async): click y esperar a que quede marcado
  await page.getByRole('checkbox').first().click()
  await page.waitForFunction(() => document.querySelector('input[type=checkbox]')?.checked === true)
  await shot('04-comer')

  // Progreso: nueva medición
  await page.getByRole('link', { name: /Progreso/ }).click()
  await page.getByLabel('Peso (kg)').fill('63.8')
  await page.getByLabel('Cintura (cm)').fill('78')
  await page.getByRole('button', { name: 'Guardar medición' }).click()
  await page.getByText(/63.8 kg/).first().waitFor()
  await shot('05-progreso')

  // Persistencia tras recargar
  await page.goto('http://localhost:4173/#/entrenar/A')
  await page.reload()
  await page.getByRole('heading', { name: 'Entrenamiento A' }).waitFor()
  assert.equal(await page.getByLabel('Peso (kg)').first().inputValue(), '35')

  // Ajustes
  await page.getByRole('link', { name: /Ajustes/ }).click()
  await page.getByRole('heading', { name: 'Ajustes' }).waitFor()
  await shot('06-ajustes')

  // Imágenes cargadas
  await page.goto('http://localhost:4173/#/entrenar/C')
  await page.getByRole('heading', { name: 'Entrenamiento C' }).waitFor()
  const broken = await page.$$eval('img', (imgs) => imgs.filter((i) => i.complete && i.naturalWidth === 0).length)
  assert.equal(broken, 0, 'hay imágenes rotas')

  // Offline: el service worker debe servir la app
  await page.waitForTimeout(1500)
  await ctx.setOffline(true)
  await page.reload()
  await page.getByRole('heading', { name: 'Entrenamiento C' }).waitFor({ timeout: 8000 })
  assert.deepEqual(errors.filter((e) => !/net::ERR|Failed to load resource/.test(e)), [], 'errores de consola')
  console.log('OK: recorrido completo, persistencia, imágenes y offline')
} catch (e) {
  await shot('error').catch(() => {})
  console.error(e)
  process.exitCode = 1
} finally {
  await browser.close()
  server.kill()
}
