import { env } from '../env.js'

async function main() {
  const baseUrl = `http://localhost:${env.PORT}`

  const health = await fetch(`${baseUrl}/health`)
  if (!health.ok) throw new Error(`Health failed: ${health.status}`)

  const registerRes = await fetch(`${baseUrl}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Smoke User',
      email: `smoke.${Date.now()}@example.com`,
      password: 'password123',
    }),
  })

  if (![201, 409].includes(registerRes.status)) {
    throw new Error(`Register failed: ${registerRes.status}`)
  }

  console.log('Smoke checks passed')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
