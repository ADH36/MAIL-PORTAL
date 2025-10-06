/**
 * Email Portal Layout Component
 * Main layout wrapper with navigation and sidebar
 */
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/lib/auth'
import {
  Mail,
  Inbox,
  Send,
  FileText,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Star,
  Archive,
  Trash2,
  User,
  Shield,
  Server
} from 'lucide-react'
import { toast } from 'sonner'
import SmtpAccountSelector from './SmtpAccountSelector'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Mail },
    { name: 'Inbox', href: '/inbox', icon: Inbox },
    { name: 'Sent', href: '/sent', icon: Send },
    { name: 'Starred', href: '/starred', icon: Star },
    { name: 'Drafts', href: '/drafts', icon: FileText },
    { name: 'Archive', href: '/archive', icon: Archive },
    { name: 'Trash', href: '/trash', icon: Trash2 },
    { name: 'Contacts', href: '/contacts', icon: Users },
    { name: 'SMTP Accounts', href: '/smtp-management', icon: Server },
    { name: 'Settings', href: '/settings', icon: Settings },
  ]

  // Add admin navigation if user is admin
  const adminNavigation = user?.role === 'ADMIN' ? [
    { name: 'Admin Panel', href: '/admin', icon: Shield },
  ] : []

  const isActive = (href: string) => location.pathname === href

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 flex z-40 md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <SidebarContent navigation={navigation} adminNavigation={adminNavigation} isActive={isActive} user={user} onLogout={handleLogout} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <SidebarContent navigation={navigation} adminNavigation={adminNavigation} isActive={isActive} user={user} onLogout={handleLogout} />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top bar */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <button
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex">
              <div className="w-full flex md:ml-0">
                <div className="relative w-full text-gray-400 focus-within:text-gray-600">
                  <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div className="block w-full h-full pl-8 pr-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-0 focus:border-0 sm:text-sm">
                    Email Portal
                  </div>
                </div>
              </div>
            </div>
            <div className="ml-4 flex items-center md:ml-6 space-x-4">
              {/* SMTP Account Selector */}
              <SmtpAccountSelector />
              
              {/* User Profile */}
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-700">{user?.name}</div>
                  <div className="text-xs text-gray-500">{user?.email}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  )
}

interface SidebarContentProps {
  navigation: Array<{
    name: string
    href: string
    icon: React.ComponentType<{ className?: string }>
  }>
  adminNavigation: Array<{
    name: string
    href: string
    icon: React.ComponentType<{ className?: string }>
  }>
  isActive: (href: string) => boolean
  user: any
  onLogout: () => void
}

function SidebarContent({ navigation, adminNavigation, isActive, user, onLogout }: SidebarContentProps) {
  return (
    <div className="flex flex-col h-0 flex-1 border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Mail className="h-5 w-5 text-white" />
          </div>
          <div className="ml-3">
            <h1 className="text-lg font-semibold text-gray-900">Email Portal</h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-5 flex-1 px-2 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`${
                  isActive(item.href)
                    ? 'bg-indigo-100 text-indigo-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
              >
                <Icon
                  className={`${
                    isActive(item.href) ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'
                  } mr-3 flex-shrink-0 h-6 w-6`}
                />
                {item.name}
              </Link>
            )
          })}
          
          {/* Admin Navigation */}
          {adminNavigation.length > 0 && (
            <>
              <div className="border-t border-gray-200 my-4"></div>
              <div className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Administration
              </div>
              {adminNavigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      isActive(item.href)
                        ? 'bg-red-100 text-red-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                  >
                    <Icon
                      className={`${
                        isActive(item.href) ? 'text-red-500' : 'text-gray-400 group-hover:text-gray-500'
                      } mr-3 flex-shrink-0 h-6 w-6`}
                    />
                    {item.name}
                  </Link>
                )
              })}
            </>
          )}
        </nav>
      </div>

      {/* User section */}
      <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
        <div className="flex-shrink-0 w-full group block">
          <div className="flex items-center">
            <div>
              <div className="h-9 w-9 rounded-full bg-gray-300 flex items-center justify-center">
                <User className="h-5 w-5 text-gray-600" />
              </div>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                {user?.name}
              </p>
              <button
                onClick={onLogout}
                className="flex items-center text-xs font-medium text-gray-500 group-hover:text-gray-700"
              >
                <LogOut className="h-3 w-3 mr-1" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}