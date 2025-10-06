import { useState, useEffect } from 'react'
import { ChevronDown, Plus, Check, Settings } from 'lucide-react'
import { api } from '../lib/api'

interface SmtpConfig {
  id: string
  name: string
  host: string
  port: number
  username: string
  fromName: string
  isDefault: boolean
  isActive: boolean
}

interface SmtpAccountSelectorProps {
  selectedAccountId?: string
  onAccountChange: (accountId: string) => void
  showManageButton?: boolean
  onManageClick?: () => void
}

export default function SmtpAccountSelector({
  selectedAccountId,
  onAccountChange,
  showManageButton = true,
  onManageClick
}: SmtpAccountSelectorProps) {
  const [accounts, setAccounts] = useState<SmtpConfig[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const selectedAccount = accounts.find(acc => acc.id === selectedAccountId) || accounts.find(acc => acc.isDefault)

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    try {
      setLoading(true)
      const response = await api.get('/smtp/configs')
      setAccounts(response.data.configs || [])
      
      // Auto-select default account if none selected
      if (!selectedAccountId && response.data.configs?.length > 0) {
        const defaultAccount = response.data.configs.find((acc: SmtpConfig) => acc.isDefault) || response.data.configs[0]
        onAccountChange(defaultAccount.id)
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch SMTP accounts')
    } finally {
      setLoading(false)
    }
  }

  const handleAccountSelect = (accountId: string) => {
    onAccountChange(accountId)
    setIsOpen(false)
  }

  const handleSetDefault = async (accountId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await api.put(`/smtp/configs/${accountId}/default`)
      fetchAccounts()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to set default account')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-md">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span className="text-sm text-gray-600">Loading accounts...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-md">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    )
  }

  if (accounts.length === 0) {
    return (
      <div className="flex items-center justify-between px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-md">
        <span className="text-sm text-yellow-700">No SMTP accounts configured</span>
        {showManageButton && (
          <button
            onClick={onManageClick}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Add Account
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Selected Account Display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <div className="flex items-center space-x-2">
          <div className="flex-shrink-0">
            <div className={`w-3 h-3 rounded-full ${selectedAccount?.isActive ? 'bg-green-400' : 'bg-gray-400'}`}></div>
          </div>
          <div className="text-left">
            <div className="text-sm font-medium text-gray-900">
              {selectedAccount?.name || 'Select Account'}
            </div>
            {selectedAccount && (
              <div className="text-xs text-gray-500">
                {selectedAccount.fromName} ({selectedAccount.username})
                {selectedAccount.isDefault && (
                  <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Default
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="py-1 max-h-60 overflow-auto">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="group flex items-center justify-between px-3 py-2 hover:bg-gray-50 cursor-pointer"
                onClick={() => handleAccountSelect(account.id)}
              >
                <div className="flex items-center space-x-2 flex-1">
                  <div className={`w-3 h-3 rounded-full ${account.isActive ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{account.name}</div>
                    <div className="text-xs text-gray-500">
                      {account.fromName} ({account.username})
                    </div>
                  </div>
                  {selectedAccount?.id === account.id && (
                    <Check className="w-4 h-4 text-blue-600" />
                  )}
                </div>
                
                {/* Default button */}
                {!account.isDefault && (
                  <button
                    onClick={(e) => handleSetDefault(account.id, e)}
                    className="opacity-0 group-hover:opacity-100 ml-2 px-2 py-1 text-xs text-blue-600 hover:text-blue-800 border border-blue-200 rounded hover:bg-blue-50 transition-opacity"
                  >
                    Set Default
                  </button>
                )}
                {account.isDefault && (
                  <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Default
                  </span>
                )}
              </div>
            ))}
          </div>
          
          {/* Footer Actions */}
          <div className="border-t border-gray-200 py-1">
            {showManageButton && (
              <button
                onClick={() => {
                  setIsOpen(false)
                  onManageClick?.()
                }}
                className="flex items-center w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 hover:text-blue-800"
              >
                <Settings className="w-4 h-4 mr-2" />
                Manage SMTP Accounts
              </button>
            )}
            <button
              onClick={() => {
                setIsOpen(false)
                // Could trigger add new account modal
              }}
              className="flex items-center w-full px-3 py-2 text-sm text-green-600 hover:bg-green-50 hover:text-green-800"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Account
            </button>
          </div>
        </div>
      )}
    </div>
  )
}