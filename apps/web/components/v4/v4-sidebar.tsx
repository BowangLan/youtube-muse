"use client";

import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { V4_HEADER_HEIGHT, V4_SIDEBAR_COLLAPSED_WIDTH, V4_SIDEBAR_PX, V4_SIDEBAR_WIDTH } from "./v4-constants";
import { V4TAB_ITEMS } from "./v4-tabs-config";
import { useV4AppStateStore, V4Tab } from "@/lib/store/v4-app-state-store";
import { Link2, MusicIcon, PanelLeftClose, PanelLeft, PictureInPicture2 } from "lucide-react";
import { SearchIcon } from "@/components/ui/search";
import { PlayUrlDialog } from "@/components/player/play-url-dialog";
import { ZenIcon } from "../ui/zen-icon";
import { AboutDialog } from "./about-dialog";
import { useDesktopRuntime } from "@/components/desktop/desktop-runtime-provider";

const sidebarNavItemVariants = cva(
  "flex items-center select-none gap-2 px-3 h-9 rounded-lg text-sm font-medium transition-colors cursor-pointer",
  {
    variants: {
      variant: {
        primary: "",
        secondary: "",
      },
      isActive: {
        true: "",
        false: "",
      },
      isCollapsed: {
        true: "justify-center p-0 w-9 h-9 items-center",
        false: "",
      },
    },
    compoundVariants: [
      { variant: "primary", isActive: true, class: "bg-primary text-primary-foreground" },
      { variant: "primary", isActive: false, class: "hover:bg-primary/80 bg-primary text-primary-foreground" },
      { variant: "secondary", isActive: true, class: "bg-foreground/10 text-foreground" },
      { variant: "secondary", isActive: false, class: "hover:bg-foreground/10 text-foreground/60 hover:text-foreground" },
    ],
    defaultVariants: {
      variant: "secondary",
      isActive: false,
      isCollapsed: false,
    },
  }
);

type SidebarNavItemProps = {
  isCollapsed: boolean;
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  variant?: VariantProps<typeof sidebarNavItemVariants>["variant"];
  isActive: boolean;
  onSelect: () => void;
};

function SidebarNavItem({ isCollapsed, icon: Icon, label, variant = "secondary", isActive, onSelect }: SidebarNavItemProps) {
  return (
    <button
      onClick={onSelect}
      className={cn(sidebarNavItemVariants({ variant, isActive, isCollapsed }))}
    >
      <Icon size={16} />
      {!isCollapsed && (
        <span>{label}</span>
      )}
    </button>
  );
}

function SidebarSearchButton({ isCollapsed }: { isCollapsed: boolean }) {
  const activeTab = useV4AppStateStore((state) => state.activeTab);
  const openSearch = useV4AppStateStore((state) => state.openSearch);
  const isActive = activeTab === "search";

  return (
    <button
      onClick={openSearch}
      className={cn(sidebarNavItemVariants({ variant: "secondary", isActive, isCollapsed }))}
    >
      <SearchIcon size={16} />
      {!isCollapsed && (
        <span>Search</span>
      )}
    </button>
  );
}

function DesktopMiniPlayerButton({ isCollapsed }: { isCollapsed: boolean }) {
  const { hasDesktopBridge, windowRole, miniPlayerVisible, toggleMiniPlayer } =
    useDesktopRuntime();

  if (!hasDesktopBridge || windowRole !== "desktop-main") return null;

  return (
    <button
      onClick={() => void toggleMiniPlayer()}
      className={cn(
        sidebarNavItemVariants({
          variant: "secondary",
          isActive: miniPlayerVisible,
          isCollapsed,
        })
      )}
      aria-pressed={miniPlayerVisible}
    >
      <PictureInPicture2 size={16} />
      {!isCollapsed && <span>Mini Player</span>}
    </button>
  );
}

export default function V1Sidebar() {
  const activeTab = useV4AppStateStore((state) => state.activeTab);
  const setActiveTab = useV4AppStateStore((state) => state.setActiveTab);
  const setIsFocusMode = useV4AppStateStore((state) => state.setIsFocusMode);
  const sidebarCollapsed = useV4AppStateStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useV4AppStateStore((state) => state.toggleSidebar);

  const handleItemClick = (item: V4Tab) => {
    setActiveTab(item);
  };

  return (
    <aside
      className="self-stretch rounded-lg bg-foreground/5 z-40 flex flex-col group/sidebar"
      style={{
        paddingLeft: sidebarCollapsed ? 0 : V4_SIDEBAR_PX,
        paddingRight: sidebarCollapsed ? 0 : V4_SIDEBAR_PX,
      }}
    >
      {/* Top */}
      <div
        className="flex items-center justify-between shrink-0"
        style={{ height: V4_HEADER_HEIGHT, justifyContent: sidebarCollapsed ? "center" : "flex-start" }}
      >
        {!sidebarCollapsed && (
          <Link
            href="/"
            className={cn(
              "flex items-center gap-2 flex-1 min-w-0 ml-3",
              sidebarCollapsed && "justify-center px-0"
            )}
          >
            <MusicIcon size={16} className="shrink-0 text-foreground" />
            <span className="text-base/tight font-medium text-foreground truncate">
              YouTube Muse
            </span>
          </Link>
        )}
        {sidebarCollapsed ? (
          <button
            onClick={toggleSidebar}
            className="items-center flex justify-center rounded-md hover:bg-foreground/10 text-foreground/60 hover:text-foreground transition-colors shrink-0 size-9 select-none cursor-pointer"
            aria-label="Expand sidebar"
          >
            <PanelLeft size={18} />
          </button>
        ) : (
          <button
            onClick={toggleSidebar}
            className="items-center flex justify-center rounded-md hover:bg-foreground/10 text-foreground/60 hover:text-foreground transition-colors shrink-0 size-9 opacity-0 group-hover/sidebar:opacity-100 trans select-none cursor-pointer"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose size={18} />
          </button>
        )}
      </div>

      <nav className={cn("flex flex-col gap-0.5", sidebarCollapsed && "items-center")}>
        {V4TAB_ITEMS.map((item) => (
          <SidebarNavItem
            key={item.value}
            isCollapsed={sidebarCollapsed}
            icon={item.icon}
            label={item.label}
            isActive={activeTab === item.value}
            onSelect={() => handleItemClick(item.value)}
          />
        ))}
        <SidebarNavItem
          isCollapsed={sidebarCollapsed}
          icon={ZenIcon}
          label="Focus"
          isActive={false}
          onSelect={() => setIsFocusMode(true)}
        />
        <SidebarSearchButton isCollapsed={sidebarCollapsed} />
        <PlayUrlDialog
          trigger={
            <button
              className={cn(sidebarNavItemVariants({ variant: "secondary", isActive: false, isCollapsed: sidebarCollapsed }))}
            >
              <Link2 size={16} />
              {!sidebarCollapsed && <span>Quick Play</span>}
            </button>
          }
        />
        <DesktopMiniPlayerButton isCollapsed={sidebarCollapsed} />
      </nav>

      <div className={cn("mt-auto mb-4 flex flex-col gap-1", sidebarCollapsed && "items-center")}>
        <AboutDialog sidebarCollapsed={sidebarCollapsed} />
      </div>
    </aside>
  );
}