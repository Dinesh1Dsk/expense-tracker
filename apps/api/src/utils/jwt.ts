import { SignJWT, jwtVerify } from 'jose'
import { env } from '../env.js'

const secret = new TextEncoder().encode(env.JWT_SECRET)

export async function signToken(payload: { userId: string; email: string }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(env.JWT_EXPIRES_IN)
    .sign(secret)
}

export async function verifyToken(token: string): Promise<{ userId: string; email: string }> {
  const { payload } = await jwtVerify(token, secret)
  return payload as { userId: string; email: string }
}
