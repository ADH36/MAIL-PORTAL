/**
 * Email Portal Admin Routes
 * Handle admin user management operations
 */
import { Router, type Request, type Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { hashPassword, authenticateToken, AuthenticatedRequest } from '../lib/auth.js'

const router = Router()

// Middleware to check admin role
const requireAdmin = async (req: AuthenticatedRequest, res: Response, next: Function) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { role: true }
    })

    if (!user || user.role !== 'ADMIN') {
      res.status(403).json({ error: 'Admin access required' })
      return
    }

    next()
  } catch (error) {
    console.error('Admin middleware error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * Get all users (Admin only)
 * GET /api/admin/users
 */
router.get('/users', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, search, status, role } = req.query

    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    const skip = (pageNum - 1) * limitNum

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } }
      ]
    }
    
    if (status) {
      where.status = status
    }
    
    if (role) {
      where.role = role
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          createdBy: true,
          creator: {
            select: {
              name: true,
              email: true
            }
          },
          _count: {
            select: {
              emails: true,
              smtpConfigs: true
            }
          }
        },
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ])

    res.json({
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    })
  } catch (error) {
    console.error('Get users error:', error)
    res.status(500).json({ error: 'Failed to fetch users' })
  }
})

/**
 * Create new user (Admin only)
 * POST /api/admin/users
 */
router.post('/users', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { email, password, name, role = 'USER', status = 'ACTIVE' } = req.body

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
        role,
        status,
        createdBy: req.user!.id
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
        creator: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    res.status(201).json({ user })
  } catch (error) {
    console.error('Create user error:', error)
    res.status(500).json({ error: 'Failed to create user' })
  }
})

/**
 * Update user (Admin only)
 * PUT /api/admin/users/:id
 */
router.put('/users/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { name, role, status } = req.body

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    // Prevent admin from changing their own role
    if (id === req.user!.id && role && role !== existingUser.role) {
      res.status(400).json({ error: 'Cannot change your own role' })
      return
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(role && { role }),
        ...(status && { status })
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        creator: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    res.json({ user })
  } catch (error) {
    console.error('Update user error:', error)
    res.status(500).json({ error: 'Failed to update user' })
  }
})

/**
 * Reset user password (Admin only)
 * POST /api/admin/users/:id/reset-password
 */
router.post('/users/:id/reset-password', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { password } = req.body

    if (!password || password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long' })
      return
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    // Hash new password
    const passwordHash = await hashPassword(password)

    await prisma.user.update({
      where: { id },
      data: { passwordHash }
    })

    res.json({ message: 'Password reset successfully' })
  } catch (error) {
    console.error('Reset password error:', error)
    res.status(500).json({ error: 'Failed to reset password' })
  }
})

/**
 * Delete user (Admin only)
 * DELETE /api/admin/users/:id
 */
router.delete('/users/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    // Prevent admin from deleting themselves
    if (id === req.user!.id) {
      res.status(400).json({ error: 'Cannot delete your own account' })
      return
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    await prisma.user.delete({
      where: { id }
    })

    res.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Delete user error:', error)
    res.status(500).json({ error: 'Failed to delete user' })
  }
})

/**
 * Get admin dashboard stats
 * GET /api/admin/stats
 */
router.get('/stats', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalEmails,
      totalSmtpConfigs,
      recentUsers
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.email.count(),
      prisma.smtpConfig.count(),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          createdAt: true
        }
      })
    ])

    res.json({
      stats: {
        totalUsers,
        activeUsers,
        totalEmails,
        totalSmtpConfigs
      },
      recentUsers
    })
  } catch (error) {
    console.error('Get stats error:', error)
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
})

export default router