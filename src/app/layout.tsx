import type { Metadata } from 'next'
import './globals.css'
import "tailwindcss";

export const metadata: Metadata = {
  title: 'Dynamic Form Engine',
  description: 'Configuration-driven form builder — Full-Stack Assessment',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css"
        />
      </head>
      <body className="bg-[#FDFAF4] text-[#0f1f2a]">
        {children}
      </body>
    </html>
  )
}