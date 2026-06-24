/**
 * Root mdx-components.tsx — REQUIRED by @next/mdx in App Router.
 *
 * Maps native HTML elements emitted by remark/rehype to Wavloops
 * design-system primitives. The mapping favours readability for
 * long-form content (blog posts, pillar guides) while staying
 * aligned with our display / body type ramp and accent colour
 * tokens — so an MDX page reads as part of the landing surface,
 * not a generic prose dump.
 *
 * Scope: every .mdx file in the project pulls these by default.
 * Per-page overrides remain possible via the `components` prop on
 * imported MDX components (see Next.js MDX docs).
 *
 * Implementation notes:
 *   - `headings` use clamp() so the same H2 reads cleanly from a
 *     phone to a 1440 monitor without media queries.
 *   - `code` (inline) sits on bg-2 with a thin border so it stands
 *     out without screaming. Fenced code blocks (<pre>) get a wider
 *     container, monospace font, and a soft accent tint so they
 *     feel native to the cinematic landing aesthetic.
 *   - Links are accent-coloured with a soft underline; no garish
 *     blue. Aligned with the rest of the landing chrome.
 *   - Tables get a clean border + striped rows so comparison
 *     matrices in pillar posts read like the landing's design.
 *   - Images go through next/image so they're auto-optimised; the
 *     `src` types accept string or the StaticImageData shape an
 *     `import logo from "@/public/x.png"` would produce.
 */

import type { MDXComponents } from "mdx/types";
import NextImage, { type ImageProps } from "next/image";
import Link from "next/link";
import * as React from "react";

const components: MDXComponents = {
  /* ============================================================
     Headings — typographic ramp aligned with t-display tokens.
     ============================================================ */
  h1: ({ children, ...props }) => (
    <h1
      className="t-display"
      style={{
        fontSize: "clamp(34px, 5vw, 56px)",
        lineHeight: 1.04,
        letterSpacing: "-0.02em",
        marginTop: 8,
        marginBottom: 24,
        color: "var(--fg-1)",
      }}
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2
      className="t-display"
      style={{
        fontSize: "clamp(26px, 3.4vw, 36px)",
        lineHeight: 1.15,
        letterSpacing: "-0.018em",
        marginTop: 56,
        marginBottom: 18,
        color: "var(--fg-1)",
      }}
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3
      style={{
        fontFamily: "var(--font-display)",
        fontWeight: 600,
        fontSize: "clamp(20px, 2.4vw, 24px)",
        lineHeight: 1.25,
        marginTop: 36,
        marginBottom: 14,
        color: "var(--fg-1)",
      }}
      {...props}
    >
      {children}
    </h3>
  ),
  h4: ({ children, ...props }) => (
    <h4
      style={{
        fontFamily: "var(--font-body)",
        fontWeight: 600,
        fontSize: 18,
        lineHeight: 1.3,
        marginTop: 28,
        marginBottom: 10,
        color: "var(--fg-1)",
      }}
      {...props}
    >
      {children}
    </h4>
  ),

  /* ============================================================
     Body text — paragraph + inline emphasis.
     ============================================================ */
  p: ({ children, ...props }) => (
    <p
      style={{
        fontFamily: "var(--font-body)",
        fontSize: 17,
        lineHeight: 1.7,
        color: "var(--fg-2)",
        marginTop: 0,
        marginBottom: 18,
      }}
      {...props}
    >
      {children}
    </p>
  ),
  strong: ({ children, ...props }) => (
    <strong style={{ color: "var(--fg-1)", fontWeight: 600 }} {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }) => (
    <em style={{ color: "var(--fg-2)", fontStyle: "italic" }} {...props}>
      {children}
    </em>
  ),

  /* ============================================================
     Lists.
     ============================================================ */
  ul: ({ children, ...props }) => (
    <ul
      style={{
        listStyle: "disc",
        paddingLeft: 24,
        marginTop: 0,
        marginBottom: 22,
        color: "var(--fg-2)",
      }}
      {...props}
    >
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol
      style={{
        listStyle: "decimal",
        paddingLeft: 24,
        marginTop: 0,
        marginBottom: 22,
        color: "var(--fg-2)",
      }}
      {...props}
    >
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li
      style={{
        fontFamily: "var(--font-body)",
        fontSize: 17,
        lineHeight: 1.6,
        marginBottom: 8,
      }}
      {...props}
    >
      {children}
    </li>
  ),

  /* ============================================================
     Links — relative URLs go through next/link for SPA-style
     transitions; external URLs stay anchors with proper rel.
     ============================================================ */
  a: ({ href, children, ...props }) => {
    const isExternal =
      typeof href === "string" &&
      (href.startsWith("http://") || href.startsWith("https://"));
    const isHash = typeof href === "string" && href.startsWith("#");
    const linkStyle: React.CSSProperties = {
      color: "var(--accent-text)",
      textDecoration: "underline",
      textDecorationThickness: 1,
      textUnderlineOffset: 3,
      textDecorationColor: "color-mix(in oklch, var(--accent-text) 40%, transparent)",
    };
    if (isExternal) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          style={linkStyle}
          {...props}
        >
          {children}
        </a>
      );
    }
    if (isHash || !href) {
      return (
        <a href={href} style={linkStyle} {...props}>
          {children}
        </a>
      );
    }
    return (
      <Link href={href} style={linkStyle} {...props}>
        {children}
      </Link>
    );
  },

  /* ============================================================
     Blockquote — soft accent left rail; reads as a callout.
     ============================================================ */
  blockquote: ({ children, ...props }) => (
    <blockquote
      style={{
        borderLeft: "3px solid var(--accent-text)",
        paddingLeft: 18,
        marginLeft: 0,
        marginTop: 24,
        marginBottom: 24,
        color: "var(--fg-2)",
        fontStyle: "italic",
        fontSize: 18,
        lineHeight: 1.6,
      }}
      {...props}
    >
      {children}
    </blockquote>
  ),

  /* ============================================================
     Code — inline + fenced. Fenced blocks get a subtle accent
     tint so they feel native to the landing aesthetic.
     ============================================================ */
  code: ({ children, ...props }) => (
    <code
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: "0.9em",
        background: "var(--bg-2)",
        border: "1px solid var(--border-1)",
        borderRadius: "var(--r-sm)",
        padding: "2px 6px",
        color: "var(--fg-1)",
      }}
      {...props}
    >
      {children}
    </code>
  ),
  pre: ({ children, ...props }) => (
    <pre
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 14,
        lineHeight: 1.6,
        background: "var(--bg-inset)",
        border: "1px solid var(--border-1)",
        borderRadius: "var(--r-md)",
        padding: 20,
        overflowX: "auto",
        marginTop: 24,
        marginBottom: 24,
        color: "var(--fg-1)",
      }}
      {...props}
    >
      {children}
    </pre>
  ),

  /* ============================================================
     Tables — GFM tables in pillar/comparison content.
     ============================================================ */
  table: ({ children, ...props }) => (
    <div style={{ marginTop: 24, marginBottom: 24, overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontFamily: "var(--font-body)",
          fontSize: 15,
          border: "1px solid var(--border-1)",
          borderRadius: "var(--r-md)",
          overflow: "hidden",
        }}
        {...props}
      >
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead style={{ background: "var(--bg-2)" }} {...props}>
      {children}
    </thead>
  ),
  th: ({ children, ...props }) => (
    <th
      style={{
        textAlign: "left",
        padding: "10px 14px",
        color: "var(--fg-1)",
        fontWeight: 600,
        borderBottom: "1px solid var(--border-1)",
      }}
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td
      style={{
        padding: "10px 14px",
        color: "var(--fg-2)",
        borderBottom: "1px solid var(--border-1)",
      }}
      {...props}
    >
      {children}
    </td>
  ),

  /* ============================================================
     Horizontal rule — soft divider.
     ============================================================ */
  hr: ({ ...props }) => (
    <hr
      style={{
        border: 0,
        borderTop: "1px solid var(--border-1)",
        margin: "40px 0",
      }}
      {...props}
    />
  ),

  /* ============================================================
     Image — auto-optimised. Falls back to a plain <img> when MDX
     hands us a src that isn't a static import (e.g. a remote URL).
     ============================================================ */
  img: (props) => {
    const { src, alt = "", width, height, ...rest } = props as ImageProps & {
      src?: string;
    };
    if (typeof src === "string" && (!width || !height)) {
      // eslint-disable-next-line @next/next/no-img-element
      return (
        <img
          src={src}
          alt={alt}
          style={{
            width: "100%",
            height: "auto",
            display: "block",
            borderRadius: "var(--r-md)",
            margin: "24px 0",
          }}
          {...rest}
        />
      );
    }
    return (
      <NextImage
        src={src as ImageProps["src"]}
        alt={alt}
        width={Number(width) || 1200}
        height={Number(height) || 630}
        style={{
          width: "100%",
          height: "auto",
          display: "block",
          borderRadius: "var(--r-md)",
          margin: "24px 0",
        }}
        {...rest}
      />
    );
  },
};

export function useMDXComponents(): MDXComponents {
  return components;
}
