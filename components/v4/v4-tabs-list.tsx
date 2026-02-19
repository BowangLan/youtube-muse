import { V4TAB_ITEMS } from "./v4-tabs-config";
import { V4TabsSectionView } from "./v4-tabs-section.view";
import { useV4AppStateStore, V4Tab, V4TabWithDetail } from "@/lib/store/v4-app-state-store";

export function V4TabsSection({
  className,
}: {
  className?: string;
}) {
  const activeTab = useV4AppStateStore((state) => state.activeTab);
  const setActiveTab = useV4AppStateStore((state) => state.setActiveTab);

  const handleItemClick = (item: V4Tab) => {
    setActiveTab(item);
  };

  return (
    <V4TabsSectionView<V4Tab, V4TabWithDetail>
      items={V4TAB_ITEMS}
      activeItem={activeTab}
      onItemClick={handleItemClick}
      className={className}
    />
  );
}