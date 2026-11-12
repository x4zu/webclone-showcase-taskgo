import type { Metadata } from "next";
import "./globals.css";
import "@/components/sites/taskgo-oly-webflow-io/webflow.css";
import "@/components/sites/taskgo-oly-webflow-io/ix3-preload.css";
import { SiteRuntime } from "@/components/sites/taskgo-oly-webflow-io/SiteRuntime";

export const metadata: Metadata = {
  title: "TaskGo- TaskGo Webflow HTML Website Template",
  description:
    "TaskGo helps teams manage tasks, customers, and workflows more efficiently with an all-in-one CRM built for speed, clarity, collaboration, and scalable growth.",
  icons: { icon: "/sites/taskgo-oly-webflow-io/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // w-mod-js is set by the Webflow runtime; SiteRuntime adds w-mod-ix3 once animations are ready; the stylesheet keys off them.
    <html lang="en" className="w-mod-js" suppressHydrationWarning>
      <head>
        {/* Self-hosted Inter Tight (downloaded by asset-harvest), exact family name kept. */}
        {/* eslint-disable-next-line @next/next/no-css-tags -- static self-hosted font file in public/ */}
        <link rel="stylesheet" href="/sites/taskgo-oly-webflow-io/fonts/fonts.css" />
      </head>
      <body>
        {children}
        <SiteRuntime />
      </body>
    </html>
  );
}
