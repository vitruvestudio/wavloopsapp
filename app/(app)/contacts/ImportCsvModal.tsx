/**
 * ImportCsvModal — bulk-import contacts from a CSV file.
 *
 * Flow:
 *   1. Producer picks a CSV (drag-drop OR click to choose).
 *   2. Papa Parse tokenises rows in the browser; we normalise
 *      headers to a canonical set (email / name / phone / roles
 *      + one column per social platform) and surface the first 5
 *      rows as a preview so the producer can sanity-check the
 *      detection before committing.
 *   3. Optionally pick servers to attach every imported contact to.
 *   4. "Import N contacts" fires importContactsAction → bulk upsert
 *      on contacts + bulk insert on server_contacts. Idempotent
 *      via the onConflict policies in the action.
 *   5. Result card shows {imported, skipped} and closes after a
 *      brief moment so the producer sees the new rows on the page.
 *
 * Accepted CSV headers (case + space + underscore-insensitive):
 *   identity    : email, e-mail
 *   name        : name, full name, nom
 *   phone       : phone, tel, telephone, téléphone
 *   roles       : roles, role, type    (comma OR `;` OR `·` separated)
 *   instagram   : instagram, ig
 *   x           : x, twitter
 *   youtube     : youtube, yt
 *   tiktok      : tiktok
 *   soundcloud  : soundcloud, sc
 *   genius      : genius
 *   website     : website, site, url
 *
 * Rows missing a parseable email get dropped silently (skipped
 * count is reported back). The action layer dedupes by email
 * within the batch — re-uploading the same CSV is safe.
 */

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { UpgradeRequiredModal } from "@/components/billing/UpgradeRequiredModal";
import type { PlanKey } from "@/lib/billing/plans";
import { importContactsAction, type CsvContactRow } from "./actions";
import type { ServerStub } from "./page";

interface ImportCsvModalProps {
  allServers: ServerStub[];
  onClose: () => void;
}

/** Map of canonical-key → set of header aliases the producer might
 *  use in their spreadsheet. Header normalisation: lowercase + drop
 *  spaces / underscores / hyphens. */
const HEADER_ALIASES: Record<string, string[]> = {
  email: ["email", "emailaddress"],
  name: ["name", "fullname", "nom"],
  phone: ["phone", "tel", "telephone", "téléphone", "phonenumber"],
  roles: ["roles", "role", "type", "types"],
  instagram: ["instagram", "ig", "insta"],
  x: ["x", "twitter"],
  youtube: ["youtube", "yt"],
  tiktok: ["tiktok"],
  soundcloud: ["soundcloud", "sc"],
  genius: ["genius"],
  website: ["website", "site", "url", "link"],
};

function canonicalHeader(raw: string): string | null {
  const norm = raw.toLowerCase().replace(/[\s_\-./]/g, "");
  for (const [canonical, aliases] of Object.entries(HEADER_ALIASES)) {
    if (aliases.includes(norm)) return canonical;
  }
  return null;
}

function splitMulti(v: string): string[] {
  return v
    .split(/[,;·]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function ImportCsvModal({ allServers, onClose }: ImportCsvModalProps) {
  const router = useRouter();
  const [file, setFile] = React.useState<File | null>(null);
  const [rows, setRows] = React.useState<CsvContactRow[]>([]);
  const [parseError, setParseError] = React.useState<string | null>(null);
  const [parsing, setParsing] = React.useState(false);
  const [serverIds, setServerIds] = React.useState<string[]>([]);
  const [result, setResult] = React.useState<{
    imported: number;
    skipped: number;
  } | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  /** Quota gate fired on the CSV size — pop the upgrade modal
   *  instead of the inline banner. */
  const [upgradeCtx, setUpgradeCtx] = React.useState<{
    plan: PlanKey;
    reason: string;
  } | null>(null);
  const [pending, startTransition] = React.useTransition();
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Lock body scroll while open + close on Escape.
  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, pending]);

  const onPickFile = (f: File) => {
    setFile(f);
    setParseError(null);
    setRows([]);
    setResult(null);
    setActionError(null);
    setParsing(true);

    Papa.parse<Record<string, string>>(f, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete: (res) => {
        setParsing(false);
        if (res.errors.length > 0) {
          setParseError(res.errors[0].message);
          return;
        }
        const parsed: CsvContactRow[] = [];
        for (const raw of res.data) {
          // Map each cell against the canonical header.
          const cell: Record<string, string> = {};
          for (const [key, val] of Object.entries(raw)) {
            const c = canonicalHeader(key);
            if (c) cell[c] = (val ?? "").trim();
          }
          if (!cell.email) continue;
          const socials: Record<string, string> = {};
          for (const p of ["instagram", "x", "youtube", "tiktok", "soundcloud", "genius", "website"]) {
            if (cell[p]) socials[p] = cell[p];
          }
          parsed.push({
            email: cell.email,
            name: cell.name || null,
            phone: cell.phone || null,
            roles: cell.roles ? splitMulti(cell.roles) : [],
            socials,
          });
        }
        setRows(parsed);
      },
      error: (err) => {
        setParsing(false);
        setParseError(err.message);
      },
    });
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && /\.csv$/i.test(f.name)) onPickFile(f);
  };

  const toggleServer = (id: string) => {
    setServerIds((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
    );
  };

  const submit = () => {
    if (rows.length === 0 || pending) return;
    setActionError(null);
    startTransition(async () => {
      const res = await importContactsAction(rows, serverIds);
      if (res.error) {
        if (res.upgradeRequired) {
          // CSV row count would blow past the artists quota for
          // this plan — pop the upgrade modal instead of the
          // banner so the producer can fix it in one click.
          setUpgradeCtx({
            plan: res.upgradeRequired.plan,
            reason: res.error,
          });
        } else {
          setActionError(res.error);
        }
        return;
      }
      setResult({ imported: res.imported, skipped: res.skipped });
      router.refresh();
      // Hold the success card for ~1.6s so the producer reads the
      // count, then close.
      window.setTimeout(() => onClose(), 1600);
    });
  };

  return (
    <>
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Import contacts from CSV"
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ padding: 18 }}
    >
      {/* Backdrop */}
      <div
        onClick={() => !pending && onClose()}
        aria-hidden
        className="absolute inset-0"
        style={{
          background: "oklch(0 0 0 / 0.5)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
        }}
      />

      {/* Card */}
      <div
        className="relative flex flex-col bg-bg-0 border border-border-1"
        style={{
          width: "100%",
          maxWidth: 640,
          maxHeight: "min(820px, 92vh)",
          borderRadius: "var(--r-lg)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center border-b border-border-1 shrink-0"
          style={{ gap: 14, padding: "16px 18px" }}
        >
          <div
            className="flex items-center justify-center text-accent-text shrink-0"
            style={{
              width: 40,
              height: 40,
              borderRadius: "var(--r-md)",
              background: "var(--accent-surface)",
            }}
          >
            <Icon name="upload" size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="t-h2" style={{ fontSize: 18 }}>
              Import contacts
            </div>
            <div
              className="t-mono-s truncate"
              style={{ color: "var(--fg-3)", marginTop: 3 }}
            >
              CSV WITH EMAIL · NAME · PHONE · ROLES · SOCIALS
            </div>
          </div>
          <IconButton
            name="close"
            size={32}
            iconSize={18}
            onClick={() => !pending && onClose()}
            label="Close"
          />
        </div>

        {/* Body */}
        <div
          className="flex-1 overflow-y-auto"
          style={{ padding: 18 }}
        >
          {/* Success card overrides everything else when we get one */}
          {result ? (
            <SuccessCard
              imported={result.imported}
              skipped={result.skipped}
            />
          ) : (
            <>
              {/* File picker / dropzone */}
              <div
                onDrop={onDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => inputRef.current?.click()}
                className="flex flex-col items-center justify-center cursor-pointer transition-colors duration-fast hover:bg-bg-2"
                style={{
                  padding: file ? "20px 16px" : "36px 16px",
                  border: "1.5px dashed var(--border-2)",
                  borderRadius: "var(--r-md)",
                  marginBottom: 18,
                  background: "transparent",
                }}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (f) onPickFile(f);
                  }}
                />
                <div
                  className="flex items-center justify-center text-accent-text"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "var(--r-md)",
                    background: "var(--accent-surface)",
                    marginBottom: 10,
                  }}
                >
                  <Icon name="upload" size={20} />
                </div>
                {file ? (
                  <>
                    <span className="t-title" style={{ fontSize: 14 }}>
                      {file.name}
                    </span>
                    <span
                      className="t-mono-s"
                      style={{
                        marginTop: 4,
                        color: parsing
                          ? "var(--fg-3)"
                          : rows.length > 0
                            ? "var(--accent-text)"
                            : "var(--fg-4)",
                      }}
                    >
                      {parsing
                        ? "PARSING…"
                        : `${rows.length} ROW${rows.length === 1 ? "" : "S"} READY`}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="t-title" style={{ fontSize: 14 }}>
                      Drop a CSV or click to choose
                    </span>
                    <span
                      className="t-mono-s"
                      style={{ marginTop: 4, color: "var(--fg-4)" }}
                    >
                      FIRST ROW = HEADER · 1 CONTACT PER ROW
                    </span>
                  </>
                )}
              </div>

              {parseError && (
                <ErrorBanner>{parseError}</ErrorBanner>
              )}
              {actionError && <ErrorBanner>{actionError}</ErrorBanner>}

              {/* Preview */}
              {rows.length > 0 && (
                <>
                  <div
                    className="t-mono-s"
                    style={{ marginBottom: 10, color: "var(--fg-3)" }}
                  >
                    PREVIEW · FIRST {Math.min(5, rows.length)} OF{" "}
                    {rows.length}
                  </div>
                  <div
                    className="border border-border-1 bg-bg-1 overflow-hidden"
                    style={{
                      borderRadius: "var(--r-md)",
                      marginBottom: 18,
                    }}
                  >
                    {rows.slice(0, 5).map((r, i) => (
                      <div
                        key={r.email + i}
                        className="border-t border-border-1 first:border-t-0"
                        style={{ padding: "10px 14px" }}
                      >
                        <div
                          className="t-body-s"
                          style={{
                            fontWeight: 600,
                            color: "var(--fg-1)",
                          }}
                        >
                          {r.name ?? r.email}
                        </div>
                        <div
                          className="t-mono-s truncate"
                          style={{
                            color: "var(--fg-3)",
                            marginTop: 3,
                          }}
                        >
                          {r.email}
                          {r.phone && ` · ${r.phone}`}
                          {r.roles.length > 0 &&
                            ` · ${r.roles.join(", ")}`}
                          {Object.keys(r.socials).length > 0 &&
                            ` · ${Object.keys(r.socials).join("/")}`}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Servers picker */}
                  {allServers.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <div
                        className="t-mono-s"
                        style={{ marginBottom: 10 }}
                      >
                        ATTACH ALL TO SERVERS · OPTIONAL
                      </div>
                      <div className="flex flex-wrap" style={{ gap: 8 }}>
                        {allServers.map((s) => {
                          const selected = serverIds.includes(s.id);
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => toggleServer(s.id)}
                              className="inline-flex items-center cursor-pointer transition-all duration-fast"
                              style={{
                                gap: 6,
                                padding: "6px 12px",
                                height: 30,
                                borderRadius: "var(--r-pill)",
                                border: `1px solid ${selected ? "var(--accent)" : "var(--border-1)"}`,
                                background: selected
                                  ? "var(--accent-surface)"
                                  : "var(--bg-1)",
                                color: selected
                                  ? "var(--accent-text)"
                                  : "var(--fg-2)",
                                fontFamily: "var(--font-mono)",
                                fontSize: 11,
                                fontWeight: 600,
                                letterSpacing: "0.06em",
                                textTransform: "uppercase",
                              }}
                            >
                              <Icon name="server" size={12} />
                              {s.name}
                              {selected && <Icon name="check" size={12} />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end border-t border-border-1 shrink-0"
          style={{ padding: "14px 18px", gap: 8 }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => !pending && onClose()}
            disabled={pending}
            className="!h-[36px]"
          >
            {result ? "Done" : "Cancel"}
          </Button>
          {!result && (
            <Button
              icon="upload"
              size="sm"
              onClick={submit}
              disabled={rows.length === 0 || pending}
              className="!h-[36px]"
            >
              {pending
                ? "Importing…"
                : rows.length > 0
                  ? `Import ${rows.length}`
                  : "Import"}
            </Button>
          )}
        </div>
      </div>
    </div>

    {/* Upgrade modal — fires when the CSV row count would push
        the producer past their artists quota. Layered above the
        importer so their draft selection stays intact. */}
    <UpgradeRequiredModal
      open={upgradeCtx !== null}
      onClose={() => setUpgradeCtx(null)}
      currentPlan={upgradeCtx?.plan ?? "free"}
      reason={upgradeCtx?.reason ?? ""}
    />
    </>
  );
}

/* ============================================================
   Small helpers
   ============================================================ */

function ErrorBanner({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="alert"
      className="t-body-s"
      style={{
        marginBottom: 18,
        padding: "10px 12px",
        borderRadius: "var(--r-md)",
        background: "var(--danger-surface)",
        color: "var(--danger)",
        border: "1px solid var(--danger)",
      }}
    >
      {children}
    </div>
  );
}

function SuccessCard({
  imported,
  skipped,
}: {
  imported: number;
  skipped: number;
}) {
  return (
    <div
      className="flex flex-col items-center text-center"
      style={{ padding: "24px 16px", gap: 8 }}
    >
      <div
        className="flex items-center justify-center text-accent-text"
        style={{
          width: 56,
          height: 56,
          borderRadius: "var(--r-lg)",
          background: "var(--accent-surface)",
          marginBottom: 8,
        }}
      >
        <Icon name="check" size={28} />
      </div>
      <div className="t-h2" style={{ fontSize: 18 }}>
        {imported} contact{imported === 1 ? "" : "s"} imported
      </div>
      <div className="t-mono-s" style={{ color: "var(--fg-3)" }}>
        {skipped > 0
          ? `${skipped} ROW${skipped === 1 ? "" : "S"} SKIPPED (NO VALID EMAIL)`
          : "ALL ROWS SAVED · NO SKIPS"}
      </div>
    </div>
  );
}
