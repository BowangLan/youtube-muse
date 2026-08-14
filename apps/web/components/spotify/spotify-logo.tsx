import type { SVGProps } from "react";

type SpotifyLogoProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export function SpotifyLogo({ size, style, ...props }: SpotifyLogoProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      style={{ width: size, height: size, ...style }}
      {...props}
    >
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.502 17.308a.747.747 0 0 1-1.029.249c-2.818-1.722-6.365-2.111-10.542-1.157a.748.748 0 1 1-.333-1.458c4.571-1.045 8.492-.595 11.655 1.338.352.215.464.676.249 1.028zm1.469-3.267a.935.935 0 0 1-1.286.308c-3.226-1.983-8.144-2.558-11.96-1.4a.936.936 0 0 1-.543-1.79c4.36-1.323 9.78-.682 13.481 1.596.44.27.578.846.308 1.286zm.126-3.403C15.23 8.34 8.876 8.129 5.186 9.25a1.122 1.122 0 1 1-.652-2.148c4.237-1.286 11.28-1.038 15.73 1.605a1.123 1.123 0 0 1-1.147 1.931z" />
    </svg>
  );
}
