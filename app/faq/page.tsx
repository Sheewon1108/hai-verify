import type { Metadata } from 'next';
import { FaqContent } from '@/app/components/faq-content';

export const metadata: Metadata = {
  title: 'FAQ | HAI Verify',
  description: 'Frequently asked questions about HAI Verify — verification for AI-generated outputs.',
};

export default function FaqPage() {
  return <FaqContent />;
}
