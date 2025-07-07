import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Caffis - Social Coffee Platform",
  description: "Connect with coffee lovers and discover amazing cafes in your area",
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#667eea",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it" suppressHydrationWarning>
      <head>
        {/* Preload essential fonts */}
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          as="style"
        />
        
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://api.mapbox.com" />
        <link rel="dns-prefetch" href="https://api.mapbox.com" />
        
        {/* Meta tags for better mobile experience */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Caffis" />
        
        {/* Security headers */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        
        {/* Open Graph meta tags for social sharing */}
        <meta property="og:title" content="Caffis - Social Coffee Platform" />
        <meta property="og:description" content="Connect with coffee lovers and discover amazing cafes in your area" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/og-image.jpg" />
        
        {/* Twitter Card meta tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Caffis - Social Coffee Platform" />
        <meta name="twitter:description" content="Connect with coffee lovers and discover amazing cafes in your area" />
        <meta name="twitter:image" content="/twitter-image.jpg" />
      </head>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <AuthProvider>
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <Navbar />
            <main className="relative">
              {children}
            </main>
          </div>
        </AuthProvider>
        
        {/* Global scripts for map widget support */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Global configuration for Caffis Map Widget
              window.CAFFIS_CONFIG = {
                mapServiceUrl: 'http://localhost:3002',
                apiUrl: 'http://localhost:5000',
                environment: 'development'
              };
              
              // Console branding
              console.log('%c☕ Caffis Platform', 'font-size: 20px; font-weight: bold; color: #667eea;');
              console.log('%cWelcome to Caffis! Connect with coffee lovers around you.', 'color: #6b7280;');
            `,
          }}
        />
      </body>
    </html>
  );
}