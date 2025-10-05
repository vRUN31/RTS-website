export default function CustomerDashboardPage() {
	return (
		<main className="dashboard-container">
			<div className="dashboard-header mb-18">Welcome to RAJMOHAN TRANSPORT SERVICES</div>
			<div className="grid-2-1">
				<section>
					<div className="panel">
						<div className="panel-title">Live Tracking</div>
						<div className="live-map">Map Placeholder</div>
						<div className="progress"><div className="fill" /></div>
						<div className="eta">ETA: 2 hrs 15 min</div>
					</div>
					<div className="panel">
						<div className="panel-title">Orders</div>
						<input placeholder="Filter shipments..." className="filter-input" />
						<table className="table">
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
					<div className="panel">
						<div className="panel-title">Rate Calculator</div>
						<div className="calc-column">
							<input placeholder="Distance (km)" className="filter-input" />
							<input placeholder="Weight (MT)" className="filter-input" />
							<button className="btn-dark">Calculate</button>
							<div className="eta">Estimated Price: —</div>
						</div>
					</div>
				</section>
				<aside className="col-gap-32">
					<div className="panel">
						<div className="panel-title">Notifications</div>
						<ul>
							<li>Shipment #1002 is in transit.</li>
							<li>Payment pending for shipment #1003.</li>
							<li>Support ticket #202 resolved.</li>
						</ul>
					</div>
					<div className="panel">
						<div className="panel-title">Document Center</div>
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
