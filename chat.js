import "dotenv/config";
import OpenAI from "openai";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://api.groq.com/openai/v1"
});

const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

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

if (!process.env.OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY belum diatur di file .env");
  process.exit(1);
}

const rl = readline.createInterface({ input, output });

const messages = [
  { role: "system", content: systemPrompt }
];

console.log("AI Chat Kesehatan");
console.log(`Model: ${model}`);
console.log("Ketik pertanyaan kesehatan Anda. Ketik 'exit' untuk keluar.\n");

while (true) {
  const userInput = (await rl.question("Anda: ")).trim();

  if (!userInput) {
    continue;
  }

  if (userInput.toLowerCase() === "exit") {
    break;
  }

  messages.push({ role: "user", content: userInput });

  try {
    const response = await client.chat.completions.create({
      model,
      temperature: 0.4,
      messages
    });

    const answer = response.choices?.[0]?.message?.content?.trim() || "Maaf, saya belum bisa menjawab saat ini.";
    messages.push({ role: "assistant", content: answer });

    console.log(`\nDokter AI:\n${answer}\n`);
  } catch (error) {
    console.error("\nTerjadi error saat menghubungi model.");
    console.error(error?.message || error);
    console.log("");
  }
}

rl.close();
