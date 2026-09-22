import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Tutor Whiteboard",
  description: "Live multimodal AI tutor whiteboard",
};

// Bootstrap placeholder. Owned by the Gemini integration agent
// (src/app/layout.tsx) per PLAN.md section 10 — replace with the
// real app shell there.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
