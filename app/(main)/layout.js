import Sidebar from '@/components/Sidebar';

export default function MainLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      {/* min-w-0 กัน flex child ดันความกว้างจนหน้าเลื่อนแนวนอน
          pt-14 เผื่อที่ให้แถบบนแบบ fixed บนจอเล็ก */}
      <div className="flex-1 min-w-0 p-4 pt-[4.5rem] sm:p-6 sm:pt-[4.5rem] lg:p-8">
        {children}
      </div>
    </div>
  );
}
