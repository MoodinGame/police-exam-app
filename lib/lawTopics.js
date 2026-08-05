const studyGroups = {
  basics: {
    mustKnow: ['ความหมาย ระบบ และการแบ่งประเภทของกฎหมาย', 'ลำดับศักดิ์ของกฎหมายและหลักกฎหมายสูงสุด', 'สิทธิ หน้าที่ และกฎหมายที่ใช้ในชีวิตประจำวัน'],
    traps: 'อย่าสับสนระหว่างกฎหมายมหาชน กฎหมายเอกชน และกฎหมายวิธีสบัญญัติ ให้ดูความสัมพันธ์และอำนาจของคู่กรณีเป็นหลัก',
    examStyle: 'จำแนกประเภทกฎหมายหรือเลือกหลักกฎหมายที่ใช้กับสถานการณ์',
  },
  civil: {
    mustKnow: ['บุคคล บุคคลธรรมดา และนิติบุคคล', 'นิติกรรม สัญญา ซื้อขาย ทรัพย์ ครอบครัว และมรดก', 'ผลของการกระทำและเงื่อนไขตามประมวลกฎหมายแพ่งและพาณิชย์'],
    traps: 'ต้องแยกข้อพิพาททางแพ่งออกจากความผิดอาญา และดูคู่สัญญา วัตถุประสงค์ กับผลทางกฎหมายให้ครบ',
    examStyle: 'วิเคราะห์ข้อเท็จจริงเรื่องบุคคล นิติกรรม สัญญา หรือทรัพย์สิน',
  },
  criminal: {
    mustKnow: ['องค์ประกอบความผิด การกระทำ เจตนา และประมาท', 'ประเภทโทษ เหตุยกเว้นโทษ และเหตุลดโทษ', 'หมวดความผิดสำคัญตามประมวลกฎหมายอาญา'],
    traps: 'อย่าตอบจากชื่อฐานความผิดเพียงอย่างเดียว ต้องตรวจองค์ประกอบและข้อยกเว้นตามข้อเท็จจริงก่อน',
    examStyle: 'ระบุฐานความผิดหรือเลือกผลทางอาญาที่สอดคล้องกับเหตุการณ์',
  },
  procedure: {
    mustKnow: ['สิทธิของผู้ต้องหา ผู้เสียหาย และพยาน', 'ขั้นตอนรับแจ้ง จับกุม สอบสวน ฟ้องคดี และพิจารณา', 'บทบาทของศาล พนักงานสอบสวน อัยการ และกระบวนการยุติธรรม'],
    traps: 'แยกอำนาจของเจ้าพนักงานในแต่ละขั้นตอน และอย่าข้ามเงื่อนไขที่กฎหมายกำหนด',
    examStyle: 'เลือกขั้นตอนหรือสิทธิที่ถูกต้องในสถานการณ์ทางคดีอาญา',
  },
  public: {
    mustKnow: ['รัฐธรรมนูญ อำนาจอธิปไตย และโครงสร้างการปกครอง', 'องค์กรอิสระและหลักนิติรัฐ', 'หน้าที่ราชการและความผิดต่อเจ้าพนักงาน'],
    traps: 'อย่าสับสนอำนาจนิติบัญญัติ บริหาร และตุลาการ หรือบทบาทขององค์กรอิสระกับหน่วยงานฝ่ายบริหาร',
    examStyle: 'จับคู่หน้าที่ หน่วยงาน หรือหลักรัฐธรรมนูญกับเหตุการณ์',
  },
  special: {
    mustKnow: ['กฎหมายจราจร ทะเบียนราษฎร เช็ค ภาษี และคุ้มครองผู้บริโภค', 'เงื่อนไข หน้าที่ และข้อห้ามในกฎหมายเฉพาะ', 'หลักการใช้กฎหมายเฉพาะควบคู่กฎหมายทั่วไป'],
    traps: 'อ่านข้อความโจทย์ให้ครบ เพราะกฎหมายเฉพาะมักมีเงื่อนไข บุคคล หรือระยะเวลาที่ต่างจากหลักทั่วไป',
    examStyle: 'เลือกหน้าที่ ขั้นตอน หรือความรับผิดตามกฎหมายเฉพาะ',
  },
};

function makeSeries(prefix, title, count, group, startAt = 1) {
  return Array.from({ length: count }, (_, index) => {
    const number = startAt + index;
    return [`${prefix}-${String(number).padStart(2, '0')}`, `${title} ชุดที่ ${number}`, group];
  });
}

// หัวข้อบนการ์ดแบบฝึกหัด: แยกตามชุดย่อยที่ผู้เรียนเลือกฝึกได้ทันที
// ยังไม่ผูกจำนวนข้อไว้ที่นี่ เพราะแอดมินเป็นผู้กำหนดคำถามและจำนวนข้อของแต่ละชุด
const criminalGeneralDefinitions = [
  ...makeSeries('law-criminal-definition', 'กฎหมายอาญา บทนิยาม', 7, 'criminal'),
  ['law-criminal-multiple-offences', 'การกระทำความผิดหลายบทหรือหลายกระทง ชุดที่ 1', 'criminal'],
  ['law-criminal-recidivism', 'การกระทำความผิดซ้ำ ชุดที่ 1', 'criminal'],
  ['law-criminal', 'การใช้กฎหมายอาญา ชุดที่ 1', 'criminal'],
  ...makeSeries('law-criminal-application', 'การใช้กฎหมายอาญา', 4, 'criminal', 2),
  ...makeSeries('law-criminal-attempt', 'การพยายามกระทำความผิด', 2, 'criminal'),
  ...makeSeries('law-criminal-liability', 'ความรับผิดทางอาญา', 5, 'criminal'),
  ...makeSeries('law-criminal-participant', 'ตัวการ ผู้ใช้ และผู้สนับสนุน', 3, 'criminal'),
  ['law-penalty', 'โทษและวิธีการเพื่อความปลอดภัย ชุดที่ 1', 'criminal'],
  ...makeSeries('law-criminal-penalty-measures', 'โทษและวิธีการเพื่อความปลอดภัย', 4, 'criminal', 2),
];

const criminalOffenceDefinitions = [
  ...makeSeries('law-public-danger', 'ความผิดเกี่ยวกับการก่อให้เกิดอันตรายต่อประชาชน', 2, 'criminal'),
  ...makeSeries('law-forgery', 'ความผิดเกี่ยวกับการปลอมและการแปลง', 2, 'criminal'),
  ...makeSeries('law-justice', 'ความผิดเกี่ยวกับการยุติธรรม', 2, 'criminal'),
  ...makeSeries('law-public-health', 'ความผิดเกี่ยวกับความสงบสุขของประชาชน', 2, 'criminal'),
  ...makeSeries('law-life-body', 'ความผิดเกี่ยวกับชีวิตและร่างกาย', 5, 'criminal'),
  ...makeSeries('law-property-offense', 'ความผิดเกี่ยวกับทรัพย์', 5, 'criminal'),
  ...makeSeries('law-sexual', 'ความผิดเกี่ยวกับเพศ', 5, 'criminal'),
  ...makeSeries('law-liberty', 'ความผิดเกี่ยวกับเสรีภาพ', 2, 'criminal'),
  ...makeSeries('law-reputation', 'ความผิดเกี่ยวกับชื่อเสียง', 2, 'criminal'),
];

const criminalPettyDefinitions = [
  ...makeSeries('law-criminal-petty', 'ลหุโทษ', 3, 'criminal'),
  ['law-criminal-limitations', 'อายุความ ชุดที่ 1', 'criminal'],
];

const civilCommercialDefinitions = [
  ['law-property', 'ทรัพย์ ชุดที่ 1', 'civil'],
  ...makeSeries('law-civil-property', 'ทรัพย์', 5, 'civil', 2),
  ['law-juristic-act', 'นิติกรรม ชุดที่ 1', 'civil'],
  ['law-natural-person', 'บุคคลธรรมดา ชุดที่ 1', 'civil'],
  ...makeSeries('law-natural-person', 'บุคคลธรรมดา', 4, 'civil', 2),
];

export const LAW_CRIMINAL_GENERAL_TOPIC_IDS = criminalGeneralDefinitions.map(([id]) => id);
export const LAW_CRIMINAL_OFFENCE_TOPIC_IDS = criminalOffenceDefinitions.map(([id]) => id);
export const LAW_CRIMINAL_PETTY_TOPIC_IDS = criminalPettyDefinitions.map(([id]) => id);
export const LAW_CIVIL_COMMERCIAL_TOPIC_IDS = civilCommercialDefinitions.map(([id]) => id);

const definitions = [
  ...criminalGeneralDefinitions,
  ...criminalOffenceDefinitions,
  ...criminalPettyDefinitions,
  ...civilCommercialDefinitions,

  ['law-system', 'ระบบและการแบ่งประเภทกฎหมาย', 'basics'],
  ['law-basic', 'ความรู้ทั่วไปทางกฎหมาย', 'basics'],
  ['law-police-act', 'กฎหมายที่ประชาชนควรรู้', 'basics'],
  ['law-traffic', 'กฎหมายจราจร', 'special'],
  ['law-civil-register', 'กฎหมายทะเบียนราษฎร', 'special'],
];

export const lawTopics = definitions.map(([id, name, group]) => ({
  id,
  name,
  group,
  description: `หลักเกณฑ์ ขอบเขต และแนววิเคราะห์เรื่อง${name}`,
  ...studyGroups[group],
}));
