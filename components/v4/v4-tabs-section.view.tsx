import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { EASING_EASE_OUT } from "@/lib/styles/animation";

export function V4TabsSectionView<T extends string>({
  items,
  activeItem,
  onItemClick,
  className,
}: {
  items: {
    label: string;
    value: T;
  }[];
  activeItem: T;
  onItemClick: (item: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center relative gap-4 md:gap-6", className)}>
      {items.map((item) => (
        <div key={item.value} className="relative group">
          <Button
            onClick={() => onItemClick(item.value)}
            className={cn(
              "px-0 py-2 text-sm md:text-base",
              "bg-transparent hover:bg-transparent trans",
              activeItem === item.value ? "text-foreground" : "text-foreground/60 hover:text-foreground"
            )}
          >
            {item.label}
          </Button>
          {activeItem === item.value && (
            <motion.div
              layoutId="v3-tabs-section-indicator"
              className="absolute bottom-0 left-0 right-0 h-px bg-foreground/60 group-hover:bg-foreground transition-colors duration-300"
              transition={{ duration: 0.3, ease: EASING_EASE_OUT }}
            />
          )}
        </div>
      ))}
    </div>
  );
}