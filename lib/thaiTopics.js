// หมวดภาษาไทยกลาง: ใช้ร่วมกันในแบบฝึกหัด ตัวกรอง Random Quiz และคลังความรู้
// ผู้ดูแลสามารถเพิ่มคำถามให้แต่ละหมวดได้ภายหลัง โดยระบบจะเปิดเฉพาะหมวดที่มีคำถาม

const studyGroups = {
  reading: {
    mustKnow: [
      'จับใจความสำคัญ รายละเอียด และเจตนาของผู้เขียน',
      'แยกข้อเท็จจริง ความคิดเห็น และข้อสรุปจากบทอ่าน',
      'ตีความคำหรือข้อความตามบริบทและความสัมพันธ์ของเนื้อหา',
    ],
    traps: 'อย่าเลือกคำตอบที่ยกคำจากบทอ่านมาเพียงบางส่วน ให้ตรวจว่าตอบตรงประเด็นที่โจทย์ถามทั้งประโยค',
    examStyle: 'ตอบคำถามจับใจความ ตีความ วิเคราะห์บทความ หรือเรียงลำดับข้อความ',
  },
  writing: {
    mustKnow: [
      'โครงสร้างข้อความ: เปิดเรื่อง ขยายความ และสรุป',
      'การเลือกถ้อยคำให้เหมาะกับผู้รับสารและจุดประสงค์',
      'โวหารและวิธีสื่อสารที่ทำให้ข้อความชัดเจน',
    ],
    traps: 'คำที่สละสลวยไม่ใช่คำตอบเสมอไป ต้องเลือกข้อความที่ถูกต้อง ชัดเจน และเหมาะกับบริบท',
    examStyle: 'เลือกข้อความที่เหมาะสม เติมข้อความ หรือเรียงประโยคให้สื่อความครบถ้วน',
  },
  grammar: {
    mustKnow: [
      'ชนิดของคำ หน้าที่คำ และโครงสร้างประโยค',
      'การสร้างคำ การสะกดคำ และหลักเสียงภาษาไทย',
      'คำเชื่อม การเรียงประโยค และเครื่องหมายวรรคตอน',
    ],
    traps: 'ให้พิจารณาหน้าที่และความหมายของคำในประโยค ไม่ตัดสินจากรูปคำเพียงอย่างเดียว',
    examStyle: 'จำแนกชนิดคำ วิเคราะห์ประโยค เลือกคำที่ถูกต้อง และหาข้อผิดพลาดทางภาษา',
  },
  vocabulary: {
    mustKnow: [
      'ความหมายคำตามบริบทและระดับภาษา',
      'คำราชาศัพท์ คำสุภาพ คำยืม คำทับศัพท์ และสำนวน',
      'การเลือกใช้คำให้ถูกต้องและเหมาะกับสถานการณ์',
    ],
    traps: 'คำที่มีความหมายใกล้กันอาจใช้แทนกันไม่ได้ ต้องดูระดับภาษาและความสัมพันธ์กับคำรอบข้าง',
    examStyle: 'เลือกคำที่มีความหมายเหมาะสม จับคู่คำ และวิเคราะห์สำนวนหรือคำราชาศัพท์',
  },
  official: {
    mustKnow: [
      'ลักษณะภาษาและรูปแบบของหนังสือราชการ',
      'ถ้อยคำราชการที่ชัดเจน กระชับ และเป็นทางการ',
      'การสื่อสารในงานเขียนราชการตามผู้รับและวัตถุประสงค์',
    ],
    traps: 'หลีกเลี่ยงภาษาพูด คำฟุ่มเฟือย และคำที่ตีความได้หลายทางเมื่อโจทย์เป็นบริบทหนังสือราชการ',
    examStyle: 'เลือกถ้อยคำหรือข้อความที่เหมาะกับงานเขียนและหนังสือราชการ',
  },
};

const definitions = [
  ['thai-summary', 'การย่อความ', 'reading'],
  ['thai-article-analysis', 'การวิเคราะห์บทความ', 'reading', 'thai-reading-comprehension'],
  ['thai-compound', 'การสร้างคำ', 'grammar'],
  ['thai-spelling', 'การสะกดคำ', 'grammar'],
  ['thai-communication', 'การสื่อสาร', 'writing'],
  ['thai-reading-general', 'การอ่าน', 'reading'],
  ['thai-reading', 'การอ่านจับใจความ', 'reading', 'thai-reading-comprehension'],
  ['thai-interpretation', 'การอ่านตีความ', 'reading'],
  ['thai-reading-analysis', 'การอ่านวิเคราะห์', 'reading'],
  ['thai-critical-reading', 'การอ่านเชิงวิเคราะห์', 'reading'],
  ['thai-writing', 'การเขียน', 'writing'],
  ['thai-writing-thai', 'การเขียนภาษาไทย', 'writing'],
  ['thai-completion', 'การเติมคำ', 'grammar'],
  ['thai-sentence-order', 'การเรียงประโยค', 'grammar'],
  ['thai-text-order', 'การเรียงลำดับข้อความ', 'reading'],
  ['thai-word-choice', 'การเลือกใช้คำ', 'vocabulary'],
  ['thai-word-use', 'การใช้คำ', 'vocabulary'],
  ['thai-language-use', 'การใช้ภาษา', 'vocabulary'],
  ['thai-compound-words', 'คำซ้อน', 'grammar'],
  ['thai-repetition', 'คำซ้ำ', 'grammar'],
  ['thai-transliteration', 'คำทับศัพท์', 'vocabulary'],
  ['thai-loanwords', 'คำยืมภาษาต่างประเทศ', 'vocabulary'],
  ['thai-royal-word', 'คำราชาศัพท์', 'vocabulary'],
  ['thai-vocabulary', 'คำศัพท์', 'vocabulary'],
  ['thai-connectors', 'คำเชื่อม', 'grammar'],
  ['thai-official-writing', 'งานเขียนราชการ', 'official'],
  ['thai-parts-of-speech', 'ชนิดของคำ', 'grammar'],
  ['thai-sentence-types', 'ชนิดของประโยค', 'grammar'],
  ['thai-sentence', 'ประโยค', 'grammar'],
  ['thai-rhetoric', 'ภาพพจน์', 'writing', 'thai-figures-of-speech'],
  ['thai-official-language', 'ภาษาราชการ', 'official'],
  ['thai-official-document-language', 'ภาษาในหนังสือราชการ', 'official'],
  ['thai-register', 'ระดับภาษา', 'vocabulary'],
  ['thai-royal', 'ราชาศัพท์', 'vocabulary'],
  ['thai-royal-polite', 'ราชาศัพท์และคำสุภาพ', 'vocabulary'],
  ['thai-classifier', 'ลักษณนาม', 'grammar'],
  ['thai-idiom', 'สำนวน', 'vocabulary'],
  ['thai-idiom-proverb', 'สำนวน สุภาษิต คำพังเพย', 'vocabulary'],
  ['thai-proverb', 'สำนวนสุภาษิตคำพังเพย', 'vocabulary'],
  ['thai-thai-numeral', 'จำนวนไทย', 'grammar'],
  ['thai-official-book', 'หนังสือราชการ', 'official'],
  ['thai-grammar', 'หลักภาษา', 'grammar'],
  ['thai-grammar-use', 'หลักภาษาและการใช้ภาษา', 'grammar'],
  ['thai-punctuation', 'เครื่องหมายวรรคตอน', 'grammar'],
  ['thai-sound', 'เสียงในภาษาไทย', 'grammar'],
  ['thai-rhetoric-general', 'โวหาร', 'writing'],
  ['thai-writing-rhetoric', 'โวหารการเขียน', 'writing'],
  ['thai-syntax', 'ไวยากรณ์', 'grammar'],
];

export const thaiTopics = definitions.map(([id, name, group, articleId = null]) => ({
  id,
  name,
  description: `หลักการ วิธีวิเคราะห์ และแนวทำข้อสอบเรื่อง${name}`,
  articleId,
  ...studyGroups[group],
}));
