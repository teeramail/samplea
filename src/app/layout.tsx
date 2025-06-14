import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";

import { Navbar } from "./_components/Navbar";
import { Footer } from "./_components/Footer";
import { ThemeProvider } from "./_components/ThemeProvider";
import { ClientLayout } from "./_components/ClientLayout";
import { RegionsNav } from "./_components/RegionsNav";
import { TRPCReactProvider } from "~/trpc/react";
import ChatWidgetWrapper from "~/components/ChatWidgetWrapper";
import MobileBottomNav from "~/components/MobileBottomNav";

export const metadata: Metadata = {
  title: "ThaiBoxingHub",
  description: "Muay Thai events and ticket sales platform",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={GeistSans.variable} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <TRPCReactProvider>
          <ThemeProvider>
            <ClientLayout>
              <Navbar />
              <RegionsNav />
              <div className="flex-grow pb-16 md:pb-0">{children}</div>
              <Footer />
              <MobileBottomNav />
              <ChatWidgetWrapper />
            </ClientLayout>
          </ThemeProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
