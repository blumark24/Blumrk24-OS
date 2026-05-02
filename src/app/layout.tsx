import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { NotificationsProvider } from "@/contexts/NotificationsContext";
import { MessagesProvider } from "@/contexts/MessagesContext";
import { PermissionsProvider } from "@/contexts/PermissionsContext";

export const metadata: Metadata = {
  title: "Blumark24 OS – نظام إدارة الأعمال بالذكاء الاصطناعي",
  description: "منصة متكاملة لإدارة جميع عمليات الشركات السعودية بذكاء",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M12 2L3 7v10l9 5 9-5V7L12 2z' fill='%2322d3ee'/></svg>",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Read Supabase config server-side so both SUPABASE_URL and
  // NEXT_PUBLIC_SUPABASE_URL env var naming conventions work.
  const sbUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL  || process.env.SUPABASE_URL  || "";
  const sbKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
  const inlineScript = `window.__SB_URL__=${JSON.stringify(sbUrl)};window.__SB_KEY__=${JSON.stringify(sbKey)};`;

  return (
    <html lang="ar" dir="rtl">
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=Tajawal:wght@300;400;500;700;800&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: inlineScript }} />
      </head>
      <body>
        <ToastProvider>
          <AuthProvider>
            <PermissionsProvider>
              <NotificationsProvider>
                <MessagesProvider>
                  {children}
                </MessagesProvider>
              </NotificationsProvider>
            </PermissionsProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
