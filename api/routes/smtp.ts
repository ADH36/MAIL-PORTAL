/**
 * Email Portal SMTP Configuration Routes
 * Handle SMTP settings management with multi-account support
 */
import { Router, type Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { authenticateToken, AuthenticatedRequest } from '../lib/auth.js'
import { encryptPassword, decryptPassword, testSmtpConnection } from '../lib/smtp.js'

const router = Router()

/**
 * Get all SMTP Configurations for user
 * GET /api/smtp/configs
 */
router.get('/configs', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const configs = await prisma.smtpConfig.findMany({
      where: { 
        userId: req.user!.id,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        host: true,
        port: true,
        secure: true,
        username: true,
        fromName: true,
        signature: true,
        isDefault: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            emails: true
          }
        }
        // Note: password is excluded for security
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    res.json({
      success: true,
      configs
    })
  } catch (error) {
    console.error('Get SMTP configs error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * Get specific SMTP Configuration
 * GET /api/smtp/configs/:id
 */
router.get('/configs/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const config = await prisma.smtpConfig.findFirst({
      where: { 
        id,
        userId: req.user!.id
      },
      select: {
        id: true,
        name: true,
        host: true,
        port: true,
        secure: true,
        username: true,
        fromName: true,
        signature: true,
        isDefault: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!config) {
      res.status(404).json({ error: 'SMTP configuration not found' })
      return
    }

    res.json({
      success: true,
      config
    })
  } catch (error) {
    console.error('Get SMTP config error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * Create new SMTP Configuration
 * POST /api/smtp/configs
 */
router.post('/configs', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, host, port, secure, username, password, fromName, signature, isDefault } = req.body

    // Validation
    if (!name || !host || !port || !username || !password) {
      res.status(400).json({ error: 'Name, host, port, username, and password are required' })
      return
    }

    // Validate port
    const portNum = parseInt(port)
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      res.status(400).json({ error: 'Invalid port number' })
      return
    }

    // Encrypt password
    const encryptedPassword = encryptPassword(password)

    // If this is set as default, unset other defaults
    if (isDefault) {
      await prisma.smtpConfig.updateMany({
        where: { 
          userId: req.user!.id,
          isDefault: true
        },
        data: { isDefault: false }
      })
    }

    // Create new config
    const config = await prisma.smtpConfig.create({
      data: {
        userId: req.user!.id,
        name,
        host,
        port: portNum,
        secure: Boolean(secure),
        username,
        passwordEncrypted: encryptedPassword,
        fromName: fromName || req.user!.name,
        signature: signature || '',
        isDefault: Boolean(isDefault),
        isActive: true
      },
      select: {
        id: true,
        name: true,
        host: true,
        port: true,
        secure: true,
        username: true,
        fromName: true,
        signature: true,
        isDefault: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    })

    res.status(201).json({
      success: true,
      config
    })
  } catch (error) {
    console.error('Create SMTP config error:', error)
    res.status(500).json({ error: 'Failed to create SMTP configuration' })
  }
})

/**
 * Update SMTP Configuration
 * PUT /api/smtp/configs/:id
 */
router.put('/configs/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { name, host, port, secure, username, password, fromName, signature, isDefault } = req.body

    // Check if config exists and belongs to user
    const existingConfig = await prisma.smtpConfig.findFirst({
      where: { 
        id,
        userId: req.user!.id
      }
    })

    if (!existingConfig) {
      res.status(404).json({ error: 'SMTP configuration not found' })
      return
    }

    // Validate port if provided
    let portNum
    if (port) {
      portNum = parseInt(port)
      if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
        res.status(400).json({ error: 'Invalid port number' })
        return
      }
    }

    // If this is set as default, unset other defaults
    if (isDefault) {
      await prisma.smtpConfig.updateMany({
        where: { 
          userId: req.user!.id,
          isDefault: true,
          id: { not: id }
        },
        data: { isDefault: false }
      })
    }

    // Prepare update data
    const updateData: any = {}
    if (name) updateData.name = name
    if (host) updateData.host = host
    if (portNum) updateData.port = portNum
    if (secure !== undefined) updateData.secure = Boolean(secure)
    if (username) updateData.username = username
    if (password) updateData.passwordEncrypted = encryptPassword(password)
    if (fromName !== undefined) updateData.fromName = fromName
    if (signature !== undefined) updateData.signature = signature
    if (isDefault !== undefined) updateData.isDefault = Boolean(isDefault)

    // Update config
    const config = await prisma.smtpConfig.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        host: true,
        port: true,
        secure: true,
        username: true,
        fromName: true,
        signature: true,
        isDefault: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    })

    res.json({
      success: true,
      config
    })
  } catch (error) {
    console.error('Update SMTP config error:', error)
    res.status(500).json({ error: 'Failed to update SMTP configuration' })
  }
})

/**
 * Set default SMTP Configuration
 * POST /api/smtp/configs/:id/set-default
 */
router.post('/configs/:id/set-default', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    // Check if config exists and belongs to user
    const existingConfig = await prisma.smtpConfig.findFirst({
      where: { 
        id,
        userId: req.user!.id,
        isActive: true
      }
    })

    if (!existingConfig) {
      res.status(404).json({ error: 'SMTP configuration not found' })
      return
    }

    // Unset other defaults and set this one as default
    await prisma.$transaction([
      prisma.smtpConfig.updateMany({
        where: { 
          userId: req.user!.id,
          isDefault: true
        },
        data: { isDefault: false }
      }),
      prisma.smtpConfig.update({
        where: { id },
        data: { isDefault: true }
      })
    ])

    res.json({
      success: true,
      message: 'Default SMTP configuration updated'
    })
  } catch (error) {
    console.error('Set default SMTP config error:', error)
    res.status(500).json({ error: 'Failed to set default SMTP configuration' })
  }
})

/**
 * Test SMTP Configuration
 * POST /api/smtp/configs/:id/test
 */
router.post('/configs/:id/test', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    // Get config with password
    const config = await prisma.smtpConfig.findFirst({
      where: { 
        id,
        userId: req.user!.id,
        isActive: true
      }
    })

    if (!config) {
      res.status(404).json({ error: 'SMTP configuration not found' })
      return
    }

    // Decrypt password and test connection
    const decryptedPassword = decryptPassword(config.passwordEncrypted)
    
    const testResult = await testSmtpConnection({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.username,
        pass: decryptedPassword
      }
    })

    if (testResult.success) {
      res.json({
        success: true,
        message: 'SMTP connection successful'
      })
    } else {
      res.status(400).json({
        success: false,
        error: testResult.error
      })
    }
  } catch (error) {
    console.error('Test SMTP config error:', error)
    res.status(500).json({ error: 'Failed to test SMTP configuration' })
  }
})

/**
 * Delete SMTP Configuration
 * DELETE /api/smtp/configs/:id
 */
router.delete('/configs/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    // Check if config exists and belongs to user
    const existingConfig = await prisma.smtpConfig.findFirst({
      where: { 
        id,
        userId: req.user!.id
      }
    })

    if (!existingConfig) {
      res.status(404).json({ error: 'SMTP configuration not found' })
      return
    }

    // Check if this is the only config
    const configCount = await prisma.smtpConfig.count({
      where: { 
        userId: req.user!.id,
        isActive: true
      }
    })

    if (configCount === 1) {
      res.status(400).json({ error: 'Cannot delete the only SMTP configuration' })
      return
    }

    // If this was the default, set another one as default
    if (existingConfig.isDefault) {
      const nextConfig = await prisma.smtpConfig.findFirst({
        where: { 
          userId: req.user!.id,
          isActive: true,
          id: { not: id }
        },
        orderBy: { createdAt: 'asc' }
      })

      if (nextConfig) {
        await prisma.smtpConfig.update({
          where: { id: nextConfig.id },
          data: { isDefault: true }
        })
      }
    }

    // Soft delete by setting isActive to false
    await prisma.smtpConfig.update({
      where: { id },
      data: { isActive: false }
    })

    res.json({
      success: true,
      message: 'SMTP configuration deleted successfully'
    })
  } catch (error) {
    console.error('Delete SMTP config error:', error)
    res.status(500).json({ error: 'Failed to delete SMTP configuration' })
  }
})

/**
 * Get SMTP Providers (predefined configurations)
 * GET /api/smtp/providers
 */
router.get('/providers', (req, res: Response): void => {
  const providers = [
    {
      name: 'Gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      description: 'Google Gmail SMTP'
    },
    {
      name: 'Outlook',
      host: 'smtp-mail.outlook.com',
      port: 587,
      secure: false,
      description: 'Microsoft Outlook SMTP'
    },
    {
      name: 'Yahoo',
      host: 'smtp.mail.yahoo.com',
      port: 587,
      secure: false,
      description: 'Yahoo Mail SMTP'
    },
    {
      name: 'SendGrid',
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      description: 'SendGrid SMTP Service'
    },
    {
      name: 'Mailgun',
      host: 'smtp.mailgun.org',
      port: 587,
      secure: false,
      description: 'Mailgun SMTP Service'
    }
  ]

  res.json({
    success: true,
    providers
  })
})

// Legacy endpoints for backward compatibility
/**
 * Get SMTP Configuration (Legacy)
 * GET /api/smtp/config
 */
router.get('/config', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const config = await prisma.smtpConfig.findFirst({
      where: { 
        userId: req.user!.id,
        isDefault: true,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        host: true,
        port: true,
        secure: true,
        username: true,
        fromName: true,
        signature: true,
        isDefault: true,
        createdAt: true,
        updatedAt: true
      }
    })

    res.json({
      success: true,
      config
    })
  } catch (error) {
    console.error('Get SMTP config error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router