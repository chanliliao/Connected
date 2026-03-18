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

test.describe.serial('Profile edit — Eric changes last name', () => {
  test.beforeAll(async () => {
    const result = runSQL(
      "UPDATE public.profiles SET last_name = 'Nguyen' WHERE id = (SELECT id FROM auth.users WHERE email = 'eric@connected.app')"
    )
    console.log('Reset Eric last_name to Nguyen:', result.trim())
  })

  test('Login as Eric', async ({ page }) => {
    await page.goto('/login')
    await page.waitForSelector('.login-card')
    await page.locator('input[placeholder="Username"]').fill('eric')
    await page.locator('input[type="password"]').fill('123456')
    await page.locator('button[type="submit"]').click()
    await expect(page).toHaveURL('/', { timeout: 15000 })
  })

  test('Navigate to profile via top-right link', async ({ page }) => {
    await page.goto('/login')
    await page.waitForSelector('.login-card')
    await page.locator('input[placeholder="Username"]').fill('eric')
    await page.locator('input[type="password"]').fill('123456')
    await page.locator('button[type="submit"]').click()
    await expect(page).toHaveURL('/', { timeout: 15000 })

    await page.locator('.home-profile-link').click()
    await expect(page).toHaveURL('/profile', { timeout: 10000 })
    await expect(page.locator('input[placeholder="Last Name"]')).toHaveValue('Nguyen', { timeout: 10000 })
  })

  test('Change last name to Chen and save', async ({ page }) => {
    await page.goto('/login')
    await page.waitForSelector('.login-card')
    await page.locator('input[placeholder="Username"]').fill('eric')
    await page.locator('input[type="password"]').fill('123456')
    await page.locator('button[type="submit"]').click()
    await expect(page).toHaveURL('/', { timeout: 15000 })

    await page.locator('.home-profile-link').click()
    await expect(page).toHaveURL('/profile', { timeout: 10000 })

    const lastNameInput = page.locator('input[placeholder="Last Name"]')
    await lastNameInput.waitFor({ timeout: 10000 })
    await lastNameInput.clear()
    await lastNameInput.fill('Chen')
    await page.getByRole('button', { name: 'Save Changes' }).click()
    await expect(page.locator('.profile-success-msg')).toBeVisible({ timeout: 10000 })
  })

  test('Verify in DB', async () => {
    const result = runSQL(
      "SELECT last_name FROM public.profiles WHERE id = (SELECT id FROM auth.users WHERE email = 'eric@connected.app')"
    )
    console.log('DB result:', result.trim())
    if (!result.includes('Chen')) {
      throw new Error(`Expected last_name to be 'Chen', got: ${result.trim()}`)
    }
    console.log('✓ last_name updated to Chen in DB')
  })
})
