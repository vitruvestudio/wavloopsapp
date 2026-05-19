import Link from "next/link";

type FooterLink = { label: string; href: string; external?: boolean };

const PRODUCT_LINKS: FooterLink[] = [
  { label: "Live preview", href: "/preview" },
  { label: "Claim early access", href: "/onboarding_early" },
  { label: "Pricing", href: "/#waitlist" },
];

const COMPANY_LINKS: FooterLink[] = [
  { label: "Contact", href: "mailto:hello@wavloops.com", external: true },
  { label: "Privacy", href: "#" },
  { label: "Terms", href: "#" },
];

function LinkColumn({
  title,
  links,
}: {
  title: string;
  links: FooterLink[];
}) {
  return (
    <div className="flex flex-col gap-s-3">
      <span className="font-mono text-mono-tiny uppercase tracking-mono-eyebrow text-text-3">
        {title}
      </span>
      <ul className="flex flex-col gap-s-2">
        {links.map((link) => (
          <li key={link.label}>
            {link.external ? (
              <a
                href={link.href}
                className="text-[13px] text-text-2 transition-colors duration-wav ease-wav hover:text-text-1"
              >
                {link.label}
              </a>
            ) : (
              <Link
                href={link.href}
                className="text-[13px] text-text-2 transition-colors duration-wav ease-wav hover:text-text-1"
              >
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="relative border-t border-line bg-bg">
      <div className="mx-auto max-w-7xl px-s-4 py-s-7 sm:px-s-5 sm:py-s-8">
        {/* Top section */}
        <div className="grid gap-s-7 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand block — spans 2 cols on lg */}
          <div className="flex flex-col gap-s-3 lg:col-span-2">
            <Link
              href="/"
              aria-label="Wavloops home"
              className="flex items-center gap-s-2"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/Photos/wavloops-icon.png"
                alt=""
                className="h-[18px] w-[18px]"
              />
              <span className="font-display text-[18px] font-extrabold uppercase leading-none tracking-[-0.04em] text-text-1">
                Wavloops
              </span>
            </Link>
            <p className="max-w-sm text-[13px] leading-snug text-text-2">
              Gated downloads for music producers. Turn every free kit into
              emails, followers, and future buyers.
            </p>
          </div>

          <LinkColumn title="Product" links={PRODUCT_LINKS} />
          <LinkColumn title="Company" links={COMPANY_LINKS} />
        </div>

        {/* Bottom bar */}
        <div className="mt-s-7 flex flex-col items-start gap-s-3 border-t border-line pt-s-5 sm:flex-row sm:items-center sm:justify-between sm:gap-s-5">
          <p className="font-mono text-mono-tiny uppercase tracking-mono-eyebrow text-text-3">
            © 2026 Wavloops{" "}
            <span aria-hidden className="mx-s-1 text-line-strong">·</span>{" "}
            Built for producers
          </p>
          <p className="inline-flex items-center gap-s-2 font-mono text-mono-tiny uppercase tracking-mono-eyebrow text-text-3">
            <span aria-hidden className="h-[6px] w-[6px] animate-pulse bg-accent" />
            <span className="text-text-1">Private launch June 20</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
