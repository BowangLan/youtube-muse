"use client"

import { ConvexProvider, ConvexReactClient } from "convex/react"
import { useMemo } from "react"

type ConvexProviderProps = {
  children: React.ReactNode
}

export const ConvexAppProvider = ({ children }: ConvexProviderProps) => {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
  const client = useMemo(() => {
    if (!convexUrl) return null
    return new ConvexReactClient(convexUrl)
  }, [convexUrl])

  if (!client) {
    return children
  }

  return <ConvexProvider client={client}>{children}</ConvexProvider>
}
