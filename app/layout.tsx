import type { Metadata } from "next";
import "./globals.css";

const vercelHost =
  process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
const metadataBase = new URL(
  vercelHost ? `https://${vercelHost}` : "http://localhost:3000",
);
const title = "HVAC — Operations Command Centre";
const description =
  "Explore a demo HVAC operations workspace for inventory, jobs, technicians and branch performance.";

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: title,
    template: "%s · HVAC",
  },
  description,
  applicationName: "HVAC Demo",
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title,
    description,
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1743,
        height: 909,
        alt: "HVAC operations command centre demo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
