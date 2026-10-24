import type { ButtonHTMLAttributes, ReactNode } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "plain" | "danger" | "ok";
  block?: boolean;
  children: ReactNode;
}

export function Button({ variant = "primary", block, className, children, ...rest }: Props) {
  const cls = ["btn", variant !== "primary" ? variant : "", block ? "block" : "", className ?? ""].filter(Boolean).join(" ");
  return (
    <button type="button" className={cls} {...rest}>
      {children}
    </button>
  );
}
