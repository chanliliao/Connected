import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

const persist = localStorage.getItem('connected_persist') !== 'false'

const storage = persist
  ? localStorage
  : { getItem: () => null, setItem: () => {}, removeItem: () => {} }

export const supabase = createClient(url, key, {
  auth: { storage, persistSession: persist },
})
