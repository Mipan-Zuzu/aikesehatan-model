import express from "express";
import OpenAI from "openai";
import { randomUUID } from "node:crypto";

const app = express();

const model = process.env.GROQ_MODEL || "openai/gpt-oss-20b";

const systemPrompt = `
Kamu adalah dokter kesehatan profesional terbaik di dunia.

Aturan jawaban:
- Gunakan Bahasa Indonesia yang profesional, ramah, dan jelas.
- Jawaban harus singkat, padat, dan terstruktur.
- Format jawaban sebisa mungkin:
  1. Analisis singkat
  2. Saran
  3. Kapan harus ke dokter
- Jangan membuat diagnosis pasti tanpa pemeriksaan langsung.
- Jika gejala darurat muncul seperti sesak berat, nyeri dada, penurunan kesadaran, perdarahan hebat, atau kejang, arahkan segera ke IGD.
- Jika pengguna bertanya obat, berikan informasi umum yang aman dan sarankan konsultasi dokter/apoteker untuk dosis spesifik, terutama pada anak, ibu hamil, lansia, atau pasien dengan penyakit kronis.
- Hindari jawaban panjang. Maksimal sekitar 120 kata kecuali diminta lebih detail.
`.trim();

const requests = new Map();

function getClient() {
  return new OpenAI({
    apiKey: process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY,
    baseURL: "https://api.groq.com/openai/v1"
  });
}

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  console.log(`${req.method} ${req.path}`);
  next();
});

function validateChatPost(req, res, next) {
  const { message, messages } = req.body || {};
  const hasMessage = typeof message === "string" && message.trim().length > 0;
  const hasMessagesArray = Array.isArray(messages) && messages.length > 0;

  if (!hasMessage && !hasMessagesArray) {
    return res.status(400).json({
      error: "Body harus berisi `message` string atau `messages` array."
    });
  }

  next();
}

function buildConversation(body) {
  if (Array.isArray(body.messages) && body.messages.length > 0) {
    return body.messages;
  }

  return [{ role: "user", content: body.message.trim() }];
}

function buildInput(conversation) {
  const history = conversation
    .map((item) => {
      const role = item.role === "assistant" ? "Assistant" : "User";
      return `${role}: ${item.content}`;
    })
    .join("\n");

  return `${systemPrompt}\n\nPercakapan:\n${history}\n\nBerikan jawaban sesuai aturan di atas.`;
}

app.get("/api/health", (req, res) => {
  res.status(200).json({
    ok: true,
    model
  });
});

app.post("/api/chat", validateChatPost, async (req, res) => {
  if (!process.env.GROQ_API_KEY && !process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      error: "GROQ_API_KEY belum diatur."
    });
  }

  const id = randomUUID();
  const conversation = buildConversation(req.body);

  requests.set(id, {
    id,
    status: "processing",
    createdAt: new Date().toISOString(),
    conversation
  });

  try {
    const client = getClient();
    const input = buildInput(conversation);

    const completion = await client.responses.create({
      model,
      input
    });

    const reply =
      completion.output_text?.trim() ||
      "Maaf, saya belum bisa menjawab saat ini.";

    requests.set(id, {
      ...requests.get(id),
      status: "completed",
      reply,
      completedAt: new Date().toISOString()
    });

    return res.status(202).json({
      id,
      status: "completed",
      fetchUrl: `/api/chat/${id}`
    });
  } catch (error) {
    requests.set(id, {
      ...requests.get(id),
      status: "failed",
      error: error?.message || "Unknown error",
      completedAt: new Date().toISOString()
    });

    return res.status(500).json({
      id,
      status: "failed",
      error: "Terjadi error saat menghubungi model.",
      detail: error?.message || "Unknown error"
    });
  }
});

app.get("/api/chat/:id", (req, res) => {
  const result = requests.get(req.params.id);

  if (!result) {
    return res.status(404).json({
      error: "Data chat tidak ditemukan."
    });
  }

  return res.status(200).json(result);
});

export default app;
