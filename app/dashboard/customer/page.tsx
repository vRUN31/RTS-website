export default function CustomerDashboardPage() {
  return (
    <main style={{ maxWidth: 1300, margin: '40px auto', background: '#fff', borderRadius: 10, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '32px 40px' }}>
      <div style={{ fontSize: '2rem', fontWeight: 700, color: '#0d3c6e', marginBottom: 18, textAlign: 'center' }}>Welcome to RAJMOHAN TRANSPORT SERVICES</div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 32 }}>
        <section>
          <div style={{ background: '#f4f6fb', borderRadius: 8, padding: '24px 32px', marginBottom: 32 }}>
            <div style={{ fontSize: '1.3rem', color: '#0d3c6e', marginBottom: 12 }}>Live Tracking</div>
            <div style={{ width: '100%', height: 250, borderRadius: 8, background: 'linear-gradient(135deg, #e3eafc 60%, #b6d0f7 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0d3c6e' }}>Map Placeholder</div>
            <div style={{ width: '100%', background: '#e0e0e0', borderRadius: 6, marginTop: 18, height: 18 }}>
              <div style={{ height: '100%', background: 'linear-gradient(90deg, #0d3c6e 60%, #ff9800 100%)', width: '70%', borderRadius: 6 }} />
            </div>
            <div style={{ marginTop: 8, color: '#ff9800', fontWeight: 700 }}>ETA: 2 hrs 15 min</div>
          </div>
          <div style={{ background: '#f4f6fb', borderRadius: 8, padding: '24px 32px', marginBottom: 32 }}>
            <div style={{ fontSize: '1.3rem', color: '#0d3c6e', marginBottom: 12 }}>Orders</div>
            <input placeholder="Filter shipments..." style={{ padding: '6px 12px', borderRadius: 4, border: '1px solid #b6d0f7', fontSize: '1rem', marginBottom: 10 }} />
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th>ID</th><th>Origin</th><th>Destination</th><th>Status</th><th>Date</th><th>Cost</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>1001</td><td>Delhi</td><td>Mumbai</td><td>Delivered</td><td>2025-09-20</td><td>₹12,500</td></tr>
                <tr><td>1002</td><td>Chennai</td><td>Bangalore</td><td>In Transit</td><td>2025-09-26</td><td>₹8,200</td></tr>
                <tr><td>1003</td><td>Pune</td><td>Hyderabad</td><td>Pending</td><td>2025-09-28</td><td>₹9,800</td></tr>
              </tbody>
            </table>
          </div>
          <div style={{ background: '#f4f6fb', borderRadius: 8, padding: '24px 32px', marginBottom: 32 }}>
            <div style={{ fontSize: '1.3rem', color: '#0d3c6e', marginBottom: 12 }}>Rate Calculator</div>
            <div style={{ display: 'flex', gap: 10, flexDirection: 'column' }}>
              <input placeholder="Distance (km)" style={{ padding: '8px 12px', borderRadius: 4, border: '1px solid #b6d0f7' }} />
              <input placeholder="Weight (MT)" style={{ padding: '8px 12px', borderRadius: 4, border: '1px solid #b6d0f7' }} />
              <button style={{ background: '#0d3c6e', color: '#fff', border: 'none', padding: '10px 0', borderRadius: 4, fontSize: '1rem' }}>Calculate</button>
              <div style={{ color: '#ff9800', fontWeight: 700 }}>Estimated Price: —</div>
            </div>
          </div>
        </section>
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <div style={{ background: '#f4f6fb', borderRadius: 8, padding: '24px 32px' }}>
            <div style={{ fontSize: '1.3rem', color: '#0d3c6e', marginBottom: 12 }}>Notifications</div>
            <ul>
              <li>Shipment #1002 is in transit.</li>
              <li>Payment pending for shipment #1003.</li>
              <li>Support ticket #202 resolved.</li>
            </ul>
          </div>
          <div style={{ background: '#f4f6fb', borderRadius: 8, padding: '24px 32px' }}>
            <div style={{ fontSize: '1.3rem', color: '#0d3c6e', marginBottom: 12 }}>Document Center</div>
            <ul>
              <li>Waybill</li>
              <li>Invoice</li>
              <li>PoD</li>
              <li>Compliance</li>
            </ul>
          </div>
        </aside>
      </div>
    </main>
  );
}



