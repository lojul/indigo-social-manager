import { redirect } from 'next/navigation';

export default function LegacyNewPage() {
  redirect('/dashboard/company/new');
}
