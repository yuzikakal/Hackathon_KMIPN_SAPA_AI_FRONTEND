import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { AuthProvider } from './context/AuthContext';
import { RealtimeProvider } from './context/RealtimeContext';

const miSans = localFont({
  src: [
    {
      path: '../public/ttf/MiSansLatin-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/ttf/MiSansLatin-Medium.ttf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/ttf/MiSansLatin-Semibold.ttf',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../public/ttf/MiSansLatin-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-misans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SAPA AI CRM - Intelligent Sales & Customer Management',
  description: 'Real-Time CRM Platform powered by SAPA AI with WhatsApp and Multi-channel Automation',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${miSans.variable} font-sans h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#090d16] text-slate-100 font-sans">
        <AuthProvider>
          <RealtimeProvider>{children}</RealtimeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
