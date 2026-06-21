import { Inter } from "next/font/google";
import type { Metadata } from "next";
import { Auth0Provider } from "@auth0/nextjs-auth0/client";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"] 
});

export const metadata = {
  title: 'bizsto.re - WhatsApp Link-in-Bio & Catalogue Generator',
  description: 'Convert your social media traffic into instant WhatsApp orders.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Auth0Provider>
          {children}
        </Auth0Provider>
      </body>
    </html>
  );
}