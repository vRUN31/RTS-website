import { validateAdmin } from '@/src/utils/admin';
import './manage-trucks.css';
import ManageTrucksClient from '@/src/components/admin/ManageTrucks.client';

export default async function AdminManageTrucksPage() {
  await validateAdmin();

  return (
    <main className="manage-trucks-main">
      <h1>Manage Trucks</h1>
      <ManageTrucksClient />
    </main>
  );
}

