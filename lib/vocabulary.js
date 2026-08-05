import { flashcards as subjectFlashcards } from './flashcards';

// Oxford 3000 is organised around these CEFR bands.  Keep this definition in
// one place so learner filters, progress panels, and admin tooling agree.
export const OXFORD_CEFR_LEVELS = [
  { id: 'A1', label: 'A1 เริ่มต้น', description: 'คำพื้นฐานในชีวิตประจำวัน', color: 'emerald' },
  { id: 'A2', label: 'A2 พื้นฐาน', description: 'สื่อสารเรื่องทั่วไปได้', color: 'cyan' },
  { id: 'B1', label: 'B1 กลาง', description: 'อ่านและใช้คำในข้อสอบได้มากขึ้น', color: 'blue' },
  { id: 'B2', label: 'B2 สูง', description: 'คำเชิงวิชาการและบริบทซับซ้อน', color: 'violet' },
];

export const OXFORD_3000_TARGET = 3000;

const subjectDecks = [
  { id: 'subject-law', subjectId: 'law', title: 'กฎหมาย', shortTitle: 'กฎหมาย', description: 'สรุปหลักกฎหมายที่ประชาชนควรรู้และใช้ในข้อสอบ', note: 'แฟลชการ์ดสรุปประเด็นกฎหมาย', icon: 'scale', tone: 'navy', kind: 'subject' },
  { id: 'subject-correspondence', subjectId: 'correspondence', title: 'งานสารบรรณ', shortTitle: 'สารบรรณ', description: 'ทบทวนชนิดหนังสือราชการและหลักปฏิบัติงานเอกสาร', note: 'แฟลชการ์ดสรุประเบียบงานสารบรรณ', icon: 'file', tone: 'emerald', kind: 'subject' },
  { id: 'subject-it', subjectId: 'it', title: 'คอมพิวเตอร์', shortTitle: 'คอมพิวเตอร์', description: 'คำสำคัญและพื้นฐานเทคโนโลยีสารสนเทศ', note: 'แฟลชการ์ดสรุปคอมพิวเตอร์', icon: 'cpu', tone: 'sky', kind: 'subject' },
  { id: 'subject-aptitude', subjectId: 'aptitude', title: 'ความสามารถทั่วไป', shortTitle: 'คณิตศาสตร์', description: 'สูตรและแนวคิดคณิตศาสตร์ที่ใช้บ่อยในการทำข้อสอบ', note: 'แฟลชการ์ดสูตรและแนวคิดคณิตศาสตร์', icon: 'calculator', tone: 'teal', kind: 'subject' },
  { id: 'subject-thai', subjectId: 'thai', title: 'ภาษาไทย', shortTitle: 'ภาษาไทย', description: 'ราชาศัพท์ คำไทย และหลักการใช้ภาษา', note: 'แฟลชการ์ดสรุปภาษาไทย', icon: 'thai', tone: 'rose', kind: 'subject' },
  { id: 'subject-english', subjectId: 'english', title: 'ภาษาอังกฤษ', shortTitle: 'ภาษาอังกฤษ', description: 'ไวยากรณ์และรูปประโยคที่พบบ่อยในข้อสอบ', note: 'แฟลชการ์ดสรุปไวยากรณ์อังกฤษ', icon: 'english', tone: 'purple', kind: 'subject' },
];

export const vocabularyDecks = [
  ...subjectDecks,
  {
    id: 'oxford-3000',
    title: 'Oxford 3000',
    shortTitle: 'Oxford 3000',
    description: 'คำศัพท์อังกฤษพื้นฐานที่พบบ่อยในการอ่านและทำข้อสอบ',
    note: 'ชุดเริ่มต้น — สามารถเพิ่มคลังคำศัพท์ทั้งหมดได้ภายหลัง',
    icon: 'book',
    tone: 'cyan',
    kind: 'english',
  },
  {
    id: 'police-english',
    title: 'ศัพท์เฉพาะตำรวจ',
    shortTitle: 'ศัพท์ตำรวจ',
    description: 'คำศัพท์อังกฤษที่ใช้ในบริบทงานตำรวจและกระบวนการยุติธรรม',
    note: 'เน้นคำที่ควรรู้ก่อนสอบและใช้ในงานจริง',
    icon: 'shield',
    tone: 'violet',
    kind: 'police',
  },
];

const englishVocabularyCards = [
  { id: 'ox-ability', deckId: 'oxford-3000', word: 'ability', phonetic: '/əˈbɪləti/', partOfSpeech: 'noun', level: 'A2', translation: 'ความสามารถ', meaning: 'the power or skill to do something', example: 'She has the ability to solve difficult problems.' },
  { id: 'ox-achieve', deckId: 'oxford-3000', word: 'achieve', phonetic: '/əˈtʃiːv/', partOfSpeech: 'verb', level: 'A2', translation: 'บรรลุ, ทำสำเร็จ', meaning: 'to succeed in reaching a goal', example: 'Study every day to achieve your goal.' },
  { id: 'ox-advice', deckId: 'oxford-3000', word: 'advice', phonetic: '/ədˈvaɪs/', partOfSpeech: 'noun', level: 'A2', translation: 'คำแนะนำ', meaning: 'an opinion about what someone should do', example: 'My teacher gave me useful advice.' },
  { id: 'ox-allow', deckId: 'oxford-3000', word: 'allow', phonetic: '/əˈlaʊ/', partOfSpeech: 'verb', level: 'A2', translation: 'อนุญาต', meaning: 'to let someone do something', example: 'The rules allow students to use a dictionary.' },
  { id: 'ox-approach', deckId: 'oxford-3000', word: 'approach', phonetic: '/əˈprəʊtʃ/', partOfSpeech: 'noun', level: 'B1', translation: 'แนวทาง, วิธีการ', meaning: 'a way of dealing with something', example: 'This is a practical approach to learning.' },
  { id: 'ox-benefit', deckId: 'oxford-3000', word: 'benefit', phonetic: '/ˈbenɪfɪt/', partOfSpeech: 'noun', level: 'B1', translation: 'ประโยชน์', meaning: 'an advantage or helpful effect', example: 'Regular practice has many benefits.' },
  { id: 'ox-challenge', deckId: 'oxford-3000', word: 'challenge', phonetic: '/ˈtʃælɪndʒ/', partOfSpeech: 'noun', level: 'B1', translation: 'ความท้าทาย', meaning: 'something difficult that tests your ability', example: 'The exam is a challenge, but you can prepare.' },
  { id: 'ox-compare', deckId: 'oxford-3000', word: 'compare', phonetic: '/kəmˈpeə(r)/', partOfSpeech: 'verb', level: 'A2', translation: 'เปรียบเทียบ', meaning: 'to examine two things to find similarities or differences', example: 'Compare the two answers carefully.' },
  { id: 'ox-concern', deckId: 'oxford-3000', word: 'concern', phonetic: '/kənˈsɜːn/', partOfSpeech: 'noun', level: 'B1', translation: 'ความกังวล, เรื่องที่เกี่ยวข้อง', meaning: 'something that worries you or is important to you', example: 'Public safety is an important concern.' },
  { id: 'ox-decide', deckId: 'oxford-3000', word: 'decide', phonetic: '/dɪˈsaɪd/', partOfSpeech: 'verb', level: 'A2', translation: 'ตัดสินใจ', meaning: 'to choose after thinking about something', example: 'Decide which answer is the best.' },
  { id: 'ox-develop', deckId: 'oxford-3000', word: 'develop', phonetic: '/dɪˈveləp/', partOfSpeech: 'verb', level: 'B1', translation: 'พัฒนา', meaning: 'to grow or improve over time', example: 'You can develop your skills through practice.' },
  { id: 'ox-evidence', deckId: 'oxford-3000', word: 'evidence', phonetic: '/ˈevɪdəns/', partOfSpeech: 'noun', level: 'B1', translation: 'หลักฐาน', meaning: 'facts or information that show something is true', example: 'There is clear evidence in the report.' },
  { id: 'ox-improve', deckId: 'oxford-3000', word: 'improve', phonetic: '/ɪmˈpruːv/', partOfSpeech: 'verb', level: 'A2', translation: 'พัฒนาให้ดีขึ้น', meaning: 'to become better or make something better', example: 'Review mistakes to improve your score.' },
  { id: 'ox-involve', deckId: 'oxford-3000', word: 'involve', phonetic: '/ɪnˈvɒlv/', partOfSpeech: 'verb', level: 'B1', translation: 'เกี่ยวข้อง, มีส่วนร่วม', meaning: 'to include or affect someone or something', example: 'The job involves working with people.' },
  { id: 'ox-maintain', deckId: 'oxford-3000', word: 'maintain', phonetic: '/meɪnˈteɪn/', partOfSpeech: 'verb', level: 'B1', translation: 'รักษาไว้', meaning: 'to keep something at the same level or condition', example: 'Maintain a regular study routine.' },
  { id: 'ox-prevent', deckId: 'oxford-3000', word: 'prevent', phonetic: '/prɪˈvent/', partOfSpeech: 'verb', level: 'B1', translation: 'ป้องกัน', meaning: 'to stop something from happening', example: 'Rules help prevent mistakes.' },
  { id: 'ox-require', deckId: 'oxford-3000', word: 'require', phonetic: '/rɪˈkwaɪə(r)/', partOfSpeech: 'verb', level: 'B1', translation: 'ต้องการ, กำหนดให้ต้อง', meaning: 'to need something or make it necessary', example: 'This task requires careful attention.' },
  { id: 'ox-respond', deckId: 'oxford-3000', word: 'respond', phonetic: '/rɪˈspɒnd/', partOfSpeech: 'verb', level: 'B1', translation: 'ตอบสนอง, ตอบกลับ', meaning: 'to react or give an answer', example: 'Respond to the question clearly.' },
  { id: 'ox-support', deckId: 'oxford-3000', word: 'support', phonetic: '/səˈpɔːt/', partOfSpeech: 'verb', level: 'A2', translation: 'สนับสนุน', meaning: 'to help someone or something succeed', example: 'Evidence can support your answer.' },
  { id: 'ox-suitable', deckId: 'oxford-3000', word: 'suitable', phonetic: '/ˈsuːtəbl/', partOfSpeech: 'adjective', level: 'B1', translation: 'เหมาะสม', meaning: 'right or appropriate for a purpose', example: 'Choose the most suitable answer.' },
  { id: 'ox-vary', deckId: 'oxford-3000', word: 'vary', phonetic: '/ˈveəri/', partOfSpeech: 'verb', level: 'B1', translation: 'แตกต่าง, เปลี่ยนแปลง', meaning: 'to be different in size, amount, or type', example: 'Question difficulty can vary.' },
  { id: 'ox-aware', deckId: 'oxford-3000', word: 'aware', phonetic: '/əˈweə(r)/', partOfSpeech: 'adjective', level: 'B1', translation: 'ตระหนักรู้', meaning: 'knowing that something exists or is happening', example: 'Be aware of the time limit.' },
  { id: 'ox-community', deckId: 'oxford-3000', word: 'community', phonetic: '/kəˈmjuːnəti/', partOfSpeech: 'noun', level: 'A2', translation: 'ชุมชน', meaning: 'people living in the same area or sharing an interest', example: 'Police work closely with the community.' },
  { id: 'ox-duty', deckId: 'oxford-3000', word: 'duty', phonetic: '/ˈdjuːti/', partOfSpeech: 'noun', level: 'B1', translation: 'หน้าที่', meaning: 'something you are responsible for doing', example: 'It is your duty to follow the law.' },

  { id: 'pol-arrest', deckId: 'police-english', word: 'arrest', phonetic: '/əˈrest/', partOfSpeech: 'verb / noun', level: 'ตำรวจ', translation: 'จับกุม', meaning: 'to take someone into custody because they may have committed a crime', example: 'The officer arrested the suspect.' },
  { id: 'pol-bail', deckId: 'police-english', word: 'bail', phonetic: '/beɪl/', partOfSpeech: 'noun', level: 'ตำรวจ', translation: 'การประกันตัว', meaning: 'money paid so that a person can leave custody before trial', example: 'The court granted bail to the defendant.' },
  { id: 'pol-complainant', deckId: 'police-english', word: 'complainant', phonetic: '/kəmˈpleɪnənt/', partOfSpeech: 'noun', level: 'ตำรวจ', translation: 'ผู้ร้องทุกข์', meaning: 'a person who makes a formal complaint', example: 'The complainant gave a statement.' },
  { id: 'pol-constable', deckId: 'police-english', word: 'constable', phonetic: '/ˈkʌnstəbl/', partOfSpeech: 'noun', level: 'ตำรวจ', translation: 'เจ้าหน้าที่ตำรวจชั้นประทวน', meaning: 'a police officer of a junior rank', example: 'A constable arrived at the scene.' },
  { id: 'pol-custody', deckId: 'police-english', word: 'custody', phonetic: '/ˈkʌstədi/', partOfSpeech: 'noun', level: 'ตำรวจ', translation: 'การควบคุมตัว', meaning: 'the legal care or control of a person', example: 'The suspect is in police custody.' },
  { id: 'pol-evidence', deckId: 'police-english', word: 'evidence', phonetic: '/ˈevɪdəns/', partOfSpeech: 'noun', level: 'ตำรวจ', translation: 'พยานหลักฐาน', meaning: 'objects or facts used to prove something in a case', example: 'The team collected evidence at the scene.' },
  { id: 'pol-investigation', deckId: 'police-english', word: 'investigation', phonetic: '/ɪnˌvestɪˈɡeɪʃn/', partOfSpeech: 'noun', level: 'ตำรวจ', translation: 'การสืบสวน', meaning: 'an official attempt to discover facts about an incident', example: 'The investigation is still ongoing.' },
  { id: 'pol-patrol', deckId: 'police-english', word: 'patrol', phonetic: '/pəˈtrəʊl/', partOfSpeech: 'noun / verb', level: 'ตำรวจ', translation: 'การตรวจตรา', meaning: 'the act of checking an area for safety or security', example: 'Officers patrol the area at night.' },
  { id: 'pol-report', deckId: 'police-english', word: 'report', phonetic: '/rɪˈpɔːt/', partOfSpeech: 'noun / verb', level: 'ตำรวจ', translation: 'รายงาน, แจ้งความ', meaning: 'to give information about an incident officially', example: 'Please report the incident immediately.' },
  { id: 'pol-search-warrant', deckId: 'police-english', word: 'search warrant', phonetic: '/sɜːtʃ ˈwɒrənt/', partOfSpeech: 'noun', level: 'ตำรวจ', translation: 'หมายค้น', meaning: 'a legal document allowing police to search a place', example: 'The officers obtained a search warrant.' },
  { id: 'pol-suspect', deckId: 'police-english', word: 'suspect', phonetic: '/səˈspekt/', partOfSpeech: 'noun', level: 'ตำรวจ', translation: 'ผู้ต้องสงสัย', meaning: 'a person believed to have committed a crime', example: 'The suspect was questioned by police.' },
  { id: 'pol-traffic-violation', deckId: 'police-english', word: 'traffic violation', phonetic: '/ˈtræfɪk ˌvaɪəˈleɪʃn/', partOfSpeech: 'noun', level: 'ตำรวจ', translation: 'การกระทำผิดกฎจราจร', meaning: 'an offence against traffic rules', example: 'Speeding is a traffic violation.' },
  { id: 'pol-victim', deckId: 'police-english', word: 'victim', phonetic: '/ˈvɪktɪm/', partOfSpeech: 'noun', level: 'ตำรวจ', translation: 'ผู้เสียหาย', meaning: 'a person harmed by a crime or accident', example: 'The victim needs immediate assistance.' },
  { id: 'pol-witness', deckId: 'police-english', word: 'witness', phonetic: '/ˈwɪtnəs/', partOfSpeech: 'noun', level: 'ตำรวจ', translation: 'พยาน', meaning: 'a person who sees an event happen', example: 'A witness described what happened.' },
];

// คำอ่านไทยช่วยให้ผู้เรียนเริ่มออกเสียงศัพท์ได้ทันที โดยยังเก็บ IPA ไว้สำหรับการฝึกแบบมาตรฐาน
const englishThaiReadings = {
  'ox-ability': 'อะบิลิตี้',
  'ox-achieve': 'อะชีฟ',
  'ox-advice': 'แอดไวซ์',
  'ox-allow': 'อะเลา',
  'ox-approach': 'อะโพรช',
  'ox-benefit': 'เบเนฟิต',
  'ox-challenge': 'แชลเลนจ์',
  'ox-compare': 'คัมแพร์',
  'ox-concern': 'คันเซิร์น',
  'ox-decide': 'ดิไซด์',
  'ox-develop': 'ดีเวลอป',
  'ox-evidence': 'เอวิเดนซ์',
  'ox-improve': 'อิมพรูฟ',
  'ox-involve': 'อินวอล์ฟ',
  'ox-maintain': 'เมนเทน',
  'ox-prevent': 'พรีเวนต์',
  'ox-require': 'ริไควร์',
  'ox-respond': 'รีสพอนด์',
  'ox-support': 'ซะพอร์ต',
  'ox-suitable': 'ซูทะเบิล',
  'ox-vary': 'แวรี',
  'ox-aware': 'อะแวร์',
  'ox-community': 'คะมูนิตี้',
  'ox-duty': 'ดิวตี้',
  'pol-arrest': 'อะเรสต์',
  'pol-bail': 'เบล',
  'pol-complainant': 'คัมเพลนนันต์',
  'pol-constable': 'คันสเทเบิล',
  'pol-custody': 'คัสทะดี',
  'pol-evidence': 'เอวิเดนซ์',
  'pol-investigation': 'อินเวสทิเกชัน',
  'pol-patrol': 'พะโทรล',
  'pol-report': 'รีพอร์ต',
  'pol-search-warrant': 'เซิร์ช วอร์แรนต์',
  'pol-suspect': 'ซัสเพ็กต์',
  'pol-traffic-violation': 'แทรฟฟิก ไวอะเลชัน',
  'pol-victim': 'วิกทิม',
  'pol-witness': 'วิทเนส',
};

const subjectThaiReadings = {
  'english-f1': 'พาสต์ เทนส์ · โก · เวนต์',
  'english-f2': 'ออลโธ · คอนแทรสต์',
};

export const vocabularyCards = [
  ...englishVocabularyCards.map((card) => ({ ...card, thaiReading: englishThaiReadings[card.id] })),
  ...subjectFlashcards.map((card) => {
    const deck = subjectDecks.find((item) => item.subjectId === card.subjectId);
    const titles = {
      'it-f1': 'RAM',
      'it-f2': 'HTTPS และ HTTP',
      'it-f3': 'URL',
      'it-f4': 'ไฟล์ .docx',
      'correspondence-f1': 'ชนิดหนังสือราชการ',
      'correspondence-f2': 'หนังสือภายใน',
      'correspondence-f3': 'หนังสือประทับตรา',
      'law-f1': 'อายุความคดีอาญา',
      'law-f2': 'ป้องกันโดยชอบด้วยกฎหมาย',
      'law-f3': 'การบรรลุนิติภาวะ',
      'aptitude-f1': 'พื้นที่วงกลม',
      'aptitude-f2': 'อัตราส่วน',
      'thai-f1': 'คำว่า “ฉัน”',
      'thai-f2': 'คำว่า “อิเหนา”',
      'english-f1': 'Past tense: go',
      'english-f2': 'Although',
    };
    return {
      id: `subject-${card.id}`,
      deckId: deck.id,
      kind: 'subject',
      word: titles[card.id] || deck.shortTitle,
      phonetic: card.front,
      thaiReading: subjectThaiReadings[card.id],
      partOfSpeech: deck.title,
      level: deck.shortTitle,
      translation: card.back,
      meaning: '',
      example: `ทบทวนหัวข้อ ${deck.title} เพื่อใช้ทำข้อสอบ`,
    };
  }),
  { id: 'subject-correspondence-f4', deckId: 'subject-correspondence', kind: 'subject', word: 'หนังสือเวียน', phonetic: 'หนังสือเวียนใช้สื่อสารกับผู้รับจำนวนมากที่มีข้อความเดียวกัน', partOfSpeech: 'งานสารบรรณ', level: 'สารบรรณ', translation: 'หนังสือที่มีถึงผู้รับหลายราย และมีใจความเดียวกัน', meaning: '', example: 'ทบทวนหัวข้องานสารบรรณเพื่อใช้ทำข้อสอบ' },
  { id: 'subject-law-f4', deckId: 'subject-law', kind: 'subject', word: 'สันนิษฐานว่าเป็นผู้บริสุทธิ์', phonetic: 'ก่อนมีคำพิพากษาถึงที่สุด บุคคลต้องได้รับการสันนิษฐานไว้ก่อนว่าไม่มีความผิด', partOfSpeech: 'กฎหมาย', level: 'กฎหมาย', translation: 'หลักคุ้มครองสิทธิที่ให้ถือว่าผู้ถูกกล่าวหายังเป็นผู้บริสุทธิ์จนกว่าศาลจะพิพากษาถึงที่สุด', meaning: '', example: 'ทบทวนหัวข้อกฎหมายเพื่อใช้ทำข้อสอบ' },
  { id: 'subject-aptitude-f3', deckId: 'subject-aptitude', kind: 'subject', word: 'ร้อยละ', phonetic: 'ร้อยละหมายถึงส่วนหนึ่งจากจำนวนเต็มหนึ่งร้อยส่วน', partOfSpeech: 'ความสามารถทั่วไป', level: 'คณิตศาสตร์', translation: 'ร้อยละ x เท่ากับ x/100 และใช้เปรียบเทียบสัดส่วนของจำนวนได้', meaning: '', example: 'ทบทวนหัวข้อความสามารถทั่วไปเพื่อใช้ทำข้อสอบ' },
  { id: 'subject-aptitude-f4', deckId: 'subject-aptitude', kind: 'subject', word: 'ค่าเฉลี่ย', phonetic: 'ค่าเฉลี่ยเลขคณิตหาได้อย่างไร', partOfSpeech: 'ความสามารถทั่วไป', level: 'คณิตศาสตร์', translation: 'ผลรวมของข้อมูลทั้งหมด ÷ จำนวนข้อมูล', meaning: '', example: 'ทบทวนหัวข้อความสามารถทั่วไปเพื่อใช้ทำข้อสอบ' },
  { id: 'subject-thai-f3', deckId: 'subject-thai', kind: 'subject', word: 'ใจความสำคัญ', phonetic: 'ใจความสำคัญของย่อหน้าคืออะไร', partOfSpeech: 'ภาษาไทย', level: 'ภาษาไทย', translation: 'สาระหลักที่ผู้เขียนต้องการสื่อ ซึ่งครอบคลุมเนื้อหาส่วนใหญ่ของย่อหน้า', meaning: '', example: 'ทบทวนหัวข้อภาษาไทยเพื่อใช้ทำข้อสอบ' },
  { id: 'subject-thai-f4', deckId: 'subject-thai', kind: 'subject', word: 'คำสันธาน', phonetic: 'คำสันธานมีหน้าที่อย่างไร', partOfSpeech: 'ภาษาไทย', level: 'ภาษาไทย', translation: 'เชื่อมคำ กลุ่มคำ หรือประโยคให้มีความสัมพันธ์กัน', meaning: '', example: 'ทบทวนหัวข้อภาษาไทยเพื่อใช้ทำข้อสอบ' },
  { id: 'subject-english-f3', deckId: 'subject-english', kind: 'subject', word: 'Present Perfect', phonetic: 'Present Perfect ใช้โครงสร้างใด', thaiReading: 'เพรสเซนต์ เพอร์เฟ็กต์', partOfSpeech: 'ภาษาอังกฤษ', level: 'ภาษาอังกฤษ', translation: 'have/has + past participle ใช้กล่าวถึงเหตุการณ์ที่เชื่อมโยงกับปัจจุบัน', meaning: '', example: 'ทบทวนหัวข้อภาษาอังกฤษเพื่อใช้ทำข้อสอบ' },
  { id: 'subject-english-f4', deckId: 'subject-english', kind: 'subject', word: 'Modal verb: must', phonetic: 'must ใช้สื่อความหมายใด', thaiReading: 'โมดัล เวิร์บ: มัสต์', partOfSpeech: 'ภาษาอังกฤษ', level: 'ภาษาอังกฤษ', translation: 'ความจำเป็นหรือข้อบังคับ เช่น You must follow the rules.', meaning: '', example: 'ทบทวนหัวข้อภาษาอังกฤษเพื่อใช้ทำข้อสอบ' },
];

export function vocabularyByDeck(deckId, cards = vocabularyCards) {
  return cards.filter((card) => card.deckId === deckId);
}

// The first vocabulary release lives in code so the learning screen remains
// useful on a fresh installation.  The API and admin panel use this same
// canonical shape when they initialise Supabase, so IDs and fields never drift
// between the learner experience and the content-management experience.
export function getFallbackVocabularyLibrary() {
  const deckById = new Map(vocabularyDecks.map((deck) => [deck.id, deck]));
  return {
    decks: vocabularyDecks.map((deck, index) => ({ ...deck, sortOrder: index + 1, isActive: true })),
    cards: vocabularyCards.map((card, index) => ({
      ...card,
      subjectId: card.subjectId || deckById.get(card.deckId)?.subjectId || null,
      sortOrder: index + 1,
      isActive: true,
    })),
  };
}
