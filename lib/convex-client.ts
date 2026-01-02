import { ConvexClient } from "convex/browser"

if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL is not set")
}

export const convexClient = new ConvexClient(process.env.NEXT_PUBLIC_CONVEX_URL!)
