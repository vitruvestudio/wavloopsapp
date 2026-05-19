import type { Metadata } from "next";
import Link from "next/link";
import { Atmosphere } from "@/components/landingPage/atmosphere";
import { PreviewLivePage } from "@/components/landingPage/previewLivePage";

export const metadata: Metadata = {
  title: "Night Shift 03 by 40minsmusic — Free kit",
  description:
    "Free drum kit + loops. Complete the actions to unlock your download.",
};

export default function PreviewPage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-bg">
      <Atmosphere intensity="soft" />

      <div className="relative flex flex-1 flex-col">
        {/* Top back link */}
        <div className="px-s-4 py-s-4 sm:px-s-5 sm:py-s-5">
          <Link
            href="/"
            className="group inline-flex items-center gap-s-2 rounded-r-1 border border-line-strong bg-surface-1/60 px-s-3 py-s-2 font-mono text-mono-tiny uppercase tracking-mono-button text-text-2 backdrop-blur-md transition-colors duration-wav ease-wav hover:border-text-1 hover:text-text-1"
          >
            <span
              aria-hidden
              className="transition-transform duration-wav ease-wav group-hover:-translate-x-[2px]"
            >
              ←
            </span>
            Back to Wavloops
          </Link>
        </div>

        {/* Centered card */}
        <div className="flex flex-1 items-center justify-center px-s-4 pb-s-7 pt-s-5 sm:px-s-5">
          <PreviewLivePage />
        </div>

        {/* Footer attribution */}
        <div className="px-s-4 py-s-4 text-center sm:py-s-5">
          <span className="font-mono text-mono-tiny uppercase tracking-mono-eyebrow text-text-3">
            <span className="inline-flex items-center gap-s-1">
              <span aria-hidden className="h-[6px] w-[6px] flex-shrink-0 bg-accent" />
              Powered by{" "}
              <span className="font-semibold text-text-1">Wavloops</span>
            </span>
            <span aria-hidden className="mx-s-2 text-line-strong">·</span>
            Demo page
          </span>
        </div>
      </div>
    </div>
  );
}
