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

const users = [
  { username: 'admin',     password: '123456', firstName: 'Admin',     lastName: 'Admin',    birthday: '1990-01-01' },
  { username: 'andy',      password: '123456', firstName: 'Andy',      lastName: 'Chen',     birthday: '1995-03-14' },
  { username: 'eric',      password: '123456', firstName: 'Eric',      lastName: 'Nguyen',   birthday: '1993-07-22' },
  { username: 'ivan',      password: '123456', firstName: 'Ivan',      lastName: 'Petrov',   birthday: '1991-11-05' },
  { username: 'karen',     password: '123456', firstName: 'Karen',     lastName: 'Williams', birthday: '1997-04-30' },
  { username: 'josephine', password: '123456', firstName: 'Josephine', lastName: 'Martinez', birthday: '1994-09-18' },
  { username: 'mei',       password: '123456', firstName: 'Mei',       lastName: 'Lin',      birthday: '1996-02-07' },
]

async function signUp(page, { username, password, firstName, lastName, birthday }) {
  await page.goto('/login')
  await page.waitForSelector('.login-card')
  await page.getByRole('button', { name: 'Sign Up' }).click()
  await page.locator('input[placeholder="Username"]').fill(username)
  await page.locator('input[placeholder="First Name"]').fill(firstName)
  await page.locator('input[placeholder="Last Name"]').fill(lastName)
  await page.locator('input[type="date"]').fill(birthday)
  await page.locator('input[type="password"]').fill(password)
  await page.locator('button[type="submit"]').click()
  // Email confirmation is off — signup auto-logs in and redirects to /
  await expect(page).toHaveURL('/', { timeout: 15000 })
  await expect(page.locator('.home-email')).toContainText(username)
}

async function login(page, username, password) {
  await page.goto('/login')
  await page.waitForSelector('.login-card')
  await page.locator('input[placeholder="Username"]').fill(username)
  await page.locator('input[type="password"]').fill(password)
  await page.locator('button[type="submit"]').click()
  await expect(page).toHaveURL('/', { timeout: 15000 })
  await expect(page.locator('.home-email')).toContainText(username)
  await page.locator('.home-logout-btn').click()
  await expect(page).toHaveURL('/login')
}

test.describe.serial('E2E Account Creation + DB Verification', () => {
  test.beforeAll(async () => {
    runSQL("DELETE FROM auth.users WHERE email LIKE '%@connected.app'")
    const result = runSQL("SELECT COUNT(*) FROM auth.users WHERE email LIKE '%@connected.app'")
    console.log('DB before test (should be 0):', result.trim())
  })

  for (const user of users) {
    test(`Sign up ${user.firstName} ${user.lastName}`, async ({ page }) => {
      await signUp(page, user)
      console.log(`✓ Created: ${user.firstName} ${user.lastName} (${user.username})`)
    })
  }

  test('Set admin role via DB', async () => {
    const result = runSQL("UPDATE public.profiles SET role = 'admin' WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@connected.app') RETURNING username, role")
    console.log('Admin role set:\n', result)
  })

  test('Admin login and logout', async ({ page }) => {
    await login(page, 'admin', '123456')
    console.log('✓ Admin login works')
  })

  test('User (andy) login and logout', async ({ page }) => {
    await login(page, 'andy', '123456')
    console.log('✓ Andy login works')
  })

  test.afterAll(async () => {
    const result = runSQL("SELECT p.username, p.first_name, p.last_name, p.role FROM public.profiles p JOIN auth.users u ON u.id = p.id WHERE u.email LIKE '%@connected.app' ORDER BY u.email")
    console.log('✓ All profiles:\n', result)
  })
})
