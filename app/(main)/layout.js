import AppShell from '@/components/AppShell';
import { redirect } from 'next/navigation';
import { requireCurrentUser } from '@/lib/serverUser';

// Every page in the application workspace is protected at the layout level.
// This runs on a fresh visit or refresh before any private UI is rendered.
export const dynamic = 'force-dynamic';

export default async function MainLayout({ children }) {
  try {
    await requireCurrentUser();
  } catch {
    redirect('/login');
  }

  return <AppShell>{children}</AppShell>;
}
