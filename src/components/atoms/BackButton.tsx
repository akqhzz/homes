'use client';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function BackButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="inline-flex h-10 items-center gap-2 rounded-full bg-[#F5F6F7] px-4 text-sm font-semibold text-[#0F1729] transition-colors hover:bg-[#EBEBEB]"
    >
      <ArrowLeft size={16} />
      Back
    </button>
  );
}
