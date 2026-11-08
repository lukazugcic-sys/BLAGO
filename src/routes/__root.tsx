import { useEffect } from "react";
import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { NijeNadjeno, AppErrorComponent } from "@/lib/error-component";
import appCss from "../styles.css?url";

const APP_NAME = "BLAGO";

export const Route = createRootRoute({
  errorComponent: AppErrorComponent,
  notFoundComponent: NijeNadjeno,
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1, user-scalable=no",
      },
      { title: APP_NAME },
      { name: "description", content: "Kaubojski automat — vrti, gradi kaubu i traži blago." },
      { name: "theme-color", content: "#2B1814" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "mobile-web-app-capable", content: "yes" },
    ],
    links: [
      { rel: "icon", href: "/favicon.ico", sizes: "any" },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      {
        rel: "preload",
        href: "/fonts/BarlowCondensed-SemiBold.woff2",
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      {
        rel: "preload",
        href: "/fonts/BarlowCondensed-Bold.woff2",
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      {
        rel: "preload",
        href: "/fonts/CinzelDecorative-Bold.woff2",
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/icons/apple-touch-icon.png" },
    ],
  }),
  component: () => (
    <html lang="hr" className="is-fs antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="is-fs bg-void font-sans text-ink">
        <ManifestBlago />
        <PreviewHostBridge />
        <AuthProvider>
          <Outlet />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});

function ManifestBlago() {
  useEffect(() => {
    const popravi = () => {
      const linkovi = [...document.querySelectorAll('link[rel="manifest"]')];
      const tudji = linkovi.filter((l) => l.getAttribute("href") !== "/manifest.webmanifest");
      const nasi = linkovi.filter((l) => l.getAttribute("href") === "/manifest.webmanifest");
      if (tudji.length === 0 && nasi.length === 1) {
        const tema = document.querySelector('meta[name="theme-color"]');
        if (!tema || tema.getAttribute("content") === "#2B1814") return;
        tema.setAttribute("content", "#2B1814");
        return;
      }
      tudji.forEach((l) => l.remove());
      if (nasi.length === 0) {
        const l = document.createElement("link");
        l.rel = "manifest";
        l.href = "/manifest.webmanifest";
        document.head.appendChild(l);
      } else {
        nasi.slice(1).forEach((l) => l.remove());
      }
      const tema = document.querySelector('meta[name="theme-color"]');
      if (tema && tema.getAttribute("content") !== "#2B1814") tema.setAttribute("content", "#2B1814");
    };
    popravi();
    const o = new MutationObserver(popravi);
    o.observe(document.head, { childList: true, subtree: true });
    return () => o.disconnect();
  }, []);
  return null;
}
