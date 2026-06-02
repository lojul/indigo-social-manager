import { redirect } from 'next/navigation';

export default function LegacySettingsPage({ params }: { params: { id: string } }) {
  redirect(`/social/company/${params.id}/settings`);
}
