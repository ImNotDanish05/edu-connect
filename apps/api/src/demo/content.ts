/**
 * Katalog akademik demo EduConnect: 5 kategori, 3 pengajar fiktif, 12 modul pembelajaran
 * (lengkap dengan video, artikel, rangkuman PDF, kuis, dan tugas proyek), ulasan, serta
 * diskusi tanya-jawab. Seluruh nama dan institusi di sini bersifat fiktif untuk keperluan demo.
 */

export interface DemoQuestion {
  kind: "SINGLE" | "MULTI" | "TRUE_FALSE" | "SHORT_TEXT";
  prompt: string;
  explanation: string;
  options?: [string, boolean][];
  accepted?: string[];
}

export type DemoItem =
  | { kind: "VIDEO"; title: string; minutes: number; preview?: boolean; notes?: string }
  | { kind: "ARTICLE"; title: string; minutes: number; body: string; preview?: boolean }
  | { kind: "PDF"; title: string; minutes: number; heading: string; points: string[] }
  | { kind: "QUIZ"; title: string; pass: number; minutes: number; questions: DemoQuestion[]; attempts?: number; timed?: number }
  | { kind: "ASSIGNMENT"; title: string; minutes: number; instructions: string; rubric: [string, string, number][]; dueDays?: number };

export interface DemoCourse {
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "ALL_LEVELS";
  access: "FREE" | "PAID" | "SUBSCRIPTION_ONLY";
  usd?: number;
  inr?: number;
  idr?: number;
  compareUsd?: number;
  compareIdr?: number;
  featured?: boolean;
  inPlan?: boolean;
  instructors: number[];
  description: string;
  outcomes: string[];
  prerequisites: string[];
  sections: { title: string; items: DemoItem[] }[];
}

export const CATEGORIES = [
  { slug: "persiapan-snbt", name: "Persiapan SNBT & Ujian", description: "Penalaran matematika, kuantitatif, dan literasi akademik untuk seleksi perguruan tinggi." },
  { slug: "sains-dan-olimpiade", name: "Sains, Matematika & Olimpiade", description: "Pendalaman konsep matematika, statistika, biologi, kimia, dan pembinaan olimpiade sains." },
  { slug: "beasiswa-dan-riset", name: "Beasiswa, Riset & Karya Ilmiah", description: "Metodologi penelitian, penulisan karya tulis ilmiah, dan esai akademik beasiswa." },
  { slug: "ekonomi-dan-bisnis", name: "Ekonomi, Akuntansi & Bisnis", description: "Pengantar ilmu ekonomi, siklus akuntansi dasar, dan penyusunan perencanaan bisnis." },
  { slug: "komunikasi-dan-bahasa", name: "Komunikasi, Bahasa & Produktivitas", description: "Komunikasi ilmiah, visualisasi data presentasi, dan manajemen belajar mandiri." },
] as const;

export const INSTRUCTORS = [
  {
    name: "Rizky Pratama",
    headline: "Pengajar Ekonomi, Akuntansi, dan Penalaran Kuantitatif",
    bio: "Rizky membimbing siswa sekolah menengah dan mahasiswa tahun pertama dalam memahami konsep ekonomi, akuntansi dasar, serta penalaran kuantitatif secara terstruktur dan berbasis pemahaman konsep.",
  },
  {
    name: "Alya Maharani",
    headline: "Tutor Matematika Sains, Statistika, dan Metodologi Riset",
    bio: "Alya berfokus pada pengajaran matematika, statistika dasar, dan sains terpadu. Ia membantu peserta didik membaca data secara objektif serta membangun argumen ilmiah yang runtut.",
  },
  {
    name: "Bagas Wicaksono",
    headline: "Pembimbing Penulisan Akademik, Perencanaan Bisnis, dan Komunikasi Ilmiah",
    bio: "Bagas mendampingi pelajar dan mahasiswa dalam menyusun karya tulis ilmiah, proposal program kreativitas mahasiswa, esai beasiswa, serta penyajian materi presentasi akademik.",
  },
] as const;

export const LEARNERS = [
  "Juniper Vale", "Theo Marsh", "Amara Lindqvist", "Kenji Watanabe", "Sofia Delgado", "Noah Brennan", "Leila Haddad", "Oscar Nyberg", "Ava Castellanos",
  "Rohan Mehta", "Isla Fitzgerald", "Mateo Ruiz", "Hana Kobayashi", "Elias Moreau", "Zara Ahmed", "Lucas Ferreira", "Mira Petrova", "Samuel Osei",
  "Clara Jensen", "Arjun Nair", "Nina Kowalski", "Felix Hartmann", "Yara Saleh", "Ethan Park", "Lina Bauer", "Omar Farouk", "Grace Liu",
  "Tomás Silva", "Ingrid Solberg", "Kofi Mensah", "Anika Sharma", "Leo Rossi", "Chloe Martin", "Dev Patel", "Esme Walsh", "Hugo Lambert",
] as const;

const vid = (title: string, minutes: number, preview = false, notes?: string): DemoItem => ({ kind: "VIDEO", title, minutes, preview, notes });
const art = (title: string, minutes: number, body: string, preview = false): DemoItem => ({ kind: "ARTICLE", title, minutes, body, preview });

const SNBT_QUIZ: DemoQuestion[] = [
  { kind: "SINGLE", prompt: "Jika rasio siswa kelas A dan B adalah 3 : 5 dan selisih jumlah siswa keduanya adalah 12 orang, berapa jumlah siswa di kelas A?", explanation: "Selisih rasio adalah 5 - 3 = 2 bagian yang setara dengan 12 orang (1 bagian = 6 orang). Maka kelas A = 3 × 6 = 18 orang.", options: [["18 orang", true], ["24 orang", false], ["30 orang", false]] },
  { kind: "MULTI", prompt: "Manakah pernyataan yang benar mengenai barisan aritmetika dengan suku pertama a dan beda b?", explanation: "Selisih dua suku berurutan konstan sebesar b, rumus suku ke-n adalah a + (n - 1)b, dan nilai rata-rata suku pertama serta suku terakhir sama dengan nilai tengahnya.", options: [["Suku ke-n dirumuskan dengan Un = a + (n - 1)b", true], ["Selisih dua suku berurutan selalu tetap", true], ["Rata-rata suku pertama dan suku ke-n adalah (U1 + Un) / 2", true], ["Rasio antar suku berurutan selalu konstan", false]] },
  { kind: "TRUE_FALSE", prompt: "Pada himpunan bilangan riil, pertidaksamaan kuadrat selalu memiliki himpunan penyelesaian yang tidak kosong.", explanation: "Pertidaksamaan seperti x² + 1 < 0 tidak memiliki penyelesaian pada himpunan bilangan riil.", options: [["Benar", false], ["Salah", true]] },
  { kind: "SHORT_TEXT", prompt: "Jika f(x) = 2x + 3, berapakah nilai dari f(4)?", explanation: "Substitusi x = 4 menghasilkan 2(4) + 3 = 11.", accepted: ["11"] },
  { kind: "SINGLE", prompt: "Tujuan utama membaca grafik pada soal penalaran kuantitatif sebelum menghitung adalah...", explanation: "Memahami satuan sumbu dan skala grafik mencegah kesalahan interpretasi angka.", options: [["Memastikan satuan sumbu, skala, dan tren variabel yang ditanyakan", true], ["Menghafal seluruh angka pada grafik", false], ["Menggambar ulang grafik di kertas buram", false]] },
];

const EKONOMI_QUIZ: DemoQuestion[] = [
  { kind: "SINGLE", prompt: "Manakah persamaan dasar akuntansi yang tepat?", explanation: "Seluruh aset perusahaan dibiayai oleh kewajiban (liabilitas) ditambah modal pemilik (ekuitas).", options: [["Aset = Liabilitas + Ekuitas", true], ["Aset = Liabilitas - Ekuitas", false], ["Ekuitas = Aset + Liabilitas", false]] },
  { kind: "SINGLE", prompt: "Ketika harga suatu barang naik (ceteris paribus), maka menurut hukum permintaan...", explanation: "Hukum permintaan menyatakan hubungan terbalik antara harga barang dan jumlah barang yang diminta.", options: [["Jumlah barang yang diminta akan berkurang", true], ["Kurva permintaan bergeser ke kanan", false], ["Jumlah barang yang ditawarkan berkurang", false]] },
  { kind: "TRUE_FALSE", prompt: "Beban sewa yang dibayar tunai akan mengurangi kas dan mengurangi ekuitas.", explanation: "Pembayaran beban mengurangi aset (kas) dan menurunkan saldo laba/ekuitas.", options: [["Benar", true], ["Salah", false]] },
  { kind: "MULTI", prompt: "Akun manakah yang memiliki saldo normal di sisi Debit?", explanation: "Aset, Beban, dan Prive memiliki saldo normal di sisi Debit; Pendapatan dan Utang di sisi Kredit.", options: [["Kas dan Piutang Usaha", true], ["Beban Perlengkapan", true], ["Peralatan Kantor", true], ["Utang Usaha", false]] },
];

const OLIMPIADE_QUIZ: DemoQuestion[] = [
  { kind: "SINGLE", prompt: "Berapa sisa pembagian 2^10 oleh 7?", explanation: "Karena 2^3 = 8 ≡ 1 (mod 7), maka 2^10 = (2^3)^3 × 2 ≡ 1^3 × 2 = 2 (mod 7).", options: [["2", true], ["1", false], ["4", false]] },
  { kind: "SINGLE", prompt: "Mengapa prinsip sarang merpati (Pigeonhole Principle) efektif dalam soal kombinatorika?", explanation: "Prinsip ini menjamin keberadaan minimal satu kelompok yang memuat lebih dari satu elemen ketika jumlah objek melebihi jumlah wadah.", options: [["Menjamin eksistensi kondisi tertentu tanpa harus memeriksa semua kemungkinan satu per satu", true], ["Menghitung nilai peluang eksak dari variabel acak kontinu", false], ["Mengurutkan data numerik dari terkecil ke terbesar", false]] },
  { kind: "MULTI", prompt: "Manakah langkah yang valid dalam metode pembuktian induksi matematika?", explanation: "Induksi matematika memerlukan pembuktian kasus dasar (basis) dan langkah induktif dari n = k ke n = k + 1.", options: [["Membuktikan pernyataan benar untuk kasus dasar n = 1", true], ["Mengasumsikan pernyataan benar untuk n = k (hipotesis induksi)", true], ["Membuktikan pernyataan benar untuk n = k + 1 berdasarkan hipotesis induksi", true], ["Menguji tiga angka acak saja tanpa langkah aljabar", false]] },
  { kind: "TRUE_FALSE", prompt: "Banyaknya cara menyusun n objek berbeda dalam satu baris lurus adalah n! (n faktorial).", explanation: "Permutasi penuh dari n elemen berbeda adalah n × (n - 1) × ... × 1 = n!.", options: [["Benar", true], ["Salah", false]] },
  { kind: "SHORT_TEXT", prompt: "Sebutkan istilah matematika untuk bilangan bulat lebih besar dari 1 yang hanya habis dibagi 1 dan dirinya sendiri.", explanation: "Bilangan prima hanya memiliki tepat dua faktor positif.", accepted: ["prima", "bilangan prima", "prime"] },
];

const ESAI_QUIZ: DemoQuestion[] = [
  { kind: "SINGLE", prompt: "Bagian pembuka pada esai akademik atau motivation letter sebaiknya berfungsi untuk...", explanation: "Paragraf pembuka menyampaikan gagasan utama (thesis statement) dan konteks yang relevan secara ringkas.", options: [["Menyampaikan konteks utama dan gagasan inti (thesis statement) secara jelas", true], ["Mencantumkan seluruh riwayat hidup sejak sekolah dasar", false], ["Menggunakan kutipan panjang tanpa penjelasan", false]] },
  { kind: "TRUE_FALSE", prompt: "Motivation letter yang baik harus mengulang seluruh isi CV dalam bentuk kalimat.", explanation: "Motivation letter seharusnya menjelaskan motivasi, relevansi pengalaman utama, dan rencana kontribusi, bukan sekadar menyalin isi CV.", options: [["Benar", false], ["Salah", true]] },
  { kind: "MULTI", prompt: "Unsur apa saja yang memperkuat argumen dalam esai beasiswa?", explanation: "Contoh konkret, keterkaitan tujuan studi dengan rencana kontribusi, dan struktur paragraf yang koheren memperkuat esai.", options: [["Contoh pengalaman konkret beserta dampaknya", true], ["Keterkaitan antara bidang studi dan rencana pascastudi", true], ["Transisi antarparagraf yang logis dan terukur", true], ["Klaim berlebihan tanpa bukti pendukung", false]] },
];

const RISET_QUIZ: DemoQuestion[] = [
  { kind: "SINGLE", prompt: "Rumusan masalah penelitian yang baik harus bersifat...", explanation: "Rumusan masalah perlu spesifik, terukur, dan dapat dijawab melalui metode ilmiah.", options: [["Spesifik, terfokus, dan dapat diuji secara empiris atau analitis", true], ["Sangat luas agar mencakup semua topik sekaligus", false], ["Berisi kesimpulan akhir sebelum data dikumpulkan", false]] },
  { kind: "SINGLE", prompt: "Mengapa sitasi dan daftar pustaka wajib dicantumkan dalam karya tulis ilmiah?", explanation: "Sitasi menjaga integritas akademik, menghargai karya peneliti sebelumnya, dan memudahkan pembaca menelusuri sumber rujukan.", options: [["Menjaga integritas akademik dan menunjukkan landasan literatur yang valid", true], ["Sekadar menambah jumlah halaman dokumen", false], ["Menggantikan bagian analisis data", false]] },
  { kind: "MULTI", prompt: "Manakah yang termasuk komponen Bab Pendahuluan pada karya tulis ilmiah?", explanation: "Pendahuluan umumnya memuat latar belakang, rumusan masalah, serta tujuan dan manfaat penelitian.", options: [["Latar belakang masalah", true], ["Rumusan masalah penelitian", true], ["Tujuan dan manfaat penelitian", true], ["Lampiran kuesioner mentah", false]] },
  { kind: "TRUE_FALSE", prompt: "Abstrak penelitian sebaiknya ditulis secara ringkas mencakup tujuan, metode, dan temuan utama.", explanation: "Abstrak memberikan gambaran utuh penelitian dalam satu paragraf padat.", options: [["Benar", true], ["Salah", false]] },
];

const STATS_QUIZ: DemoQuestion[] = [
  { kind: "SINGLE", prompt: "Median dari data terurut 2, 3, 3, 8, 40 adalah...", explanation: "Nilai tengah (urutan ke-3 dari 5 data terurut) adalah 3. Rata-rata (11,2) tertarik ke atas oleh pencilan (outlier) 40.", options: [["3", true], ["11,2", false], ["8", false]] },
  { kind: "TRUE_FALSE", prompt: "Korelasi yang tinggi antara dua variabel otomatis membuktikan hubungan sebab-akibat (kausalitas).", explanation: "Korelasi dapat dipengaruhi oleh variabel perancu (confounding variable) atau kebetulan, sehingga belum tentu kausalitas.", options: [["Benar", false], ["Salah", true]] },
  { kind: "SINGLE", prompt: "Ukuran pemusatan data yang paling tahan terhadap nilai ekstrem (outlier) adalah...", explanation: "Median hanya bergantung pada urutan posisi tengah data, bukan besarnya nilai ekstrem di ujung.", options: [["Median", true], ["Rata-rata hitung (Mean)", false], ["Rentang (Range)", false]] },
];

export const COURSES: DemoCourse[] = [
  {
    slug: "penalaran-matematika-dan-kuantitatif",
    title: "Penalaran Matematika dan Pengetahuan Kuantitatif",
    subtitle: "Pemahaman konsep aljabar, aritmetika sosial, dan analisis data untuk ujian seleksi",
    category: "persiapan-snbt",
    level: "INTERMEDIATE",
    access: "PAID",
    usd: 4900,
    inr: 399900,
    idr: 1490000,
    compareUsd: 7900,
    compareIdr: 2490000,
    featured: true,
    instructors: [0],
    description:
      "Modul ini membahas fondasi penalaran matematika dan pengetahuan kuantitatif secara sistematis. Fokus pembelajaran terletak pada cara menerjemahkan permasalahan kontekstual ke dalam model matematika yang ringkas.\n\nSetiap topik dilengkapi dengan contoh pembahasan bertahap, latihan soal terstruktur, serta evaluasi pemahaman di akhir bab.\n\n- Memahami konsep perbandingan, persentase, dan aritmetika sosial\n- Menyelesaikan persamaan dan pertidaksamaan aljabar secara efisien\n- Menganalisis informasi dari tabel, diagram, dan grafik kuantitatif",
    outcomes: [
      "Menerjemahkan soal cerita ke dalam model aljabar yang tepat",
      "Menyelesaikan persoalan proporsi, laju, dan perbandingan kuantitatif",
      "Menganalisis kecenderungan data dari tabel dan grafik",
      "Mengevaluasi kecukupan data pada soal penalaran kuantitatif",
      "Mengelola waktu pengerjaan soal secara terukur",
    ],
    prerequisites: ["Penguasaan operasi hitung dasar dan aljabar tingkat SMP/SMA"],
    sections: [
      { title: "Pengantar Penalaran Kuantitatif", items: [vid("Memahami struktur soal penalaran matematika", 6, true), art("Panduan mengikuti modul ini", 4, "## Cara belajar di modul ini\n\nSetiap bagian diakhiri dengan kuis singkat untuk menguji pemahaman konsep. Tugas analisis di bagian akhir akan ditinjau oleh pengajar.\n\nSiapkan buku catatan untuk menuliskan langkah penurunan rumus sendiri selama menonton materi.")] },
      { title: "Aljabar, Proporsi, dan Barisan", items: [vid("Rasio, proporsi, dan aritmetika sosial", 11), vid("Persamaan linear dan fungsi kuadrat", 13), vid("Barisan dan deret dalam persoalan kontekstual", 12), { kind: "QUIZ", title: "Evaluasi pemahaman: aljabar dan proporsi", pass: 60, minutes: 8, questions: SNBT_QUIZ, attempts: 3 }] },
      { title: "Analisis Tabel dan Geometri Dasar", items: [vid("Membaca tabel dan grafik multi-variabel", 9), vid("Konsep bangun datar dan ruang pada soal cerita", 10), { kind: "PDF", title: "Rangkuman materi: konsep inti kuantitatif", minutes: 5, heading: "Rangkuman Konsep Kuantitatif", points: ["Periksa satuan dan skala grafik sebelum melakukan perhitungan", "Gunakan pemisalan variabel yang sederhana untuk soal cerita", "Bandingkan nilai ekstrem untuk menguji kecukupan pernyataan", "Catat pola barisan dari tiga suku pertama sebelum menggunakan rumus umum", "Verifikasi kembali apakah hasil akhir menjawab pertanyaan soal"] }] },
      { title: "Tugas Analisis Soal", items: [{ kind: "ASSIGNMENT", title: "Penyusunan pembahasan terstruktur soal penalaran", minutes: 90, instructions: "Pilih tiga soal penalaran matematika pada lembar kerja di bagian sumber daya, lalu susun pembahasan lengkap:\n\n1. Tuliskan informasi yang diketahui dan variabel yang ditanyakan.\n2. Jabarkan langkah penyelesaian secara runtut beserta alasan tiap langkah.\n3. Sertakan satu cara pemeriksaan ulang (verifikasi jawaban).\n\nUnggah dokumen pembahasan Anda dalam format PDF atau teks.", rubric: [["Ketepatan Konsep", "Model matematika dan hasil akhir tepat", 10], ["Keruntutan Argumen", "Langkah penyelesaian logis dan mudah diikuti", 10], ["Kejelasan Penulisan", "Notasi dan kesimpulan ditulis dengan rapi", 5]], dueDays: 21 }] },
    ],
  },
  {
    slug: "pengantar-ekonomi-dan-akuntansi-dasar",
    title: "Pengantar Ekonomi dan Akuntansi Dasar",
    subtitle: "Konsep mekanisme pasar, persamaan dasar akuntansi, dan penyusunan laporan keuangan",
    category: "ekonomi-dan-bisnis",
    level: "BEGINNER",
    access: "PAID",
    usd: 3900,
    inr: 299900,
    idr: 990000,
    instructors: [0],
    description: "Modul pengantar bagi siswa menengah atas maupun mahasiswa tahun pertama yang mempelajari ilmu ekonomi dan akuntansi. Pembahasan dimulai dari konsep kelangkaan dan mekanisme pasar hingga siklus pencatatan transaksi keuangan.\n\nPada akhir modul, peserta dapat membaca laporan keuangan dasar dan memahami dampak transaksi terhadap posisi keuangan.",
    outcomes: [
      "Memahami konsep permintaan, penawaran, dan keseimbangan pasar",
      "Menerapkan persamaan dasar akuntansi pada transaksi usaha",
      "Menyusun jurnal umum, buku besar, dan neraca saldo sederhana",
      "Membaca laporan laba rugi dan laporan posisi keuangan",
    ],
    prerequisites: ["Tidak memerlukan latar belakang akuntansi sebelumnya"],
    sections: [
      { title: "Konsep Dasar Ilmu Ekonomi", items: [vid("Kelangkaan, biaya peluang, dan pilihan ekonomi", 7, true), vid("Permintaan, penawaran, dan keseimbangan pasar", 9), art("Studi kasus usaha jasa dan dagang", 5, "## Mengenal studi kasus modul\n\nSepanjang modul ini kita menggunakan contoh usaha fiktif yang memiliki empat kelompok akun utama: `Aset`, `Liabilitas`, `Ekuitas`, serta akun operasional `Pendapatan` dan `Beban`.\n\nGunakan halaman ini sebagai acuan saat mempelajari siklus pencatatan.")] },
      { title: "Persamaan dan Siklus Akuntansi", items: [vid("Persamaan dasar akuntansi dan saldo normal", 12), vid("Pencatatan jurnal umum dan pemindahan ke buku besar", 11), { kind: "QUIZ", title: "Kuis: mekanisme pasar dan persamaan akuntansi", pass: 70, minutes: 6, questions: EKONOMI_QUIZ }] },
      { title: "Laporan Keuangan Dasar", items: [vid("Menyusun neraca saldo dan laporan laba rugi", 10), vid("Laporan perubahan ekuitas dan posisi keuangan", 9)] },
    ],
  },
  {
    slug: "matematika-olimpiade-teori-bilangan-kombinatorika",
    title: "Matematika Olimpiade: Teori Bilangan dan Kombinatorika",
    subtitle: "Pendalaman keterbagian, aritmetika modular, prinsip pencacahan, dan teknik pembuktian",
    category: "sains-dan-olimpiade",
    level: "INTERMEDIATE",
    access: "PAID",
    usd: 7900,
    inr: 599900,
    idr: 2290000,
    compareUsd: 9900,
    compareIdr: 2990000,
    featured: true,
    instructors: [1],
    description: "Modul pembinaan olimpiade matematika yang berfokus pada dua bidang utama kompetisi sains: teori bilangan dan kombinatorika. Materi disusun untuk melatih cara berpikir deduktif dan penyusunan bukti matematika yang rapi.\n\nPenekanan diberikan pada pemilihan strategi pemecahan masalah, bukan sekadar menghafal rumus jadi.",
    outcomes: [
      "Menerapkan sifat keterbagian dan aritmetika modular pada persoalan teori bilangan",
      "Menggunakan prinsip pencacahan, permutasi, kombinasi, dan bijeksi",
      "Menyusun bukti matematika menggunakan induksi dan prinsip sarang merpati",
      "Menuliskan solusi kompetisi secara sistematis dan lengkap",
    ],
    prerequisites: ["Aljabar dasar", "Terbiasa dengan operasi bilangan bulat dan himpunan"],
    sections: [
      { title: "Landasan Logika dan Pembuktian", items: [vid("Struktur pembuktian langsung dan kontradiksi", 8, true), vid("Prinsip induksi matematika", 12)] },
      { title: "Teori Bilangan", items: [vid("Keterbagian, FPB, dan algoritma Euclid", 11), vid("Aritmetika modular dan kongruensi", 13), { kind: "QUIZ", title: "Kuis: teori bilangan dan kombinatorika", pass: 60, minutes: 10, questions: OLIMPIADE_QUIZ, attempts: 2, timed: 600 }] },
      { title: "Kombinatorika", items: [vid("Prinsip penjumlahan, perkalian, dan inklusi-eksklusi", 9), vid("Prinsip sarang merpati (Pigeonhole Principle)", 14), art("Panduan menuliskan solusi pembuktian", 6, "## Empat prinsip penulisan bukti\n\nSolusi olimpiade dinilai tidak hanya dari hasil akhir, tetapi dari kelengkapan argumen menuju hasil tersebut.\n\n**Definisi variabel** harus dinyatakan di awal, dan **setiap klaim antara** perlu disertai alasan atau sifat matematika yang mendasarinya.")] },
      { title: "Tugas Pembuktian", items: [{ kind: "ASSIGNMENT", title: "Penyelesaian dan pembuktian soal olimpiade", minutes: 120, instructions: "Kerjakan dua soal pembuktian (satu teori bilangan dan satu kombinatorika) yang tersedia pada lembar tugas:\n\nTuliskan definisi variabel, langkah deduksi secara lengkap, serta pemeriksaan kasus batas.", rubric: [["Validitas Bukti", "Argumen deduktif valid tanpa lompatan logika", 10], ["Kelengkapan Kasus", "Seluruh kasus batas telah diperiksa", 10], ["Kejelasan Penulisan", "Notasi matematika baku dan terstruktur", 10]], dueDays: 30 }] },
    ],
  },
  {
    slug: "penulisan-esai-akademik-dan-motivation-letter",
    title: "Penulisan Esai Akademik dan Motivation Letter",
    subtitle: "Struktur argumen, koherensi paragraf, dan penyusunan dokumen aplikasi beasiswa",
    category: "beasiswa-dan-riset",
    level: "ALL_LEVELS",
    access: "SUBSCRIPTION_ONLY",
    instructors: [2],
    description: "Dokumen aplikasi beasiswa dan esai akademik yang kuat dibangun dari gagasan yang terfokus, bukti pengalaman yang relevan, serta alur paragraf yang rapi. Modul ini memandu peserta menyusun kerangka hingga penyuntingan akhir.",
    outcomes: [
      "Merumuskan gagasan utama (thesis statement) yang jelas dan terarah",
      "Menyusun struktur motivation letter yang relevan dengan kriteria seleksi",
      "Menghubungkan latar belakang akademik dengan rencana kontribusi",
      "Melakukan penyuntingan mandiri (self-editing) untuk kejelasan bahasa",
    ],
    prerequisites: ["Tidak ada prasyarat khusus"],
    sections: [
      { title: "Kerangka dan Gagasan Utama", items: [vid("Memahami tujuan esai seleksi dan motivation letter", 7, true), vid("Menyusun kerangka paragraf dan alur logika", 10)] },
      { title: "Pengembangan Argumen", items: [vid("Menulis paragraf pembuka dan bukti pengalaman", 9), vid("Menjabarkan rencana studi dan kontribusi", 8), { kind: "QUIZ", title: "Kuis: struktur esai akademik", pass: 70, minutes: 5, questions: ESAI_QUIZ }] },
      { title: "Penyuntingan dan Revisi", items: [vid("Kohesi antarparagraf dan ketepatan diksi", 9), vid("Evaluasi draf akhir sebelum pengiriman", 11)] },
    ],
  },
  {
    slug: "metode-belajar-mandiri-dan-manajemen-waktu",
    title: "Metode Belajar Mandiri dan Manajemen Waktu Akademik",
    subtitle: "Pencatatan terstruktur, strategi pengulangan aktif, dan perencanaan jadwal belajar",
    category: "komunikasi-dan-bahasa",
    level: "BEGINNER",
    access: "FREE",
    instructors: [0],
    description: "Modul terbuka mengenai kebiasaan belajar yang efektif bagi pelajar dan mahasiswa: menyusun catatan yang mudah ditinjau ulang, menerapkan metode pengulangan aktif (active recall), serta mengatur prioritas tugas akademik.",
    outcomes: [
      "Menerapkan teknik pencatatan terstruktur untuk materi pelajaran",
      "Menggunakan active recall dan spaced repetition secara konsisten",
      "Menyusun jadwal belajar mingguan yang realistis dan terukur",
    ],
    prerequisites: ["Tidak ada prasyarat khusus"],
    sections: [
      { title: "Strategi Pemahaman Materi", items: [vid("Membedakan membaca pasif dan pengulangan aktif", 6, true), vid("Metode pencatatan terstruktur (Cornell Notes)", 9)] },
      { title: "Perencanaan Waktu Belajar", items: [vid("Menyusun jadwal mingguan dan prioritas tugas", 8), art("Daftar periksa evaluasi belajar mingguan", 4, "## Evaluasi akhir pekan\n\n- Apakah konsep inti minggu ini dapat dijelaskan kembali tanpa melihat buku?\n- Materi mana yang masih memerlukan latihan soal tambahan?\n- Apakah alokasi waktu belajar sudah seimbang dengan waktu istirahat?\n- Apa tiga target utama untuk minggu berikutnya?")] },
    ],
  },
  {
    slug: "penyusunan-proposal-pkm-dan-perencanaan-bisnis",
    title: "Penyusunan Proposal PKM-K dan Perencanaan Bisnis",
    subtitle: "Identifikasi masalah, validasi solusi, model bisnis, dan proyeksi keuangan dasar",
    category: "ekonomi-dan-bisnis",
    level: "INTERMEDIATE",
    access: "PAID",
    usd: 5900,
    inr: 449900,
    idr: 1690000,
    instructors: [2],
    description: "Perencanaan bisnis dan proposal Program Kreativitas Mahasiswa Kewirausahaan (PKM-K) yang baik berawal dari masalah nyata di lapangan. Modul ini membahas tahapan validasi kebutuhan pengguna, penyusunan model bisnis, hingga perhitungan anggaran dan proyeksi arus kas.",
    outcomes: [
      "Merumuskan permasalahan target pengguna dan proposisi nilai produk",
      "Melakukan wawancara validasi kebutuhan secara objektif",
      "Menyusun Business Model Canvas dan rencana operasional",
      "Menghitung rencana anggaran biaya dan proyeksi kelayakan usaha",
    ],
    prerequisites: ["Ketertarikan pada kewirausahaan atau kompetisi inovasi mahasiswa"],
    sections: [
      { title: "Identifikasi Masalah dan Peluang", items: [vid("Merumuskan masalah dan nilai guna produk", 8, true), vid("Pemetaan segmen pengguna dan analisis pasar", 11)] },
      { title: "Validasi dan Model Bisnis", items: [vid("Teknik wawancara validasi kebutuhan pengguna", 12), art("Panduan pertanyaan wawancara riset pasar", 5, "## Panduan wawancara yang objektif\n\n1. Ceritakan pengalaman terakhir Anda ketika menghadapi kendala tersebut.\n2. Langkah apa yang saat itu Anda lakukan untuk mengatasinya?\n3. Bagian mana yang paling memakan waktu atau biaya?\n4. Apa yang masih belum terpecahkan dari solusi yang ada saat ini?\n\nHindari pertanyaan tertutup yang mengarahkan responden.")] },
      { title: "Perencanaan Operasional dan Keuangan", items: [vid("Menyusun struktur biaya dan harga pokok", 9), vid("Proyeksi arus kas dan sistematika proposal PKM-K", 10)] },
    ],
  },
  {
    slug: "biologi-dan-kimia-terpadu-konsep-inti",
    title: "Biologi dan Kimia Terpadu: Konsep Inti Menengah",
    subtitle: "Struktur sel, metabolisme, stoikiometri kimia, dan kesetimbangan reaksi",
    category: "sains-dan-olimpiade",
    level: "INTERMEDIATE",
    access: "PAID",
    usd: 6900,
    inr: 499900,
    idr: 1990000,
    instructors: [1],
    description: "Pendalaman konsep biologi dan kimia tingkat menengah yang saling berkaitan. Materi mencakup struktur dan fungsi sel, proses biokimia dasar, stoikiometri reaksi, serta sifat larutan asam-basa.",
    outcomes: [
      "Memahami struktur organel sel dan mekanisme transpor membran",
      "Menyetarakan persamaan reaksi kimia dan menghitung stoikiometri mol",
      "Menganalisis faktor yang memengaruhi laju dan kesetimbangan reaksi",
      "Menghubungkan konsep kimia larutan dengan proses biologis",
    ],
    prerequisites: ["Penguasaan IPA dasar tingkat menengah pertama"],
    sections: [
      { title: "Biologi Sel dan Biomolekul", items: [vid("Struktur sel, membran, dan mekanisme transpor", 8, true), vid("Enzim dan pengantar metabolisme seluler", 12)] },
      { title: "Stoikiometri dan Reaksi Kimia", items: [vid("Konsep mol, rumus empiris, dan pereaksi pembatas", 13), vid("Kesetimbangan kimia dan pergeseran Le Chatelier", 10)] },
      { title: "Larutan dan Analisis Soal", items: [vid("Konsep asam-basa, pH, dan larutan penyangga", 11), art("Ringkasan pemeriksaan perhitungan stoikiometri", 5, "## Tahapan penyelesaian soal stoikiometri\n\n1. Pastikan persamaan reaksi kimia sudah setara jumlah atom dan muatannya.\n2. Ubah satuan kuantitas zat yang diketahui ke dalam satuan mol.\n3. Tentukan pereaksi pembatas berdasarkan perbandingan mol terhadap koefisien reaksi.\n4. Hitung jumlah mol produk, lalu konversi kembali ke satuan yang diminta.")] },
    ],
  },
  {
    slug: "statistika-dasar-dan-analisis-data-penelitian",
    title: "Statistika Dasar dan Analisis Data Penelitian",
    subtitle: "Statistika deskriptif, distribusi peluang, selang kepercayaan, dan pengujian hipotesis",
    category: "sains-dan-olimpiade",
    level: "BEGINNER",
    access: "PAID",
    usd: 4500,
    inr: 349900,
    idr: 1290000,
    instructors: [1],
    description: "Statistika yang dibutuhkan untuk membaca dan mengolah data penelitian secara akurat: ukuran pemusatan dan penyebaran data, cara mengomunikasikan ketidakpastian melalui selang kepercayaan, serta dasar pengujian hipotesis.",
    outcomes: [
      "Memilih ukuran pemusatan dan penyebaran data yang sesuai dengan distribusi",
      "Menginterpretasikan selang kepercayaan secara tepat",
      "Memahami logika uji hipotesis dan perbedaan signifikansi statistik",
    ],
    prerequisites: ["Operasi hitung matematika dasar"],
    sections: [
      { title: "Statistika Deskriptif", items: [vid("Ukuran pemusatan: rata-rata, median, dan modus", 8, true), vid("Ukuran penyebaran: varians, simpangan baku, dan pencilan", 9)] },
      { title: "Ketidakpastian dan Estimasi", items: [vid("Memahami distribusi sampel dan selang kepercayaan", 11), { kind: "QUIZ", title: "Kuis: interpretasi data statistik", pass: 67, minutes: 5, questions: STATS_QUIZ }] },
      { title: "Pengujian Hipotesis Dasar", items: [vid("Merumuskan hipotesis nol, nilai-p, dan penarikan kesimpulan", 12)] },
    ],
  },
  {
    slug: "literasi-bahasa-inggris-dan-teks-akademik",
    title: "Literasi Bahasa Inggris dan Pemahaman Teks Akademik",
    subtitle: "Analisis gagasan utama, inferensi, struktur wacana, dan kosakata akademik",
    category: "persiapan-snbt",
    level: "ADVANCED",
    access: "PAID",
    usd: 5900,
    inr: 449900,
    idr: 1690000,
    instructors: [2, 0],
    description: "Peningkatan kemampuan membaca kritis teks akademik berbahasa Inggris. Modul ini melatih identifikasi argumen penulis, penarikan kesimpulan tersirat (inferensi), evaluasi kepaduan wacana, serta pembandingan informasi antarparagraf.",
    outcomes: [
      "Mengidentifikasi gagasan utama, tujuan penulis, dan nada teks akademik",
      "Menarik kesimpulan logis (inferensi) berdasarkan bukti tekstual",
      "Menganalisis hubungan sebab-akibat dan perbandingan dalam wacana ilmiah",
    ],
    prerequisites: ["Penguasaan tata bahasa dan kosakata Bahasa Inggris dasar"],
    sections: [
      { title: "Struktur Wacana Akademik", items: [vid("Menemukan gagasan utama dan kalimat topik", 9, true), vid("Menganalisis pola organisasi paragraf ilmiah", 11)] },
      { title: "Inferensi dan Evaluasi Argumen", items: [vid("Membedakan fakta eksplisit, asumsi, dan inferensi", 13), vid("Membandingkan dua teks dengan sudut pandang berbeda", 12)] },
    ],
  },
  {
    slug: "komunikasi-publik-dan-presentasi-ilmiah",
    title: "Komunikasi Publik dan Teknik Presentasi Ilmiah",
    subtitle: "Penyusunan alur paparan, kejelasan penyampaian, dan penanganan sesi tanya-jawab",
    category: "komunikasi-dan-bahasa",
    level: "ALL_LEVELS",
    access: "FREE",
    instructors: [2],
    description: "Kemampuan menyampaikan gagasan secara terstruktur merupakan keterampilan penting di sekolah maupun perguruan tinggi. Modul gratis ini membahas cara menyusun kerangka presentasi ilmiah dan menjawab pertanyaan audiens atau penguji secara lugas.",
    outcomes: [
      "Menyusun struktur pembukaan, isi, dan kesimpulan presentasi ilmiah",
      "Menyampaikan argumen secara terukur dengan intonasi dan tempo yang jelas",
      "Menjawab pertanyaan pada sesi diskusi atau sidang secara sistematis",
    ],
    prerequisites: ["Tidak ada prasyarat khusus"],
    sections: [{ title: "Struktur Paparan Ilmiah", items: [vid("Menyusun alur presentasi dari latar belakang hingga temuan", 6, true), vid("Teknik penyampaian dan pengelolaan sesi tanya-jawab", 10), art("Kerangka ringkas pemaparan hasil riset", 3, "## Kerangka paparan 5 menit\n\n**Latar belakang & Masalah:** satu kalimat inti mengapa topik ini penting.\n\n**Metode & Analisis:** dua sampai tiga poin langkah yang dilakukan.\n\n**Temuan & Simpulan:** hasil utama yang menjawab rumusan masalah.")] }],
  },
  {
    slug: "metodologi-penelitian-dan-karya-tulis-ilmiah",
    title: "Metodologi Penelitian dan Karya Tulis Ilmiah",
    subtitle: "Perumusan masalah, kajian pustaka, desain metode penelitian, dan etika penulisan ilmiah",
    category: "beasiswa-dan-riset",
    level: "ADVANCED",
    access: "PAID",
    usd: 8900,
    inr: 699900,
    idr: 2490000,
    featured: true,
    instructors: [2],
    description: "Panduan menyeluruh dalam merancang penelitian dan menulis karya tulis ilmiah (KTI), makalah akademik, maupun proposal tugas akhir. Pembahasan mencakup perumusan masalah, penelusuran literatur ilmiah, pemilihan metode penelitian, hingga tata cara sitasi.\n\nSetiap bab membekali peserta dengan kerangka kerja yang dapat langsung diterapkan pada draf penelitian.",
    outcomes: [
      "Merumuskan masalah dan tujuan penelitian yang terukur",
      "Menyusun tinjauan pustaka dan kerangka pemikiran secara kritis",
      "Memilih pendekatan metode penelitian kualitatif maupun kuantitatif yang tepat",
      "Menerapkan kaidah sitasi ilmiah dan menghindari plagiarisme",
    ],
    prerequisites: ["Familiar dengan penulisan karangan ilmiah dasar"],
    sections: [
      { title: "Perumusan Masalah Penelitian", items: [vid("Menentukan topik dan kesenjangan penelitian (research gap)", 7, true), vid("Merumuskan pertanyaan dan tujuan penelitian", 11)] },
      { title: "Kajian Pustaka dan Etika Ilmiah", items: [vid("Menelusuri jurnal ilmiah dan menyintesis literatur", 13), vid("Teknik parafrasa, sitasi, dan pencegahan plagiarisme", 12), { kind: "QUIZ", title: "Kuis: metodologi dan etika penulisan ilmiah", pass: 75, minutes: 6, questions: RISET_QUIZ, attempts: 3 }] },
      { title: "Desain Metode dan Pembahasan", items: [vid("Memilih metode pengumpulan dan analisis data", 10), vid("Menyusun bab hasil, pembahasan, dan simpulan", 12)] },
      { title: "Tugas Kerangka Karya Ilmiah", items: [{ kind: "ASSIGNMENT", title: "Penyusunan kerangka proposal karya tulis ilmiah", minutes: 120, instructions: "Susun kerangka proposal penelitian singkat (Bab 1 hingga Bab 3) sesuai topik bidang minat Anda:\n\n1. Tuliskan latar belakang dan rumusan masalah yang spesifik.\n2. Cantumkan minimal tiga rujukan literatur yang relevan.\n3. Jelaskan metode pengumpulan dan analisis data yang akan digunakan.", rubric: [["Ketajaman Masalah", "Rumusan masalah spesifik dan selaras dengan tujuan", 15], ["Kajian Literatur & Metode", "Rujukan relevan dan metode penelitian tepat", 10], ["Sistematika Penulisan", "Mengikuti kaidah bahasa Indonesia ilmiah yang baku", 5]] }] },
    ],
  },
  {
    slug: "visualisasi-data-dan-desain-presentasi",
    title: "Visualisasi Data dan Desain Materi Presentasi",
    subtitle: "Pemilihan jenis grafik, penyederhanaan informasi visual, dan tata letak slide akademik",
    category: "komunikasi-dan-bahasa",
    level: "INTERMEDIATE",
    access: "SUBSCRIPTION_ONLY",
    instructors: [1, 2],
    description: "Memilih bentuk visualisasi data yang tepat, menghilangkan elemen visual yang mengganggu, serta menyusun judul grafik yang langsung menyampaikan temuan utama pada laporan maupun slide presentasi akademik.",
    outcomes: [
      "Memilih jenis diagram yang sesuai dengan karakteristik data",
      "Menyederhanakan tabel dan grafik agar mudah dibaca",
      "Menyusun tata letak slide presentasi yang bersih dan komunikatif",
    ],
    prerequisites: ["Tidak ada prasyarat khusus"],
    sections: [
      { title: "Prinsip Visualisasi Data", items: [vid("Menentukan grafik berdasarkan pertanyaan analisis", 7, true), vid("Penggunaan diagram batang, garis, dan proporsi secara tepat", 10)] },
      { title: "Tata Letak Materi Presentasi", items: [vid("Menghilangkan gangguan visual pada grafik", 9), vid("Menulis judul slide yang merangkum temuan utama", 6)] },
    ],
  },
];

export const REVIEW_LINES: [number, string][] = [
  [5, "Penjelasannya sangat runtut dan mudah dipahami. Rangkuman materinya sangat membantu saat latihan soal."],
  [5, "Pembahasan konsep dasarnya jelas sekali, tidak sekadar menghafal rumus. Tugas di akhir modul juga memperdalam pemahaman."],
  [4, "Materinya terstruktur dengan baik. Akan lebih lengkap lagi jika ditambah satu contoh studi kasus di bagian tengah."],
  [5, "Kedalaman materinya pas untuk persiapan ujian maupun kuliah. Setiap video langsung membahas inti permasalahan."],
  [4, "Materi dan umpan balik pada tugas sangat membangun. Sangat direkomendasikan untuk belajar mandiri."],
  [3, "Fondasi konsepnya bagus dan sistematis, meskipun bagian pengantar sudah cukup familier bagi saya."],
  [5, "Akhirnya paham konsep yang selama ini terasa membingungkan di kelas. Terima kasih atas penjelasan yang sabar."],
  [4, "Contoh soal dan pembahasannya aplikatif. Kuis di setiap bab sangat membantu mengecek pemahaman."],
];

export const QA_THREADS: { title: string; body: string; answer: string }[] = [
  { title: "Apakah lembar kerja tugas dan rangkuman tersedia dalam format PDF?", body: "Saya ingin mencetak materi rangkuman untuk dipelajari secara luring. Apakah filenya dapat diunduh?", answer: "Tentu: file PDF rangkuman dan panduan tugas tersedia di tab sumber daya (resources) pada materi terkait dan dapat langsung diunduh." },
  { title: "Mengapa pada contoh kedua digunakan median, bukan rata-rata?", body: "Kedua contoh sama-sama menghitung nilai pusat data, tetapi mengapa kesimpulannya menggunakan ukuran yang berbeda?", answer: "Pada contoh kedua terdapat nilai pencilan (outlier) yang cukup jauh, sehingga median memberikan gambaran nilai tengah yang lebih representatif dibandingkan rata-rata hitung." },
  { title: "Berapa alokasi waktu belajar yang disarankan setiap minggu?", body: "Saya ingin menyelesaikan seluruh materi beserta tugas proyek dalam waktu satu bulan.", answer: "Sekitar tiga hingga empat jam per minggu sudah sangat cukup bagi sebagian besar peserta untuk menuntaskan seluruh video, kuis, dan tugas akhir dalam satu bulan." },
  { title: "Apakah boleh menggunakan topik atau data penelitian sendiri untuk tugas akhir?", body: "Saya sedang menyiapkan draf penelitian untuk kegiatan akademik di sekolah/kampus.", answer: "Sangat diperbolehkan, selama struktur penulisan dan kriteria pada rubrik penilaian tetap terpenuhi secara lengkap." },
];
