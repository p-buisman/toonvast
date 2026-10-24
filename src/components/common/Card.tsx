import type { HTMLAttributes, ReactNode } from "react";

interface Props extends HTMLAttributes<HTMLDivElement> {
  tight?: boolean;
  children: ReactNode;
}

export function Card({ tight, className, children, ...rest }: Props) {
  return (
    <div className={["card", tight ? "tight" : "", className ?? ""].filter(Boolean).join(" ")} {...rest}>
      {children}
    </div>
  );
}
