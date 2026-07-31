export const subjects = [
  {
    id: 'it',
    name: 'เทคโนโลยีสารสนเทศ (คอมพิวเตอร์)',
    description: 'ความรู้พื้นฐานคอมพิวเตอร์ เครือข่าย อินเทอร์เน็ต และโปรแกรมสำนักงาน',
    count: 40,
  },
  {
    id: 'correspondence',
    name: 'งานสารบรรณ',
    description: 'ระเบียบงานสารบรรณ ประเภทหนังสือราชการ และการจัดเก็บเอกสาร',
    count: 30,
  },
  {
    id: 'law',
    name: 'กฎหมายที่ประชาชนควรรู้',
    description: 'กฎหมายแพ่ง อาญา รัฐธรรมนูญ และกฎหมายที่เกี่ยวข้องกับตำรวจ',
    count: 25,
  },
  {
    id: 'aptitude',
    name: 'ความสามารถทั่วไป (คณิตศาสตร์)',
    description: 'อัตราส่วน ร้อยละ อนุกรม และการให้เหตุผลเชิงตรรกะ',
    count: 20,
  },
  {
    id: 'thai',
    name: 'ภาษาไทย',
    description: 'ราชาศัพท์ โวหาร หลักการเขียน และการอ่านจับใจความ',
    count: 20,
  },
  {
    id: 'english',
    name: 'ภาษาต่างประเทศ (ภาษาอังกฤษ)',
    description: 'Grammar, Vocabulary และคำศัพท์เฉพาะทางตำรวจ',
    count: 15,
  },
];

export const totalQuestions = subjects.reduce((sum, s) => sum + s.count, 0); // 150
