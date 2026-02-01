# Candidate Management System

Ứng dụng quản lý hồ sơ ứng viên dành cho nhân viên HR, xây dựng với React + TypeScript và Supabase.

## Tính năng

### Authentication
- ✅ Đăng ký / Đăng nhập với email & password
- ✅ Phiên đăng nhập được duy trì với Supabase Auth
- ✅ Bảo vệ route Dashboard

### Quản lý ứng viên
- ✅ Thêm ứng viên mới với thông tin đầy đủ
- ✅ Upload CV (PDF) lên Supabase Storage
- ✅ Cập nhật trạng thái ứng viên (New, Interviewing, Hired, Rejected)
- ✅ Xóa ứng viên
- ✅ **Real-time updates** - Danh sách cập nhật tức thì khi có thay đổi

### Tính năng nâng cao (Thuật toán)
- ✅ **Filter & Search** - Lọc theo trạng thái, vị trí, ngày, tìm kiếm fuzzy
- ✅ **Analytics** - Thống kê tổng số, tỷ lệ trạng thái, top vị trí
- ✅ **Matching Score** - Tính điểm phù hợp dựa trên kỹ năng
- ✅ **Recommendation** - Gợi ý top 3 ứng viên cho vị trí cụ thể

## Công nghệ sử dụng

- **Frontend**: React 18+ TypeScript, Vite, React Router
- **Backend**: Supabase (Auth, Database, Edge Functions, Storage, Realtime)
- **Database**: PostgreSQL (via Supabase)

## Cài đặt

### 1. Cài đặt dependencies

npm install

### 2. Chạy ứng dụng

npm run dev

Mở browser tại `http://localhost:5173`

## 📁 Cấu trúc dự án

```
├── src/
│   ├── components/
│   │   ├── Auth/           # Login & Register forms
│   │   ├── Dashboard/      # CandidateCard, CandidateForm, etc.
│   │   └── Layout/         # Header, ProtectedRoute
│   ├── hooks/
│   │   ├── useAuth.tsx     # Authentication context
│   │   ├── useCandidates.ts # CRUD operations
│   │   └── useRealtime.ts  # Real-time subscriptions
│   ├── lib/
│   │   └── supabase.ts     # Supabase client
│   ├── pages/              # Page components
│   ├── types/              # TypeScript interfaces
│   ├── App.tsx
│   └── index.css           # Global styles
├── supabase/
│   ├── migrations/         # SQL migrations
│   └── functions/          # Edge Functions
└── README.md
```

## 🗄️ Database Schema

### Table: `candidates`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK to auth.users |
| full_name | TEXT | Tên ứng viên |
| applied_position | TEXT | Vị trí ứng tuyển |
| status | TEXT | New/Interviewing/Hired/Rejected |
| resume_url | TEXT | Link CV |
| skills | JSONB | Mảng kỹ năng |
| matching_score | NUMERIC | Điểm phù hợp (0-100) |
| created_at | TIMESTAMP | Thời gian tạo |

### Row Level Security (RLS)

- Users chỉ có thể xem/thêm/sửa/xóa candidates của chính họ
- Mỗi candidate được liên kết với `user_id` từ `auth.users`

## ⚡ Edge Functions

### `/add-candidate`
- Validate dữ liệu đầu vào
- Tính matching score dựa trên skills
- Insert candidate vào database

### `/analytics`
- Tổng số ứng viên
- Phân bố theo trạng thái
- Top 3 vị trí phổ biến
- Ứng viên mới trong 7 ngày

### `/recommend`
- Nhận vị trí cần tuyển
- Tính similarity score cho mỗi ứng viên
- Trả về top 3 ứng viên phù hợp nhất

## 🔄 Real-time Updates

Ứng dụng sử dụng Supabase Realtime để lắng nghe thay đổi:

- INSERT: Ứng viên mới được thêm vào đầu danh sách
- UPDATE: Cập nhật thông tin ứng viên ngay lập tức
- DELETE: Xóa ứng viên khỏi danh sách