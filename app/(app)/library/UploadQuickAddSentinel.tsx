/**
 * UploadQuickAddSentinel — auto-opens the UploadModal on /library
 * when the URL carries `?upload=1`. Used by the Sidebar's Quick add
 * → "Upload a beat" item so a single click anywhere in the app
 * lands the producer in the file-picker flow.
 *
 * Sits as a single instance in the Library page next to the other
 * UploadTrigger instances — they all open the same modal type, but
 * only this one responds to the URL param, so a refresh of /library
 * (after the param is cleaned) doesn't re-open the picker.
 */

"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { UploadModal } from "@/components/app/UploadModal";

export function UploadQuickAddSentinel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (searchParams.get("upload") === "1") {
      setOpen(true);
      // Strip the param so a refresh doesn't keep re-opening and
      // the URL stays clean for shareability.
      const cleaned = new URLSearchParams(searchParams.toString());
      cleaned.delete("upload");
      const qs = cleaned.toString();
      router.replace(qs ? `/library?${qs}` : "/library", { scroll: false });
    }
  }, [searchParams, router]);

  return <UploadModal open={open} onClose={() => setOpen(false)} />;
}
