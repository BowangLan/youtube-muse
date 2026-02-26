import { V4Tab } from "@/lib/store/v4-app-state-store";
import { ListMusic, RssIcon } from "lucide-react";

export type V4TabItem = {
  icon: (props: { size?: number }) => React.ReactNode;
  label: string;
  value: V4Tab;
};

export const V4TAB_ITEMS: V4TabItem[] = [
  {
    icon: ListMusic,
    label: "Playlists",
    value: "intents",
  },
  {
    icon: RssIcon,
    label: "Feed",
    value: "channels",
  },
];
