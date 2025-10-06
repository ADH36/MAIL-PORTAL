/**
 * Email Portal Authentication Routes
 * Handle user registration, login, and authentication
 */
import { Router, type Request, type Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { hashPassword, comparePassword, generateToken, authenticateToken, AuthenticatedRequest } from '../lib/auth.js'

const router = Router()

/**
 * User Registration
 * POST /api/auth/register
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name } = req.body

    // Validation
    if (!email || !password || !name) {
      res.status(400).json({ error: 'Email, password, and name are required' })
      return
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long' })
      return
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      res.status(409).json({ error: 'User with this email already exists' })
      return
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password)
    
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: 'USER'
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    })

    // Generate token
    const token = generateToken({ userId: user.id, email: user.email })

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * User Login
 * POST /api/auth/login
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body

    // Validation
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' })
      return
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' })
      return
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      res.status(401).json({ error: 'Account is inactive. Please contact administrator.' })
      return
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.passwordHash)
    
    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid email or password' })
      return
    }

    // Update last login time
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    })

    // Generate token
    const token = generateToken({ userId: user.id, email: user.email })

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * Get Current User
 * GET /api/auth/me
 */
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    res.json({
      success: true,
      user
    })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * Update User Profile
 * PUT /api/auth/profile
 */
router.put('/profile', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name } = req.body

    if (!name) {
      res.status(400).json({ error: 'Name is required' })
      return
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: { name },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        updatedAt: true
      }
    })

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    })
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * Change Password
 * PUT /api/auth/password
 */
router.put('/password', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current password and new password are required' })
      return
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters long' })
      return
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id }
    })

    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    // Verify current password
    const isValidPassword = await comparePassword(currentPassword, user.passwordHash)
    
    if (!isValidPassword) {
      res.status(401).json({ error: 'Current password is incorrect' })
      return
    }

    // Hash new password and update
    const newPasswordHash = await hashPassword(newPassword)
    
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash }
    })

    res.json({
      success: true,
      message: 'Password changed successfully'
    })
  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
