"use client";

import { ConvexAppProvider } from "@/components/convex-provider";
import { DesktopRuntimeProvider } from "@/components/desktop/desktop-runtime-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

type ProvidersProps = {
  children: React.ReactNode;
};

export const Providers = ({ children }: ProvidersProps) => {
  return (
    <DesktopRuntimeProvider>
      <ConvexAppProvider>
        <TooltipProvider delayDuration={150}>{children}</TooltipProvider>
      </ConvexAppProvider>
    </DesktopRuntimeProvider>
  );
};
