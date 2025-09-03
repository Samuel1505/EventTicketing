import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { Web3Provider } from "../components/Provider"
import "./globals.css"

export const metadata: Metadata = {
  title: "Leepoo - NFT Powered Event Ticketing",
  description: "The future of blockchain event ticketing onchain",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
      <body className="font-sans">
        <Web3Provider>
          <Suspense fallback={null}>{children}</Suspense>
        </Web3Provider>
        <Analytics />
      </body>
    </html>
  )
}