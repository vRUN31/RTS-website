import type { Metadata } from 'next';
import React from 'react';
import './globals.css';
import Effects from './_effects.client';
import TopBar from './_topbar.client';
import HideableTopBar from './_hideable-topbar.client';
import AuthInit from './_auth-init.client';

export const metadata: Metadata = {
    title: 'Raj Mohan Transport Services',
    description: 'Transport logistics platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
 return (
     <html lang="en">
         <head>
             <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Playfair+Display:wght@400;700&display=swap" rel="stylesheet" />
             <link
                 rel="stylesheet"
                 href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
                 integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
                 crossOrigin=""
             />
         </head>
         <body>
             <AuthInit />
             <Effects />
             <HideableTopBar />
             <main className="app-main">
                 {children}
             </main>
                     <footer className="footer-center mt-32">
                         <div className="footer-contact">
                             <strong>Contact Us</strong>
                             <div className="muted-small">Phone: <a href="tel:+911234567890">+91 12345 67890</a></div>
                             <div className="muted-small">Email: <a href="mailto:info@rajmohan.com">info@rajmohan.com</a></div>
                             <div className="muted-small">Address: Shree Ganesh Plaza, Park Sight Society, Sector - 2, Greater Khanda, Panvel, Navi Mumbai, Maharashtra, India</div>
                         </div>
                         <div className="footer-copyright">&copy; RTS. All rights reserved.</div>
                     </footer>
         </body>
     </html>
 );
}
