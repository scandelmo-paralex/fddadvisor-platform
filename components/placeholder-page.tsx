"use client"

export function PlaceholderPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
      <div className="text-center space-y-8">
        {/* Simple text logo */}
        <h1 className="text-4xl font-semibold tracking-tight text-gray-900">
          FDDHub
        </h1>
        
        {/* Request Access link */}
        <a
          href="https://forms.gle/18StYMf8pjd7NK838"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-sm text-gray-500 hover:text-gray-900 underline underline-offset-4 transition-colors"
        >
          Request Access
        </a>
      </div>
    </div>
  )
}
