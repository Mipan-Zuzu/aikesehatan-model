# AI Chat Kesehatan

Chat AI kesehatan berbasis Node.js menggunakan `openai` SDK dengan endpoint Groq. Project ini siap dipakai di Vercel dengan Express route.

```js
baseURL: "https://api.groq.com/openai/v1"
```

## Setup Lokal

1. Install dependency:

```bash
npm install
```

2. Copy `.env.example` menjadi `.env`, lalu isi API key:

```env
GROQ_API_KEY=api_key_anda
GROQ_MODEL=openai/gpt-oss-20b
```

3. Jalankan Vercel local dev:

```bash
npm run dev
```

Endpoint:

```bash
POST /api/chat
GET /api/chat/:id
```

Contoh `POST /api/chat`:

```json
{
  "message": "Saya demam dan batuk 2 hari, apa yang harus saya lakukan?"
}
```

Response `POST`:

```json
{
  "id": "uuid",
  "status": "completed",
  "fetchUrl": "/api/chat/uuid"
}
```

Lalu ambil hasil dengan:

```bash
GET /api/chat/:id
```

Contoh response `GET`:

```json
{
  "id": "uuid",
  "status": "completed",
  "createdAt": "2026-04-14T00:00:00.000Z",
  "completedAt": "2026-04-14T00:00:01.000Z",
  "conversation": [
    {
      "role": "user",
      "content": "Saya demam dan batuk 2 hari, apa yang harus saya lakukan?"
    }
  ],
  "reply": "1. Analisis singkat: ...\n2. Saran: ...\n3. Kapan harus ke dokter: ..."
}
```

## Deploy ke Vercel

1. Import project ke Vercel.
2. Tambahkan environment variable `GROQ_API_KEY`.
3. Optional: tambahkan `GROQ_MODEL`.
4. Deploy.

## Fitur

- Persona dokter kesehatan profesional
- Jawaban singkat dan terstruktur
- Express middleware sederhana untuk CORS, logging, dan validasi body
- Bisa menerima `message` tunggal atau `messages` array
- Endpoint `POST` untuk submit konteks dan `GET` untuk fetch hasil
