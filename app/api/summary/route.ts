import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { month, year, initialBalance, totalIncome, totalExpense, transactions, activeDebts = [], totalDebt = 0, prevMonthData } = body;

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

    // Memproses data bulan sebelumnya jika ada
    let prevFormattedTransactions = "Tidak ada data bulan sebelumnya.";
    if (prevMonthData && prevMonthData.transactions && prevMonthData.transactions.length > 0) {
      const prevCategories: Record<string, { total: number }> = {};
      prevMonthData.transactions.forEach((t: any) => {
        if (t.type === "expense") {
          if (!prevCategories[t.category]) {
            prevCategories[t.category] = { total: 0 };
          }
          prevCategories[t.category].total += t.amount;
        }
      });
      prevFormattedTransactions = Object.entries(prevCategories)
        .sort((a, b) => b[1].total - a[1].total)
        .map(([cat, data]) => `- ${cat}: Rp ${data.total}`)
        .join("\n");
    }

    const prevMonthSummary = prevMonthData ? `
Ringkasan Bulan Sebelumnya (${prevMonthData.month}/${prevMonthData.year}):
- Pemasukan: Rp ${prevMonthData.totalIncome}
- Pengeluaran: Rp ${prevMonthData.totalExpense}

Pengeluaran per Kategori (Bulan Sebelumnya):
${prevFormattedTransactions}
` : "";

    const prompt = `
Penasihat keuangan KRITIS & BLAK-BLAKAN. Analisis keuangan bln ${month}/${year}. Roasting keras jika boros, puji tipis jika hemat.
WAJIB gunakan BAHASA INDONESIA yang gaul, santai tapi nyelekit.

Ringkasan Bulan Ini (${month}/${year}):
- Saldo Awal: Rp ${initialBalance}
- Pemasukan: Rp ${totalIncome}
- Pengeluaran: Rp ${totalExpense}
- Sisa: Rp ${initialBalance + totalIncome - totalExpense}
- Total Hutang Aktif: Rp ${totalDebt}

Pengeluaran per Kategori (Bulan Ini):
${formattedTransactions}

Rincian Hutang Aktif:
${formattedDebts}
${prevMonthSummary}
Peran: Penasihat keuangan galak. Output: Markdown rinci.
Analisis data keuangan berikut:
1. Ringkasan Pedas: Evaluasi komprehensif performa bulan ini.
2. Perbandingan vs Bulan Lalu: Bandingkan pengeluaran dan pemasukan bulan ini dengan bulan lalu. Beri kritik ekstra pedas jika pengeluaran membengkak atau trennya memburuk!
3. Analisis Kritis: Identifikasi dan kritik tajam sumber kebocoran pengeluaran terbesar beserta peringatan terkait hutang (jika ada).
4. Rekomendasi Taktis: Langkah spesifik dan tegas perbaikan bulan depan.
`;

    let text = "";
    // Function to attempt generation with a given model name, with optional retry
    const tryGenerate = async (modelName: string, attempt = 1, maxAttempts = 3): Promise<string> => {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }]
        });
        return result.response.text();
      } catch (err: any) {
        if (attempt < maxAttempts) {
          // wait for (2^attempt) * 500 ms before retry
          await new Promise(res => setTimeout(res, 500 * 2 ** attempt));
          return tryGenerate(modelName, attempt + 1, maxAttempts);
        }
        throw err;
      }
    };

    try {
      // Primary model: gemini-2.5-flash (stable)
      text = await tryGenerate("gemini-2.5-flash");
    } catch (primaryError: any) {
      console.warn("Model gemini-2.5-flash limit atau gagal, mencoba fallback ke gemini-2.5-pro...", primaryError?.message);
      try {
        // Fallback model: gemini-2.5-pro
        text = await tryGenerate("gemini-2.5-pro");
      } catch (fallbackError: any) {
        throw new Error("Kedua model AI (gemini-2.5-flash & gemini-2.5-pro) sedang tidak tersedia: " + (fallbackError?.message || String(fallbackError)));
      }
    }

    return NextResponse.json({ success: true, text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json({ success: false, error: "Gagal menganalisis data: " + (error?.message || String(error)) }, { status: 500 });
  }
}