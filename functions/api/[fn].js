/**
 * Backend thay cho Code.gs — chạy trên Cloudflare Pages Functions, lưu dữ liệu trong D1.
 *
 * Mỗi hàm cũ của Apps Script được gọi qua: POST /api/<tênHàm>, body là mảng tham số (JSON).
 * Ví dụ: google.script.run.quickUpdate(id, status, pct)  →  POST /api/quickUpdate  body: [id, status, pct]
 * File public/api-shim.js lo việc chuyển đổi này, nên Index.html gần như giữ nguyên.
 *
 * Cần cấu hình trên Cloudflare:
 *   - Binding D1 tên DB
 *   - Secret ADMIN_PASSWORD (mật khẩu để được phép sửa dữ liệu)
 */

// ══════════ HELPERS ══════════
const VN_OFFSET_MS = 7 * 3600 * 1000; // Giờ Việt Nam (UTC+7)
const today = () => new Date(Date.now() + VN_OFFSET_MS).toISOString().slice(0, 10);
const str = (v) => (v == null ? '' : String(v).trim());
const pad2 = (n) => (n < 10 ? '0' : '') + n;

// Chuẩn hóa ngày về yyyy-MM-dd (nhận cả dd/MM/yyyy)
function normDate(v) {
  const s = str(v);
  let m;
  if ((m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/))) return `${m[1]}-${pad2(+m[2])}-${pad2(+m[3])}`;
  if ((m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/))) return `${m[3]}-${pad2(+m[2])}-${pad2(+m[1])}`;
  return '';
}

// Dòng DB → object với đúng tên khóa mà giao diện cũ đang dùng
const rowToItem = (r) => ({
  'ID': r.id,
  'Lộ trình': r.lo_trinh,
  'Mảng kiến thức': r.mang_kien_thuc,
  'Mức độ chi tiết': r.ten_khoa_hoc,
  'Mức độ ưu tiên': r.muc_do_uu_tien,
  'Nền tảng học': r.nen_tang,
  'Link': r.link,
  'Nội dung học': r.noi_dung,
  'Ghi chú': r.ghi_chu,
  'Trạng thái': r.trang_thai,
  'Tiến độ (%)': r.tien_do,
  'Ngày bắt đầu': r.ngay_bat_dau,
  'Ngày hoàn thành': r.ngay_hoan_thanh,
  'Ghi chú cá nhân': r.ghi_chu_ca_nhan,
});

const rowToLesson = (r) => ({
  id: r.id,
  id_road_map: r.roadmap_id,
  ten_bai_hoc: r.ten_bai_hoc,
  mo_ta: r.mo_ta,
  'Ngày bắt đầu': r.ngay_bat_dau,
  'Ngày hoàn thành': r.ngay_hoan_thanh,
  trang_thai_hoan_thanh: r.trang_thai,
});

// Tìm số thứ tự lớn nhất sau tiền tố: "DA." → DA.001, DA.002...
function maxSuffix(ids, prefix) {
  let max = 0;
  for (const id of ids) {
    if (!id.startsWith(prefix)) continue;
    const rest = id.slice(prefix.length);
    if (/^\d+$/.test(rest)) max = Math.max(max, parseInt(rest, 10));
  }
  return max;
}

const lessonStatusFromDates = (s, e) => (e ? 'Hoàn thành' : s ? 'Đang học' : 'Chưa học');

// ══════════ ROADMAP ══════════
async function getAllItems(db) {
  const { results } = await db.prepare('SELECT * FROM roadmap ORDER BY rowid').all();
  return results.map(rowToItem);
}

async function nextRoadmapId(db, track) {
  const { results } = await db.prepare('SELECT id FROM roadmap').all();
  const prefix = track + '.';
  return prefix + String(maxSuffix(results.map((r) => r.id), prefix) + 1).padStart(3, '0');
}

async function addItem(db, item) {
  item = item || {};
  const track = str(item['Lộ trình']) || 'DA';
  const id = await nextRoadmapId(db, track);
  await db
    .prepare(
      `INSERT INTO roadmap (id, lo_trinh, mang_kien_thuc, ten_khoa_hoc, muc_do_uu_tien, nen_tang, link,
        noi_dung, ghi_chu, trang_thai, tien_do, ngay_bat_dau, ngay_hoan_thanh, ghi_chu_ca_nhan)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id, track,
      str(item['Mảng kiến thức']),
      str(item['Mức độ chi tiết']),
      str(item['Mức độ ưu tiên']) || 'Quan trọng',
      str(item['Nền tảng học']),
      str(item['Link']),
      str(item['Nội dung học']),
      str(item['Ghi chú']),
      str(item['Trạng thái']) || 'Chưa học',
      Number(item['Tiến độ (%)']) || 0,
      normDate(item['Ngày bắt đầu']),
      normDate(item['Ngày hoàn thành']),
      str(item['Ghi chú cá nhân'])
    )
    .run();
  return id;
}

// Chỉ cập nhật các trường sửa được trong form.
// (Bản Apps Script cũ ghi đè cả trạng thái, ngày và ghi chú cá nhân bằng giá trị rỗng — đã sửa.)
async function updateItem(db, item) {
  item = item || {};
  const res = await db
    .prepare(
      `UPDATE roadmap SET lo_trinh = ?, mang_kien_thuc = ?, ten_khoa_hoc = ?, muc_do_uu_tien = ?,
        nen_tang = ?, link = ?, noi_dung = ?, ghi_chu = ? WHERE id = ?`
    )
    .bind(
      str(item['Lộ trình']) || 'DA',
      str(item['Mảng kiến thức']),
      str(item['Mức độ chi tiết']),
      str(item['Mức độ ưu tiên']) || 'Quan trọng',
      str(item['Nền tảng học']),
      str(item['Link']),
      str(item['Nội dung học']),
      str(item['Ghi chú']),
      str(item['ID'])
    )
    .run();
  return res.meta.changes > 0;
}

async function quickUpdate(db, id, status, progress) {
  const row = await db
    .prepare('SELECT ngay_bat_dau, ngay_hoan_thanh FROM roadmap WHERE id = ?')
    .bind(str(id))
    .first();
  if (!row) return false;
  let pct = Number(progress) || 0;
  let start = row.ngay_bat_dau;
  let end = row.ngay_hoan_thanh;
  if (status === 'Đang học' && !start) start = today();
  if (status === 'Hoàn thành') {
    pct = 100;
    if (!end) end = today(); // giữ ngày hoàn thành cũ nếu đã có
  }
  await db
    .prepare('UPDATE roadmap SET trang_thai = ?, tien_do = ?, ngay_bat_dau = ?, ngay_hoan_thanh = ? WHERE id = ?')
    .bind(status, pct, start, end, str(id))
    .run();
  return true;
}

async function deleteItem(db, id) {
  id = str(id);
  const results = await db.batch([
    db.prepare('DELETE FROM bai_hoc WHERE roadmap_id = ?').bind(id),
    db.prepare('DELETE FROM roadmap WHERE id = ?').bind(id),
  ]);
  return results[1].meta.changes > 0;
}

// ══════════ LESSONS ══════════
async function getAllLessons(db) {
  const { results } = await db.prepare('SELECT * FROM bai_hoc ORDER BY rowid').all();
  return results.map(rowToLesson);
}

async function loadLessonsForItem(db, roadmapId) {
  const { results } = await db
    .prepare('SELECT * FROM bai_hoc WHERE roadmap_id = ? ORDER BY rowid')
    .bind(str(roadmapId))
    .all();
  return results.map(rowToLesson);
}

async function getLessonsForItems(db, roadmapIds) {
  const ids = new Set((roadmapIds || []).map(String));
  return (await getAllLessons(db)).filter((l) => ids.has(String(l.id_road_map)));
}

// Tính lại % và trạng thái khóa học từ các bài học
async function recalcRoadmap(db, roadmapId) {
  const { results } = await db
    .prepare('SELECT trang_thai FROM bai_hoc WHERE roadmap_id = ?')
    .bind(str(roadmapId))
    .all();
  if (!results.length) return null;
  const done = results.filter((x) => x.trang_thai === 'Hoàn thành').length;
  const pct = Math.round((done / results.length) * 100);
  let st = 'Chưa học';
  if (pct === 100) st = 'Hoàn thành';
  else if (pct > 0 || results.some((x) => x.trang_thai === 'Đang học')) st = 'Đang học';
  await quickUpdate(db, roadmapId, st, pct);
  return { status: st, pct };
}

// Sửa ngày bắt đầu/hoàn thành của 1 bài học, tự đặt trạng thái theo ngày
async function updateLessonDates(db, lessonId, startDate, endDate) {
  lessonId = str(lessonId);
  startDate = normDate(startDate);
  endDate = normDate(endDate);
  const row = await db.prepare('SELECT roadmap_id FROM bai_hoc WHERE id = ?').bind(lessonId).first();
  if (!row) throw new Error('Không tìm thấy bài học ' + lessonId);
  if (endDate && !startDate) startDate = endDate;
  if (startDate && endDate && endDate < startDate) {
    throw new Error('Ngày hoàn thành phải sau hoặc bằng ngày bắt đầu');
  }
  const status = lessonStatusFromDates(startDate, endDate);
  await db
    .prepare('UPDATE bai_hoc SET ngay_bat_dau = ?, ngay_hoan_thanh = ?, trang_thai = ? WHERE id = ?')
    .bind(startDate, endDate, status, lessonId)
    .run();
  const roadmap = await recalcRoadmap(db, row.roadmap_id);
  return { id: lessonId, start: startDate, end: endDate, status, roadmap };
}

// Lưu cả danh sách bài học của 1 khóa (thêm / sửa / xóa) trong một lần
async function saveLessonsBatch(db, roadmapId, lessons, deletedIds) {
  roadmapId = str(roadmapId);
  const prefix = roadmapId + '.';
  const delSet = new Set((deletedIds || []).map(String));

  const { results: existing } = await db
    .prepare('SELECT id FROM bai_hoc WHERE roadmap_id = ?')
    .bind(roadmapId)
    .all();
  const remaining = existing.map((r) => r.id).filter((id) => !delSet.has(id));
  const remainingSet = new Set(remaining);
  let maxNum = maxSuffix(remaining, prefix);

  const stmts = [];
  for (const id of delSet) {
    stmts.push(db.prepare('DELETE FROM bai_hoc WHERE id = ? AND roadmap_id = ?').bind(id, roadmapId));
  }

  const saved = [];
  for (const l of lessons || []) {
    const lid = str(l.id);
    const fields = [
      str(l.ten_bai_hoc),
      str(l.mo_ta),
      normDate(l['Ngày bắt đầu']),
      normDate(l['Ngày hoàn thành']),
      str(l.trang_thai_hoan_thanh) || 'Chưa học',
    ];
    let id = lid;
    if (remainingSet.has(lid)) {
      stmts.push(
        db
          .prepare('UPDATE bai_hoc SET ten_bai_hoc = ?, mo_ta = ?, ngay_bat_dau = ?, ngay_hoan_thanh = ?, trang_thai = ? WHERE id = ?')
          .bind(...fields, lid)
      );
    } else {
      maxNum++;
      id = prefix + String(maxNum).padStart(3, '0');
      stmts.push(
        db
          .prepare('INSERT INTO bai_hoc (id, roadmap_id, ten_bai_hoc, mo_ta, ngay_bat_dau, ngay_hoan_thanh, trang_thai) VALUES (?, ?, ?, ?, ?, ?, ?)')
          .bind(id, roadmapId, ...fields)
      );
    }
    saved.push({
      id,
      id_road_map: roadmapId,
      ten_bai_hoc: fields[0],
      mo_ta: fields[1],
      'Ngày bắt đầu': fields[2],
      'Ngày hoàn thành': fields[3],
      trang_thai_hoan_thanh: fields[4],
    });
  }

  if (stmts.length) await db.batch(stmts); // chạy cùng lúc, lỗi thì không lưu nửa vời
  await recalcRoadmap(db, roadmapId);
  return saved;
}

// ══════════ ĐĂNG KÝ HÀM ══════════
const HANDLERS = {
  getAllItems, addItem, updateItem, quickUpdate, deleteItem,
  getAllLessons, loadLessonsForItem, getLessonsForItems,
  updateLessonDates, saveLessonsBatch,
};
// Các hàm chỉ đọc: ai có link cũng xem được. Các hàm còn lại cần mật khẩu.
const READ_ONLY = new Set(['getAllItems', 'getAllLessons', 'loadLessonsForItem', 'getLessonsForItems']);

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

// So sánh mật khẩu không để lộ thông tin qua thời gian phản hồi
async function safeEqual(a, b) {
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([a, b].map((x) => crypto.subtle.digest('SHA-256', enc.encode(x))));
  const x = new Uint8Array(ha), y = new Uint8Array(hb);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

export async function onRequestPost({ request, env, params }) {
  const fn = String(params.fn || '');
  const handler = Object.prototype.hasOwnProperty.call(HANDLERS, fn) ? HANDLERS[fn] : null;
  if (!handler) return json({ error: 'Không có hàm ' + fn }, 404);
  if (!env.DB) return json({ error: 'Chưa gắn database D1 (binding tên DB) cho project' }, 500);

  if (!READ_ONLY.has(fn)) {
    if (!env.ADMIN_PASSWORD) return json({ error: 'Chưa cấu hình secret ADMIN_PASSWORD trên Cloudflare' }, 500);
    const pw = request.headers.get('X-Admin-Password') || '';
    if (!(await safeEqual(pw, env.ADMIN_PASSWORD))) return json({ error: 'Sai mật khẩu' }, 401);
  }

  let args = [];
  try {
    args = await request.json();
  } catch (_) {
    args = [];
  }
  if (!Array.isArray(args)) args = [];

  try {
    const result = await handler(env.DB, ...args);
    return json(result === undefined ? null : result);
  } catch (e) {
    return json({ error: (e && e.message) || String(e) }, 400);
  }
}
