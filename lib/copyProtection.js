// กันคัดลอกเนื้อหาข้อสอบ (คำถาม/ตัวเลือก/เฉลย) ป้องกันการนำโจทย์ไปเผยแพร่ต่อ
// ใช้คู่กับคลาส .no-copy (user-select: none) ใน globals.css
export function preventCopy(event) {
  event.preventDefault();
}

export const noCopyHandlers = {
  onCopy: preventCopy,
  onCut: preventCopy,
  onContextMenu: preventCopy,
};
