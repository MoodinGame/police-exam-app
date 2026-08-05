// PostgREST ส่งกลับสูงสุด 1000 แถวต่อคำขอ และ .limit() ที่มากกว่านั้นไม่ override ค่านี้
// ทุกที่ที่ต้อง "นับให้ครบจริง" จึงต้องไล่ทีละหน้า ไม่งั้นพอข้อมูลเกิน 1000 แถวจะนับตกเงียบ ๆ
const PAGE_SIZE = 1000;

export async function fetchAllRows(buildQuery, { maxPages = 50 } = {}) {
  const rows = [];
  for (let page = 0; page < maxPages; page += 1) {
    const { data, error } = await buildQuery().range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...(data || []));
    if ((data || []).length < PAGE_SIZE) break;
  }
  return rows;
}
