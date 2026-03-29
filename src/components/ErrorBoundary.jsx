import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-cream flex items-center justify-center px-6 text-center">
          <div className="max-w-sm">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h1 className="font-serif text-xl text-brown mb-2">Something went wrong</h1>
            <p className="text-brown-muted text-sm mb-4">Please refresh the page or ask your usher for help.</p>
            <code className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg block text-left break-all">
              {this.state.error.message}
            </code>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 bg-burgundy text-white text-sm px-5 py-2 rounded-full hover:bg-burgundy-mid transition"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
