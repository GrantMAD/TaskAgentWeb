import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientProviders from "../components/ClientProviders";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import NextTopLoader from 'nextjs-toploader';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Task Marketplace | Neighbourhood Help",
  description: "A premium marketplace for neighbourhood tasks and help.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Task Marketplace",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: "#E68A00",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col transition-colors duration-300">
        <NextTopLoader 
          color="#E68A00"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #E68A00,0 0 5px #E68A00"
        />
        <ClientProviders>
          <Navigation />
          <main className="flex-grow pt-20">
            {children}
          </main>
          <Footer />
        </ClientProviders>
      </body>
    </html>
  );
}
