import Link from 'next/link';
import { AlertCircle, CheckCircle2, Clock3, FileText, LockKeyhole } from 'lucide-react';
import {
  mockExamBlueprint,
  mockExamReady,
  mockExamSections,
  mockExamAvailableCount,
  mockExamMissingCount,
} from '@/lib/mockExamCatalog';
import ResumeBanner from '@/components/ResumeBanner';

export default function MockExamPage() {
  return (
    <div className="max-w-5xl">
      <ResumeBanner />
      <div className="flex items-start justify-between gap-5 flex-wrap mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-navy mb-1">ข้อสอบเสมือนจริง</h1>
          <p className="text-graydark/60">จำลองบรรยากาศสอบจริงตามสัดส่วนสายอำนวยการ 2569</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-graydark/60 bg-graylight/10 px-4 py-2.5 rounded-xl">
          <Clock3 size={17} className="text-accent-cyan" />
          180 นาที · 150 ข้อ
        </div>
      </div>

      <section className="border border-graylight/30 rounded-2xl overflow-hidden mb-6">
        <div className="bg-navy px-6 py-5 text-white flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-accent-cyan text-xs font-medium mb-1">MOCK EXAM 01</p>
            <h2 className="font-semibold text-lg">{mockExamBlueprint.title}</h2>
            <p className="text-white/65 text-sm mt-1">เกณฑ์ผ่าน {mockExamBlueprint.passScore}/{mockExamBlueprint.totalQuestions} คะแนน</p>
          </div>
          {mockExamReady ? (
            <span className="inline-flex items-center gap-1.5 bg-accent-green/20 text-accent-green text-xs font-medium px-3 py-2 rounded-full">
              <CheckCircle2 size={15} /> พร้อมสอบ
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 bg-orange-400/15 text-orange-300 text-xs font-medium px-3 py-2 rounded-full">
              <AlertCircle size={15} /> กำลังจัดทำคลังข้อสอบ
            </span>
          )}
        </div>

        <div className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4 mb-3 text-sm">
            <span className="font-medium text-graydark">ความพร้อมของคลังข้อสอบ</span>
            <span className="text-navy font-semibold">{mockExamAvailableCount} / {mockExamBlueprint.totalQuestions} ข้อ</span>
          </div>
          <div className="h-2.5 rounded-full bg-graylight/20 overflow-hidden mb-3">
            <div className="h-full bg-accent-cyan transition-all" style={{ width: `${Math.round((mockExamAvailableCount / mockExamBlueprint.totalQuestions) * 100)}%` }} />
          </div>
          {!mockExamReady && (
            <div className="flex gap-2 rounded-xl bg-orange-50 border border-orange-200 p-3 text-sm text-orange-800 mb-6">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <p>ยังเปิดสอบเต็มชุดไม่ได้: ต้องเติมข้อสอบใหม่ที่ไม่ซ้ำกับแบบฝึกหัดอีก <strong>{mockExamMissingCount} ข้อ</strong> ก่อน ระบบจะปลดล็อกอัตโนมัติเมื่อครบทุกวิชา</p>
            </div>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            {mockExamSections.map((section) => {
              const complete = section.available >= section.required;
              return (
                <div key={section.id} className="border border-graylight/25 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="font-medium text-sm text-graydark leading-snug">{section.name}</p>
                    {complete ? <CheckCircle2 size={16} className="text-accent-green shrink-0" /> : <LockKeyhole size={15} className="text-graydark/35 shrink-0" />}
                  </div>
                  <p className="text-xs text-graydark/50">ต้องมี {section.required} ข้อ · มีแล้ว {section.available} ข้อ</p>
                  <div className="h-1.5 bg-graylight/15 rounded-full overflow-hidden mt-3">
                    <div className={`h-full ${complete ? 'bg-accent-green' : 'bg-graylight/40'}`} style={{ width: `${Math.min(100, Math.round((section.available / section.required) * 100))}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {mockExamReady ? (
            <Link href={`/mock-exam/${mockExamBlueprint.id}`} className="inline-flex items-center justify-center bg-accent-cyan text-white rounded-xl px-5 py-3 text-sm font-medium hover:opacity-90">
              เริ่มสอบเต็มชุด
            </Link>
          ) : (
            <button type="button" disabled className="inline-flex items-center gap-2 bg-graylight/25 text-graydark/50 rounded-xl px-5 py-3 text-sm font-medium cursor-not-allowed">
              <LockKeyhole size={16} /> เริ่มสอบเต็มชุดเมื่อคลังครบ 150 ข้อ
            </button>
          )}
        </div>
      </section>

      <section className="grid sm:grid-cols-2 gap-4">
        <div className="border border-graylight/25 rounded-2xl p-5">
          <FileText className="text-accent-cyan mb-3" size={22} />
          <h2 className="font-semibold text-navy mb-1">แยกคลังจากแบบฝึกหัด</h2>
          <p className="text-sm text-graydark/60 leading-relaxed">ข้อสอบ Mock Exam จะเก็บคนละคลังกับแบบฝึกหัดรายวิชา เพื่อไม่ให้เจอข้อซ้ำระหว่างการฝึกและการสอบจำลอง</p>
        </div>
        <div className="border border-graylight/25 rounded-2xl p-5">
          <Clock3 className="text-accent-cyan mb-3" size={22} />
          <h2 className="font-semibold text-navy mb-1">ระบบสอบเตรียมพร้อมแล้ว</h2>
          <p className="text-sm text-graydark/60 leading-relaxed">เมื่อคลังครบ จะใช้ panel การทำข้อสอบเดียวกับแบบฝึกหัด พร้อมจับเวลา 180 นาที, ทำเครื่องหมายไม่แน่ใจ และหยุดพัก/ทำต่อ</p>
        </div>
      </section>
    </div>
  );
}
