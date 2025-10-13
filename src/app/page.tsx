import { createClient as createServerSupabase } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import ThemeToggle from "@/src/components/ThemeToggle.client";

export default async function HomePage() {
    // Optional demo: pull todos if table exists; swallow errors silently
    let todos: any[] | null = null;
    try {
        const cookieStore = await cookies();
        const supabase = createServerSupabase(cookieStore);
        const { data, error } = await supabase.from('todos').select();
        if (!error) todos = data as any[];
    } catch { /* ignore in demo */ }

    return (
        <>
            <ThemeToggle />
            <header className="site-header">
                <div className="truly">Delivering Trust, Safety, and Speed Across Every Journey</div>
            </header>
            <main className="main-center-screen">
                <div className="welcome-sub">Welcome To,</div>
                <div className="logo-text">RAJMOHAN TRANSPORT SERVICES</div>
                <div className="auth-container">
                    <div className="auth-row">
                        <div className="auth-section">
                            <h4>New Member?</h4>
                            <a data-transition href="/register" className="cta-primary">Sign Up</a>
                        </div>
                        <div className="divider" />
                        <div className="auth-section">
                            <h4>Already a Member?</h4>
                            <a data-transition href="/login" className="cta-primary">Login</a>
                        </div>
                    </div>
                    <div className="guest-section">
                        <h4>Just want to explore? No Problem.<br />Continue as,</h4>
                        <a data-transition href="/dashboard/customer?guest=true" className="cta-ghost">Guest</a>
                    </div>
                </div>
                {Array.isArray(todos) && todos.length > 0 && (
                    <ul className="mt-32">
                        {todos.map((t: any, i: number) => (
                            <li key={t.id ?? i}>{typeof t === 'string' ? t : JSON.stringify(t)}</li>
                        ))}
                    </ul>
                )}
            </main>
            {/* <footer className="text-center mt-32">
                <div className="footer-grid">
                    <div>&copy; RTS. All rights reserved.</div>
                    <div className="footer-contact">
                        <strong>Contact Us</strong>
                        <div className="muted-small">Phone: <a href="tel:+911234567890">+91 12345 67890</a></div>
                        <div className="muted-small">Email: <a href="mailto:info@rajmohan.com">info@rajmohan.com</a></div>
                        <div className="muted-small">Address: 12, Industrial Estate, Chennai, Tamil Nadu, India</div>
                    </div>
                </div>
            </footer> */}
        </>
    );
}
