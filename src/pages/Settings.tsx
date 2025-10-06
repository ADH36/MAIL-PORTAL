import { useState, useEffect } from 'react'
import { 
  Save, 
  TestTube, 
  Eye, 
  EyeOff, 
  Check, 
  X, 
  Mail, 
  Server, 
  Shield,
  User,
  Key
} from 'lucide-react'
import { toast } from 'sonner'
import Layout from '../components/Layout'
import { smtpApi } from '../lib/api'
import { useAuthStore } from '../lib/auth'

interface SmtpConfig {
  id?: string
  host: string
  port: number
  secure: boolean
  username: string
  password: string
  fromName: string
  fromEmail: string
}

interface SmtpProvider {
  name: string
  host: string
  port: number
  secure: boolean
}

export default function Settings() {
  const { user, updateUser } = useAuthStore()
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)
  
  // Profile form
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || ''
  })

  // SMTP form
  const [smtpData, setSmtpData] = useState<SmtpConfig>({
    host: '',
    port: 587,
    secure: false,
    username: '',
    password: '',
    fromName: '',
    fromEmail: ''
  })

  const [providers, setProviders] = useState<SmtpProvider[]>([])
  const [selectedProvider, setSelectedProvider] = useState('')

  useEffect(() => {
    fetchSmtpConfig()
    fetchProviders()
  }, [])

  const fetchSmtpConfig = async () => {
    try {
      const config = await smtpApi.getConfig()
      if (config) {
        setSmtpData(config)
      }
    } catch (error) {
      console.error('Error fetching SMTP config:', error)
    }
  }

  const fetchProviders = async () => {
    try {
      const providerList = await smtpApi.getProviders()
      setProviders(providerList)
    } catch (error) {
      console.error('Error fetching providers:', error)
    }
  }

  const handleProviderSelect = (provider: SmtpProvider) => {
    setSmtpData(prev => ({
      ...prev,
      host: provider.host,
      port: provider.port,
      secure: provider.secure
    }))
    setSelectedProvider(provider.name)
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!profileData.name.trim() || !profileData.email.trim()) {
      toast.error('Name and email are required')
      return
    }

    try {
      setLoading(true)
      await updateUser(profileData)
      toast.success('Profile updated successfully')
    } catch (error) {
      toast.error('Failed to update profile')
      console.error('Error updating profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSmtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!smtpData.host || !smtpData.username || !smtpData.password) {
      toast.error('Host, username, and password are required')
      return
    }

    try {
      setLoading(true)
      await smtpApi.saveConfig(smtpData)
      toast.success('SMTP configuration saved successfully')
    } catch (error) {
      toast.error('Failed to save SMTP configuration')
      console.error('Error saving SMTP config:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTestConnection = async () => {
    if (!smtpData.host || !smtpData.username || !smtpData.password) {
      toast.error('Please fill in all required SMTP fields')
      return
    }

    try {
      setTestingConnection(true)
      await smtpApi.testConfig(smtpData)
      toast.success('SMTP connection test successful!')
    } catch (error) {
      toast.error('SMTP connection test failed')
      console.error('Error testing SMTP connection:', error)
    } finally {
      setTestingConnection(false)
    }
  }

  const handleDeleteSmtpConfig = async () => {
    if (!confirm('Are you sure you want to delete the SMTP configuration?')) return

    try {
      await smtpApi.deleteConfig()
      setSmtpData({
        host: '',
        port: 587,
        secure: false,
        username: '',
        password: '',
        fromName: '',
        fromEmail: ''
      })
      setSelectedProvider('')
      toast.success('SMTP configuration deleted successfully')
    } catch (error) {
      toast.error('Failed to delete SMTP configuration')
      console.error('Error deleting SMTP config:', error)
    }
  }

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'smtp', name: 'Email Settings', icon: Mail },
    { id: 'security', name: 'Security', icon: Shield }
  ]

  return (
    <Layout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="border-b border-gray-200 p-4">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      activeTab === tab.id
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {tab.name}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            {activeTab === 'profile' && (
              <div className="max-w-2xl">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Profile Information</h2>
                
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'smtp' && (
              <div className="max-w-4xl">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Email Settings</h2>
                  {smtpData.host && (
                    <button
                      onClick={handleDeleteSmtpConfig}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Delete Configuration
                    </button>
                  )}
                </div>

                {/* Quick Setup */}
                <div className="mb-8">
                  <h3 className="text-md font-medium text-gray-900 mb-4">Quick Setup</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {providers.map((provider) => (
                      <button
                        key={provider.name}
                        onClick={() => handleProviderSelect(provider)}
                        className={`p-4 border rounded-lg text-left hover:bg-gray-50 ${
                          selectedProvider === provider.name
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">{provider.name}</h4>
                          {selectedProvider === provider.name && (
                            <Check className="h-5 w-5 text-indigo-600" />
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {provider.host}:{provider.port}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Manual Configuration */}
                <form onSubmit={handleSmtpSubmit} className="space-y-6">
                  <h3 className="text-md font-medium text-gray-900">SMTP Configuration</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Server className="h-4 w-4 inline mr-1" />
                        SMTP Host *
                      </label>
                      <input
                        type="text"
                        value={smtpData.host}
                        onChange={(e) => setSmtpData(prev => ({ ...prev, host: e.target.value }))}
                        placeholder="smtp.gmail.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Port *
                      </label>
                      <input
                        type="number"
                        value={smtpData.port}
                        onChange={(e) => setSmtpData(prev => ({ ...prev, port: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="secure"
                      checked={smtpData.secure}
                      onChange={(e) => setSmtpData(prev => ({ ...prev, secure: e.target.checked }))}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="secure" className="ml-2 text-sm text-gray-700">
                      Use SSL/TLS encryption
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <User className="h-4 w-4 inline mr-1" />
                        Username *
                      </label>
                      <input
                        type="text"
                        value={smtpData.username}
                        onChange={(e) => setSmtpData(prev => ({ ...prev, username: e.target.value }))}
                        placeholder="your-email@gmail.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Key className="h-4 w-4 inline mr-1" />
                        Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={smtpData.password}
                          onChange={(e) => setSmtpData(prev => ({ ...prev, password: e.target.value }))}
                          placeholder="App password or account password"
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        From Name
                      </label>
                      <input
                        type="text"
                        value={smtpData.fromName}
                        onChange={(e) => setSmtpData(prev => ({ ...prev, fromName: e.target.value }))}
                        placeholder="Your Name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        From Email
                      </label>
                      <input
                        type="email"
                        value={smtpData.fromEmail}
                        onChange={(e) => setSmtpData(prev => ({ ...prev, fromEmail: e.target.value }))}
                        placeholder="your-email@gmail.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-6">
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={testingConnection}
                      className="flex items-center px-4 py-2 text-sm text-indigo-600 hover:text-indigo-800 border border-indigo-300 rounded-md hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <TestTube className="h-4 w-4 mr-2" />
                      {testingConnection ? 'Testing...' : 'Test Connection'}
                    </button>

                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? 'Saving...' : 'Save Configuration'}
                    </button>
                  </div>
                </form>

                {/* Help Text */}
                <div className="mt-8 p-4 bg-blue-50 rounded-md">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Setup Help</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• For Gmail: Use your email and an App Password (not your regular password)</li>
                    <li>• For Outlook: Use your email and account password</li>
                    <li>• For custom SMTP: Contact your email provider for settings</li>
                    <li>• Test the connection before saving to ensure it works</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="max-w-2xl">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Security Settings</h2>
                
                <div className="space-y-6">
                  <div className="p-4 border border-gray-200 rounded-md">
                    <h3 className="text-md font-medium text-gray-900 mb-2">Change Password</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Update your account password to keep your account secure.
                    </p>
                    <button className="text-sm text-indigo-600 hover:text-indigo-800">
                      Change Password
                    </button>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-md">
                    <h3 className="text-md font-medium text-gray-900 mb-2">Two-Factor Authentication</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Add an extra layer of security to your account.
                    </p>
                    <button className="text-sm text-indigo-600 hover:text-indigo-800">
                      Enable 2FA
                    </button>
                  </div>

                  <div className="p-4 border border-red-200 rounded-md">
                    <h3 className="text-md font-medium text-red-900 mb-2">Delete Account</h3>
                    <p className="text-sm text-red-600 mb-4">
                      Permanently delete your account and all associated data.
                    </p>
                    <button className="text-sm text-red-600 hover:text-red-800">
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}