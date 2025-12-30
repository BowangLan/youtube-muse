"use client";

import * as React from "react";
import {
  ArrowLeft,
  Loader2,
  MoreVertical,
  Palette,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface StreamHeaderActionsProps {
  onRefresh: () => void;
  onDelete: () => void;
  onSwitchGradient: () => void;
  onBack: () => void;
  isRefreshing: boolean;
}

export function StreamHeaderActions({
  onRefresh,
  onDelete,
  onSwitchGradient,
  onBack,
  isRefreshing,
}: StreamHeaderActionsProps) {
  return (
    <>
      {/* Desktop Actions */}
      <div className="relative z-10 mx-auto flex max-w-5xl items-center justify-between">
        <Button
          variant="ghost"
          onClick={onBack}
          size="icon"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="hidden items-center gap-1 sm:flex">
          <Button
            onClick={onRefresh}
            disabled={isRefreshing}
            variant="ghost"
            size="icon"
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 border-white/10 bg-[#0a0a0a] text-white"
            >
              <DropdownMenuItem
                onClick={onSwitchGradient}
                className="cursor-pointer hover:bg-white/10 focus:bg-white/10"
              >
                <Palette className="h-4 w-4" />
                Random Gradient
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onDelete}
                className="cursor-pointer text-red-400 hover:bg-red-500/10 hover:text-red-400 focus:bg-red-500/10 focus:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
                Delete Stream
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Actions */}
      <div className="relative z-10 mx-auto mt-10 flex max-w-5xl flex-wrap items-center gap-1 sm:hidden">
        <Button
          onClick={onRefresh}
          disabled={isRefreshing}
          variant="ghost"
          size="icon"
        >
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48 border-white/10 bg-[#0a0a0a] text-white"
          >
            <DropdownMenuItem
              onClick={onSwitchGradient}
              className="cursor-pointer hover:bg-white/10 focus:bg-white/10"
            >
              <Palette className="h-4 w-4" />
              Random Gradient
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onDelete}
              className="cursor-pointer text-red-400 hover:bg-red-500/10 hover:text-red-400 focus:bg-red-500/10 focus:text-red-400"
            >
              <Trash2 className="h-4 w-4" />
              Delete Stream
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}
