import { expect, test, type Page } from '@playwright/test'

const signIn = async (page: Page) => {
  await page.goto('/#/login') // HashRouter
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible()
}

test('landing page is public and leads to sign-in', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await page.getByRole('link', { name: 'Sign in' }).first().click()
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
})

test('open a project, accept a recommendation, see it recorded', async ({ page }) => {
  await signIn(page)
  await page.getByRole('link', { name: 'Projects' }).first().click()
  await page.locator('a[href^="#/projects/"]').first().click()
  await page.getByText('Recommendations', { exact: true }).first().click()
  const accept = page.getByRole('button', { name: 'Accept', exact: true }).first()
  await expect(accept).toBeEnabled()
  await accept.click()
  await page.getByRole('dialog').getByRole('button', { name: 'Accept', exact: true }).click()
  await expect(page.getByText('No decisions yet')).toBeHidden()
})

test('viewer role cannot decide recommendations', async ({ page }) => {
  await signIn(page)
  await page.getByRole('button', { name: 'Account menu' }).click()
  const select = page.getByLabel(/View as/)
  const viewer = (await select.locator('option').allTextContents()).find(t => t.includes('Viewer'))!
  await select.selectOption({ label: viewer })
  await page.getByRole('link', { name: 'Projects' }).first().click()
  await expect(page.getByRole('button', { name: /New project/ })).toBeDisabled()
})
