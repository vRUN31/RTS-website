import { validateAdmin } from '@/src/utils/admin';
import './manage-trucks.css';
import ManageTrucksClient from '@/src/components/admin/ManageTrucks.client';
import AdminShell from '../_admin-shell.client';

export default async function AdminManageTrucksPage() {
  try {
    // First validate admin access
    await validateAdmin();

    return (
      <AdminShell>
        <main className="manage-trucks-main">
          <h1>Manage Trucks</h1>
          <ManageTrucksClient />
        </main>
      </AdminShell>
    );
  } catch (error) {
    console.error("Admin validation error:", error);
    // Return a proper error UI instead of throwing
    return (
      <AdminShell>
        <main className="manage-trucks-main">
          <div className="error-container">
            <h1>Error</h1>
            <p>An error occurred while loading the manage trucks page. Please try again.</p>
          </div>
        </main>
      </AdminShell>
    );
  }
}

