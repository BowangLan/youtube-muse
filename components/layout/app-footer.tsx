"use client";

import * as React from "react";
import Link from "next/link";

export function AppFooter() {
  return (
    <footer className="relative border-t border-white/5 bg-gradient-to-b from-transparent to-black/20">
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        <p className="text-center text-sm text-neutral-500">
          made with love by{" "}
          <Link
            href="https://jeffbl.dev"
            target="_blank"
            className="text-neutral-200 hover:text-white transition-colors hover:underline"
          >
            Jeffrey
          </Link>
        </p>
      </div>
    </footer>
  );
}
