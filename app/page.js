import Link from 'next/link';

const tracks = [
  {
    id: 'general-affairs',
    name: 'สายอำนวยการ 2569',
    status: 'ready',
    desc: '150 ข้อ · 6 วิชา · พร้อมใช้งาน',
  },
  {
    id: 'patrol',
    name: 'สายป้องกันปราบปราม',
    status: 'soon',
    desc: 'เร็วๆ นี้',
  },
  {
    id: 'forensic',
    name: 'สายพิสูจน์หลักฐาน',
    status: 'soon',
    desc: 'เร็วๆ นี้',
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      <header className="bg-navy text-white py-16 px-6 text-center">
        <h1 className="text-3xl md:text-4xl font-semibold mb-3">
          เตรียมสอบตำรวจ ให้พร้อมที่สุด
        </h1>
        <p className="text-graylight text-lg">
          เลือกสายสอบที่คุณกำลังเตรียมตัว แล้วเริ่มฝึกทำข้อสอบได้ทันที
        </p>
      </header>

      <section className="max-w-5xl mx-auto px-6 py-12 grid gap-6 md:grid-cols-3">
        {tracks.map((t) => (
          <div
            key={t.id}
            className="border border-graylight/30 rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow"
          >
            <div>
              <h2 className="text-xl font-semibold text-navy mb-1">{t.name}</h2>
              <p className="text-graydark/70 text-sm mb-4">{t.desc}</p>
            </div>
            {t.status === 'ready' ? (
              <Link
                href="/dashboard"
                className="inline-block text-center bg-accent-cyan text-white rounded-xl py-2.5 font-medium hover:opacity-90 transition-opacity"
              >
                เลือกสายนี้
              </Link>
            ) : (
              <span className="inline-block text-center bg-graylight/20 text-graydark/50 rounded-xl py-2.5 font-medium cursor-not-allowed">
                เร็วๆ นี้
              </span>
            )}
          </div>
        ))}
      </section>
    </main>
  );
}
