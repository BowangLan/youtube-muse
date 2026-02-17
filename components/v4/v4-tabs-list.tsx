import { V4TAB_ITEMS } from "./v4-tabs-config";
import { V4TabsSectionView } from "./v4-tabs-section.view";
import { useAppStateStore, V4Tab } from "@/lib/store/app-state-store";

export function V4TabsSection({
  className,
}: {
  className?: string;
}) {
  const activeTab = useAppStateStore((state) => state.activeTab);
  const setActiveTab = useAppStateStore((state) => state.setActiveTab);

  const handleItemClick = (item: V4Tab) => {
    setActiveTab(item);
  };

  return (
    <V4TabsSectionView items={V4TAB_ITEMS} activeItem={activeTab} onItemClick={handleItemClick} className={className} />
  );
}