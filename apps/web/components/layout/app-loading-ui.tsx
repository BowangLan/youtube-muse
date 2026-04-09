"use client";
import { useHasMounted } from "@/hooks/use-has-mounted";
import { cn } from "@/lib/utils";
import * as React from "react";

const LOADING_PHRASE_LIST = [
  "Let's grind",
  "Let's lock in",
  "Time to lock in",
  "Time to crush it, you got this",
  "Get comfortable, let's focus",
];

export const AppLoadingUI = () => {
  const isMounted = useHasMounted();
  const [loadingPhrase, setLoadingPhrase] = React.useState("");
  const [showMotion, setShowMotion] = React.useState(false);

  React.useEffect(() => {
    if (!isMounted) return;
    setLoadingPhrase(
      LOADING_PHRASE_LIST[
        Math.floor(Math.random() * LOADING_PHRASE_LIST.length)
      ]
    );
    const timer = setTimeout(() => setShowMotion(true), 1100);
    return () => clearTimeout(timer);
  }, [isMounted]);

  return (
    <div
      className={cn(
        "flex flex-col gap-8 items-center pt-[30vh] motion-opacity-in-0 motion-blur-in-lg",
        showMotion && "motion-opacity-out-0 motion-blur-out-md"
      )}
    >
      <p className="text-xl sm:text-3xl md:text-5xl font-light lowercase tracking-wider">
        {loadingPhrase}
      </p>
    </div>
  );
};
