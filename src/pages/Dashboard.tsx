/**
 * Email Portal Dashboard Page
 * Main dashboard with email overview and quick actions
 */
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/lib/auth'
import { emailApi } from '@/lib/api'
import Layout from '@/components/Layout'
import {
  Mail,
  Inbox,
  Send,
  FileText,
  Star,
  Archive,
  Trash2,
  Plus,
  RefreshCw,
  TrendingUp,
  Users,
  Settings
} from 'lucide-react'
import { toast } from 'sonner'

interface EmailStats {
  total: number
  unread: number
  sent: number
  drafts: number
  starred: number
  archived: number
  trash: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<EmailStats>({
    total: 0,
    unread: 0,
    sent: 0,
    drafts: 0,
    starred: 0,
    archived: 0,
    trash: 0
  })
  const [recentEmails, setRecentEmails] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const { user } = useAuthStore()

  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      // Load email statistics from different folders
      const [inbox, sent, drafts, starred, archived, trash] = await Promise.all([
        emailApi.getEmails({ folder: 'INBOX', limit: 1 }),
        emailApi.getEmails({ folder: 'SENT', limit: 1 }),
        emailApi.getEmails({ folder: 'DRAFTS', limit: 1 }),
        emailApi.getEmails({ folder: 'STARRED', limit: 1 }),
        emailApi.getEmails({ folder: 'ARCHIVE', limit: 1 }),
        emailApi.getEmails({ folder: 'TRASH', limit: 1 })
      ])

      // Count unread emails in inbox
      const inboxEmails = await emailApi.getEmails({ folder: 'INBOX', limit: 50 })
      const unreadCount = inboxEmails.emails?.filter((email: any) => !email.isRead).length || 0

      setStats({
        total: inbox.pagination?.total || 0,
        unread: unreadCount,
        sent: sent.pagination?.total || 0,
        drafts: drafts.pagination?.total || 0,
        starred: starred.pagination?.total || 0,
        archived: archived.pagination?.total || 0,
        trash: trash.pagination?.total || 0
      })

      // Load recent emails
      const recent = await emailApi.getEmails({ folder: 'INBOX', limit: 5 })
      setRecentEmails(recent.emails || [])
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  const statCards = [
    {
      name: 'Total Emails',
      value: stats.total,
      icon: Mail,
      color: 'bg-blue-500',
      href: '/inbox'
    },
    {
      name: 'Unread',
      value: stats.unread,
      icon: Inbox,
      color: 'bg-red-500',
      href: '/inbox'
    },
    {
      name: 'Sent',
      value: stats.sent,
      icon: Send,
      color: 'bg-green-500',
      href: '/sent'
    },
    {
      name: 'Drafts',
      value: stats.drafts,
      icon: FileText,
      color: 'bg-yellow-500',
      href: '/drafts'
    }
  ]

  const quickActions = [
    {
      name: 'Compose Email',
      description: 'Write a new email',
      icon: Plus,
      color: 'bg-indigo-500',
      href: '/compose'
    },
    {
      name: 'View Inbox',
      description: 'Check your messages',
      icon: Inbox,
      color: 'bg-blue-500',
      href: '/inbox'
    },
    {
      name: 'Manage Contacts',
      description: 'Add or edit contacts',
      icon: Users,
      color: 'bg-green-500',
      href: '/contacts'
    },
    {
      name: 'Settings',
      description: 'Configure your account',
      icon: Settings,
      color: 'bg-gray-500',
      href: '/settings'
    }
  ]

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      return 'Today'
    } else if (diffDays === 2) {
      return 'Yesterday'
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  return (
    <Layout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          {/* Header */}
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                Welcome back, {user?.name}!
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Here&apos;s what&apos;s happening with your emails today.
              </p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <button
                onClick={loadDashboardData}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <Link
                to="/compose"
                className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Compose
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="mt-8">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {statCards.map((card) => {
                const Icon = card.icon
                return (
                  <Link
                    key={card.name}
                    to={card.href}
                    className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div>
                      <div className={`absolute ${card.color} rounded-md p-3`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <p className="ml-16 text-sm font-medium text-gray-500 truncate">
                        {card.name}
                      </p>
                    </div>
                    <div className="ml-16 flex items-baseline pb-6 sm:pb-7">
                      <p className="text-2xl font-semibold text-gray-900">
                        {isLoading ? '...' : card.value}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Quick Actions and Recent Emails */}
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Quick Actions */}
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {quickActions.map((action) => {
                  const Icon = action.icon
                  return (
                    <Link
                      key={action.name}
                      to={action.href}
                      className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 rounded-lg shadow hover:shadow-md transition-shadow"
                    >
                      <div>
                        <span className={`rounded-lg inline-flex p-3 ${action.color} text-white`}>
                          <Icon className="h-6 w-6" />
                        </span>
                      </div>
                      <div className="mt-4">
                        <h3 className="text-lg font-medium text-gray-900">
                          {action.name}
                        </h3>
                        <p className="mt-2 text-sm text-gray-500">
                          {action.description}
                        </p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Recent Emails */}
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Recent Emails
              </h3>
              <div className="bg-white shadow rounded-lg">
                {isLoading ? (
                  <div className="p-6 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-500">Loading emails...</p>
                  </div>
                ) : recentEmails.length === 0 ? (
                  <div className="p-6 text-center">
                    <Mail className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No emails</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      You don&apos;t have any emails yet.
                    </p>
                    <div className="mt-6">
                      <Link
                        to="/compose"
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Send your first email
                      </Link>
                    </div>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {recentEmails.map((email) => (
                      <li key={email.id}>
                        <Link
                          to={`/email/${email.id}`}
                          className="block hover:bg-gray-50 px-6 py-4"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                {email.isRead ? (
                                  <Mail className="h-5 w-5 text-gray-400" />
                                ) : (
                                  <Mail className="h-5 w-5 text-blue-600" />
                                )}
                              </div>
                              <div className="ml-3 min-w-0 flex-1">
                                <p className={`text-sm ${email.isRead ? 'text-gray-900' : 'font-medium text-gray-900'} truncate`}>
                                  {email.fromAddress}
                                </p>
                                <p className={`text-sm ${email.isRead ? 'text-gray-500' : 'text-gray-700'} truncate`}>
                                  {email.subject}
                                </p>
                              </div>
                            </div>
                            <div className="flex-shrink-0 text-sm text-gray-500">
                              {formatDate(email.sentAt)}
                            </div>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                {recentEmails.length > 0 && (
                  <div className="bg-gray-50 px-6 py-3">
                    <Link
                      to="/inbox"
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      View all emails &rarr;
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}