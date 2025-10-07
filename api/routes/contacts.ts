/**
 * Email Portal Contacts Management Routes
 * Handle contact operations: create, read, update, delete
 */
import { Router, type Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { authenticateToken, AuthenticatedRequest } from '../lib/auth.js'

const router = Router()

/**
 * Get Contacts
 * GET /api/contacts
 */
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { search = '', page = '1', limit = '50' } = req.query

    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    const offset = (pageNum - 1) * limitNum

    // Build where clause
    const where: any = {
      userId: req.user!.id
    }

    // Add search functionality
    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { email: { contains: search as string } },
        { company: { contains: search as string } }
      ]
    }

    // Get contacts with pagination
    const [contacts, totalCount] = await Promise.all([
      prisma.contact.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: offset,
        take: limitNum
      }),
      prisma.contact.count({ where })
    ])

    res.json({
      success: true,
      contacts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        pages: Math.ceil(totalCount / limitNum)
      }
    })
  } catch (error) {
    console.error('Get contacts error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * Get Single Contact
 * GET /api/contacts/:id
 */
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const contact = await prisma.contact.findFirst({
      where: {
        id,
        userId: req.user!.id
      }
    })

    if (!contact) {
      res.status(404).json({ error: 'Contact not found' })
      return
    }

    res.json({
      success: true,
      contact
    })
  } catch (error) {
    console.error('Get contact error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * Create Contact
 * POST /api/contacts
 */
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, email, phone, notes } = req.body

    // Validation
    if (!name || !email) {
      res.status(400).json({ error: 'Name and email are required' })
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      res.status(400).json({ error: 'Invalid email format' })
      return
    }

    // Check if contact with same email already exists for this user
    const existingContact = await prisma.contact.findFirst({
      where: {
        userId: req.user!.id,
        email
      }
    })

    if (existingContact) {
      res.status(400).json({ error: 'Contact with this email already exists' })
      return
    }

    const contact = await prisma.contact.create({
      data: {
        userId: req.user!.id,
        name,
        email,
        phone: phone || null,
        notes: notes || null
      }
    })

    res.status(201).json({
      success: true,
      message: 'Contact created successfully',
      contact
    })
  } catch (error) {
    console.error('Create contact error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * Update Contact
 * PUT /api/contacts/:id
 */
router.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { name, email, phone, company, notes } = req.body

    // Check if contact exists and belongs to user
    const existingContact = await prisma.contact.findFirst({
      where: {
        id,
        userId: req.user!.id
      }
    })

    if (!existingContact) {
      res.status(404).json({ error: 'Contact not found' })
      return
    }

    // Validation
    if (!name || !email) {
      res.status(400).json({ error: 'Name and email are required' })
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      res.status(400).json({ error: 'Invalid email format' })
      return
    }

    // Check if another contact with same email exists for this user
    if (email !== existingContact.email) {
      const duplicateContact = await prisma.contact.findFirst({
        where: {
          userId: req.user!.id,
          email,
          id: { not: id }
        }
      })

      if (duplicateContact) {
        res.status(400).json({ error: 'Another contact with this email already exists' })
        return
      }
    }

    const updatedContact = await prisma.contact.update({
      where: { id },
      data: {
        name,
        email,
        phone: phone || null,
        company: company || null,
        notes: notes || null
      }
    })

    res.json({
      success: true,
      message: 'Contact updated successfully',
      contact: updatedContact
    })
  } catch (error) {
    console.error('Update contact error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * Delete Contact
 * DELETE /api/contacts/:id
 */
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    // Check if contact exists and belongs to user
    const contact = await prisma.contact.findFirst({
      where: {
        id,
        userId: req.user!.id
      }
    })

    if (!contact) {
      res.status(404).json({ error: 'Contact not found' })
      return
    }

    await prisma.contact.delete({
      where: { id }
    })

    res.json({
      success: true,
      message: 'Contact deleted successfully'
    })
  } catch (error) {
    console.error('Delete contact error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * Bulk Delete Contacts
 * POST /api/contacts/bulk-delete
 */
router.post('/bulk-delete', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { contactIds } = req.body

    if (!contactIds || !Array.isArray(contactIds)) {
      res.status(400).json({ error: 'Contact IDs array is required' })
      return
    }

    // Verify all contacts belong to user
    const contacts = await prisma.contact.findMany({
      where: {
        id: { in: contactIds },
        userId: req.user!.id
      }
    })

    if (contacts.length !== contactIds.length) {
      res.status(400).json({ error: 'Some contacts not found or access denied' })
      return
    }

    // Delete contacts
    await prisma.contact.deleteMany({
      where: {
        id: { in: contactIds },
        userId: req.user!.id
      }
    })

    res.json({
      success: true,
      message: `${contactIds.length} contacts deleted successfully`
    })
  } catch (error) {
    console.error('Bulk delete contacts error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * Import Contacts from CSV
 * POST /api/contacts/import
 */
router.post('/import', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { contacts } = req.body

    if (!contacts || !Array.isArray(contacts)) {
      res.status(400).json({ error: 'Contacts array is required' })
      return
    }

    const results = {
      imported: 0,
      skipped: 0,
      errors: [] as string[]
    }

    for (const contactData of contacts) {
      try {
        const { name, email, phone, company, notes } = contactData

        // Validation
        if (!name || !email) {
          results.errors.push(`Skipped contact: Name and email are required`)
          results.skipped++
          continue
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
          results.errors.push(`Skipped contact ${name}: Invalid email format`)
          results.skipped++
          continue
        }

        // Check if contact already exists
        const existingContact = await prisma.contact.findFirst({
          where: {
            userId: req.user!.id,
            email
          }
        })

        if (existingContact) {
          results.errors.push(`Skipped contact ${name}: Email already exists`)
          results.skipped++
          continue
        }

        // Create contact
        await prisma.contact.create({
          data: {
            userId: req.user!.id,
            name,
            email,
            phone: phone || null,
            company: company || null,
            notes: notes || null
          }
        })

        results.imported++
      } catch (error) {
        results.errors.push(`Error importing contact: ${error instanceof Error ? error.message : 'Unknown error'}`)
        results.skipped++
      }
    }

    res.json({
      success: true,
      message: 'Import completed',
      results
    })
  } catch (error) {
    console.error('Import contacts error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * Export Contacts to CSV format
 * GET /api/contacts/export
 */
router.get('/export', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const contacts = await prisma.contact.findMany({
      where: { userId: req.user!.id },
      orderBy: { name: 'asc' }
    })

    // Convert to CSV format
    const csvHeader = 'Name,Email,Phone,Company,Notes\n'
    const csvRows = contacts.map(contact => {
      const escapeCsv = (value: string | null) => {
        if (!value) return ''
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }

      return [
        escapeCsv(contact.name),
        escapeCsv(contact.email),
        escapeCsv(contact.phone),
        escapeCsv(contact.company),
        escapeCsv(contact.notes)
      ].join(',')
    }).join('\n')

    const csvContent = csvHeader + csvRows

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename="contacts.csv"')
    res.send(csvContent)
  } catch (error) {
    console.error('Export contacts error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router