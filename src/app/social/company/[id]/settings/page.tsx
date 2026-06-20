import { redirect } from 'next/navigation';

export default function LegacySettingsPage({ params }: { params: { id: string } }) {
  redirect(`/dashboard/company/${params.id}/settings`);
}
