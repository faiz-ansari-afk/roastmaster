import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const BASE_URL = "https://roastmaster-phi.vercel.app";

export const viewport: Viewport = {
  themeColor: "#FFF5F7",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "RoastMaster AI — Unfiltered AI Code Reviewer & Standup Dev Roaster",
    template: "%s | RoastMaster AI",
  },
  description:
    "The unfiltered AI standup comedian for developers. Turn your spaghetti architecture, PRs, and midnight commits into savage standup routines — plus constructive senior-staff engineering advice. Available via Web & CLI (npx roastmaster-ai).",
  applicationName: "RoastMaster AI",
  authors: [{ name: "Faiz Ansari", url: "https://github.com/faiz-ansari-afk" }],
  generator: "Next.js 16",
  keywords: [
    "RoastMaster",
    "RoastMaster AI",
    "AI code review",
    "code roaster",
    "developer tools",
    "AI standup comedy",
    "Gemini 2.5",
    "Aiven pgvector",
    "RAG code analysis",
    "CLI code review",
    "npx roastmaster-ai",
    "git diff roast",
    "savage code review",
    "developer comedy",
    "software engineering",
    "PR review bot",
  ],
  creator: "RoastMaster AI",
  publisher: "RoastMaster AI",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "RoastMaster AI — Unfiltered AI Code Reviewer & Standup Dev Roaster",
    description:
      "Tired of polite PR comments? Turn your spaghetti architecture and midnight commits into savage standup routines — plus senior-staff constructive truth. Run online or via CLI.",
    url: BASE_URL,
    siteName: "RoastMaster AI",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RoastMaster AI — Unfiltered AI Code Reviewer & Standup Dev Roaster",
    description:
      "Tired of polite PR comments? Turn your spaghetti architecture and midnight commits into savage standup routines — plus senior-staff constructive truth.",
    creator: "@roastmaster_ai",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "technology",
};

// JSON-LD Structured Data for Google Rich Snippets
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "@id": `${BASE_URL}/#webapp`,
      name: "RoastMaster AI",
      url: BASE_URL,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Web, macOS, Linux, Windows",
      browserRequirements: "Requires JavaScript. Requires HTML5.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      description:
        "An unfiltered AI standup comedy bot and code reviewer for developers. Features real-time RAG document analysis, Git diff roasting, and constructive senior-staff architecture guidance.",
      softwareVersion: "2.5.0",
      featureList: [
        "Unfiltered Standup Code Reviews",
        "Backstage Real Talk (Senior-Staff Fixes)",
        "Aiven pgvector RAG Ingestion",
        "CLI Integration via npx roastmaster-ai",
        "Interactive Code Sandbox Roaster",
      ],
      author: {
        "@type": "Person",
        name: "Faiz Ansari",
        url: "https://github.com/faiz-ansari-afk",
      },
    },
    {
      "@type": "SoftwareApplication",
      name: "roastmaster-ai (CLI)",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "macOS, Linux, Windows (Node.js)",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      description:
        "Terminal CLI companion that roasts git repositories, uncommitted diffs, and individual code files with zero mercy.",
      downloadUrl: "https://www.npmjs.com/package/roastmaster-ai",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Google Knowledge Graph / Rich Results Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-[#FFF5F7] text-[#2D1C24] antialiased selection:bg-[#FCE7F3] selection:text-[#BE185D]">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
