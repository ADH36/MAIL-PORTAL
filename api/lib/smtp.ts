/**
 * Email Portal SMTP Service
 * Handle SMTP configuration and email sending
 */
import nodemailer from 'nodemailer'
import { prisma } from './prisma.js'
import crypto from 'crypto'

// Encryption key for SMTP passwords
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production'

/**
 * Encrypt password for storage
 */
export function encryptPassword(password: string): string {
  const algorithm = 'aes-256-cbc'
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
  const iv = crypto.randomBytes(16)
  
  const cipher = crypto.createCipheriv(algorithm, key, iv)
  let encrypted = cipher.update(password, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  return iv.toString('hex') + ':' + encrypted
}

/**
 * Decrypt password for use
 */
export function decryptPassword(encryptedPassword: string): string {
  const algorithm = 'aes-256-cbc'
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
  
  const parts = encryptedPassword.split(':')
  if (parts.length !== 2) {
    // Handle old format without IV (fallback)
    const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY)
    let decrypted = decipher.update(encryptedPassword, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  }
  
  const iv = Buffer.from(parts[0], 'hex')
  const encrypted = parts[1]
  
  const decipher = crypto.createDecipheriv(algorithm, key, iv)
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

/**
 * Get SMTP configuration for user
 */
export async function getSmtpConfig(userId: string) {
  const config = await prisma.smtpConfig.findFirst({
    where: { 
      userId,
      isActive: true,
      isDefault: true
    }
  })
  
  // If no default config, get the first active one
  if (!config) {
    const firstConfig = await prisma.smtpConfig.findFirst({
      where: { 
        userId,
        isActive: true
      }
    })
    if (firstConfig) return firstConfig
  }

  if (!config) {
    // Return default SMTP config from environment
    return {
      host: process.env.DEFAULT_SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.DEFAULT_SMTP_PORT || '587'),
      secure: process.env.DEFAULT_SMTP_SECURE === 'true',
      auth: {
        user: process.env.DEFAULT_SMTP_USER || '',
        pass: process.env.DEFAULT_SMTP_PASS || ''
      }
    }
  }

  return {
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.username,
      pass: decryptPassword(config.password)
    }
  }
}

/**
 * Create SMTP transporter
 */
export async function createTransporter(userId: string) {
  const config = await getSmtpConfig(userId)
  
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth
  })
}

/**
 * Send email via SMTP
 */
export async function sendEmail(userId: string, emailData: {
  to: string[]
  cc?: string[]
  bcc?: string[]
  subject: string
  html?: string
  text?: string
  attachments?: Array<{
    filename: string
    path: string
    contentType?: string
  }>
}) {
  try {
    const transporter = await createTransporter(userId)
    
    // Get user info for from address
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      throw new Error('User not found')
    }

    const mailOptions = {
      from: `"${user.name}" <${user.email}>`,
      to: emailData.to.join(', '),
      cc: emailData.cc?.join(', '),
      bcc: emailData.bcc?.join(', '),
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
      attachments: emailData.attachments
    }

    const result = await transporter.sendMail(mailOptions)
    
    return {
      success: true,
      messageId: result.messageId,
      response: result.response
    }
  } catch (error) {
    console.error('SMTP send error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Test SMTP connection
 */
export async function testSmtpConnection(smtpConfig: {
  host: string
  port: number
  secure: boolean
  username: string
  password: string
}) {
  try {
    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: {
        user: smtpConfig.username,
        pass: smtpConfig.password
      }
    })

    await transporter.verify()
    
    return {
      success: true,
      message: 'SMTP connection successful'
    }
  } catch (error) {
    console.error('SMTP test error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Connection failed'
    }
  }
}