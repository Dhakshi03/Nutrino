import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nutrino — Your Little Buddy for Better Eating",
  description:
    "AI-Powered Personal Nutritionist & Flexible Meal Planning Platform with Indian Food & Hostel Mode support.",
  icons: {
    icon: "/mascot/nutrino-avatar.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-nutrino-bg text-nutrino-text font-sans selection:bg-nutrino-light selection:text-nutrino-deep">
        {children}
      </body>
    </html>
  );
}
