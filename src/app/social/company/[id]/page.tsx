import { redirect } from 'next/navigation';

export default function LegacyCompanyPage({ params }: { params: { id: string } }) {
  redirect(`/dashboard/company/${params.id}`);
}
