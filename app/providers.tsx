"use client"

import { ConvexAppProvider } from "@/components/convex-provider"

type ProvidersProps = {
  children: React.ReactNode
}

export const Providers = ({ children }: ProvidersProps) => {
  return <ConvexAppProvider>{children}</ConvexAppProvider>
}
