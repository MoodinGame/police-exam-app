export const subjects = [
  {
    id: 'law',
    name: 'กฎหมายที่ประชาชนควรรู้',
    description: 'กฎหมายแพ่ง อาญา รัฐธรรมนูญ และกฎหมายที่เกี่ยวข้องกับตำรวจ',
    count: 25,
  },
  {
    id: 'english',
    name: 'ภาษาต่างประเทศ (ภาษาอังกฤษ)',
    description: 'Grammar, Vocabulary และคำศัพท์เฉพาะทางตำรวจ',
    count: 15,
  },
  {
    id: 'correspondence',
    name: 'สารบรรณ',
    description: 'ระเบียบงานสารบรรณ ประเภทหนังสือราชการ และการจัดเก็บเอกสาร',
    count: 30,
  },
  {
    id: 'police-correspondence',
    name: 'สารบรรณตำรวจ',
    description: 'ระเบียบ เอกสาร และแนวปฏิบัติงานสารบรรณในหน่วยงานตำรวจ',
    count: 0,
  },
  {
    id: 'it',
    name: 'เทคโนโลยีสารสนเทศ (คอมพิวเตอร์)',
    description: 'ความรู้พื้นฐานคอมพิวเตอร์ เครือข่าย อินเทอร์เน็ต และโปรแกรมสำนักงาน',
    count: 40,
  },
  {
    id: 'social',
    name: 'สังคม',
    description: 'สังคม วัฒนธรรม ศาสนา จริยธรรม ธรรมาภิบาล และอาเซียน',
    count: 0,
  },
  {
    id: 'aptitude',
    name: 'ความรู้ความสามารถทั่วไป',
    description: 'อัตราส่วน ร้อยละ อนุกรม และการให้เหตุผลเชิงตรรกะ',
    count: 20,
  },
  {
    id: 'thai',
    name: 'ภาษาไทย',
    description: 'ราชาศัพท์ โวหาร หลักการเขียน และการอ่านจับใจความ',
    count: 20,
  },
];

export const totalQuestions = subjects.reduce((sum, s) => sum + s.count, 0); // 150
