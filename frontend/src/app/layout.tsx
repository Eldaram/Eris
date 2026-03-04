import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Eris - A new way to chat",
  description: "A discord clone named Eris",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
