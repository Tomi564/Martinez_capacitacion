/**
 * layout.tsx — Root layout de Next.js
 *
 * Es el wrapper de toda la aplicación.
 * Acá van:
 *  - Metadatos globales (título, descripción, PWA tags)
 *  - Fuentes
 *  - Providers globales
 *  - Configuración del viewport para mobile
 */

import type { Metadata, Viewport } from 'next';
import { Exo } from 'next/font/google';
import './globals.css';

const exo = Exo({
  subsets: ['latin'],
  variable: '--font-exo',
  weight: ['400', '500', '700'],
});

// ─────────────────────────────────────────────────────
// Metadatos de la app — usados por el browser y PWA
// ─────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: {
    default: 'Martinez Neumaticos',
    template: '%s | Martinez Neumaticos',
  },
  description: 'Sistema de capacitación para vendedores de Martinez Neumaticos',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Martinez Neumaticos',
  },
  formatDetection: {
    telephone: false,
  },
};

// ─────────────────────────────────────────────────────
// Viewport — crítico para mobile
// themeColor: color de la barra del browser en Android
// ─────────────────────────────────────────────────────
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,        // Evita zoom accidental en inputs
  themeColor: '#C8102E',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={exo.variable}>
      <head>
        {/* PWA — iOS necesita estos tags adicionales */}
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}