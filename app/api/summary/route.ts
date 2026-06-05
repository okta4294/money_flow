import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { month, year, initialBalance, totalIncome, totalExpense, transactions } = body;

    if (!apiKey) {
      return NextResponse.json({ success: false, error: "API Key Gemini belum dikonfigurasi di server." }, { status: 500 });
    }

    // Mengelompokkan transaksi berdasarkan kategori dan mencatat rincian barang/catatan
    const categories: Record<string, { total: number; notes: Set<string> }> = {};
    let hasTransactions = false;

    transactions.forEach((t: any) => {
      if (t.type === "expense") {
        hasTransactions = true;
        if (!categories[t.category]) {
          categories[t.category] = { total: 0, notes: new Set() };
        }
        categories[t.category].total += t.amount;
        if (t.note && t.note.trim() !== "") {
          categories[t.category].notes.add(t.note.trim());
        }
      }
    });

    const formattedTransactions = hasTransactions
      ? Object.entries(categories)
          .sort((a, b) => b[1].total - a[1].total) // Urutkan dari pengeluaran terbesar
          .map(([category, data]) => {
            const notesArray = Array.from(data.notes);
            const notesStr = notesArray.length > 0 ? ` (Rincian: ${notesArray.join(", ")})` : "";
            return `- ${category}: Rp ${data.total}${notesStr}`;
          })
          .join("\n")
      : "Tidak ada pengeluaran.";

    const prompt = `
Penasihat keuangan KRITIS & BLAK-BLAKAN. Analisis keuangan bln ${month}/${year}. Roasting keras jika boros, puji tipis jika hemat.
WAJIB gunakan BAHASA INDONESIA yang gaul, santai tapi nyelekit.

Ringkasan:
- Saldo Awal: Rp ${initialBalance}
- Pemasukan: Rp ${totalIncome}
- Pengeluaran: Rp ${totalExpense}
- Sisa: Rp ${initialBalance + totalIncome - totalExpense}

Pengeluaran per Kategori:
${formattedTransactions}

Peran: Penasihat keuangan galak. Output: Markdown rinci. 
Analisis data keuangan berikut:
1. Ringkasan Pedas: Evaluasi komprehensif performa bulan ini.
2. Analisis Kritis: Identifikasi dan kritik tajam sumber kebocoran pengeluaran terbesar.
3. Rekomendasi Taktis: Langkah spesifik dan tegas perbaikan bulan depan.
`;

    // Menghapus batasan maxOutputTokens agar respons selesai secara natural.
    // Penghematan token sudah dilakukan secara maksimal di sisi input (agregasi transaksi).
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });
    const text = result.response.text();

    return NextResponse.json({ success: true, text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json({ success: false, error: "Gagal menganalisis data: " + (error?.message || String(error)) }, { status: 500 });
  }
}
