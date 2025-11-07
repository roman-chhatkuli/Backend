import { Hono } from 'hono'
import * as z from 'zod'

const authRouter = new Hono()

const authSchema = z.object({
  name: z.string().min(5),
  email: z.string().email(),
  password: z.string().min(6),
})

authRouter.post('/login', async (c) => {
  const { email, password } = await c.req.json()
  return c.json({ message: 'Login successful' })
})

authRouter.post('/signup', async (c) => {
  const { fullName,email, password } = await c.req.json()
  return c.json({ message: 'Registration successful' })
})

export default authRouter