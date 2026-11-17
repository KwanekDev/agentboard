import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

const TITLE = "AgentBoard: kanban board for humans and AI agents";
const DESC =
  "AgentBoard is an open-source kanban board where people plan and AI coding agents work. Drop a task; Claude Code, Codex or Cursor claim it over MCP.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  openGraph: {
    type: "website",
    title: TITLE,
    description: DESC,
    images: ["/share.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESC,
    images: ["/share.jpg"],
  },
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      data-type="software"
      data-radius="sharp"
      data-buttons="tonal"
      data-motion
    >
      <head>
        <meta name="site-kind" content="software" />
        <meta name="page-type" content="software" />
        <meta name="theme-color" content="#0f1f10" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wdth,wght@75..100,400..700&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="/assets/system.css" />
        <link rel="stylesheet" href="/assets/ui/cards.css" />
        <link rel="stylesheet" href="/assets/motion/motion.css" />
        <link rel="stylesheet" href="/assets/backgrounds/backgrounds.css" />
        <link rel="stylesheet" href="/assets/layout/layout.css" />
        <link rel="stylesheet" href="/assets/icons/icon.css" />
        <link rel="stylesheet" href="/assets/ui/base.css" />
        <link rel="stylesheet" href="/assets/ui/window/fragment.css" />
        <link rel="stylesheet" href="/assets/ui/pipeline-board/fragment.css" />
        <link rel="stylesheet" href="/assets/ui/terminal-run/fragment.css" />
        <link rel="stylesheet" href="/assets/ui/notify/fragment.css" />
        <link rel="stylesheet" href="/assets/ui/integrations/fragment.css" />
        <link rel="stylesheet" href="/assets/ui/toggles/fragment.css" />
        <link rel="stylesheet" href="/assets/diagrams/diagram.css" />
        <style>{String.raw`
:root {
  --p-bg: #0f1f10; --p-surface: #162a17; --p-ink: #ffffff; --p-muted: #9aa39a;
  --p-accent: #c6f19d; --p-accent-ink: #0f1f10; --p-action: #c6f19d; --p-action-ink: #0f1f10;
  --p-inv-bg: #ffffff; --p-inv-surface: #ecedec; --p-inv-ink: #0f1f10; --p-inv-muted: #606c60;
  --p-inv-accent: #0f1f10; --p-inv-accent-ink: #ffffff; --p-inv-action: #0f1f10; --p-inv-action-ink: #ffffff;
  --font-display: "Instrument Sans", system-ui, sans-serif;
  --font-text: "Instrument Sans", system-ui, sans-serif;
  --font-mono: "DM Mono", ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
  --display-weight: 500;
  --display-tracking: -0.028em;
  --display-tracking-xl: -0.036em;
  --display-stretch: 96%;
  --ly-scale: 1.04;

  /* page refinements (after kit rules) */
  .hero .hero__lead { color: var(--p-ink); }
  .btn.btn--secondary { background: transparent; border: 1px solid color-mix(in oklch, var(--p-ink) 55%, transparent); }
  .closing__cta .btn { max-width: 100%; }
  .close__word { font-size: clamp(40px, 14vw, 120px); line-height: 1.05; }
  #features .dg .dg-cap__l { color: var(--p-ink) !important; }
  .dg .dg-node--core { background: var(--p-accent) !important; }
  .dg .dg-node--core .dg-cap, .dg .dg-node--core .dg-cap__l { color: var(--p-accent-ink) !important; }
  .dg .dg-cap__l, .dg .dg-cap { color: var(--p-ink) !important; }
  .dg-node { background: var(--p-surface) !important; }
  #selfhost .ui-term { min-height: 420px; }
  #selfhost .frame--lit { min-height: 460px; }
  .stage { overflow: hidden; }
  .dg-node--core, .dg-node--tile { background: var(--p-accent) !important; }
  .dg-node--core .dg-cap, .dg-node--core .dg-cap__l, .dg-node--tile .dg-cap, .dg-node--tile .dg-cap__l { color: var(--p-accent-ink) !important; }
  .loop-pause:focus-visible, .ui-pause:focus-visible { outline: 2px solid #ffffff; outline-offset: 2px; box-shadow: 0 0 0 2px var(--p-bg); }
  .nav__bar .nav__logo { padding-left: 0; }
  .footer__mark { padding-left: 0 !important; margin-left: 0 !important; }
  @media (max-width: 639px) {
    .dg-hide-phone { display: none; }
    .dg-fallback { display: flex; } .footer__mark { margin-left: -21px !important; } }

  .dg-fallback { display: none; }
  @media (max-width: 639px) {
    .dg-hide-phone { display: none; }
    .dg-fallback { display: flex; }
    .nav__actions .btn { display: none; }
    .section-head--split { display: block; }
    .section-head--split .btn { width: 100%; min-width: 0; margin-top: var(--s-4); display: flex; justify-content: center; }
    .closing__cta .btn { width: 100%; }
  }

`}</style>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "document.documentElement.classList.add('m-enter');setTimeout(()=>document.documentElement.classList.add('m-enter-done'),700)",
          }}
        />
        <script src="/assets/backgrounds/backgrounds.js" />
        <script
          dangerouslySetInnerHTML={{
            __html:
              "document.documentElement.classList.add('mo-js');setTimeout(()=>document.documentElement.classList.add('mo-safe'),2500)",
          }}
        />
        <link rel="modulepreload" href="/assets/moments/moments.js" />
        <link rel="modulepreload" href="/assets/moments/lib.js" />
        <link rel="modulepreload" href="/assets/moments/iris-opens/moment.js" />
      </head>
      <body>
        {children}
        <script type="module" src="/assets/system.js" />
        <script type="module" src="/assets/motion/motion.js" />
        <script type="module" src="/assets/layout/layout.js" />
        <script type="module" src="/assets/diagrams/mount.js" />
      </body>
    </html>
  );
}









