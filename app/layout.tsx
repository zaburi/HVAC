import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "coolops.openai.site";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  const metadataBase = new URL(`${protocol}://${host}`);
  const title = "CoolOps — HVAC Operations Command Centre";
  const description =
    "Inventory, jobs, technicians and branch performance in one trusted HVAC operations workspace.";
  const imageUrl = new URL("/og.png", metadataBase).toString();

  return {
    metadataBase,
    title: {
      default: title,
      template: "%s · CoolOps",
    },
    description,
    applicationName: "CoolOps",
    openGraph: {
      title,
      description:
        "Run stock, service jobs and field teams from one operational workspace.",
      type: "website",
      images: [{ url: imageUrl, width: 1743, height: 909, alt: "CoolOps HVAC operations command centre" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description:
        "Run stock, service jobs and field teams from one operational workspace.",
      images: [imageUrl],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
