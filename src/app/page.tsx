import { createClient as createServerSupabase } from "@/utils/supabase/server";
import { cookies } from "next/headers";

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
        <main className="main-center-screen">
            <div className="truly">Delivering Trust, Safety, and Speed Across Every Journey</div>
            <div className="logo-text">RAJMOHAN TRANSPORT SERVICES</div>
            <div className="btn-row">
                <a data-transition href="/register" className="cta-primary">Sign Up</a>
                <a data-transition href="/login" className="cta-primary">Login</a>
                <a data-transition href="/dashboard/customer?guest=true" className="cta-ghost">Guest</a>
            </div>
            {Array.isArray(todos) && todos.length > 0 && (
                <ul className="mt-32">
                    {todos.map((t: any, i: number) => (
                        <li key={t.id ?? i}>{typeof t === 'string' ? t : JSON.stringify(t)}</li>
                    ))}
                </ul>
            )}
        </main>
    );
}
