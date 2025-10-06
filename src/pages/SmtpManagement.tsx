import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react'
import { api } from '../lib/api'

interface SmtpConfig {
  id: string
  name: string
  host: string
  port: number
  username: string
  fromName: string
  signature: string
  isDefault: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface SmtpFormData {
  name: string
  host: string
  port: number
  username: string
  password: string
  fromName: string
  signature: string
  isDefault: boolean
}

export default function SmtpManagement() {
  const [configs, setConfigs] = useState<SmtpConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingConfig, setEditingConfig] = useState<SmtpConfig | null>(null)
  const [testingId, setTestingId] = useState<string | null>(null)

  const [formData, setFormData] = useState<SmtpFormData>({
    name: '',
    host: '',
    port: 587,
    username: '',
    password: '',
    fromName: '',
    signature: '',
    isDefault: false
  })

  useEffect(() => {
    fetchConfigs()
  }, [])

  const fetchConfigs = async () => {
    try {
      setLoading(true)
      const response = await api.get('/smtp/configs')
      setConfigs(response.data.configs || [])
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch SMTP configurations')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingConfig) {
        await api.put(`/smtp/configs/${editingConfig.id}`, formData)
      } else {
        await api.post('/smtp/configs', formData)
      }
      
      resetForm()
      fetchConfigs()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save SMTP configuration')
    }
  }

  const handleEdit = (config: SmtpConfig) => {
    setEditingConfig(config)
    setFormData({
      name: config.name,
      host: config.host,
      port: config.port,
      username: config.username,
      password: '', // Don't populate password for security
      fromName: config.fromName,
      signature: config.signature,
      isDefault: config.isDefault
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this SMTP configuration?')) return
    
    try {
      await api.delete(`/smtp/configs/${id}`)
      fetchConfigs()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete SMTP configuration')
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      await api.put(`/smtp/configs/${id}/default`)
      fetchConfigs()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to set default configuration')
    }
  }

  const handleTest = async (id: string) => {
    try {
      setTestingId(id)
      await api.post(`/smtp/configs/${id}/test`)
      alert('Test email sent successfully!')
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to send test email')
    } finally {
      setTestingId(null)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      host: '',
      port: 587,
      username: '',
      password: '',
      fromName: '',
      signature: '',
      isDefault: false
    })
    setEditingConfig(null)
    setShowForm(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">SMTP Account Management</h1>
          <p className="text-gray-600 mt-2">Manage your email sending accounts</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error}</p>
            <button
              onClick={() => setError('')}
              className="text-red-600 hover:text-red-800 text-sm mt-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Add New Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add SMTP Account
          </button>
        </div>

        {/* SMTP Configurations List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading configurations...</p>
            </div>
          ) : configs.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">No SMTP configurations found</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Account
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Account
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Server Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {configs.map((config) => (
                    <tr key={config.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 flex items-center">
                            {config.name}
                            {config.isDefault && (
                              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Default
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {config.fromName} ({config.username})
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{config.host}:{config.port}</div>
                        <div className="text-sm text-gray-500">Username: {config.username}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {config.isActive ? (
                            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500 mr-2" />
                          )}
                          <span className={`text-sm ${config.isActive ? 'text-green-800' : 'text-red-800'}`}>
                            {config.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleTest(config.id)}
                            disabled={testingId === config.id}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                          >
                            {testingId === config.id ? 'Testing...' : 'Test'}
                          </button>
                          <button
                            onClick={() => handleEdit(config)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {!config.isDefault && (
                            <button
                              onClick={() => handleSetDefault(config.id)}
                              className="text-purple-600 hover:text-purple-900"
                            >
                              Set Default
                            </button>
                          )}
                          <button
                                onClick={() => handleDelete(config.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingConfig ? 'Edit SMTP Account' : 'Add New SMTP Account'}
                </h3>
              </div>
              <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Account Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="e.g., Work Email, Personal Gmail"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">From Name</label>
                    <input
                      type="text"
                      required
                      value={formData.fromName}
                      onChange={(e) => setFormData({ ...formData, fromName: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Your Name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">SMTP Host</label>
                    <input
                      type="text"
                      required
                      value={formData.host}
                      onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="smtp.gmail.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Port</label>
                    <input
                      type="number"
                      required
                      value={formData.port}
                      onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Username/Email</label>
                  <input
                    type="email"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="your.email@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Password {editingConfig && <span className="text-gray-500">(leave blank to keep current)</span>}
                  </label>
                  <input
                    type="password"
                    required={!editingConfig}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email Signature</label>
                  <textarea
                    rows={3}
                    value={formData.signature}
                    onChange={(e) => setFormData({ ...formData, signature: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Best regards,&#10;Your Name&#10;Your Title"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-900">
                    Set as default account
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                  >
                    {editingConfig ? 'Update Account' : 'Add Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}