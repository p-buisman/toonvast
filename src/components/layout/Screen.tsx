import type { ReactNode } from "react";

interface Props {
  title?: string;
  /** Something at the left of the title, usually a back or close button. */
  left?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  /** The bottom tab bar, when the screen has one. */
  footer?: ReactNode;
}

export function Screen({ title, left, right, children, footer }: Props) {
  return (
    <>
      <div className="screen">
        {(title || left || right) && (
          <div className="screen-head">
            {left}
            {title && <h1>{title}</h1>}
            {right}
          </div>
        )}
        {children}
      </div>
      {footer}
    </>
  );
}

export function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className="icon-btn" aria-label={label} onClick={onClick}>
      {children}
    </button>
  );
}
