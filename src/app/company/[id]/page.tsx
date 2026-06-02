import { redirect } from 'next/navigation';

export default function LegacyCompanyPage({ params }: { params: { id: string } }) {
  redirect(`/social/company/${params.id}`);
}
