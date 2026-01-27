"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CircleHelp } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface HelpStep {
  title: string;
  description: string;
  icon: LucideIcon;
}

interface FeatureHelpAccordionProps {
  value: string;
  title: string;
  steps: readonly HelpStep[];
}

export function FeatureHelpAccordion({
  value,
  title,
  steps,
}: FeatureHelpAccordionProps) {
  return (
    <Accordion
      type="single"
      collapsible
      className="rounded-2xl px-4 border border-white/5 bg-white/3"
    >
      <AccordionItem value={value} className="border-white/10">
        <AccordionTrigger className="cursor-pointer flex items-center justify-start gap-3 text-xs uppercase tracking-[0.32em] text-white/60 hover:no-underline">
          <CircleHelp className="size-4 text-white/60" />
          <span className="flex-1 inline-block">{title}</span>
        </AccordionTrigger>
        <AccordionContent className="pt-2">
          <div className="grid gap-3 pb-2 sm:grid-cols-3">
            {steps.map(({ title, description, icon }) => {
              const Icon = icon;
              return (
                <div
                  key={title}
                  className="flex items-start gap-3 rounded-xl text-left transition-colors p-3 border border-white/5 bg-white/5 hover:bg-white/10"
                >
                  <div className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80">
                    <Icon className="size-4" />
                  </div>
                  <div className="flex flex-1 flex-col gap-1">
                    <div className="text-sm font-medium text-white">{title}</div>
                    <p className="text-xs text-white/60">{description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}