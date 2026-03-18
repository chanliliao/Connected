import { createClient } from './frontend/node_modules/@supabase/supabase-js/dist/module/index.js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing required env vars: VITE_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const accounts = [
  { email: 'admin@connected.app',     password: '123456', data: { first_name: 'Admin',     last_name: 'Admin',    birthday: '1990-01-01', role: 'admin' } },
  { email: 'andy@connected.app',      password: '123456', data: { first_name: 'Andy',      last_name: 'Chen',     birthday: '1995-03-14', role: 'user'  } },
  { email: 'eric@connected.app',      password: '123456', data: { first_name: 'Eric',      last_name: 'Nguyen',   birthday: '1993-07-22', role: 'user'  } },
  { email: 'ivan@connected.app',      password: '123456', data: { first_name: 'Ivan',      last_name: 'Petrov',   birthday: '1991-11-05', role: 'user'  } },
  { email: 'karen@connected.app',     password: '123456', data: { first_name: 'Karen',     last_name: 'Williams', birthday: '1997-04-30', role: 'user'  } },
  { email: 'josephine@connected.app', password: '123456', data: { first_name: 'Josephine', last_name: 'Martinez', birthday: '1994-09-18', role: 'user'  } },
  { email: 'mei@connected.app',       password: '123456', data: { first_name: 'Mei',       last_name: 'Lin',      birthday: '1996-02-07', role: 'user'  } },
]

for (const account of accounts) {
  const { data, error } = await supabase.auth.admin.createUser({
    email: account.email,
    password: account.password,
    user_metadata: account.data,
    email_confirm: true,
  })

  if (error) {
    if (error.message?.includes('already been registered') || error.code === 'email_exists') {
      console.log(`[already exists] ${account.email}`)
    } else {
      console.error(`[error] ${account.email}: ${error.message}`)
    }
  } else {
    console.log(`[created] ${account.email} (id: ${data.user.id})`)
  }
}
