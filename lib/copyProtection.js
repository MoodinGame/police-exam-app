// กันคัดลอกเนื้อหาข้อสอบ (คำถาม/ตัวเลือก/เฉลย) ป้องกันการนำโจทย์ไปเผยแพร่ต่อ
// ใช้คู่กับคลาส .no-copy (user-select: none) ใน globals.css
// ปล่อยผ่านถ้าเหตุการณ์เกิดในช่องกรอก เพราะผู้ใช้ต้องคัดลอก/ตัดคำที่ตัวเองพิมพ์ได้
function isEditableTarget(target) {
  const tag = target?.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable === true;
}

export function preventCopy(event) {
  if (isEditableTarget(event.target)) return;
  event.preventDefault();
}

export const noCopyHandlers = {
  onCopy: preventCopy,
  onCut: preventCopy,
  onContextMenu: preventCopy,
};
