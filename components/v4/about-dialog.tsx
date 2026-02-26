"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  SITE_DESCRIPTION_FULL,
  SITE_NAME,
  SITE_URL,
  SITE_GITHUB_URL,
  SITE_TWITTER_URL,
  SITE_AUTHOR,
} from "@/lib/site";
import { Info } from "lucide-react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import Link from "next/link";

const sidebarNavItemVariants = cva(
  "flex items-center select-none gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer",
  {
    variants: {
      isCollapsed: {
        true: "justify-center p-0 w-9 h-9 items-center",
        false: "",
      },
    },
    compoundVariants: [
      {
        isCollapsed: false,
        class: "hover:bg-foreground/10 text-foreground/60 hover:text-foreground",
      },
      {
        isCollapsed: true,
        class: "text-foreground/60 hover:text-foreground",
      },
    ],
    defaultVariants: {
      isCollapsed: false,
    },
  }
);

type AboutDialogProps = {
  trigger?: React.ReactNode;
  sidebarCollapsed?: boolean;
};

export function AboutDialog({
  trigger,
  sidebarCollapsed = false,
}: AboutDialogProps) {
  const defaultTrigger = (
    <button
      type="button"
      className={cn(sidebarNavItemVariants({ isCollapsed: sidebarCollapsed }))}
      aria-label="About"
    >
      <Info size={16} />
      {!sidebarCollapsed && <span>About</span>}
    </button>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>
      <DialogContent className="w-[92vw] sm:max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] p-0 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_-10%,rgba(255,255,255,0.08),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.05),transparent_40%)]"
        />
        <div className="relative flex flex-col gap-6 overflow-y-auto p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-white">
              {SITE_NAME}
            </DialogTitle>
            <DialogDescription className="text-white/60">
              {SITE_DESCRIPTION_FULL}
            </DialogDescription>
          </DialogHeader>

          <p className="text-sm text-white/70">
            Created by{" "}
            <Link href="https://jeffbl.dev" target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white hover:underline">
              {SITE_AUTHOR}
            </Link>
          </p>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <a
                href={SITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-white/70 underline-offset-4 hover:text-white hover:underline"
              >
                {SITE_URL.replace(/^https?:\/\//, "")}
              </a>
              <a
                href={SITE_GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-white/70 underline-offset-4 hover:text-white hover:underline"
              >
                GitHub
              </a>
              <a
                href={SITE_TWITTER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-white/70 underline-offset-4 hover:text-white hover:underline"
              >
                Twitter
              </a>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
