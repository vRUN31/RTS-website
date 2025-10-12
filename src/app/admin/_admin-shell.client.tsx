"use client";
import { ReactNode } from 'react';
import ThemeToggle from '@/src/components/ThemeToggle.client';

export default function AdminShell({ children }: { children: ReactNode }) {
    return (
        <>
            <ThemeToggle />
            {children}
        </>
    );
}
