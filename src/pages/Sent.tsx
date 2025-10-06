import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Search, 
  Filter, 
  Star, 
  Archive, 
  Trash2, 
  Mail, 
  MailOpen, 
  Paperclip,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Send
} from 'lucide-react'
import { toast } from 'sonner'
import Layout from '../components/Layout'
import { emailApi } from '../lib/api'

interface Email {
  id: string
  subject: string
  recipient: string
  recipientEmail: string
  content: string
  isRead: boolean
  isStarred: boolean
  hasAttachments: boolean
  sentAt: string
  folder: string
}

export default function Sent() {
  const [emails, setEmails] = useState<Email[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEmails, setSelectedEmails] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchEmails = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        folder: 'SENT'
      })
      
      if (searchTerm) params.append('search', searchTerm)

      const response = await emailApi.getEmails(params.toString())
      setEmails(response.emails)
      setTotalPages(response.totalPages)
    } catch (error) {
      toast.error('Failed to fetch sent emails')
      console.error('Error fetching emails:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEmails()
  }, [currentPage, searchTerm])

  const handleSelectEmail = (emailId: string) => {
    setSelectedEmails(prev => 
      prev.includes(emailId) 
        ? prev.filter(id => id !== emailId)
        : [...prev, emailId]
    )
  }

  const handleSelectAll = () => {
    if (selectedEmails.length === emails.length) {
      setSelectedEmails([])
    } else {
      setSelectedEmails(emails.map(email => email.id))
    }
  }

  const handleStarEmail = async (emailId: string, isStarred: boolean) => {
    try {
      await emailApi.updateEmail(emailId, { isStarred })
      setEmails(prev => prev.map(email => 
        email.id === emailId ? { ...email, isStarred } : email
      ))
      toast.success(`Email ${isStarred ? 'starred' : 'unstarred'}`)
    } catch (error) {
      toast.error('Failed to update email')
    }
  }

  const handleArchiveEmails = async (emailIds: string[]) => {
    try {
      await emailApi.bulkUpdate(emailIds, { folder: 'ARCHIVE' })
      setEmails(prev => prev.filter(email => !emailIds.includes(email.id)))
      setSelectedEmails([])
      toast.success(`${emailIds.length} email${emailIds.length > 1 ? 's' : ''} archived`)
    } catch (error) {
      toast.error('Failed to archive emails')
    }
  }

  const handleDeleteEmails = async (emailIds: string[]) => {
    try {
      await emailApi.bulkUpdate(emailIds, { folder: 'TRASH' })
      setEmails(prev => prev.filter(email => !emailIds.includes(email.id)))
      setSelectedEmails([])
      toast.success(`${emailIds.length} email${emailIds.length > 1 ? 's' : ''} moved to trash`)
    } catch (error) {
      toast.error('Failed to delete emails')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  return (
    <Layout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Sent</h1>
            <div className="flex items-center space-x-2">
              <button
                onClick={fetchEmails}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
                title="Refresh"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
              <Link
                to="/compose"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Compose
              </Link>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search sent emails..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Bulk Actions */}
          {selectedEmails.length > 0 && (
            <div className="mt-4 flex items-center justify-between p-3 bg-indigo-50 rounded-md">
              <span className="text-sm text-indigo-700">
                {selectedEmails.length} email{selectedEmails.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleArchiveEmails(selectedEmails)}
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  Archive
                </button>
                <button
                  onClick={() => handleDeleteEmails(selectedEmails)}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Email List */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : emails.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Send className="h-12 w-12 mb-4" />
              <p className="text-lg font-medium">No sent emails</p>
              <p className="text-sm">Emails you send will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {/* Select All Header */}
              <div className="flex items-center px-4 py-2 bg-gray-50 border-b">
                <input
                  type="checkbox"
                  checked={selectedEmails.length === emails.length && emails.length > 0}
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="ml-3 text-sm text-gray-600">
                  Select all ({emails.length})
                </span>
              </div>

              {/* Email Items */}
              {emails.map((email) => (
                <div
                  key={email.id}
                  className="flex items-center px-4 py-3 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedEmails.includes(email.id)}
                    onChange={() => handleSelectEmail(email.id)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  
                  <button
                    onClick={() => handleStarEmail(email.id, !email.isStarred)}
                    className="ml-3 p-1 text-gray-400 hover:text-yellow-500"
                  >
                    <Star className={`h-4 w-4 ${email.isStarred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                  </button>

                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <span className="text-sm text-gray-600">
                          To: {email.recipient}
                        </span>
                        <Link
                          to={`/email/${email.id}`}
                          className="text-sm truncate flex-1 text-gray-900 font-medium"
                        >
                          {email.subject}
                        </Link>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        {email.hasAttachments && (
                          <Paperclip className="h-4 w-4 text-gray-400" />
                        )}
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {formatDate(email.sentAt)}
                        </span>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleArchiveEmails([email.id])}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Archive"
                          >
                            <Archive className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteEmails([email.id])}
                            className="p-1 text-gray-400 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-gray-200 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}