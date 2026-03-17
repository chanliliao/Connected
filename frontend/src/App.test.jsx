import { render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import App from './App'

vi.mock('./lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
  },
}))

test('renders login page when not authenticated', async () => {
  render(<App />)
  await waitFor(() => {
    expect(screen.getByRole('heading', { name: /connected/i })).toBeInTheDocument()
  })
})
