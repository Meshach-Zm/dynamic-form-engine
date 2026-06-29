// app/layout.tsx
// Replaces the top NavBar with a fixed left sidebar.
// Every color, border, and type token matches the existing codebase exactly.

import type { Metadata } from 'next'
import { SideBar } from '@/components/shell/SideBar'
import './globals.css'

export const metadata: Metadata = {
  title: 'Form Engine',
  description: 'Dynamic schema-driven form builder',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="flex h-screen overflow-hidden bg-white antialiased">
        <SideBar />
        {/* Right canvas scrolls independently */}
        <div className="flex-1 overflow-y-auto bg-neutral-50">
          {children}
        </div>
      </body>
    </html>
  )
}