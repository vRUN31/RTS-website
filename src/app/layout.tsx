import type { Metadata } from 'next';
import React from 'react';
import './globals.css';
import Effects from './_effects.client';

export const metadata: Metadata = {
	title: 'Raj Mohan Transport Services',
	description: 'Transport logistics platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Playfair+Display:wght@400;700&display=swap" rel="stylesheet" />
			</head>
			<body>
				<Effects />
				{children}
			</body>
		</html>
	);
}
