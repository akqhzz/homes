'use client';
// /map redirects to the main explore page which contains the map
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MapRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/'); }, [router]);
  return null;
}
