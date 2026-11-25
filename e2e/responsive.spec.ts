import { expect, test } from '@playwright/test'

const SIZES = [{ w: 375, h: 800 }, { w: 768, h: 1024 }, { w: 1280, h: 800 }]
const ROUTES = ['/', '/projects', '/library', '/permissions', '/review', '/reports', '/team']

for (const { w, h } of SIZES) {
  test(`no horizontal overflow at ${w}px`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h })
    await page.goto('/')
    const landing = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(landing, 'landing').toBeLessThanOrEqual(0)
    await page.goto('/#/login')
    await page.getByRole('button', { name: 'Sign in' }).click()
    for (const r of ROUTES) {
      await page.goto(`/#${r}`)
      await page.waitForLoadState('networkidle')
      const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
      expect(over, r).toBeLessThanOrEqual(0)
    }
    await page.goto('/#/projects')
    await page.locator('a[href^="#/projects/"]').first().click()
    await page.waitForLoadState('networkidle')
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth), 'project detail').toBeLessThanOrEqual(0)
  })
}
