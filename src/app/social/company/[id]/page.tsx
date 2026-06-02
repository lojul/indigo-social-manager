import { notFound } from 'next/navigation';
import { getCompanyById } from '@/lib/db';
import SocialManager from '@/components/SocialManager';

export const dynamic = 'force-dynamic';

interface Props {
  params: { id: string };
}

export default async function CompanyPage({ params }: Props) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) notFound();

  const company = await getCompanyById(id);
  if (!company) notFound();

  return <SocialManager company={company} />;
}
