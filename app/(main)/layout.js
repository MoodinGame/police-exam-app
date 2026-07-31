import Sidebar from '@/components/Sidebar';

export default function MainLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex-1 p-8">{children}</div>
    </div>
  );
}
