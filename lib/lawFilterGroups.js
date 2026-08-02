import {
  LAW_CIVIL_COMMERCIAL_TOPIC_IDS,
  LAW_CRIMINAL_GENERAL_TOPIC_IDS,
  LAW_CRIMINAL_OFFENCE_TOPIC_IDS,
  LAW_CRIMINAL_PETTY_TOPIC_IDS,
} from './lawTopics';

// โครงสร้างตัวกรองสำหรับหน้ากฎหมายโดยเฉพาะ
// แต่ละรายการอ้างอิง legacy topic id เพื่อให้ใช้ได้ทั้งคลังเดิมและข้อมูลจาก Supabase
export const LAW_FILTER_GROUPS = [
  {
    id: 'criminal',
    label: 'กฎหมายอาญา',
    topicIds: [...LAW_CRIMINAL_GENERAL_TOPIC_IDS, ...LAW_CRIMINAL_OFFENCE_TOPIC_IDS, ...LAW_CRIMINAL_PETTY_TOPIC_IDS],
    children: [
      {
        id: 'criminal-general',
        label: 'ภาค 1 บทบัญญัติทั่วไป',
        topicIds: LAW_CRIMINAL_GENERAL_TOPIC_IDS,
      },
      {
        id: 'criminal-offences',
        label: 'ภาค 2 ความผิด',
        topicIds: LAW_CRIMINAL_OFFENCE_TOPIC_IDS,
      },
      { id: 'criminal-petty', label: 'ภาค 3 ลหุโทษ', topicIds: LAW_CRIMINAL_PETTY_TOPIC_IDS },
    ],
  },
  {
    id: 'civil-commercial',
    label: 'กฎหมายแพ่งและพาณิชย์',
    topicIds: LAW_CIVIL_COMMERCIAL_TOPIC_IDS,
  },
  {
    id: 'police',
    label: 'กฎหมายตำรวจ',
    topicIds: ['law-police-act'],
  },
  {
    id: 'administrative',
    label: 'กฎหมายปกครอง',
    topicIds: ['law-system', 'law-basic'],
  },
  {
    id: 'special-laws',
    label: 'กฎหมายเฉพาะ',
    topicIds: ['law-traffic', 'law-civil-register'],
  },
];
