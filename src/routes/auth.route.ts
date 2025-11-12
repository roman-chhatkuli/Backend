import { Hono } from 'hono'
import * as z from 'zod'
import { db } from '../index.ts'
import { users } from '../db/schema/schema.ts'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { setCookie, getCookie, deleteCookie } from 'hono/cookie'

const authRouter = new Hono()

const authLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

const authSignUpSchema = authLoginSchema.extend({
  name: z.string().min(5),
})

authRouter.post('/login', async (c) => {
  const { email, password } = await c.req.json()

  const parsed = authLoginSchema.safeParse({ email, password })

  if (!parsed.success) {
    return c.json({ message: 'Invalid credentials', success: false }, 401)
  }

  const user = await db.select().from(users).where(eq(users.email, email))
  const foundUser = user[0]

  if (!foundUser) {
    return c.json({ message: 'User not found', success: false }, 404)
  }

  const checkPassword = await bcrypt.compare(password, foundUser.password)

  if (!checkPassword) {
    return c.json({ message: 'Invalid credentials', success: false }, 401)
  }

  const accessToken = jwt.sign({ email: foundUser.email }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' })

  const refreshToken = jwt.sign({ email: foundUser.email }, process.env.JWT_REFRESH_SECRET, { expiresIn: '3d' })

  setCookie(c, 'accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 5*60,
  })

  setCookie(c, 'refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 5 * 24 * 60 * 60,
  })

  return c.json({ message: 'Login successful', success: true, user: foundUser.email }, 200)
})

authRouter.post('/signup', async (c) => {
  const { name, email, password } = await c.req.json()

  const parsed = authSignUpSchema.safeParse({ name, email, password })
  if (!parsed.success) {
    return c.json({ message: 'Invalid credentials', success: false }, 401)
  }

  const existingUser = await db.select().from(users).where(eq(users.email, email))


  if (existingUser.length > 0) {
    return c.json({ message: 'User already exists', success: false }, 404)
  }
 
  const salt = await bcrypt.genSalt(10)
  const hashedPassword = await bcrypt.hash(password, salt) 

  const newUser = await db.insert(users).values({
    name,
    email,
    password: hashedPassword,
  })

  const accessToken = jwt.sign({ email: foundUser.email }, process.env.JWT_ACCESS_SECRET, { expiresIn: '5m' })

  const refreshToken = jwt.sign({ email: foundUser.email }, process.env.JWT_REFRESH_SECRET, { expiresIn: '3d' })

  setCookie(c, 'accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 5 * 60,
  })

  setCookie(c, 'refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 5 * 24 * 60 * 60,
  })

  return c.json({ message: 'Signup successful', success: true, user: email }, 201)
})



authRouter.post('/logout', async (c) => {
  deleteCookie(c, 'accessToken')
  deleteCookie(c, 'refreshToken')
  return c.json({ message: 'Logout successful', success: true }, 201)
})



authRouter.get("/profile", async (c) => {
  const accessToken = getCookie(c, 'accessToken')

  if (!accessToken) {
    return c.json({ message: 'Unauthorized', success: false }, 401)
  }

  try {
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET)
    return c.json({ message: 'Profile fetched successfully', success: true, email: decoded.email }, 200)
  } catch (e) {
    return c.json({ message: 'Invalid or expired token', success: false }, 401)
  }

})

export default authRouter