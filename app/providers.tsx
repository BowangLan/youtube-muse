"use client";

import { ConvexAppProvider } from "@/components/convex-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

type ProvidersProps = {
  children: React.ReactNode;
};

export const Providers = ({ children }: ProvidersProps) => {
  return (
    <ConvexAppProvider>
      <TooltipProvider delayDuration={150}>{children}</TooltipProvider>
    </ConvexAppProvider>
  );
};
