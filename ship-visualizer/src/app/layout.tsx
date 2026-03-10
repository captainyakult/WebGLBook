import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ship Visualizer",
  description: "Visualize nearby ships on an interactive map",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="h-screen w-screen overflow-hidden">{children}</body>
    </html>
  );
}
