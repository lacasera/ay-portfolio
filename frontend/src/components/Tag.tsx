import type { ReactNode } from "react";

export function Tag({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
}
