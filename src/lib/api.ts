/**
 * Email Portal API Utilities
 * Centralized API functions for the frontend
 */
import { useAuthStore } from './auth'

const API_BASE = '/api'

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = useAuthStore.getState().token
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  }
}

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    if (response.status === 401) {
      useAuthStore.getState().logout()
    }
    const error = await response.json().catch(() => ({ error: 'Network error' }))
    throw new Error(error.error || 'API error')
  }
  return response.json()
}

// Email API functions
export const emailApi = {
  // Get emails with pagination and filtering
  getEmails: async (params: {
    folder?: string
    page?: number
    limit?: number
    search?: string
  } = {}) => {
    const searchParams = new URLSearchParams()
    if (params.folder) searchParams.set('folder', params.folder)
    if (params.page) searchParams.set('page', params.page.toString())
    if (params.limit) searchParams.set('limit', params.limit.toString())
    if (params.search) searchParams.set('search', params.search)

    const response = await fetch(`${API_BASE}/emails?${searchParams}`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  // Get single email
  getEmail: async (id: string) => {
    const response = await fetch(`${API_BASE}/emails/${id}`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  // Send email
  sendEmail: async (emailData: {
    to: string[]
    cc?: string[]
    bcc?: string[]
    subject: string
    bodyHtml?: string
    bodyText?: string
    attachments?: File[]
  }) => {
    const formData = new FormData()
    
    // Add email data
    emailData.to.forEach(email => formData.append('to', email))
    if (emailData.cc) emailData.cc.forEach(email => formData.append('cc', email))
    if (emailData.bcc) emailData.bcc.forEach(email => formData.append('bcc', email))
    formData.append('subject', emailData.subject)
    if (emailData.bodyHtml) formData.append('bodyHtml', emailData.bodyHtml)
    if (emailData.bodyText) formData.append('bodyText', emailData.bodyText)
    
    // Add attachments
    if (emailData.attachments) {
      emailData.attachments.forEach(file => {
        formData.append('attachments', file)
      })
    }

    const token = useAuthStore.getState().token
    const response = await fetch(`${API_BASE}/emails/send`, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: formData,
    })
    return handleResponse(response)
  },

  // Update email (mark read/unread, star, move)
  updateEmail: async (id: string, updates: {
    isRead?: boolean
    isStarred?: boolean
    folder?: string
  }) => {
    const response = await fetch(`${API_BASE}/emails/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    })
    return handleResponse(response)
  },

  // Delete email
  deleteEmail: async (id: string) => {
    const response = await fetch(`${API_BASE}/emails/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  // Bulk operations
  bulkOperation: async (emailIds: string[], action: string, folder?: string) => {
    const response = await fetch(`${API_BASE}/emails/bulk`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ emailIds, action, folder }),
    })
    return handleResponse(response)
  },

  // Download attachment
  downloadAttachment: async (emailId: string, attachmentId: string) => {
    const token = useAuthStore.getState().token
    const response = await fetch(`${API_BASE}/emails/${emailId}/attachments/${attachmentId}`, {
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    })
    
    if (!response.ok) {
      throw new Error('Failed to download attachment')
    }
    
    return response.blob()
  },
}

// SMTP API functions
export const smtpApi = {
  // Get SMTP configuration
  getConfig: async () => {
    const response = await fetch(`${API_BASE}/smtp/config`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  // Save SMTP configuration
  saveConfig: async (config: {
    host: string
    port: number
    secure: boolean
    username: string
    password: string
    fromName?: string
  }) => {
    const response = await fetch(`${API_BASE}/smtp/config`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(config),
    })
    return handleResponse(response)
  },

  // Test SMTP configuration
  testConfig: async (config: {
    host: string
    port: number
    secure: boolean
    username: string
    password: string
  }) => {
    const response = await fetch(`${API_BASE}/smtp/test`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(config),
    })
    return handleResponse(response)
  },

  // Delete SMTP configuration
  deleteConfig: async () => {
    const response = await fetch(`${API_BASE}/smtp/config`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  // Get SMTP providers
  getProviders: async () => {
    const response = await fetch(`${API_BASE}/smtp/providers`)
    return handleResponse(response)
  },
}

// Contacts API functions
export const contactsApi = {
  // Get contacts
  getContacts: async (params: {
    search?: string
    page?: number
    limit?: number
  } = {}) => {
    const searchParams = new URLSearchParams()
    if (params.search) searchParams.set('search', params.search)
    if (params.page) searchParams.set('page', params.page.toString())
    if (params.limit) searchParams.set('limit', params.limit.toString())

    const response = await fetch(`${API_BASE}/contacts?${searchParams}`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  // Get single contact
  getContact: async (id: string) => {
    const response = await fetch(`${API_BASE}/contacts/${id}`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  // Create contact
  createContact: async (contact: {
    name: string
    email: string
    phone?: string
    company?: string
    notes?: string
  }) => {
    const response = await fetch(`${API_BASE}/contacts`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(contact),
    })
    return handleResponse(response)
  },

  // Update contact
  updateContact: async (id: string, contact: {
    name: string
    email: string
    phone?: string
    company?: string
    notes?: string
  }) => {
    const response = await fetch(`${API_BASE}/contacts/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(contact),
    })
    return handleResponse(response)
  },

  // Delete contact
  deleteContact: async (id: string) => {
    const response = await fetch(`${API_BASE}/contacts/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  // Bulk delete contacts
  bulkDelete: async (contactIds: string[]) => {
    const response = await fetch(`${API_BASE}/contacts/bulk-delete`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ contactIds }),
    })
    return handleResponse(response)
  },

  // Import contacts
  importContacts: async (contacts: Array<{
    name: string
    email: string
    phone?: string
    company?: string
    notes?: string
  }>) => {
    const response = await fetch(`${API_BASE}/contacts/import`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ contacts }),
    })
    return handleResponse(response)
  },

  // Export contacts
  exportContacts: async () => {
    const response = await fetch(`${API_BASE}/contacts/export`, {
      headers: getAuthHeaders(),
    })
    
    if (!response.ok) {
      throw new Error('Failed to export contacts')
    }
    
    const blob = await response.blob()
    return blob
  },
}

// General API utility for custom requests
export const api = {
  get: async (url: string) => {
    const response = await fetch(`${API_BASE}${url}`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  post: async (url: string, data: any) => {
    const response = await fetch(`${API_BASE}${url}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })
    return handleResponse(response)
  },

  put: async (url: string, data: any) => {
    const response = await fetch(`${API_BASE}${url}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })
    return handleResponse(response)
  },

  delete: async (url: string) => {
    const response = await fetch(`${API_BASE}${url}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },
}