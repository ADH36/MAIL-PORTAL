import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Send, 
  Paperclip, 
  X, 
  Bold, 
  Italic, 
  Underline, 
  List, 
  Link as LinkIcon,
  Save,
  Eye,
  ChevronDown
} from 'lucide-react'
import { toast } from 'sonner'
import Layout from '../components/Layout'
import { emailApi, api } from '../lib/api'

interface Attachment {
  file: File
  name: string
  size: number
  type: string
}

interface SmtpConfig {
  id: string
  name: string
  username: string
  fromName: string
  signature: string
  isDefault: boolean
}

export default function Compose() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  
  const [formData, setFormData] = useState({
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    content: ''
  })
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [sending, setSending] = useState(false)
  const [showCc, setShowCc] = useState(false)
  const [showBcc, setShowBcc] = useState(false)
  const [isPreview, setIsPreview] = useState(false)
  const [smtpConfigs, setSmtpConfigs] = useState<SmtpConfig[]>([])
  const [selectedSmtpId, setSelectedSmtpId] = useState<string>('')
  const [loadingConfigs, setLoadingConfigs] = useState(true)

  useEffect(() => {
    fetchSmtpConfigs()
  }, [])

  const fetchSmtpConfigs = async () => {
    try {
      setLoadingConfigs(true)
      const response = await api.get('/smtp/configs')
      const configs = response.data.configs || []
      setSmtpConfigs(configs)
      
      // Set default SMTP config as selected
      const defaultConfig = configs.find((config: SmtpConfig) => config.isDefault)
      if (defaultConfig) {
        setSelectedSmtpId(defaultConfig.id)
      } else if (configs.length > 0) {
        setSelectedSmtpId(configs[0].id)
      }
    } catch (error) {
      console.error('Error fetching SMTP configs:', error)
      toast.error('Failed to load email accounts')
    } finally {
      setLoadingConfigs(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    const newAttachments: Attachment[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file.size > 25 * 1024 * 1024) { // 25MB limit
        toast.error(`File ${file.name} is too large. Maximum size is 25MB.`)
        continue
      }
      newAttachments.push({
        file,
        name: file.name,
        size: file.size,
        type: file.type
      })
    }
    
    setAttachments(prev => [...prev, ...newAttachments])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const applyFormatting = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    contentRef.current?.focus()
  }

  const handleContentChange = () => {
    if (contentRef.current) {
      setFormData(prev => ({ ...prev, content: contentRef.current!.innerHTML }))
    }
  }

  const validateForm = () => {
    if (!formData.to.trim()) {
      toast.error('Please enter recipient email address')
      return false
    }
    
    if (!formData.subject.trim()) {
      toast.error('Please enter email subject')
      return false
    }
    
    if (!formData.content.trim() && !contentRef.current?.textContent?.trim()) {
      toast.error('Please enter email content')
      return false
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const toEmails = formData.to.split(',').map(email => email.trim())
    for (const email of toEmails) {
      if (!emailRegex.test(email)) {
        toast.error(`Invalid email address: ${email}`)
        return false
      }
    }

    return true
  }

  const handleSend = async () => {
    if (!validateForm()) return
    
    if (!selectedSmtpId) {
      toast.error('Please select an email account to send from')
      return
    }

    try {
      setSending(true)
      
      const emailData = new FormData()
      emailData.append('to', formData.to)
      emailData.append('cc', formData.cc)
      emailData.append('bcc', formData.bcc)
      emailData.append('subject', formData.subject)
      emailData.append('content', contentRef.current?.innerHTML || formData.content)
      emailData.append('smtpConfigId', selectedSmtpId)
      
      attachments.forEach((attachment) => {
        emailData.append('attachments', attachment.file)
      })

      await emailApi.sendEmail(emailData)
      toast.success('Email sent successfully!')
      navigate('/inbox')
    } catch (error) {
      toast.error('Failed to send email')
      console.error('Error sending email:', error)
    } finally {
      setSending(false)
    }
  }

  const handleSaveDraft = async () => {
    try {
      const emailData = new FormData()
      emailData.append('to', formData.to)
      emailData.append('cc', formData.cc)
      emailData.append('bcc', formData.bcc)
      emailData.append('subject', formData.subject)
      emailData.append('content', contentRef.current?.innerHTML || formData.content)
      emailData.append('isDraft', 'true')
      
      attachments.forEach((attachment) => {
        emailData.append('attachments', attachment.file)
      })

      await emailApi.sendEmail(emailData)
      toast.success('Draft saved successfully!')
    } catch (error) {
      toast.error('Failed to save draft')
      console.error('Error saving draft:', error)
    }
  }

  return (
    <Layout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Compose Email</h1>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsPreview(!isPreview)}
                className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <Eye className="h-4 w-4 mr-2" />
                {isPreview ? 'Edit' : 'Preview'}
              </button>
              <button
                onClick={handleSaveDraft}
                className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </button>
              <button
                onClick={handleSend}
                disabled={sending}
                className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4 mr-2" />
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>

        {/* Email Form */}
        <div className="flex-1 overflow-auto p-4">
          <div className="max-w-4xl mx-auto space-y-4">
            {/* SMTP Account Selector */}
            <div className="bg-gray-50 p-4 rounded-lg border">
              <div className="flex items-center">
                <label className="w-20 text-sm font-medium text-gray-700">From:</label>
                {loadingConfigs ? (
                  <div className="flex-1 px-3 py-2 text-sm text-gray-500">Loading email accounts...</div>
                ) : smtpConfigs.length === 0 ? (
                  <div className="flex-1 px-3 py-2 text-sm text-red-600">
                    No email accounts configured. 
                    <button 
                      onClick={() => navigate('/smtp-management')}
                      className="ml-2 text-indigo-600 hover:text-indigo-800 underline"
                    >
                      Add one now
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 relative">
                    <select
                      value={selectedSmtpId}
                      onChange={(e) => setSelectedSmtpId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white"
                    >
                      {smtpConfigs.map((config) => (
                        <option key={config.id} value={config.id}>
                          {config.name} ({config.fromName} &lt;{config.username}&gt;)
                          {config.isDefault ? ' - Default' : ''}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                )}
              </div>
            </div>

            {/* Recipients */}
            <div className="space-y-3">
              <div className="flex items-center">
                <label className="w-16 text-sm font-medium text-gray-700">To:</label>
                <input
                  type="email"
                  value={formData.to}
                  onChange={(e) => handleInputChange('to', e.target.value)}
                  placeholder="recipient@example.com"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  multiple
                />
                <div className="ml-2 flex items-center space-x-2">
                  {!showCc && (
                    <button
                      onClick={() => setShowCc(true)}
                      className="text-sm text-indigo-600 hover:text-indigo-800"
                    >
                      Cc
                    </button>
                  )}
                  {!showBcc && (
                    <button
                      onClick={() => setShowBcc(true)}
                      className="text-sm text-indigo-600 hover:text-indigo-800"
                    >
                      Bcc
                    </button>
                  )}
                </div>
              </div>

              {showCc && (
                <div className="flex items-center">
                  <label className="w-16 text-sm font-medium text-gray-700">Cc:</label>
                  <input
                    type="email"
                    value={formData.cc}
                    onChange={(e) => handleInputChange('cc', e.target.value)}
                    placeholder="cc@example.com"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <button
                    onClick={() => setShowCc(false)}
                    className="ml-2 p-1 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {showBcc && (
                <div className="flex items-center">
                  <label className="w-16 text-sm font-medium text-gray-700">Bcc:</label>
                  <input
                    type="email"
                    value={formData.bcc}
                    onChange={(e) => handleInputChange('bcc', e.target.value)}
                    placeholder="bcc@example.com"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <button
                    onClick={() => setShowBcc(false)}
                    className="ml-2 p-1 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Subject */}
            <div className="flex items-center">
              <label className="w-16 text-sm font-medium text-gray-700">Subject:</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                placeholder="Email subject"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Attachments */}
            {attachments.length > 0 && (
              <div className="border border-gray-200 rounded-md p-3">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Attachments ({attachments.length})</h3>
                <div className="space-y-2">
                  {attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                      <div className="flex items-center space-x-2">
                        <Paperclip className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{attachment.name}</span>
                        <span className="text-xs text-gray-500">({formatFileSize(attachment.size)})</span>
                      </div>
                      <button
                        onClick={() => removeAttachment(index)}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Content Editor */}
            <div className="border border-gray-200 rounded-md">
              {!isPreview && (
                <div className="border-b border-gray-200 p-2 flex items-center space-x-2">
                  <button
                    onClick={() => applyFormatting('bold')}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                    title="Bold"
                  >
                    <Bold className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => applyFormatting('italic')}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                    title="Italic"
                  >
                    <Italic className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => applyFormatting('underline')}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                    title="Underline"
                  >
                    <Underline className="h-4 w-4" />
                  </button>
                  <div className="w-px h-6 bg-gray-300"></div>
                  <button
                    onClick={() => applyFormatting('insertUnorderedList')}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                    title="Bullet List"
                  >
                    <List className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      const url = prompt('Enter URL:')
                      if (url) applyFormatting('createLink', url)
                    }}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                    title="Insert Link"
                  >
                    <LinkIcon className="h-4 w-4" />
                  </button>
                  <div className="w-px h-6 bg-gray-300"></div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                    title="Attach File"
                  >
                    <Paperclip className="h-4 w-4" />
                  </button>
                </div>
              )}
              
              {isPreview ? (
                <div className="p-4 min-h-64">
                  <div className="prose max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: formData.content }} />
                  </div>
                </div>
              ) : (
                <div
                  ref={contentRef}
                  contentEditable
                  onInput={handleContentChange}
                  className="p-4 min-h-64 focus:outline-none"
                  style={{ minHeight: '16rem' }}
                  placeholder="Write your email content here..."
                />
              )}
            </div>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept="*/*"
        />
      </div>
    </Layout>
  )
}