export default function HomePage() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div className="truly">Delivering Trust, Safety, and Speed Across Every Journey</div>
      <div className="logo-text">RAJMOHAN TRANSPORT SERVICES</div>
      <div style={{ display: 'flex', gap: 24, marginTop: 32 }}>
        <a data-transition href="/register" className="cta-primary">Sign Up</a>
        <a data-transition href="/login" className="cta-primary">Login</a>
        <a data-transition href="/dashboard/customer?guest=true" className="cta-ghost">Guest</a>
      </div>
    </main>
  );
}



