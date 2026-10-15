-- Cấu trúc database cho web "Lộ trình học" (Cloudflare D1)
-- Chạy an toàn nhiều lần: chỉ tạo bảng nếu chưa có, không xóa dữ liệu.

CREATE TABLE IF NOT EXISTS roadmap (
  id              TEXT PRIMARY KEY,          -- DA.001, Ngoại ngữ.002...
  lo_trinh        TEXT NOT NULL DEFAULT 'DA',
  mang_kien_thuc  TEXT NOT NULL DEFAULT '',
  ten_khoa_hoc    TEXT NOT NULL DEFAULT '',  -- cột "Mức độ chi tiết" trong Sheet cũ
  muc_do_uu_tien  TEXT NOT NULL DEFAULT 'Quan trọng',
  nen_tang        TEXT NOT NULL DEFAULT '',
  link            TEXT NOT NULL DEFAULT '',
  noi_dung        TEXT NOT NULL DEFAULT '',
  ghi_chu         TEXT NOT NULL DEFAULT '',
  trang_thai      TEXT NOT NULL DEFAULT 'Chưa học',
  tien_do         INTEGER NOT NULL DEFAULT 0,
  ngay_bat_dau    TEXT NOT NULL DEFAULT '',  -- YYYY-MM-DD
  ngay_hoan_thanh TEXT NOT NULL DEFAULT '',
  ghi_chu_ca_nhan TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS bai_hoc (
  id              TEXT PRIMARY KEY,          -- DA.001.001
  roadmap_id      TEXT NOT NULL REFERENCES roadmap(id) ON DELETE CASCADE,
  ten_bai_hoc     TEXT NOT NULL DEFAULT '',
  mo_ta           TEXT NOT NULL DEFAULT '',
  ngay_bat_dau    TEXT NOT NULL DEFAULT '',
  ngay_hoan_thanh TEXT NOT NULL DEFAULT '',
  trang_thai      TEXT NOT NULL DEFAULT 'Chưa học'
);

CREATE INDEX IF NOT EXISTS idx_bai_hoc_roadmap ON bai_hoc(roadmap_id);
