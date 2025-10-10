// Redirect to admin manage-trucks page
import { redirect } from 'next/navigation';

export default function ManageTrucksRedirect() {
  redirect('/admin/manage-trucks');
}
