# ADAF — Adaptive Deception & Attack Framework

Login betine keletuģın hújimlerdi jasalma intellekt járdeminde anıqlap, hújimshini haqiqiy sistemadan uzaqlastırıp, **jalgan (honeypot) ortalıqqa** bagdarlaytuģın qáwipsizlik sisteması.

---

## Qanday ishlaydi

```
Foydalanuvchi login qiladi
        ↓
AI Detection (3 qatlam):
  1. Regex — 44 ta pattern (SQLi, XSS, Path Traversal, CMD)
  2. Statistik — Shannon entropy, maxsus belgilar nisbati
  3. Naive Bayes ML — o'qitilgan model
        ↓
   ┌────────────┬─────────────────┐
   │  Hujum yo'q │   Hujum aniqlandi│
   └────────────┴─────────────────┘
        ↓                ↓
  Real dashboard    Fake dashboard
  (haqiqiy login)   (NexaCore Financial —
                     soxta kompaniya,
                     soxta ma'lumotlar)
                          ↓
                   Barcha harakatlar
                   logga yoziladi
```

---

## Texnologiyalar

| Qism               | Stack                                 |
| ------------------ | ------------------------------------- |
| Backend            | Node.js · TypeScript · Express        |
| Ma'lumotlar bazasi | PostgreSQL · Drizzle ORM              |
| AI aniqlash        | Naive Bayes · Regex · Shannon entropy |
| Frontend           | React · TypeScript · Vite             |
| UI                 | Ant Design · Recharts                 |
| Auth               | PBKDF2-SHA512 · JWT-like signed token |

---

## Ishga tushirish

### Talablar

- Node.js 20+
- PostgreSQL 14+

---

### 1. Repozitoriyani klonlash

```bash
git clone <repo-url>
cd adaf-project
```

---

### 2. Backend

```bash
cd backend
```

**.env fayl yaratish:**

```bash
cp .env.example .env
```

`.env` ichini to'ldiring:

```env
DATABASE_URL=postgresql://postgres:PAROLINGIZ@localhost:5432/adaf
SESSION_SECRET=kamida-32-ta-tasodifiy-belgi
HASH_SALT=ozingiz-tanlagan-salt
PORT=8080
NODE_ENV=development
CORS_ORIGINS=http://localhost:3000
ADMIN_USERNAME=admin
ADMIN_PASSWORD=adminparol
```

> `SESSION_SECRET` uchun: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

**O'rnatish va ishga tushirish:**

```bash
npm install

# Bazani yaratish
npm run db:push

# Boshlang'ich ma'lumotlarni yuklash
npm run db:seed

# ML modelini o'qitish
npm run train

# Serverni ishga tushirish
npm run dev
```

Backend `http://localhost:8080` da ishlaydi.

---

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend `http://localhost:3000` da ishlaydi.

---

### 4. Kirish

Brauzerda `http://localhost:3000` ni oching.

| Maydon   | Qiymat                       |
| -------- | ---------------------------- |
| Username | `admin`                      |
| Password | `.env` dagi `ADMIN_PASSWORD` |

---

## Hujumni sinash

Login sahifasiga quyidagilarni kiriting:

```
Username: ' OR 1=1--
Password: anything
```

Tizim hujumni aniqlab, soxta NexaCore Financial dashboardiga yo'naltiradi. Haqiqiy hujum logi `http://localhost:3000/attacks` da ko'rinadi.

---

## API endpointlar

| Endpoint               | Tavsif                                           |
| ---------------------- | ------------------------------------------------ |
| `POST /api/auth/login` | Login — hujum aniqlansa honeypot token qaytaradi |
| `GET /api/attacks`     | Barcha aniqlangan hujumlar                       |
| `GET /api/stats`       | Dashboard statistikasi                           |
| `GET /api/events`      | Real-time SSE stream                             |
| `POST /api/analyze`    | Bitta matnni tahlil qilish                       |

---

## Loyiha strukturasi

```
adaf-project/
├── backend/
│   ├── src/
│   │   ├── lib/
│   │   │   ├── ai-analyzer.ts      # Asosiy aniqlash mantiq
│   │   │   ├── ml-classifier.ts    # Naive Bayes modeli
│   │   │   ├── behavior-monitor.ts # IP xulq-atvorini kuzatish
│   │   │   └── token.ts            # Real/fake token boshqaruvi
│   │   ├── routes/
│   │   │   ├── auth.ts             # Login endpoint
│   │   │   ├── attacks.ts          # Hujumlar ro'yxati
│   │   │   ├── fake.ts             # Honeypot API
│   │   │   └── stats.ts            # Statistika
│   │   └── training/
│   │       ├── dataset.json        # O'qitish ma'lumotlari
│   │       └── model.json          # O'qitilgan model
│   ├── train.mjs                   # Modelni o'qitish skripti
│   └── seed.mjs                    # Bazani to'ldirish
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── login.tsx           # Login sahifasi
    │   │   ├── dashboard.tsx       # Haqiqiy admin panel
    │   │   ├── attacks.tsx         # Hujumlar sahifasi
    │   │   └── fake-dashboard.tsx  # Honeypot (NexaCore Financial)
    │   └── data/
    │       └── fake-data.json      # Honeypot uchun soxta ma'lumotlar
    └── vite.config.ts
```
