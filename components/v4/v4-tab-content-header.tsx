export function V4TabContentHeader({
  title,
}: {
  title: string;
}) {
  return (
    <div className="sticky top-0 pb-4 backdrop-blur hidden">
      <h2 className="text-xl font-medium text-white/60 uppercase tracking-wider">{title}</h2>
    </div>
  );
}