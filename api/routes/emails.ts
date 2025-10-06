/**
 * Email Portal Email Management Routes
 * Handle email operations: send, receive, list, delete, etc.
 */
import { Router, type Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { authenticateToken, AuthenticatedRequest } from '../lib/auth.js'
import { sendEmail } from '../lib/smtp.js'
import multer from 'multer'
import path from 'path'
import fs from 'fs'

const router = Router()

// Configure multer for file uploads
const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') // 10MB default
  }
})

/**
 * Get Emails
 * GET /api/emails
 */
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { folder = 'INBOX', page = '1', limit = '20', search = '' } = req.query

    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    const offset = (pageNum - 1) * limitNum

    // Build where clause
    const where: any = {
      userId: req.user!.id,
      folder: folder as string
    }

    // Add search functionality
    if (search) {
      where.OR = [
        { subject: { contains: search as string } },
        { fromAddress: { contains: search as string } },
        { bodyText: { contains: search as string } }
      ]
    }

    // Get emails with pagination
    const [emails, totalCount] = await Promise.all([
      prisma.email.findMany({
        where,
        include: {
          attachments: {
            select: {
              id: true,
              filename: true,
              contentType: true,
              fileSize: true
            }
          }
        },
        orderBy: { sentAt: 'desc' },
        skip: offset,
        take: limitNum
      }),
      prisma.email.count({ where })
    ])

    res.json({
      success: true,
      emails,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        pages: Math.ceil(totalCount / limitNum)
      }
    })
  } catch (error) {
    console.error('Get emails error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * Get Single Email
 * GET /api/emails/:id
 */
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const email = await prisma.email.findFirst({
      where: {
        id,
        userId: req.user!.id
      },
      include: {
        attachments: true
      }
    })

    if (!email) {
      res.status(404).json({ error: 'Email not found' })
      return
    }

    // Mark as read if not already
    if (!email.isRead) {
      await prisma.email.update({
        where: { id },
        data: { isRead: true }
      })
    }

    res.json({
      success: true,
      email
    })
  } catch (error) {
    console.error('Get email error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * Send Email
 * POST /api/emails/send
 */
router.post('/send', authenticateToken, upload.array('attachments'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { to, cc, bcc, subject, bodyHtml, bodyText } = req.body
    const files = req.files as Express.Multer.File[]

    // Validation
    if (!to || !subject) {
      res.status(400).json({ error: 'To address and subject are required' })
      return
    }

    // Parse recipients
    const toAddresses = Array.isArray(to) ? to : [to]
    const ccAddresses = cc ? (Array.isArray(cc) ? cc : [cc]) : []
    const bccAddresses = bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : []

    // Create email record
    const email = await prisma.email.create({
      data: {
        userId: req.user!.id,
        fromAddress: req.user!.email,
        toAddresses: toAddresses.join(','),
        ccAddresses: ccAddresses.length > 0 ? ccAddresses.join(',') : null,
        bccAddresses: bccAddresses.length > 0 ? bccAddresses.join(',') : null,
        subject,
        bodyHtml: bodyHtml || null,
        bodyText: bodyText || null,
        folder: 'SENT',
        isRead: true,
        sentAt: new Date()
      }
    })

    // Handle attachments
    const attachmentPaths: Array<{
      filename: string
      path: string
      contentType?: string
    }> = []

    if (files && files.length > 0) {
      const uploadDir = process.env.UPLOAD_DIR || './uploads'
      
      // Ensure upload directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true })
      }

      for (const file of files) {
        const filename = `${Date.now()}-${file.originalname}`
        const filePath = path.join(uploadDir, filename)
        
        // Save file
        fs.writeFileSync(filePath, file.buffer)

        // Create attachment record
        await prisma.attachment.create({
          data: {
            emailId: email.id,
            filename: file.originalname,
            contentType: file.mimetype,
            fileSize: file.size,
            filePath
          }
        })

        // Add to attachments for SMTP
        attachmentPaths.push({
          filename: file.originalname,
          path: filePath,
          contentType: file.mimetype
        })
      }
    }

    // Send actual email via SMTP
    const smtpResult = await sendEmail(req.user!.id, {
      to: toAddresses,
      cc: ccAddresses.length > 0 ? ccAddresses : undefined,
      bcc: bccAddresses.length > 0 ? bccAddresses : undefined,
      subject,
      html: bodyHtml,
      text: bodyText,
      attachments: attachmentPaths.length > 0 ? attachmentPaths : undefined
    })

    if (!smtpResult.success) {
      // If SMTP fails, update email status but don't fail the request
      await prisma.email.update({
        where: { id: email.id },
        data: { 
          folder: 'DRAFTS',
          bodyText: `[SMTP Error: ${smtpResult.error}]\n\n${bodyText || ''}`
        }
      })
      
      res.status(500).json({
        error: 'Failed to send email via SMTP',
        details: smtpResult.error,
        emailId: email.id
      })
      return
    }
    
    res.status(201).json({
      success: true,
      message: 'Email sent successfully',
      emailId: email.id
    })
  } catch (error) {
    console.error('Send email error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * Update Email (mark as read/unread, star, move to folder)
 * PUT /api/emails/:id
 */
router.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { isRead, isStarred, folder } = req.body

    // Check if email belongs to user
    const existingEmail = await prisma.email.findFirst({
      where: {
        id,
        userId: req.user!.id
      }
    })

    if (!existingEmail) {
      res.status(404).json({ error: 'Email not found' })
      return
    }

    // Build update data
    const updateData: any = {}
    if (typeof isRead === 'boolean') updateData.isRead = isRead
    if (typeof isStarred === 'boolean') updateData.isStarred = isStarred
    if (folder) updateData.folder = folder

    const updatedEmail = await prisma.email.update({
      where: { id },
      data: updateData,
      include: {
        attachments: {
          select: {
            id: true,
            filename: true,
            contentType: true,
            fileSize: true
          }
        }
      }
    })

    res.json({
      success: true,
      message: 'Email updated successfully',
      email: updatedEmail
    })
  } catch (error) {
    console.error('Update email error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * Delete Email
 * DELETE /api/emails/:id
 */
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    // Check if email belongs to user
    const email = await prisma.email.findFirst({
      where: {
        id,
        userId: req.user!.id
      },
      include: {
        attachments: true
      }
    })

    if (!email) {
      res.status(404).json({ error: 'Email not found' })
      return
    }

    // Delete attachment files
    for (const attachment of email.attachments) {
      if (fs.existsSync(attachment.filePath)) {
        fs.unlinkSync(attachment.filePath)
      }
    }

    // Delete email (attachments will be deleted by cascade)
    await prisma.email.delete({
      where: { id }
    })

    res.json({
      success: true,
      message: 'Email deleted successfully'
    })
  } catch (error) {
    console.error('Delete email error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * Bulk Operations
 * POST /api/emails/bulk
 */
router.post('/bulk', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { emailIds, action, folder } = req.body

    if (!emailIds || !Array.isArray(emailIds) || !action) {
      res.status(400).json({ error: 'Email IDs and action are required' })
      return
    }

    // Verify all emails belong to user
    const emails = await prisma.email.findMany({
      where: {
        id: { in: emailIds },
        userId: req.user!.id
      }
    })

    if (emails.length !== emailIds.length) {
      res.status(400).json({ error: 'Some emails not found or access denied' })
      return
    }

    let updateData: any = {}
    
    switch (action) {
      case 'markRead':
        updateData.isRead = true
        break
      case 'markUnread':
        updateData.isRead = false
        break
      case 'star':
        updateData.isStarred = true
        break
      case 'unstar':
        updateData.isStarred = false
        break
      case 'move':
        if (!folder) {
          res.status(400).json({ error: 'Folder is required for move action' })
          return
        }
        updateData.folder = folder
        break
      case 'delete':
        // Delete emails and their attachments
        for (const email of emails) {
          const emailWithAttachments = await prisma.email.findUnique({
            where: { id: email.id },
            include: { attachments: true }
          })
          
          if (emailWithAttachments) {
            // Delete attachment files
            for (const attachment of emailWithAttachments.attachments) {
              if (fs.existsSync(attachment.filePath)) {
                fs.unlinkSync(attachment.filePath)
              }
            }
          }
        }
        
        await prisma.email.deleteMany({
          where: {
            id: { in: emailIds },
            userId: req.user!.id
          }
        })

        res.json({
          success: true,
          message: `${emailIds.length} emails deleted successfully`
        })
        return
      default:
        res.status(400).json({ error: 'Invalid action' })
        return
    }

    // Update emails
    await prisma.email.updateMany({
      where: {
        id: { in: emailIds },
        userId: req.user!.id
      },
      data: updateData
    })

    res.json({
      success: true,
      message: `${emailIds.length} emails updated successfully`
    })
  } catch (error) {
    console.error('Bulk operation error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * Download Attachment
 * GET /api/emails/:emailId/attachments/:attachmentId
 */
router.get('/:emailId/attachments/:attachmentId', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { emailId, attachmentId } = req.params

    // Verify email belongs to user and get attachment
    const attachment = await prisma.attachment.findFirst({
      where: {
        id: attachmentId,
        email: {
          id: emailId,
          userId: req.user!.id
        }
      }
    })

    if (!attachment) {
      res.status(404).json({ error: 'Attachment not found' })
      return
    }

    // Check if file exists
    if (!fs.existsSync(attachment.filePath)) {
      res.status(404).json({ error: 'File not found on server' })
      return
    }

    // Set headers and send file
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.filename}"`)
    res.setHeader('Content-Type', attachment.contentType || 'application/octet-stream')
    
    const fileStream = fs.createReadStream(attachment.filePath)
    fileStream.pipe(res)
  } catch (error) {
    console.error('Download attachment error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router