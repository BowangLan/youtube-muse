import { V4_HEADER_HEIGHT } from "./v4-constants";

export function V4MainContentHeader() {
  return (
    <div className="absolute top-0 left-0 right-0 backdrop-blur-xl z-50 rounded-lg w-full" style={{ height: V4_HEADER_HEIGHT }}>
    </div>
  );
}