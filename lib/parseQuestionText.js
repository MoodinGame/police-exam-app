// แปลงข้อความธรรมดา (พิมพ์/วางจาก Word) ให้เป็นรายการข้อสอบ เพื่อให้แอดมินวางข้อความรูปแบบที่คุ้นเคย
// แทนการเขียน JSON เอง — คั่นแต่ละข้อด้วยบรรทัดว่าง รูปแบบต่อข้อ:
//   โจทย์ข้อสอบ...
//   ก. ตัวเลือก (หรือ A. / 1.)
//   ข. ตัวเลือก
//   เฉลย: ก
//   คำอธิบาย: ... (ไม่บังคับ)
//   ที่มา: ... (ไม่บังคับ)

const LABEL_INDEX = {};
['ก', 'ข', 'ค', 'ง', 'จ', 'ฉ'].forEach((ch, index) => { LABEL_INDEX[ch] = index; });
['A', 'B', 'C', 'D', 'E', 'F'].forEach((ch, index) => { LABEL_INDEX[ch] = index; });
['1', '2', '3', '4', '5', '6'].forEach((ch, index) => { LABEL_INDEX[ch] = index; });

const CHOICE_LINE = /^\s*([กขคงจฉA-Fa-f1-6])\s*([.)：:\-])\s*(.+)$/;
const PARENTHESIZED_CHOICE_LINE = /^\s*\(([กขคงจฉA-Fa-f1-6])\)\s*(.+)$/;
const ANSWER_LINE = /^\s*(?:เฉลย|ตอบ|คำตอบ|answer|ans)\s*[:\-]?\s*(.+)$/i;
const EXPLANATION_LINE = /^\s*(?:คำอธิบาย|อธิบาย|เฉลยละเอียด|explanation)\s*[:\-]?\s*(.+)$/i;
const SOURCE_LINE = /^\s*(?:ที่มา|อ้างอิง|source)\s*[:\-]?\s*(.+)$/i;
const LEADING_NUMBER = /^(?:(?:ข้อ(?:ที่)?|คำถามที่|Q)\s*\d+|\(?\d+\)?)\s*[.)：:]?\s*/i;

function getChoiceParts(line) {
  const regularMatch = line.match(CHOICE_LINE);
  if (regularMatch) {
    return { label: regularMatch[1], delimiter: regularMatch[2], text: regularMatch[3] };
  }

  const parenthesizedMatch = line.match(PARENTHESIZED_CHOICE_LINE);
  if (parenthesizedMatch) {
    return { label: parenthesizedMatch[1], delimiter: ')', text: parenthesizedMatch[2] };
  }

  return null;
}

export function parseQuestionsText(raw) {
  const fragments = (raw || '')
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n+/)
    .map((block) => block.trim())
    .filter(Boolean);
  // ไฟล์ PDF/Word มักมีบรรทัดว่างคั่นระหว่างบทสนทนากับตัวเลือก จึงรวมข้อความ
  // ไปจนถึงบรรทัดเฉลยเดียวกันก่อน ไม่แยกบล็อกตามช่องว่างเพียงอย่างเดียว
  const blocks = [];
  let pending = [];
  let pendingHasAnswer = false;

  fragments.forEach((fragment) => {
    const firstLine = fragment.split('\n').map((line) => line.trim()).find(Boolean) || '';
    const isAnswerContinuation = EXPLANATION_LINE.test(firstLine) || SOURCE_LINE.test(firstLine);
    if (pendingHasAnswer && !isAnswerContinuation) {
      blocks.push(pending.join('\n\n'));
      pending = [];
      pendingHasAnswer = false;
    }
    pending.push(fragment);
    if (fragment.split('\n').some((line) => ANSWER_LINE.test(line.trim()))) pendingHasAnswer = true;
  });
  if (pending.length) blocks.push(pending.join('\n\n'));

  const questions = [];
  const warnings = [];

  blocks.forEach((block, blockIndex) => {
    const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
    if (!lines.length) return;

    // A: / B: ในโจทย์ Conversation เป็นผู้พูด ไม่ใช่ตัวเลือกคำตอบ ถ้าบล็อกนั้นมี
    // ตัวเลือกภาษาไทยตั้งแต่ 2 ข้อ ให้เก็บบทสนทนาไว้ในโจทย์เสมอ
    const thaiChoiceCount = lines.filter((line) => {
      const match = getChoiceParts(line);
      return match && /^[กขคงจฉ]$/.test(match.label);
    }).length;

    const stemLines = [];
    const choices = [];
    const explanationLines = [];
    let answerRaw = null;
    let sourceReference = '';
    let section = 'stem';

    lines.forEach((line, lineIndex) => {
      const choiceMatch = getChoiceParts(line);
      const isDialogueLine = choiceMatch
        && thaiChoiceCount >= 2
        && /^[A-Fa-f]$/.test(choiceMatch.label)
        && [':', '：'].includes(choiceMatch.delimiter);
      // ตัวเลขนำหน้าบรรทัดแรก เช่น "1. Choose the correct answer" คือเลขข้อ
      // ไม่ใช่ตัวเลือกข้อ 1
      const isQuestionNumber = choiceMatch && lineIndex === 0 && /^[1-6]$/.test(choiceMatch.label);
      if (choiceMatch && !isDialogueLine && !isQuestionNumber) { choices.push(choiceMatch.text.trim()); section = 'choices'; return; }

      const answerMatch = line.match(ANSWER_LINE);
      if (answerMatch) { answerRaw = answerMatch[1].trim(); section = 'answer'; return; }

      const explanationMatch = line.match(EXPLANATION_LINE);
      if (explanationMatch) { explanationLines.push(explanationMatch[1].trim()); section = 'explanation'; return; }

      const sourceMatch = line.match(SOURCE_LINE);
      if (sourceMatch) { sourceReference = sourceMatch[1].trim(); section = 'source'; return; }

      if (section === 'stem') stemLines.push(lineIndex === 0 ? line.replace(LEADING_NUMBER, '') : line);
      else if (section === 'explanation') explanationLines.push(line);
    });

    const stem = stemLines.join(' ').trim();
    if (!stem) { warnings.push({ block: blockIndex + 1, message: 'ไม่พบโจทย์ข้อสอบ' }); return; }
    if (choices.length < 2) { warnings.push({ block: blockIndex + 1, message: 'พบตัวเลือกน้อยกว่า 2 ข้อ (ต้องขึ้นต้นบรรทัดด้วย ก./A./1. เป็นต้น)' }); return; }

    let correctIndex = -1;
    if (answerRaw) {
      const key = answerRaw.charAt(0).toUpperCase();
      if (key in LABEL_INDEX) correctIndex = LABEL_INDEX[key];
      if (correctIndex === -1) {
        const foundIndex = choices.findIndex((choiceText) => choiceText === answerRaw);
        if (foundIndex !== -1) correctIndex = foundIndex;
      }
    }
    if (correctIndex === -1 || correctIndex >= choices.length) {
      warnings.push({ block: blockIndex + 1, message: 'ไม่พบเฉลยที่ตรงกับตัวเลือก ให้ระบุบรรทัด "เฉลย: ก" หรือ "เฉลย: A"' });
      return;
    }

    questions.push({
      stem,
      choices,
      correctChoice: String.fromCharCode(65 + correctIndex),
      explanation: explanationLines.join(' ').trim(),
      sourceReference,
    });
  });

  return { questions, warnings };
}
