export default function AdminDashboardStub() {
	return (
		<main style={{ maxWidth: 1200, margin: '40px auto', padding: 24, background: '#fff', borderRadius: 10 }}>
			<h1 style={{ color: '#0d3c6e' }}>Admin Dashboard</h1>
			<p>Fleet live map, KPIs, recent contracts will appear here.</p>
			<nav style={{ marginTop: 16 }}>
				<a href="/contracts" style={{ color: '#ff4d00' }}>Go to Contracts</a>
			</nav>
		</main>
	);
}
