import type { Metadata } from "next";
import "./globals.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/plus-jakarta-sans/400.css";
import "@fontsource/plus-jakarta-sans/600.css";
import "@fontsource/plus-jakarta-sans/700.css";
export const metadata: Metadata = {
  title: "Dr. Commerce Academy",
  description:
    "Learn, practice and qualify. The supervised commerce operations academy by NGB Consultancy.",
  manifest: "/manifest.webmanifest",
  applicationName: "Dr. Commerce Academy",
  icons: { icon: "/app-icon.svg" },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
