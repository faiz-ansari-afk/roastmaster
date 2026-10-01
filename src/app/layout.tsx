import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata = {
  title: "RoastMaster AI — The AI That Hates You",
  description: "Ask questions. Get roasted. You'll love it.",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* SVG favicon — works on all modern browsers */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
      </head>
      <body className="bg-[#FFF5F7] text-[#2D1C24] antialiased selection:bg-[#FCE7F3] selection:text-[#BE185D]">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
