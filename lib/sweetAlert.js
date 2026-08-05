const SWEET_ALERT_CLASSES = {
  popup: 'rounded-3xl border border-slate-200 bg-white px-5 pb-5 pt-6 shadow-[0_24px_70px_rgba(18,31,62,0.28)] sm:px-8 sm:pb-7',
  title: 'mt-2 text-xl font-black text-navy sm:text-2xl',
  htmlContainer: 'mt-2 text-sm leading-6 text-graydark/65',
  actions: 'mt-6 flex gap-2.5 sm:gap-3',
  confirmButton: 'swal-action-confirm',
  cancelButton: 'swal-action-cancel',
};

async function getSwal() {
  const { default: Swal } = await import('sweetalert2');
  return Swal;
}

export async function confirmIncompleteAnswers(remaining, action = 'ส่งคำตอบ') {
  const Swal = await getSwal();
  const result = await Swal.fire({
    icon: 'warning',
    iconColor: '#d2a94f',
    title: `ยังเหลืออีก ${remaining} ข้อ`,
    text: `คุณยังไม่ได้ตอบบางข้อ ต้องการ${action}ตอนนี้เลยหรือไม่`,
    showCancelButton: true,
    confirmButtonText: `${action}เลย`,
    cancelButtonText: 'กลับไปทำต่อ',
    reverseButtons: true,
    buttonsStyling: false,
    focusCancel: true,
    customClass: SWEET_ALERT_CLASSES,
  });
  return result.isConfirmed;
}

export async function confirmDiscardSession() {
  const Swal = await getSwal();
  const result = await Swal.fire({
    icon: 'question',
    iconColor: '#00b4d8',
    title: 'ทิ้งข้อสอบที่พักไว้?',
    text: 'ความคืบหน้าและคำตอบที่ทำไว้จะถูกลบออกจากอุปกรณ์นี้',
    showCancelButton: true,
    confirmButtonText: 'ทิ้งข้อสอบ',
    cancelButtonText: 'เก็บไว้ทำต่อ',
    reverseButtons: true,
    buttonsStyling: false,
    focusCancel: true,
    customClass: SWEET_ALERT_CLASSES,
  });
  return result.isConfirmed;
}

export async function confirmArchiveQuestion() {
  const Swal = await getSwal();
  const result = await Swal.fire({
    icon: 'warning',
    iconColor: '#ef4444',
    title: 'ปิดใช้งานข้อสอบนี้?',
    text: 'ข้อสอบจะไม่ถูกนำไปใช้กับผู้เรียนใหม่ แต่ข้อมูลเดิมยังอยู่และเปิดใช้งานกลับได้ภายหลัง',
    showCancelButton: true,
    confirmButtonText: 'ปิดใช้งาน',
    cancelButtonText: 'เก็บไว้ใช้งาน',
    reverseButtons: true,
    buttonsStyling: false,
    focusCancel: true,
    customClass: SWEET_ALERT_CLASSES,
  });
  return result.isConfirmed;
}

export async function confirmDeleteSet(title) {
  const Swal = await getSwal();
  const result = await Swal.fire({
    icon: 'warning',
    iconColor: '#ef4444',
    title: 'ลบชุดข้อสอบนี้?',
    text: `"${title}" จะถูกลบออกจากระบบ ข้อสอบในคลังยังอยู่ แต่จะหลุดจากชุดนี้ทั้งหมด และย้อนกลับไม่ได้`,
    showCancelButton: true,
    confirmButtonText: 'ลบชุดข้อสอบ',
    cancelButtonText: 'ยกเลิก',
    reverseButtons: true,
    buttonsStyling: false,
    focusCancel: true,
    customClass: SWEET_ALERT_CLASSES,
  });
  return result.isConfirmed;
}

export async function confirmArchiveTopic() {
  const Swal = await getSwal();
  const result = await Swal.fire({
    icon: 'warning',
    iconColor: '#ef4444',
    title: 'ปิดใช้งานหมวดย่อยนี้?',
    text: 'หมวดย่อยจะไม่แสดงให้เลือกใหม่ แต่ข้อสอบและชุดข้อสอบเดิมที่ผูกไว้ยังใช้งานได้ และเปิดกลับได้ภายหลัง',
    showCancelButton: true,
    confirmButtonText: 'ปิดใช้งาน',
    cancelButtonText: 'เก็บไว้ใช้งาน',
    reverseButtons: true,
    buttonsStyling: false,
    focusCancel: true,
    customClass: SWEET_ALERT_CLASSES,
  });
  return result.isConfirmed;
}

export async function confirmDeleteTopic(name) {
  const Swal = await getSwal();
  const result = await Swal.fire({
    icon: 'warning',
    iconColor: '#ef4444',
    title: 'ลบหัวข้อนี้ถาวร?',
    html: `<b>${name || 'หัวข้อนี้'}</b> และหัวข้อย่อยทั้งหมดข้างในจะถูกลบถาวร กู้คืนไม่ได้<br/><span style="font-size:0.9em;opacity:0.75">ข้อสอบที่อยู่ในหัวข้อนี้จะไม่ถูกลบ แต่จะหลุดออกจากหมวด</span>`,
    showCancelButton: true,
    confirmButtonText: 'ลบถาวร',
    cancelButtonText: 'ยกเลิก',
    reverseButtons: true,
    buttonsStyling: false,
    focusCancel: true,
    customClass: SWEET_ALERT_CLASSES,
  });
  return result.isConfirmed;
}

// ยืนยันรอบสองเมื่อวิชายังมีหัวข้อย่อยค้างอยู่ ต้องบอกจำนวนให้ชัดก่อนลบยกชุด
export async function confirmCascadeDeleteSubject(name, topicCount) {
  const Swal = await getSwal();
  const result = await Swal.fire({
    icon: 'warning',
    iconColor: '#ef4444',
    title: 'ลบพร้อมหัวข้อย่อยทั้งหมด?',
    html: `<b>${name || 'หมวดวิชานี้'}</b> ยังมีหัวข้อย่อย <b>${topicCount}</b> รายการ<br/><span style="font-size:0.9em;opacity:0.75">ยืนยันแล้วจะลบทั้งวิชาและหัวข้อย่อยทั้งหมดถาวร กู้คืนไม่ได้</span>`,
    showCancelButton: true,
    confirmButtonText: `ลบทั้งวิชาและ ${topicCount} หัวข้อ`,
    cancelButtonText: 'ยกเลิก',
    reverseButtons: true,
    buttonsStyling: false,
    focusCancel: true,
    customClass: SWEET_ALERT_CLASSES,
  });
  return result.isConfirmed;
}

export async function confirmDeleteSubject(name) {
  const Swal = await getSwal();
  const result = await Swal.fire({
    icon: 'warning',
    iconColor: '#ef4444',
    title: 'ลบหมวดวิชานี้?',
    html: `<b>${name || 'หมวดวิชานี้'}</b> จะถูกลบถาวร<br/><span style="font-size:0.9em;opacity:0.75">ถ้ายังมีหัวข้อย่อยอยู่ ระบบจะถามยืนยันอีกครั้ง · วิชาที่มีข้อสอบค้างอยู่จะลบไม่ได้</span>`,
    showCancelButton: true,
    confirmButtonText: 'ลบถาวร',
    cancelButtonText: 'ยกเลิก',
    reverseButtons: true,
    buttonsStyling: false,
    focusCancel: true,
    customClass: SWEET_ALERT_CLASSES,
  });
  return result.isConfirmed;
}

export async function confirmResetProgress() {
  const Swal = await getSwal();
  const result = await Swal.fire({
    icon: 'warning',
    iconColor: '#ef4444',
    title: 'ล้างสถิติการทำข้อสอบทั้งระบบ?',
    html: 'ประวัติการทำข้อสอบของผู้ใช้ <b>ทุกคน</b> จะถูกลบถาวร กู้คืนไม่ได้<br/><span style="font-size:0.9em;opacity:0.75">ข้อสอบในคลัง บัญชีสมาชิก และสิทธิ์แพ็กเกจจะไม่ถูกลบ</span>',
    input: 'text',
    inputPlaceholder: 'พิมพ์ ล้างสถิติ เพื่อยืนยัน',
    inputValidator: (value) => (value === 'ล้างสถิติ' ? undefined : 'พิมพ์คำว่า ล้างสถิติ ให้ถูกต้องเพื่อยืนยัน'),
    showCancelButton: true,
    confirmButtonText: 'ล้างสถิติทั้งหมด',
    cancelButtonText: 'ยกเลิก',
    reverseButtons: true,
    buttonsStyling: false,
    focusCancel: true,
    customClass: SWEET_ALERT_CLASSES,
  });
  return result.isConfirmed;
}

export async function confirmDeleteAnnouncement() {
  const Swal = await getSwal();
  const result = await Swal.fire({
    icon: 'warning',
    iconColor: '#ef4444',
    title: 'ลบประกาศนี้?',
    text: 'ประกาศจะถูกลบออกจากระบบทันทีและย้อนกลับไม่ได้',
    showCancelButton: true,
    confirmButtonText: 'ลบประกาศ',
    cancelButtonText: 'ยกเลิก',
    reverseButtons: true,
    buttonsStyling: false,
    focusCancel: true,
    customClass: SWEET_ALERT_CLASSES,
  });
  return result.isConfirmed;
}

export async function confirmDeletePlan(name) {
  const Swal = await getSwal();
  const result = await Swal.fire({
    icon: 'warning',
    iconColor: '#ef4444',
    title: 'ลบแพ็กเกจนี้?',
    text: `"${name}" จะถูกลบออกจากระบบทันทีและย้อนกลับไม่ได้ สมาชิกที่มีสิทธิ์อยู่แล้วจะไม่ได้รับผลกระทบ`,
    showCancelButton: true,
    confirmButtonText: 'ลบแพ็กเกจ',
    cancelButtonText: 'ยกเลิก',
    reverseButtons: true,
    buttonsStyling: false,
    focusCancel: true,
    customClass: SWEET_ALERT_CLASSES,
  });
  return result.isConfirmed;
}

export async function showLoginUpdateNotice(announcement = null) {
  const Swal = await getSwal();

  if (announcement) {
    const icon = { success: 'success', warning: 'warning', important: 'info', info: 'info' }[announcement.tone] || 'info';
    await Swal.fire({
      icon,
      iconColor: announcement.tone === 'warning' ? '#d2a94f' : '#00b4d8',
      title: announcement.title,
      text: announcement.body || announcement.summary,
      confirmButtonText: 'รับทราบ',
      buttonsStyling: false,
      customClass: {
        ...SWEET_ALERT_CLASSES,
        popup: `${SWEET_ALERT_CLASSES.popup} swal-update-popup`,
        title: `${SWEET_ALERT_CLASSES.title} swal-update-title`,
        confirmButton: `${SWEET_ALERT_CLASSES.confirmButton} swal-update-confirm`,
      },
    });
    return;
  }

  await Swal.fire({
    icon: 'info',
    iconColor: '#00b4d8',
    title: 'มีอะไรอัปเดตใน POLREADY',
    html: `
      <div class="swal-update-list">
        <div class="swal-update-item swal-update-item-ready">
          <span class="swal-update-icon">✓</span>
          <div><strong>เริ่มฝึกได้เลย</strong><p>แบบฝึกหัดรายวิชา, Random Quiz, แฟลชการ์ด และ Mock Exam พร้อมให้ทดลองใช้งาน</p></div>
        </div>
        <div class="swal-update-item swal-update-item-progress">
          <span class="swal-update-icon">↗</span>
          <div><strong>คลังความรู้กำลังจัดทำ</strong><p>ทีมงานกำลังเรียบเรียงและตรวจทานเนื้อหาให้ครบตามขอบเขตข้อสอบนายสิบตำรวจ</p></div>
        </div>
        <div class="swal-update-note">บางหมวดอาจแสดงว่า “ยังไม่เปิด” จนกว่าผู้ดูแลจะเพิ่มชุดข้อสอบในหมวดนั้น</div>
      </div>
    `,
    confirmButtonText: 'เริ่มใช้งาน',
    buttonsStyling: false,
    customClass: {
      ...SWEET_ALERT_CLASSES,
      popup: `${SWEET_ALERT_CLASSES.popup} swal-update-popup`,
      title: `${SWEET_ALERT_CLASSES.title} swal-update-title`,
      confirmButton: `${SWEET_ALERT_CLASSES.confirmButton} swal-update-confirm`,
    },
  });
}
