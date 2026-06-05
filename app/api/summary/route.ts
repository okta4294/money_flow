import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { month, year, initialBalance, totalIncome, totalExpense, transactions, activeDebts = [], totalDebt = 0 } = body;

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

    const formattedDebts = activeDebts.length > 0 
      ? activeDebts.map((d: any) => `- ${d.name}: Rp ${d.remainingAmount}`).join("\n")
      : "Tidak ada hutang.";

    const prompt = `
Penasihat keuangan KRITIS & BLAK-BLAKAN. Analisis keuangan bln ${month}/${year}. Roasting keras jika boros, puji tipis jika hemat.
WAJIB gunakan BAHASA INDONESIA yang gaul, santai tapi nyelekit.

Ringkasan:
- Saldo Awal: Rp ${initialBalance}
- Pemasukan: Rp ${totalIncome}
- Pengeluaran: Rp ${totalExpense}
- Sisa: Rp ${initialBalance + totalIncome - totalExpense}
- Total Hutang Aktif: Rp ${totalDebt}

Pengeluaran per Kategori:
${formattedTransactions}

Rincian Hutang Aktif:
${formattedDebts}

Peran: Penasihat keuangan galak. Output: Markdown rinci. 
Analisis data keuangan berikut:
1. Ringkasan Pedas: Evaluasi komprehensif performa bulan ini.
2. Analisis Kritis: Identifikasi dan kritik tajam sumber kebocoran pengeluaran terbesar beserta peringatan terkait hutang (jika ada).
3. Rekomendasi Taktis: Langkah spesifik dan tegas perbaikan bulan depan.
`;

    let text = "";
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      });
      text = result.response.text();
    } catch (primaryError: any) {
      console.warn("Model 3.5-flash limit atau gagal, mencoba beralih ke 2.5-flash...", primaryError?.message);
      
      try {
        const fallbackModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const fallbackResult = await fallbackModel.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }]
        });
        text = fallbackResult.response.text();
      } catch (fallbackError: any) {
        throw new Error("Kedua model AI (3.5 & 2.5) sedang tidak tersedia: " + (fallbackError?.message || String(fallbackError)));
      }
    }

    return NextResponse.json({ success: true, text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json({ success: false, error: "Gagal menganalisis data: " + (error?.message || String(error)) }, { status: 500 });
  }
}
