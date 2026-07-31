import { Megaphone } from 'lucide-react';
import { announcements } from '@/lib/announcements';

const THAI_MONTHS = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];

function formatThaiDate(iso) {
  const d = new Date(iso + 'T00:00:00+07:00');
  return `${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;
}

const TAG_STYLES = {
  'ฟีเจอร์ใหม่': 'bg-accent-green/10 text-green-700',
  'อัปเดตคลังข้อสอบ': 'bg-accent-cyan/10 text-accent-cyan',
  'กำหนดการ': 'bg-navy/10 text-navy',
  'แจ้งเตือนระบบ': 'bg-orange-100 text-orange-600',
};

export default function AnnouncementsPage() {
  const sorted = [...announcements].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      <h1 className="text-2xl font-semibold text-navy mb-1">ประกาศ</h1>
      <p className="text-graydark/60 mb-8">ข่าวสารและอัปเดตจากทีมงาน</p>

      {sorted.length === 0 ? (
        <div className="border border-dashed border-graylight/40 rounded-2xl p-12 text-center text-graydark/40">
          ยังไม่มีประกาศ
        </div>
      ) : (
        <ul className="space-y-4 max-w-2xl">
          {sorted.map((a) => (
            <li key={a.id} className="border border-graylight/30 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 shrink-0 rounded-full bg-navy/5 flex items-center justify-center">
                  <Megaphone size={16} className="text-navy" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${TAG_STYLES[a.tag] || 'bg-navy/5 text-navy'}`}>
                      {a.tag}
                    </span>
                    <span className="text-xs text-graydark/40">{formatThaiDate(a.date)}</span>
                  </div>
                  <h3 className="font-medium text-graydark mb-1.5">{a.title}</h3>
                  <p className="text-sm text-graydark/60 leading-relaxed">{a.body}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
