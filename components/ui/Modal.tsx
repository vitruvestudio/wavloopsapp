/**
 * Modal — vanilla overlay primitive. Centered card + backdrop with
 * blur. Click-outside closes, Escape closes, body scroll locked while
 * open. Lightweight (~50 lines) — when we need richer behaviour
 * (focus trap, controlled animation) we'll swap to Radix Dialog.
 *
 *   <Modal open={open} onClose={…}>
 *     <YourPanel />
 *   </Modal>
 *
 * The child panel owns its own width, padding, and rounded corners.
 * The Modal is just the chrome.
 *
 * Rendered through a Portal at document.body so the modal escapes any
 * `overflow: hidden` ancestor and z-indexes above the App shell.
 */

"use client";

import * as React from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** ARIA label for the backdrop (used by screen readers as the
   *  "click here to dismiss" target). Defaults to "Close dialog". */
  ariaCloseLabel?: string;
}

export function Modal({
  open,
  onClose,
  children,
  ariaCloseLabel = "Close dialog",
}: ModalProps) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ padding: 16 }}
    >
      <button
        type="button"
        aria-label={ariaCloseLabel}
        onClick={onClose}
        className="absolute inset-0 border-0 cursor-default"
        style={{
          background: "oklch(0 0 0 / 0.7)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
      />
      <div
        className="relative"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "100%", maxHeight: "100%" }}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
