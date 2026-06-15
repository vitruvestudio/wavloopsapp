/**
 * UploadTrigger — a thin client wrapper that renders any element as
 * the trigger for the UploadModal. Lets the Library page (server
 * component) stay server-rendered while still wiring the modal state
 * client-side.
 *
 *   <UploadTrigger as={
 *     <Button icon="upload">Upload a beat</Button>
 *   } />
 *
 * Multiple instances on the same page each manage their own modal —
 * that's fine, only one can be open at a time anyway because they all
 * point to the same page (clicking one disables the others until close).
 */

"use client";

import * as React from "react";
import { UploadModal } from "@/components/app/UploadModal";

interface UploadTriggerProps {
  children: React.ReactNode;
  /** Wrapper `display` mode. Default "inline-block" works for buttons.
   *  Pass "block" when wrapping a full-width row (e.g. the library
   *  dropzone banner) so the child can stretch edge-to-edge. */
  block?: boolean;
}

export function UploadTrigger({ children, block }: UploadTriggerProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <span
        onClick={() => setOpen(true)}
        className={block ? "block" : "inline-block"}
      >
        {children}
      </span>
      <UploadModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
