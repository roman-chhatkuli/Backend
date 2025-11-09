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

const authSignUpSchema = z.object({
  name: z.string().min(5),
  email: z.string().email(),
  password: z.string().min(6),
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

  const token = jwt.sign({ email: foundUser.email }, process.env.JWT_SECRET, { expiresIn: '10h' })

  setCookie(c, 'token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 36000,
  })

  return c.json({ message: 'Login successful', success: true }, 200)
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

  const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '10h' })
  setCookie(c, 'token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 36000,
  })

  return c.json({ message: 'Signup successful', success: true }, 201)
})

authRouter.post('/logout', async (c) => {
  deleteCookie(c, 'token')
  return c.json({ message: 'Logout successful', success: true }, 201)
})

authRouter.get("/profile", async (c) => {
  const token = getCookie(c, 'token')

  if(!token) {
    return c.json({ message: 'Unauthorized', success: false }, 401)
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET)

  console.log("Decoded", decoded)
  return c.json({ message: 'Profile fetched successfully', success: true, email: decoded.email }, 200)
})

export default authRouter