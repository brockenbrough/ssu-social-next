import '@/app/ui/global.css';
import { roboto } from '@/app/ui/fonts';

// This is the root layout of the application.  
// It is used to wrap all the pages in the application.
// It is also used to apply the global styles to the application.
// It is also used to apply the global fonts to the application.
// It is also used to apply the global layout to the application.

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
        <body className={`${roboto.className} antialiased`}>{children}</body>
    </html>
  );
}
