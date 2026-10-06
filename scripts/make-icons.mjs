// Genera icon-192.png / icon-512.png a partir de public/icon.svg usando Chromium de Playwright.
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright-core'
const svg = readFileSync('public/icon.svg', 'utf8')
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium' })
for (const size of [192, 512]) {
  const page = await browser.newPage({ viewport: { width: size, height: size } })
  await page.setContent(`<body style="margin:0">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body>`)
  await page.screenshot({ path: `public/icon-${size}.png` })
}
await browser.close()
