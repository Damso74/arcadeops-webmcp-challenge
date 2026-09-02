import type { SVGProps } from "react";

type BrandMarkProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  label?: string;
};

/** Canonical ArcadeOps Checkpoint V3 mark. */
export function BrandMark({ label, ...props }: BrandMarkProps) {
  return (
    <svg
      aria-hidden={label ? undefined : true}
      aria-label={label}
      fill="none"
      role={label ? "img" : undefined}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M4 2H20A2 2 0 0 1 22 4V8H18L15 11H11L8 14H2V4A2 2 0 0 1 4 2Z" fill="currentColor" />
      <path d="M2 17H9L12 14H16L19 11H22V20A2 2 0 0 1 20 22H4A2 2 0 0 1 2 20Z" fill="currentColor" />
      <path d="M12 11H15V14H12Z" fill="var(--brand-copper)" />
    </svg>
  );
}
