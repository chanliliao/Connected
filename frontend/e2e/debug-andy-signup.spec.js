/**
 * Debug test: sign up Andy only, verify full flow.
 * Does NOT wipe the DB — admin stays intact.
 */
import { test, expect } from '@playwright/test'
import { execSync } from 'child_process'

const PSQL = '"C:\\Program Files\\PostgreSQL\\13\\bin\\psql.exe"'
const PG_HOST = 'db.crhoqauswiyygbpjihbs.supabase.co'
const PG_ENV = { ...process.env, PGPASSWORD: 'H119d201m611d215' }

function runSQL(sql) {
  return execSync(
    `${PSQL} -h ${PG_HOST} -U postgres -d postgres -p 5432 -c "${sql}"`,
    { env: PG_ENV, encoding: 'utf8' }
  )
}

test.describe.serial('Debug: Andy signup flow', () => {

  test('Step 1 — clean Andy from DB if present', async () => {
    runSQL("DELETE FROM auth.users WHERE email = 'andy@connected.app'")
    const result = runSQL("SELECT COUNT(*) FROM auth.users WHERE email LIKE '%@connected.app'")
    console.log('Users in DB (should be 1 — admin only):', result)
  })

  test('Step 2 — sign up Andy via web form, expect auto-login to /', async ({ page }) => {
    await page.goto('/login')
    await page.waitForSelector('.login-card')
    await page.getByRole('button', { name: 'Sign Up' }).click()
    await page.locator('input[placeholder="Username"]').fill('andy')
    await page.locator('input[placeholder="First Name"]').fill('Andy')
    await page.locator('input[placeholder="Last Name"]').fill('Chen')
    await page.locator('input[type="date"]').fill('1995-03-14')
    await page.locator('input[type="password"]').fill('123456')
    await page.locator('button[type="submit"]').click()

    // Email confirmation is disabled — signup auto-logs in and redirects to /
    await expect(page).toHaveURL('/', { timeout: 15000 })
    const welcomeText = await page.locator('.home-email').textContent()
    console.log('✓ Signed up and logged in as:', welcomeText)
  })

  test('Step 3 — check DB after signup', async () => {
    const result = runSQL("SELECT u.email, p.username, p.first_name, u.email_confirmed_at IS NOT NULL AS confirmed FROM auth.users u JOIN public.profiles p ON p.id = u.id WHERE u.email = 'andy@connected.app'")
    console.log('Andy in DB:\n', result)
  })

  test('Step 4 — log in with username (fresh context)', async ({ page }) => {
    await page.goto('/login')
    await page.waitForSelector('.login-card')
    await page.locator('input[placeholder="Username"]').fill('andy')
    await page.locator('input[type="password"]').fill('123456')
    await page.locator('button[type="submit"]').click()
    await expect(page).toHaveURL('/', { timeout: 15000 })
    await expect(page.locator('.home-email')).toContainText('andy')
    console.log('✓ Login with username works')
    await page.locator('.home-logout-btn').click()
    await expect(page).toHaveURL('/login')
    console.log('✓ Logout works')
  })

})
