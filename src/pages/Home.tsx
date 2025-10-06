import { Link } from 'react-router-dom'
import { Mail, Shield, Zap, Users, ArrowRight, CheckCircle } from 'lucide-react'

export default function Home() {
  const features = [
    {
      icon: Mail,
      title: 'Email Management',
      description: 'Send, receive, and organize your emails with powerful filtering and search capabilities.'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your emails are protected with enterprise-grade security and encryption.'
    },
    {
      icon: Zap,
      title: 'Fast & Reliable',
      description: 'Lightning-fast email delivery with 99.9% uptime guarantee.'
    },
    {
      icon: Users,
      title: 'Contact Management',
      description: 'Organize your contacts and manage your communication efficiently.'
    }
  ]

  const benefits = [
    'SMTP integration with popular email providers',
    'Rich text editor for composing emails',
    'File attachments support',
    'Advanced search and filtering',
    'Contact management system',
    'Responsive design for all devices'
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Mail className="h-5 w-5 text-white" />
              </div>
              <h1 className="ml-3 text-xl font-bold text-gray-900">Email Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Manage Your Emails
              <br />
              <span className="text-indigo-200">Like a Pro</span>
            </h1>
            <p className="text-xl text-indigo-100 mb-8 max-w-3xl mx-auto">
              A powerful email portal that helps you send, receive, and organize your emails efficiently. 
              Connect with any SMTP provider and take control of your communication.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50 transition-colors"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center px-8 py-3 border border-white text-base font-medium rounded-md text-white hover:bg-white hover:text-indigo-600 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to manage emails
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our email portal provides all the tools you need to communicate effectively and stay organized.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div key={index} className="text-center">
                  <div className="mx-auto h-16 w-16 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="h-8 w-8 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Why choose our Email Portal?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Built with modern technology and designed for productivity, our email portal 
                offers everything you need to manage your communication effectively.
              </p>
              
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="mt-12 lg:mt-0">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-8 text-white">
                <h3 className="text-2xl font-bold mb-4">Ready to get started?</h3>
                <p className="text-indigo-100 mb-6">
                  Join thousands of users who trust our email portal for their communication needs.
                </p>
                <Link
                  to="/register"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50 transition-colors"
                >
                  Create Account
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Mail className="h-5 w-5 text-white" />
              </div>
              <span className="ml-3 text-white font-semibold">Email Portal</span>
            </div>
            <p className="text-gray-400 text-sm">
              &copy; 2024 Email Portal. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}