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
  MoreVertical
} from 'lucide-react'
import { toast } from 'sonner'
import Layout from '../components/Layout'
import { emailApi } from '../lib/api'

interface Email {
  id: string
  subject: string
  sender: string
  senderEmail: string
  content: string
  isRead: boolean
  isStarred: boolean
  hasAttachments: boolean
  receivedAt: string
  folder: string
}

export default function Inbox() {
  const [emails, setEmails] = useState<Email[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEmails, setSelectedEmails] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    isRead: '',
    isStarred: '',
    hasAttachments: ''
  })

  const fetchEmails = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        folder: 'INBOX'
      })
      
      if (searchTerm) params.append('search', searchTerm)
      if (filters.isRead) params.append('isRead', filters.isRead)
      if (filters.isStarred) params.append('isStarred', filters.isStarred)
      if (filters.hasAttachments) params.append('hasAttachments', filters.hasAttachments)

      const response = await emailApi.getEmails(params.toString())
      setEmails(response.emails)
      setTotalPages(response.totalPages)
    } catch (error) {
      toast.error('Failed to fetch emails')
      console.error('Error fetching emails:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEmails()
  }, [currentPage, searchTerm, filters])

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

  const handleMarkAsRead = async (emailIds: string[], isRead: boolean) => {
    try {
      await emailApi.updateEmail(emailIds[0], { isRead })
      setEmails(prev => prev.map(email => 
        emailIds.includes(email.id) ? { ...email, isRead } : email
      ))
      toast.success(`Email${emailIds.length > 1 ? 's' : ''} marked as ${isRead ? 'read' : 'unread'}`)
    } catch (error) {
      toast.error('Failed to update email')
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
            <h1 className="text-2xl font-bold text-gray-900">Inbox</h1>
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

          {/* Search and Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search emails..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-md ${showFilters ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
            >
              <Filter className="h-5 w-5" />
            </button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filters.isRead}
                    onChange={(e) => setFilters(prev => ({ ...prev, isRead: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="">All</option>
                    <option value="false">Unread</option>
                    <option value="true">Read</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Starred</label>
                  <select
                    value={filters.isStarred}
                    onChange={(e) => setFilters(prev => ({ ...prev, isStarred: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="">All</option>
                    <option value="true">Starred</option>
                    <option value="false">Not starred</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Attachments</label>
                  <select
                    value={filters.hasAttachments}
                    onChange={(e) => setFilters(prev => ({ ...prev, hasAttachments: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="">All</option>
                    <option value="true">With attachments</option>
                    <option value="false">No attachments</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Bulk Actions */}
          {selectedEmails.length > 0 && (
            <div className="mt-4 flex items-center justify-between p-3 bg-indigo-50 rounded-md">
              <span className="text-sm text-indigo-700">
                {selectedEmails.length} email{selectedEmails.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleMarkAsRead(selectedEmails, true)}
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  Mark as read
                </button>
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
              <Mail className="h-12 w-12 mb-4" />
              <p className="text-lg font-medium">No emails found</p>
              <p className="text-sm">Your inbox is empty or no emails match your search criteria.</p>
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
                  className={`flex items-center px-4 py-3 hover:bg-gray-50 ${
                    !email.isRead ? 'bg-blue-50' : ''
                  }`}
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
                        <span className={`text-sm ${!email.isRead ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                          {email.sender}
                        </span>
                        <Link
                          to={`/email/${email.id}`}
                          className={`text-sm truncate flex-1 ${!email.isRead ? 'font-medium text-gray-900' : 'text-gray-600'}`}
                        >
                          {email.subject}
                        </Link>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        {email.hasAttachments && (
                          <Paperclip className="h-4 w-4 text-gray-400" />
                        )}
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {formatDate(email.receivedAt)}
                        </span>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleMarkAsRead([email.id], !email.isRead)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title={email.isRead ? 'Mark as unread' : 'Mark as read'}
                          >
                            {email.isRead ? <MailOpen className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                          </button>
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