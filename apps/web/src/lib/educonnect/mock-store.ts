import type {
  DonationCondition,
  DonationDelivery,
  DonationItemType,
  DonationStatus,
  EducationLevel,
  InterestTag,
  KitboxDonation,
  KitboxImpact,
  KitboxPackage,
  KitboxRequest,
  KitboxRequestStatus,
  KitboxStatus,
  MentorAvailabilitySlot,
  MentorCard,
  MentorDetail,
  MentorSession,
  MentorSessionStatus,
  OpportunityCard,
  OpportunityDetail,
  OpportunityKind,
  OpportunityStatus,
  StudentLearningProfile,
} from "@open-lms/types";
import { computeCompatibility } from "./mentor-match";
import { upcomingSlots } from "./mentor-slots";

const STORAGE_KEY = "educonnect.mock.v1";

export interface StoredMentor extends Omit<MentorDetail, "compatibility"> {
  isActive: boolean;
  email: string;
}

export interface StoredOpportunity extends Omit<OpportunityDetail, "saved"> {
  status: OpportunityStatus;
  sourceUrl: string | null;
}

export interface EduconnectState {
  profile: StudentLearningProfile;
  /** Which mentor account is simulated when toggling "Mode Mentor" in /mentoring */
  activeMentorId: string;
  mentors: StoredMentor[];
  sessions: MentorSession[];
  opportunities: StoredOpportunity[];
  savedOpportunityIds: string[];
  kitboxPackages: (KitboxPackage & { status: KitboxStatus })[];
  kitboxRequests: KitboxRequest[];
  kitboxDonations: KitboxDonation[];
  baseImpact: {
    itemsDonated: number;
    donors: number;
    kitsDelivered: number;
    studentsHelped: number;
  };
}

const hoursFromNow = (h: number) => new Date(Date.now() + h * 3600_000).toISOString();
const daysFromNow = (d: number) => new Date(Date.now() + d * 86400_000).toISOString();

export function createInitialSeed(): EduconnectState {
  const mentors: StoredMentor[] = [
    {
      id: "mnt_01_rizky",
      username: "rizky-pratama",
      email: "rizky.pratama@students.undip.ac.id",
      displayName: "Rizky Pratama, S.Ak.",
      avatarUrl: null,
      headline: "Mahasiswa Berprestasi Akuntansi FEB UNDIP · Medalis OSN Ekonomi",
      bio: "Berpengalaman 3 tahun membimbing siswa SMA untuk persiapan SNBT (Penalaran Matematika & Literasi) serta Olimpiade Ekonomi & Akuntansi tingkat nasional. Metode belajar fokus pada konsep dasar, bedah soal HOTS, dan strategi manajemen waktu ujian.",
      institution: "FEB Universitas Diponegoro (UNDIP)",
      major: "S1 Akuntansi",
      specialties: ["Akuntansi Menengah", "Ekonomi SMA", "Persiapan SNBT", "Olimpiade Ekonomi"],
      interests: ["akuntansi", "ekonomi", "persiapan-snbt", "olimpiade", "matematika", "beasiswa"],
      educationLevels: ["SMA", "KULIAH"],
      isVerified: true,
      isActive: true,
      sessionsCompleted: 48,
      pricePerSession: 25000,
      sessionMinutes: 60,
      availability: [
        { weekday: 1, startMinute: 960, endMinute: 1200 },  // Senin 16:00-20:00 WIB
        { weekday: 3, startMinute: 960, endMinute: 1200 },  // Rabu 16:00-20:00 WIB
        { weekday: 6, startMinute: 540, endMinute: 780 },   // Sabtu 09:00-13:00 WIB
      ],
    },
    {
      id: "mnt_02_alya",
      username: "alya-maharani",
      email: "alya.maharani@stei.itb.ac.id",
      displayName: "Alya Maharani",
      avatarUrl: null,
      headline: "Mahasiswi Teknik Informatika STEI ITB · Penerima Beasiswa Unggulan",
      bio: "Membantu siswa SMP & SMA memahami Matematika, Fisika, dan Dasar Pemrograman (Python & Web) tanpa menghafal rumus. Siap berbagi tips lolos Beasiswa Unggulan dan penyusunan esai beasiswa.",
      institution: "STEI Institut Teknologi Bandung (ITB)",
      major: "S1 Teknik Informatika",
      specialties: ["Matematika SMA", "Fisika Dasar", "Coding Python", "Review Esai Beasiswa"],
      interests: ["matematika", "fisika", "coding", "persiapan-snbt", "beasiswa", "sains"],
      educationLevels: ["SMP", "SMA"],
      isVerified: true,
      isActive: true,
      sessionsCompleted: 36,
      pricePerSession: 30000,
      sessionMinutes: 60,
      availability: [
        { weekday: 2, startMinute: 990, endMinute: 1230 },  // Selasa 16:30-20:30 WIB
        { weekday: 4, startMinute: 990, endMinute: 1230 },  // Kamis 16:30-20:30 WIB
        { weekday: 0, startMinute: 600, endMinute: 840 },   // Minggu 10:00-14:00 WIB
      ],
    },
    {
      id: "mnt_03_bagas",
      username: "bagas-wicaksono",
      email: "bagas.wicaksono@feb.undip.ac.id",
      displayName: "Bagas Wicaksono",
      avatarUrl: null,
      headline: "Asisten Laboratorium Manajemen & Kewirausahaan FEB UNDIP",
      bio: "Fokus membimbing siswa SMA dan mahasiswa tahun pertama dalam menyusun Business Plan, proposal PKM-K, pitch deck kompetisi bisnis, serta latihan Public Speaking bahasa Indonesia & Inggris.",
      institution: "FEB Universitas Diponegoro (UNDIP)",
      major: "S1 Manajemen",
      specialties: ["Business Plan & PKM-K", "Public Speaking", "Ekonomi & Bisnis", "Bahasa Inggris"],
      interests: ["ekonomi", "public-speaking", "bahasa-inggris", "beasiswa", "skripsi"],
      educationLevels: ["SMA", "KULIAH"],
      isVerified: true,
      isActive: true,
      sessionsCompleted: 29,
      pricePerSession: 20000,
      sessionMinutes: 60,
      availability: [
        { weekday: 1, startMinute: 1140, endMinute: 1320 }, // Senin 19:00-22:00 WIB
        { weekday: 5, startMinute: 960, endMinute: 1200 },  // Jumat 16:00-20:00 WIB
      ],
    },
    {
      id: "mnt_04_nadira",
      username: "nadira-kusuma",
      email: "nadira.kusuma@fk.ui.ac.id",
      displayName: "Nadira Kusuma",
      avatarUrl: null,
      headline: "Mahasiswi Kedokteran FK UI · Tutor Biologi & Kimia SNBT",
      bio: "Spesialis pendampingan Biologi, Kimia, dan Penalaran Umum untuk siswa SMP dan SMA yang menargetkan rumpun Saintek / Kedokteran di PTN favorit.",
      institution: "Fakultas Kedokteran Universitas Indonesia (UI)",
      major: "S1 Pendidikan Dokter",
      specialties: ["Biologi SMA", "Kimia Dasar", "Persiapan SNBT", "Olimpiade Biologi"],
      interests: ["biologi", "kimia", "sains", "persiapan-snbt", "olimpiade"],
      educationLevels: ["SMP", "SMA"],
      isVerified: true,
      isActive: true,
      sessionsCompleted: 54,
      pricePerSession: 35000,
      sessionMinutes: 60,
      availability: [
        { weekday: 3, startMinute: 1140, endMinute: 1320 }, // Rabu 19:00-22:00 WIB
        { weekday: 6, startMinute: 900, endMinute: 1140 },  // Sabtu 15:00-19:00 WIB
      ],
    },
    {
      id: "mnt_05_dimas",
      username: "dimas-saputra",
      email: "dimas.saputra@ugm.ac.id",
      displayName: "Dimas Saputra",
      avatarUrl: null,
      headline: "Relawan Pengajar Matematika & Sains SD–SMP · FMIPA UGM",
      bio: "Sabar dan komunikatif dalam mendampingi adik-adik SD dan SMP belajar Matematika Dasar, IPA Terpadu, serta persiapan lomba cerdas cermat dan OSN tingkat kabupaten/provinsi.",
      institution: "FMIPA Universitas Gadjah Mada (UGM)",
      major: "S1 Matematika",
      specialties: ["Matematika SD & SMP", "IPA Terpadu", "Olimpiade Matematika SMP"],
      interests: ["matematika", "sains", "olimpiade", "fisika"],
      educationLevels: ["SD", "SMP"],
      isVerified: true,
      isActive: true,
      sessionsCompleted: 41,
      pricePerSession: 0,
      sessionMinutes: 45,
      availability: [
        { weekday: 2, startMinute: 900, endMinute: 1125 },  // Selasa 15:00-18:45 WIB
        { weekday: 4, startMinute: 900, endMinute: 1125 },  // Kamis 15:00-18:45 WIB
        { weekday: 6, startMinute: 540, endMinute: 765 },   // Sabtu 09:00-12:45 WIB
      ],
    },
    {
      id: "mnt_06_citra",
      username: "citra-lestari",
      email: "citra.lestari@fib.undip.ac.id",
      displayName: "Citra Lestari",
      avatarUrl: null,
      headline: "Tutor Bahasa Inggris, Academic Writing & Desain Presentasi · UNDIP",
      bio: "Membantu siswa SMP, SMA, hingga mahasiswa meningkatkan skor literasi Bahasa Inggris, penulisan esai akademik, dan pembuatan slide visual yang rapi.",
      institution: "FIB Universitas Diponegoro (UNDIP)",
      major: "S1 Sastra Inggris",
      specialties: ["Literasi Bahasa Inggris", "Academic Writing", "Desain Pitch Deck"],
      interests: ["bahasa-inggris", "bahasa-indonesia", "desain", "public-speaking", "beasiswa"],
      educationLevels: ["SMP", "SMA", "KULIAH"],
      isVerified: false,
      isActive: true,
      sessionsCompleted: 12,
      pricePerSession: 15000,
      sessionMinutes: 60,
      availability: [
        { weekday: 5, startMinute: 960, endMinute: 1200 },  // Jumat 16:00-20:00 WIB
        { weekday: 0, startMinute: 900, endMinute: 1140 },  // Minggu 15:00-19:00 WIB
      ],
    },
  ];

  const sessions: MentorSession[] = [
    {
      id: "ses_01_confirmed",
      status: "CONFIRMED",
      scheduledAt: daysFromNow(2),
      durationMinutes: 60,
      topic: "Bedah Soal Jurnal Penyesuaian & Strategi SNBT FEB UNDIP",
      message: "Kak Rizky, saya masih sering bingung membedakan beban dibayar di muka pendekatan neraca vs laba rugi.",
      meetingUrl: "https://meet.google.com/edu-undip-akn",
      compatibilityScore: 100,
      cancelReason: null,
      mentor: {
        id: "mnt_01_rizky",
        username: "rizky-pratama",
        displayName: "Rizky Pratama, S.Ak.",
        avatarUrl: null,
        institution: "FEB Universitas Diponegoro (UNDIP)",
      },
      student: {
        id: "stu_nadia",
        displayName: "Nadia Putri",
        avatarUrl: null,
        educationLevel: "SMA",
      },
      viewerRole: "STUDENT",
      createdAt: daysFromNow(-2),
    },
    {
      id: "ses_02_pending",
      status: "PENDING",
      scheduledAt: daysFromNow(4),
      durationMinutes: 60,
      topic: "Review Esai Motivasi Beasiswa Unggulan & Latihan Penalaran Matematika",
      message: "Mohon bantuannya untuk review draf esai 500 kata saya ya Kak Alya.",
      meetingUrl: null,
      compatibilityScore: 85,
      cancelReason: null,
      mentor: {
        id: "mnt_02_alya",
        username: "alya-maharani",
        displayName: "Alya Maharani",
        avatarUrl: null,
        institution: "STEI Institut Teknologi Bandung (ITB)",
      },
      student: {
        id: "stu_nadia",
        displayName: "Nadia Putri",
        avatarUrl: null,
        educationLevel: "SMA",
      },
      viewerRole: "STUDENT",
      createdAt: hoursFromNow(-6),
    },
    {
      id: "ses_03_completed",
      status: "COMPLETED",
      scheduledAt: daysFromNow(-5),
      durationMinutes: 60,
      topic: "Simulasi Pitching 5 Menit & Struktur Finansial Lomba Business Plan SMA",
      message: "Terima kasih banyak Kak Bagas atas masukannya!",
      meetingUrl: "https://meet.google.com/edu-pitch-feb",
      compatibilityScore: 75,
      cancelReason: null,
      mentor: {
        id: "mnt_03_bagas",
        username: "bagas-wicaksono",
        displayName: "Bagas Wicaksono",
        avatarUrl: null,
        institution: "FEB Universitas Diponegoro (UNDIP)",
      },
      student: {
        id: "stu_nadia",
        displayName: "Nadia Putri",
        avatarUrl: null,
        educationLevel: "SMA",
      },
      viewerRole: "STUDENT",
      createdAt: daysFromNow(-8),
    },
  ];

  const opportunities: StoredOpportunity[] = [
    {
      id: "opp_01_kan_undip",
      slug: "kompetisi-akuntansi-nasional-feb-undip-2026",
      kind: "COMPETITION",
      title: "Kompetisi Akuntansi & Ekonomi Nasional (KAEN) FEB UNDIP 2026",
      organizer: "HMD Akuntansi FEB Universitas Diponegoro",
      summary: "Olimpiade akuntansi dan studi kasus ekonomi tingkat nasional untuk siswa SMA/SMK sederajat dengan total hadiah Rp25.000.000 & Golden Ticket.",
      descriptionHtml:
        "<p><strong>Kompetisi Akuntansi &amp; Ekonomi Nasional (KAEN) FEB UNDIP 2026</strong> adalah ajang tahunan bergengsi bagi siswa SMA/SMK/MA di seluruh Indonesia untuk menguji kemampuan siklus akuntansi, analisis laporan keuangan, dan pemecahan masalah ekonomi makro-mikro.</p><p>Babak penyisihan dilaksanakan secara daring (Online CBT), sedangkan 15 tim terbaik akan diundang ke Kampus FEB UNDIP Tembalang, Semarang untuk babak Semifinal &amp; Grand Final.</p>",
      requirements: [
        "Siswa aktif SMA / SMK / MA sederajat kelas 10, 11, atau 12 di seluruh Indonesia",
        "Satu tim terdiri dari 2–3 siswa dari sekolah yang sama (atau individu pada kategori Solo)",
        "Melampirkan kartu pelajar atau surat keterangan kepala sekolah",
      ],
      benefits: [
        "Total uang pembinaan Rp25.000.000 + Trofi Bergilir FEB UNDIP",
        "E-Sertifikat resmi berstandar nasional untuk seluruh peserta (dapat dilampirkan di SNBP)",
        "Free mentoring 1-on-1 bersama mahasiswa berprestasi FEB UNDIP bagi finalis",
      ],
      educationLevels: ["SMA"],
      tags: ["Akuntansi", "Ekonomi", "Olimpiade", "FEB UNDIP"],
      location: "Hybrid (Online & Semarang)",
      registrationUrl: "https://feb.undip.ac.id",
      sourceUrl: "https://feb.undip.ac.id",
      opensAt: daysFromNow(-20),
      deadlineAt: hoursFromNow(18), // < 24h -> urgent red second-by-second countdown!
      isVerified: true,
      saveCount: 142,
      status: "PUBLISHED",
    },
    {
      id: "opp_02_beasiswa_perintis",
      slug: "beasiswa-perintis-nusantara-sma-kuliah-2026",
      kind: "SCHOLARSHIP",
      title: "Beasiswa Perintis Nusantara 2026 (Tunjangan Belajar & Persiapan PTN)",
      organizer: "Yayasan Pendidikan Nusantara & Mitra Kampus",
      summary: "Beasiswa uang saku bulanan, modul intensif SNBT, serta pendampingan mentor 1-on-1 selama 1 tahun penuh bagi siswa SMA & mahasiswa baru.",
      descriptionHtml:
        "<p><strong>Beasiswa Perintis Nusantara</strong> hadir untuk menjembatani kesenjangan akses pendidikan berkualitas bagi pelajar SMA kelas 11–12 dan mahasiswa tahun pertama yang memiliki semangat belajar tinggi.</p><p>Penerima beasiswa mendapatkan bantuan dana pendidikan langsung, akses penuh seluruh modul persiapan ujian, serta sesi bimbingan rutin setiap bulan.</p>",
      requirements: [
        "Siswa SMA/SMK/MA kelas 11–12 atau Mahasiswa aktif semester 1–4",
        "Rata-rata nilai rapor minimal 82,0 atau IPK minimal 3,25",
        "Menulis esai rencana kontribusi & target belajar (300–500 kata)",
      ],
      benefits: [
        "Bantuan dana pendidikan Rp750.000 / bulan selama 12 bulan",
        "Akses gratis paket tryout SNBT & sesi mentoring 1-on-1 eksklusif",
        "Jaringan komunitas awardee nasional & pelatihan kepemimpinan",
      ],
      educationLevels: ["SMA", "KULIAH"],
      tags: ["Beasiswa", "Persiapan SNBT", "Dana Pendidikan"],
      location: "Online (Seluruh Indonesia)",
      registrationUrl: "https://beasiswa.kemdikbud.go.id",
      sourceUrl: "https://beasiswa.kemdikbud.go.id",
      opensAt: daysFromNow(-15),
      deadlineAt: daysFromNow(4), // <= 7 days -> amber warning countdown
      isVerified: true,
      saveCount: 289,
      status: "PUBLISHED",
    },
    {
      id: "opp_03_osn_sains",
      slug: "olimpiade-sains-dan-matematika-pelajar-indonesia-2026",
      kind: "COMPETITION",
      title: "Olimpiade Sains & Matematika Pelajar Indonesia (OSMPI) 2026",
      organizer: "Pusat Prestasi Sains Muda Indonesia",
      summary: "Kompetisi bertingkat bidang Matematika, IPA, Biologi, Fisika, dan Ekonomi untuk jenjang SD, SMP, dan SMA secara daring.",
      descriptionHtml:
        "<p>OSMPI 2026 dirancang sebagai ajang pemanasan menuju Olimpiade Sains Nasional (OSN) dengan soal-soal terkurasi oleh tim pembina olimpiade perguruan tinggi negeri.</p>",
      requirements: [
        "Terbuka untuk pelajar SD (kelas 4–6), SMP (kelas 7–9), dan SMA (kelas 10–12)",
        "Memilih maksimal 2 bidang lomba sesuai jenjang pendidikan",
      ],
      benefits: [
        "Medali Emas, Perak, Perunggu & Piagam Penghargaan Nasional",
        "Pembahasan soal lengkap (PDF & Video) setelah kompetisi selesai",
        "Beasiswa pembinaan olimpiade lanjutan",
      ],
      educationLevels: ["SD", "SMP", "SMA"],
      tags: ["Matematika", "Sains", "Olimpiade", "OSN"],
      location: "Online",
      registrationUrl: "https://pusatprestasinasional.kemdikbud.go.id",
      sourceUrl: "https://pusatprestasinasional.kemdikbud.go.id",
      opensAt: daysFromNow(-10),
      deadlineAt: daysFromNow(6), // <= 7 days -> amber
      isVerified: true,
      saveCount: 198,
      status: "PUBLISHED",
    },
    {
      id: "opp_04_beasiswa_unggulan_smp_sma",
      slug: "beasiswa-prestasi-pelajar-cahaya-bangsa-2026",
      kind: "SCHOLARSHIP",
      title: "Beasiswa Prestasi Pelajar Cahaya Bangsa (SD, SMP & SMA)",
      organizer: "Lembaga Filantropi Cahaya Pendidikan",
      summary: "Dukungan biaya sekolah, paket buku penunjang, dan kuota internet belajar untuk siswa SD, SMP, dan SMA berprestasi akademik maupun non-akademik.",
      descriptionHtml:
        "<p>Program Beasiswa Cahaya Bangsa mendukung siswa SD, SMP, dan SMA di seluruh provinsi Indonesia agar tetap fokus meraih prestasi tanpa terkendala biaya perlengkapan dan penunjang belajar.</p>",
      requirements: [
        "Siswa aktif jenjang SD, SMP, atau SMA sederajat",
        "Memiliki prestasi akademik (peringkat 10 besar) atau aktif di kegiatan ekstrakurikuler/lomba",
        "Surat rekomendasi dari guru atau wali kelas",
      ],
      benefits: [
        "Bantuan biaya penunjang pendidikan Rp3.000.000 / semester",
        "Paket buku referensi & kuota belajar bulanan",
      ],
      educationLevels: ["SD", "SMP", "SMA"],
      tags: ["Beasiswa", "SD", "SMP", "SMA"],
      location: "Online",
      registrationUrl: "https://kemdikbud.go.id",
      sourceUrl: "https://kemdikbud.go.id",
      opensAt: daysFromNow(-7),
      deadlineAt: daysFromNow(14), // > 7 days -> emerald green
      isVerified: true,
      saveCount: 164,
      status: "PUBLISHED",
    },
    {
      id: "opp_05_lomba_business_plan",
      slug: "national-youth-business-plan-pkm-competition-2026",
      kind: "COMPETITION",
      title: "National Youth Business Plan & Social Entrepreneurship Challenge 2026",
      organizer: "Inkubator Bisnis & Kewirausahaan Kampus",
      summary: "Lomba inovasi bisnis dan proyek sosial berorientasi SDGs untuk siswa SMA dan mahasiswa S1/D4 dengan pendanaan inkubasi.",
      descriptionHtml:
        "<p>Kompetisi penyusunan Business Plan dan Pitch Deck bagi pelajar SMA dan mahasiswa yang memiliki gagasan wirausaha berdampak sosial (seperti pendidikan, lingkungan, dan ekonomi kreatif).</p>",
      requirements: [
        "Tim beranggotakan 2–4 orang (kategori Siswa SMA atau kategori Mahasiswa)",
        "Mengumpulkan proposal Business Plan (maks. 15 halaman) dan Pitch Deck (10–12 slide)",
      ],
      benefits: [
        "Hibah modal awal (Seed Funding) hingga Rp15.000.000",
        "Sesi mentoring bersama praktisi startup dan dosen kewirausahaan",
      ],
      educationLevels: ["SMA", "KULIAH"],
      tags: ["Business Plan", "Kewirausahaan", "Pitch Deck", "SDGs"],
      location: "Semarang & Online",
      registrationUrl: "https://undip.ac.id",
      sourceUrl: "https://undip.ac.id",
      opensAt: daysFromNow(-5),
      deadlineAt: daysFromNow(19),
      isVerified: true,
      saveCount: 117,
      status: "PUBLISHED",
    },
    {
      id: "opp_06_beasiswa_coding_muda",
      slug: "beasiswa-talenta-digital-coding-dan-ai-pelajar-2026",
      kind: "SCHOLARSHIP",
      title: "Beasiswa Talenta Digital: Bootcamp Coding & Data untuk Pelajar",
      organizer: "Indonesia Digital Talent Foundation",
      summary: "Beasiswa pelatihan pemrograman web, analisis data, dan logika komputasi gratis selama 3 bulan untuk siswa SMP, SMA, dan Mahasiswa.",
      descriptionHtml:
        "<p>Program beasiswa penuh untuk mempelajari dasar pengembangan aplikasi web modern dan pengolahan data bersama mentor industri dan akademisi.</p>",
      requirements: [
        "Pelajar SMP, SMA/SMK, atau Mahasiswa semua jurusan",
        "Tidak wajib memiliki latar belakang coding sebelumnya",
      ],
      benefits: [
        "Beasiswa penuh kurikulum intensif 12 minggu + proyek portofolio",
        "Sertifikat kompetensi industri & akses komunitas alumni",
      ],
      educationLevels: ["SMP", "SMA", "KULIAH"],
      tags: ["Coding", "Teknologi", "Beasiswa"],
      location: "Online",
      registrationUrl: "https://digitalent.kominfo.go.id",
      sourceUrl: "https://digitalent.kominfo.go.id",
      opensAt: daysFromNow(-3),
      deadlineAt: daysFromNow(25),
      isVerified: true,
      saveCount: 93,
      status: "PUBLISHED",
    },
    {
      id: "opp_07_lomba_esai_bahasa",
      slug: "kompetisi-esai-dan-public-speaking-pelajar-nasional-2026",
      kind: "COMPETITION",
      title: "Kompetisi Esai Ilmiah & English Speech Pelajar Nasional 2026",
      organizer: "Forum Akademisi & Bahasa Indonesia",
      summary: "Ajang penulisan esai populer dan pidato bahasa Inggris bertema Pendidikan Inklusif untuk jenjang SMP, SMA, dan Kuliah.",
      descriptionHtml:
        "<p>Asah kemampuan berpikir kritis, menulis argumen terstruktur, dan berbicara di depan publik melalui cabang Lomba Esai dan English Public Speaking.</p>",
      requirements: [
        "Kategori A: Siswa SMP & SMA; Kategori B: Mahasiswa",
        "Karya orisinal dan belum pernah dipublikasikan",
      ],
      benefits: [
        "Uang pembinaan, medali, dan publikasi karya di prosiding/antologi nasional",
      ],
      educationLevels: ["SMP", "SMA", "KULIAH"],
      tags: ["Bahasa Inggris", "Public Speaking", "Esai"],
      location: "Online",
      registrationUrl: "https://kemdikbud.go.id",
      sourceUrl: null,
      opensAt: daysFromNow(-2),
      deadlineAt: daysFromNow(28),
      isVerified: false,
      saveCount: 61,
      status: "PUBLISHED",
    },
    {
      id: "opp_08_expired_demo",
      slug: "beasiswa-semester-ganjil-2026-ditutup",
      kind: "SCHOLARSHIP",
      title: "Beasiswa Apresiasi Rapor Semester Ganjil 2026 (Periode Sebelumnya)",
      organizer: "Yayasan Edukasi Mandiri",
      summary: "Program beasiswa periode lalu yang sudah melewati batas waktu pendaftaran (otomatis disembunyikan dari katalog publik, tampil di Peluang Tersimpan).",
      descriptionHtml: "<p>Pendaftaran periode ini telah berakhir.</p>",
      requirements: ["Siswa SMA aktif"],
      benefits: ["Dana pendidikan Rp1.500.000"],
      educationLevels: ["SMA"],
      tags: ["Beasiswa", "Arsip"],
      location: "Online",
      registrationUrl: "https://kemdikbud.go.id",
      sourceUrl: "https://kemdikbud.go.id",
      opensAt: daysFromNow(-40),
      deadlineAt: daysFromNow(-3), // Already expired -> auto-hidden from public catalog!
      isVerified: true,
      saveCount: 84,
      status: "PUBLISHED",
    },
  ];

  const kitboxPackages: (KitboxPackage & { status: KitboxStatus })[] = [
    {
      id: "pkg_01_sd",
      slug: "starter-kit-sd-ceria",
      name: "Starter Kit SD Ceria",
      summary: "Paket perlengkapan tulis lengkap dan buku cerita/latihan berhitung dasar untuk adik-adik Sekolah Dasar.",
      contents: [
        "5 Buku Tulis Bergaris 58 Lembar",
        "1 Set Alat Tulis (Pensil 2B, Penghapus, Penggaris, Rautan)",
        "1 Set Pensil Warna 12 Warna",
        "2 Buku Bacaan & Latihan Matematika Dasar SD",
      ],
      educationLevels: ["SD"],
      stock: 14,
      imageUrl: null,
      status: "ACTIVE",
    },
    {
      id: "pkg_02_smp",
      slug: "paket-sains-dan-matematika-smp",
      name: "Paket Sains & Matematika SMP",
      summary: "Paket buku rangkuman konsep Matematika-IPA SMP beserta perlengkapan geometri dan buku catatan.",
      contents: [
        "1 Buku Kumpulan Rumus & Bedah Soal Matematika-IPA SMP",
        "4 Buku Catatan Kampus 100 Lembar",
        "1 Set Jangka & Busur Derajat Geometri",
        "1 Tempat Pensil + Pulpen & Highlighter",
      ],
      educationLevels: ["SMP"],
      stock: 9,
      imageUrl: null,
      status: "ACTIVE",
    },
    {
      id: "pkg_03_sma",
      slug: "kit-persiapan-snbt-dan-akuntansi-sma",
      name: "Kit Persiapan SNBT & Akuntansi SMA",
      summary: "Paket buku latihan UTBK-SNBT, kalkulator ilmiah, dan binder catatan untuk siswa SMA/SMK pejuang PTN.",
      contents: [
        "1 Buku Modul Intensif Penalaran Matematika & Literasi SNBT",
        "1 Buku Pengantar Akuntansi & Ekonomi SMA",
        "1 Kalkulator Scientific Standar Ujian",
        "1 Binder A5 + Isi Loose Leaf & Set Sticky Notes",
      ],
      educationLevels: ["SMA", "KULIAH"],
      stock: 7,
      imageUrl: null,
      status: "ACTIVE",
    },
  ];

  const kitboxRequests: KitboxRequest[] = [
    {
      id: "req_01_nadia",
      package: {
        id: "pkg_03_sma",
        name: "Kit Persiapan SNBT & Akuntansi SMA",
        slug: "kit-persiapan-snbt-dan-akuntansi-sma",
      },
      status: "APPROVED",
      recipientName: "Nadia Putri",
      phone: "081234567890",
      educationLevel: "SMA",
      institution: "SMAN 3 Semarang",
      shippingAddress: "Jl. Pemuda No. 149, Kec. Semarang Tengah",
      city: "Semarang",
      reason: "Saya sedang mempersiapkan SNBT prodi Akuntansi FEB UNDIP dan mengikuti seleksi lomba akuntansi, namun belum memiliki modul latihan SNBT terbaru dan kalkulator scientific.",
      adminNote: "Disetujui oleh Tim KitBox EduConnect. Paket siap dikirim via kurir/drop point Tembalang.",
      createdAt: daysFromNow(-4),
      updatedAt: daysFromNow(-2),
    },
  ];

  const kitboxDonations: KitboxDonation[] = [
    {
      id: "don_01",
      donorName: "Budi Santoso",
      donorContact: "budi.santoso@example.com",
      isAnonymous: false,
      itemType: "BOOK",
      itemDescription: "3 Buku Modul Latihan UTBK-SNBT & Pengantar Akuntansi (kondisi sangat terawat tanpa coretan)",
      quantity: 3,
      condition: "LIKE_NEW",
      deliveryMethod: "DROP_POINT",
      status: "DISTRIBUTED",
      adminNote: "Telah diterima di Drop Point FEB UNDIP dan dimasukkan ke paket SMA.",
      photoUrl: null,
      createdAt: daysFromNow(-6),
    },
    {
      id: "don_02",
      donorName: "Rizky Pratama",
      donorContact: "081398765432",
      isAnonymous: true,
      itemType: "STATIONERY",
      itemDescription: "10 Pak Buku Tulis & 5 Kalkulator Scientific baru untuk adik-adik SMA",
      quantity: 15,
      condition: "NEW",
      deliveryMethod: "COURIER",
      status: "RECEIVED",
      adminNote: "Paket donasi sudah tiba di gudang KitBox.",
      photoUrl: null,
      createdAt: daysFromNow(-2),
    },
  ];

  return {
    profile: {
      educationLevel: "SMA",
      gradeYear: 11,
      interests: ["matematika", "akuntansi", "persiapan-snbt", "beasiswa"],
      learningGoals: "Lolos SNBT Akuntansi FEB UNDIP dan meraih juara Olimpiade Ekonomi/Akuntansi SMA",
    },
    activeMentorId: "mnt_01_rizky",
    mentors,
    sessions,
    opportunities,
    savedOpportunityIds: ["opp_01_kan_undip", "opp_02_beasiswa_perintis", "opp_08_expired_demo"],
    kitboxPackages,
    kitboxRequests,
    kitboxDonations,
    baseImpact: {
      itemsDonated: 110,
      donors: 40,
      kitsDelivered: 63,
      studentsHelped: 63,
    },
  };
}

let memoryState: EduconnectState | null = null;
const listeners = new Set<() => void>();

export function subscribeEduconnectStore(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  for (const fn of listeners) fn();
}

export function loadState(): EduconnectState {
  if (memoryState) return memoryState;
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as EduconnectState;
        if (parsed && Array.isArray(parsed.mentors) && Array.isArray(parsed.opportunities)) {
          memoryState = parsed;
          return memoryState;
        }
      }
    } catch {
      /* fallback to seed */
    }
  }
  memoryState = createInitialSeed();
  return memoryState;
}

function saveState(next: EduconnectState): EduconnectState {
  memoryState = next;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore quota error */
    }
  }
  notify();
  return next;
}

export function resetDemoData(): EduconnectState {
  const fresh = createInitialSeed();
  return saveState(fresh);
}

// ─── Feature 1.1: Student Profile ───────────────────────────────────────────

export function getStudentProfile(): StudentLearningProfile {
  return loadState().profile;
}

export function updateStudentProfile(patch: Partial<StudentLearningProfile>): StudentLearningProfile {
  const s = loadState();
  const nextProfile: StudentLearningProfile = {
    educationLevel: patch.educationLevel !== undefined ? patch.educationLevel : s.profile.educationLevel,
    gradeYear: patch.gradeYear !== undefined ? patch.gradeYear : s.profile.gradeYear,
    interests: patch.interests !== undefined ? [...new Set(patch.interests)].slice(0, 10) : s.profile.interests,
    learningGoals: patch.learningGoals !== undefined ? patch.learningGoals : s.profile.learningGoals,
  };
  saveState({ ...s, profile: nextProfile });
  return nextProfile;
}

// ─── Feature 1.3: Mentors & Sessions ────────────────────────────────────────

export interface MentorListFilter {
  level?: EducationLevel | "";
  specialty?: string;
  q?: string;
  sort?: "match" | "popular";
}

export function listMentors(filter: MentorListFilter = {}): MentorCard[] {
  const s = loadState();
  const q = (filter.q ?? "").trim().toLowerCase();
  const spec = (filter.specialty ?? "").trim().toLowerCase();

  const cards: MentorCard[] = s.mentors
    .filter((m) => m.isActive)
    .filter((m) => (!filter.level ? true : m.educationLevels.includes(filter.level)))
    .filter((m) => (!spec ? true : m.specialties.some((sp) => sp.toLowerCase().includes(spec))))
    .filter((m) => {
      if (!q) return true;
      const hay = `${m.displayName} ${m.headline} ${m.institution ?? ""} ${m.major ?? ""} ${m.specialties.join(" ")}`.toLowerCase();
      return hay.includes(q);
    })
    .map((m) => ({
      id: m.id,
      username: m.username,
      displayName: m.displayName,
      avatarUrl: m.avatarUrl,
      headline: m.headline,
      institution: m.institution,
      specialties: m.specialties,
      educationLevels: m.educationLevels,
      isVerified: m.isVerified,
      isActive: m.isActive,
      sessionsCompleted: m.sessionsCompleted,
      pricePerSession: m.pricePerSession,
      sessionMinutes: m.sessionMinutes,
      compatibility: computeCompatibility(s.profile, m),
    }));

  if (filter.sort === "popular") {
    cards.sort((a, b) => b.sessionsCompleted - a.sessionsCompleted);
  } else {
    cards.sort((a, b) => (b.compatibility?.score ?? -1) - (a.compatibility?.score ?? -1) || b.sessionsCompleted - a.sessionsCompleted);
  }
  return cards;
}

export function getMentorByUsername(username: string): MentorDetail | null {
  const s = loadState();
  const m = s.mentors.find((x) => x.username.toLowerCase() === username.toLowerCase());
  if (!m) return null;
  return {
    ...m,
    compatibility: computeCompatibility(s.profile, m),
  };
}

export function getMentorSlots(username: string): { startsAt: string; endsAt: string }[] {
  const s = loadState();
  const m = s.mentors.find((x) => x.username.toLowerCase() === username.toLowerCase());
  if (!m || !m.isActive) return [];
  const booked = s.sessions
    .filter((ses) => ses.mentor.id === m.id && (ses.status === "PENDING" || ses.status === "CONFIRMED"))
    .map((ses) => ses.scheduledAt);
  return upcomingSlots(m.availability, booked, new Date(), {
    days: 14,
    minLeadHours: 12,
    minutes: m.sessionMinutes,
  });
}

export function listMySessions(opts: { as?: "student" | "mentor"; status?: MentorSessionStatus | "ALL" } = {}): MentorSession[] {
  const s = loadState();
  const asRole = opts.as ?? "student";
  return s.sessions
    .filter((ses) => (asRole === "mentor" ? ses.mentor.id === s.activeMentorId : true))
    .filter((ses) => (!opts.status || opts.status === "ALL" ? true : ses.status === opts.status))
    .map((ses) => ({
      ...ses,
      viewerRole: asRole === "mentor" ? ("MENTOR" as const) : ("STUDENT" as const),
    }))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export function getActiveMentorProfile(): StoredMentor | null {
  const s = loadState();
  return s.mentors.find((m) => m.id === s.activeMentorId) ?? s.mentors[0] ?? null;
}

export function setActiveMentorId(mentorId: string) {
  const s = loadState();
  saveState({ ...s, activeMentorId: mentorId });
}

export function updateMentorAvailability(mentorId: string, slots: MentorAvailabilitySlot[]): StoredMentor {
  const s = loadState();
  const nextMentors = s.mentors.map((m) => (m.id === mentorId ? { ...m, availability: slots } : m));
  saveState({ ...s, mentors: nextMentors });
  const updated = nextMentors.find((m) => m.id === mentorId);
  if (!updated) throw new Error("Mentor tidak ditemukan");
  return updated;
}

export function requestMentorSession(input: {
  mentorId: string;
  scheduledAt: string;
  topic: string;
  message?: string | null;
  studentName?: string;
}): MentorSession {
  const s = loadState();
  const mentor = s.mentors.find((m) => m.id === input.mentorId && m.isActive);
  if (!mentor) throw new Error("Mentor tidak ditemukan atau sedang tidak aktif.");

  const pendingCount = s.sessions.filter((ses) => ses.status === "PENDING").length;
  if (pendingCount >= 3) {
    throw new Error("Kamu sudah memiliki 3 permintaan sesi yang masih Menunggu Konfirmasi (maksimal 3 sesi PENDING).");
  }

  const slotClash = s.sessions.some(
    (ses) =>
      ses.mentor.id === mentor.id &&
      ses.scheduledAt === input.scheduledAt &&
      (ses.status === "PENDING" || ses.status === "CONFIRMED"),
  );
  if (slotClash) {
    throw new Error("Slot jadwal ini baru saja diambil. Silakan pilih jam lain.");
  }

  const compat = computeCompatibility(s.profile, mentor);
  const newSession: MentorSession = {
    id: `ses_${Date.now().toString(36)}`,
    status: "PENDING",
    scheduledAt: input.scheduledAt,
    durationMinutes: mentor.sessionMinutes,
    topic: input.topic.trim(),
    message: input.message?.trim() ? input.message.trim() : null,
    meetingUrl: null,
    compatibilityScore: compat?.score ?? null,
    cancelReason: null,
    mentor: {
      id: mentor.id,
      username: mentor.username,
      displayName: mentor.displayName,
      avatarUrl: mentor.avatarUrl,
      institution: mentor.institution,
    },
    student: {
      id: "stu_nadia",
      displayName: input.studentName || "Nadia Putri",
      avatarUrl: null,
      educationLevel: s.profile.educationLevel,
    },
    viewerRole: "STUDENT",
    createdAt: new Date().toISOString(),
  };

  saveState({
    ...s,
    activeMentorId: mentor.id,
    sessions: [newSession, ...s.sessions],
  });
  return newSession;
}

export function confirmMentorSession(input: { sessionId: string; meetingUrl: string }): MentorSession {
  const s = loadState();
  const target = s.sessions.find((x) => x.id === input.sessionId);
  if (!target) throw new Error("Sesi tidak ditemukan.");
  if (target.status !== "PENDING") throw new Error("Hanya sesi berstatus Menunggu yang dapat dikonfirmasi.");
  const url = input.meetingUrl.trim();
  if (!/^https?:\/\/[^\s]+\.[^\s]+$/i.test(url)) {
    throw new Error("Masukkan link pertemuan yang valid (diawali https://, mis. Google Meet / Zoom / WA).");
  }
  const updated: MentorSession = { ...target, status: "CONFIRMED", meetingUrl: url };
  saveState({
    ...s,
    sessions: s.sessions.map((x) => (x.id === input.sessionId ? updated : x)),
  });
  return updated;
}

export function declineMentorSession(input: { sessionId: string; reason?: string }): MentorSession {
  const s = loadState();
  const target = s.sessions.find((x) => x.id === input.sessionId);
  if (!target) throw new Error("Sesi tidak ditemukan.");
  if (target.status !== "PENDING") throw new Error("Hanya sesi berstatus Menunggu yang dapat ditolak.");
  const updated: MentorSession = {
    ...target,
    status: "DECLINED",
    cancelReason: input.reason?.trim() || "Jadwal mentor berhalangan pada slot ini.",
  };
  saveState({
    ...s,
    sessions: s.sessions.map((x) => (x.id === input.sessionId ? updated : x)),
  });
  return updated;
}

export function cancelMentorSession(input: { sessionId: string; reason?: string }): MentorSession {
  const s = loadState();
  const target = s.sessions.find((x) => x.id === input.sessionId);
  if (!target) throw new Error("Sesi tidak ditemukan.");
  if (target.status !== "PENDING" && target.status !== "CONFIRMED") {
    throw new Error("Sesi ini tidak dapat dibatalkan.");
  }
  const updated: MentorSession = {
    ...target,
    status: "CANCELED",
    cancelReason: input.reason?.trim() || "Dibatalkan oleh pengguna.",
  };
  saveState({
    ...s,
    sessions: s.sessions.map((x) => (x.id === input.sessionId ? updated : x)),
  });
  return updated;
}

export function completeMentorSession(sessionId: string): MentorSession {
  const s = loadState();
  const target = s.sessions.find((x) => x.id === sessionId);
  if (!target) throw new Error("Sesi tidak ditemukan.");
  if (target.status !== "CONFIRMED") throw new Error("Hanya sesi Dikonfirmasi yang dapat ditandai selesai.");
  const updated: MentorSession = { ...target, status: "COMPLETED" };
  const nextMentors = s.mentors.map((m) =>
    m.id === target.mentor.id ? { ...m, sessionsCompleted: m.sessionsCompleted + 1 } : m,
  );
  saveState({
    ...s,
    mentors: nextMentors,
    sessions: s.sessions.map((x) => (x.id === sessionId ? updated : x)),
  });
  return updated;
}

// ─── Features 1.4 & 1.5: Opportunities & Bookmarks ──────────────────────────

export interface OpportunityFilter {
  kind?: OpportunityKind | "ALL";
  level?: EducationLevel | "";
  q?: string;
  savedOnly?: boolean;
}

export function listPublicOpportunities(filter: OpportunityFilter = {}): OpportunityCard[] {
  const s = loadState();
  const nowMs = Date.now();
  const savedSet = new Set(s.savedOpportunityIds);
  const q = (filter.q ?? "").trim().toLowerCase();

  return s.opportunities
    .filter((o) => o.status === "PUBLISHED")
    .filter((o) => Date.parse(o.deadlineAt) > nowMs) // Auto-hide expired from public listing!
    .filter((o) => (!filter.kind || filter.kind === "ALL" ? true : o.kind === filter.kind))
    .filter((o) => (!filter.level ? true : o.educationLevels.includes(filter.level)))
    .filter((o) => (filter.savedOnly ? savedSet.has(o.id) : true))
    .filter((o) => {
      if (!q) return true;
      const hay = `${o.title} ${o.organizer} ${o.summary} ${o.tags.join(" ")} ${o.location ?? ""}`.toLowerCase();
      return hay.includes(q);
    })
    .map((o) => ({
      id: o.id,
      slug: o.slug,
      kind: o.kind,
      title: o.title,
      organizer: o.organizer,
      summary: o.summary,
      educationLevels: o.educationLevels,
      tags: o.tags,
      location: o.location,
      deadlineAt: o.deadlineAt,
      isVerified: o.isVerified,
      saved: savedSet.has(o.id),
      saveCount: o.saveCount,
      status: o.status,
    }))
    .sort((a, b) => Date.parse(a.deadlineAt) - Date.parse(b.deadlineAt));
}

export function getOpportunityBySlug(slug: string): OpportunityDetail | null {
  const s = loadState();
  const o = s.opportunities.find((x) => x.slug.toLowerCase() === slug.toLowerCase());
  if (!o) return null;
  const saved = s.savedOpportunityIds.includes(o.id);
  return { ...o, saved };
}

export function listSavedOpportunities(): OpportunityCard[] {
  const s = loadState();
  const savedSet = new Set(s.savedOpportunityIds);
  return s.opportunities
    .filter((o) => savedSet.has(o.id))
    .map((o) => ({
      id: o.id,
      slug: o.slug,
      kind: o.kind,
      title: o.title,
      organizer: o.organizer,
      summary: o.summary,
      educationLevels: o.educationLevels,
      tags: o.tags,
      location: o.location,
      deadlineAt: o.deadlineAt,
      isVerified: o.isVerified,
      saved: true,
      saveCount: o.saveCount,
      status: o.status,
    }))
    .sort((a, b) => Date.parse(a.deadlineAt) - Date.parse(b.deadlineAt));
}

export function toggleSaveOpportunity(slugOrId: string): { saved: boolean } {
  const s = loadState();
  const target = s.opportunities.find((o) => o.slug === slugOrId || o.id === slugOrId);
  if (!target) throw new Error("Peluang tidak ditemukan.");
  const already = s.savedOpportunityIds.includes(target.id);
  const nextSavedIds = already
    ? s.savedOpportunityIds.filter((id) => id !== target.id)
    : [target.id, ...s.savedOpportunityIds];
  const nextOpps = s.opportunities.map((o) =>
    o.id === target.id ? { ...o, saveCount: Math.max(0, o.saveCount + (already ? -1 : 1)) } : o,
  );
  saveState({ ...s, savedOpportunityIds: nextSavedIds, opportunities: nextOpps });
  return { saved: !already };
}

// ─── Feature 1.6: Dashboard Counts ──────────────────────────────────────────

export function getEduconnectCounts(): { mentorSessions: number; savedOpportunities: number; pendingSessions: number } {
  const s = loadState();
  const mentorSessions = s.sessions.filter((x) => x.status === "CONFIRMED" || x.status === "COMPLETED").length;
  const pendingSessions = s.sessions.filter((x) => x.status === "PENDING").length;
  const savedOpportunities = s.savedOpportunityIds.length;
  return { mentorSessions, savedOpportunities, pendingSessions };
}

// ─── Features 1.7 & 1.8: Educational KitBox & Impact Tracker ────────────────

export function listKitboxPackages(includeArchived = false): (KitboxPackage & { status: KitboxStatus })[] {
  const s = loadState();
  return s.kitboxPackages.filter((p) => (includeArchived ? true : p.status === "ACTIVE"));
}

export function getKitboxImpact(): KitboxImpact {
  const s = loadState();
  const activeDonations = s.kitboxDonations.filter((d) => d.status !== "REJECTED" && d.status !== "CANCELED");
  const extraItems = activeDonations.reduce((acc, d) => acc + d.quantity, 0);
  const extraDelivered = s.kitboxRequests.filter((r) => r.status === "APPROVED" || r.status === "SHIPPED" || r.status === "DELIVERED").length;

  return {
    itemsDonated: s.baseImpact.itemsDonated + extraItems,
    donors: s.baseImpact.donors + activeDonations.length,
    kitsDelivered: s.baseImpact.kitsDelivered + extraDelivered,
    studentsHelped: s.baseImpact.studentsHelped + extraDelivered,
    recentDonors: activeDonations.slice(0, 6).map((d) => ({
      name: d.isAnonymous ? "Sahabat EduConnect (Anonim)" : d.donorName || "Donatur EduConnect",
      itemType: d.itemType,
      quantity: d.quantity,
      at: d.createdAt,
    })),
  };
}

export function listMyKitboxRequests(): KitboxRequest[] {
  return loadState().kitboxRequests;
}

export function listMyKitboxDonations(): KitboxDonation[] {
  return loadState().kitboxDonations;
}

export function submitKitboxRequest(input: {
  packageId: string;
  recipientName: string;
  phone: string;
  educationLevel: EducationLevel;
  institution?: string;
  shippingAddress: string;
  city: string;
  reason: string;
}): KitboxRequest {
  const s = loadState();
  const pkg = s.kitboxPackages.find((p) => p.id === input.packageId && p.status === "ACTIVE");
  if (!pkg) throw new Error("Paket KitBox tidak ditemukan.");
  if (pkg.stock <= 0) throw new Error("Maaf, stok paket ini sedang habis (OUT_OF_STOCK).");

  const duplicateOpen = s.kitboxRequests.some(
    (r) =>
      r.package.id === pkg.id &&
      (r.status === "SUBMITTED" || r.status === "APPROVED" || r.status === "SHIPPED"),
  );
  if (duplicateOpen) {
    throw new Error("Kamu sudah memiliki pengajuan aktif untuk paket ini (REQUEST_ALREADY_OPEN).");
  }

  const now = new Date().toISOString();
  const req: KitboxRequest = {
    id: `req_${Date.now().toString(36)}`,
    package: { id: pkg.id, name: pkg.name, slug: pkg.slug },
    status: "SUBMITTED",
    recipientName: input.recipientName.trim(),
    phone: input.phone.trim(),
    educationLevel: input.educationLevel,
    institution: input.institution?.trim() || null,
    shippingAddress: input.shippingAddress.trim(),
    city: input.city.trim(),
    reason: input.reason.trim(),
    adminNote: null,
    createdAt: now,
    updatedAt: now,
  };
  saveState({ ...s, kitboxRequests: [req, ...s.kitboxRequests] });
  return req;
}

export function cancelKitboxRequest(requestId: string): KitboxRequest {
  const s = loadState();
  const target = s.kitboxRequests.find((r) => r.id === requestId);
  if (!target) throw new Error("Pengajuan tidak ditemukan.");
  if (target.status !== "SUBMITTED") throw new Error("Hanya pengajuan berstatus Diajukan yang dapat dibatalkan.");
  const updated: KitboxRequest = { ...target, status: "CANCELED", updatedAt: new Date().toISOString() };
  saveState({
    ...s,
    kitboxRequests: s.kitboxRequests.map((r) => (r.id === requestId ? updated : r)),
  });
  return updated;
}

export function submitKitboxDonation(input: {
  donorName: string;
  donorContact: string;
  isAnonymous: boolean;
  itemType: DonationItemType;
  itemDescription: string;
  quantity: number;
  condition: DonationCondition;
  deliveryMethod: DonationDelivery;
  photoUrl?: string | null;
}): KitboxDonation {
  const s = loadState();
  const don: KitboxDonation = {
    id: `don_${Date.now().toString(36)}`,
    donorName: input.donorName.trim(),
    donorContact: input.donorContact.trim(),
    isAnonymous: input.isAnonymous,
    itemType: input.itemType,
    itemDescription: input.itemDescription.trim(),
    quantity: input.quantity,
    condition: input.condition,
    deliveryMethod: input.deliveryMethod,
    status: "PLEDGED",
    adminNote: null,
    photoUrl: input.photoUrl ?? null,
    createdAt: new Date().toISOString(),
  };
  saveState({ ...s, kitboxDonations: [don, ...s.kitboxDonations] });
  return don;
}

export function cancelKitboxDonation(donationId: string): KitboxDonation {
  const s = loadState();
  const target = s.kitboxDonations.find((d) => d.id === donationId);
  if (!target) throw new Error("Donasi tidak ditemukan.");
  if (target.status !== "PLEDGED") throw new Error("Hanya donasi berstatus Menunggu Penyerahan yang dapat dibatalkan.");
  const updated: KitboxDonation = { ...target, status: "CANCELED" };
  saveState({
    ...s,
    kitboxDonations: s.kitboxDonations.map((d) => (d.id === donationId ? updated : d)),
  });
  return updated;
}

// ─── Admin Operations ───────────────────────────────────────────────────────

export function adminListMentors(): StoredMentor[] {
  return loadState().mentors;
}

export function adminUpsertMentor(input: {
  id?: string;
  email: string;
  displayName: string;
  headline: string;
  institution: string;
  major: string;
  bio: string;
  specialties: string[];
  interests: InterestTag[];
  educationLevels: EducationLevel[];
  pricePerSession: number;
  sessionMinutes: number;
  isVerified: boolean;
  isActive: boolean;
}): StoredMentor {
  const s = loadState();
  if (input.id) {
    const nextMentors = s.mentors.map((m) =>
      m.id === input.id
        ? {
            ...m,
            email: input.email.trim(),
            displayName: input.displayName.trim(),
            headline: input.headline.trim(),
            institution: input.institution.trim() || null,
            major: input.major.trim() || null,
            bio: input.bio.trim() || null,
            specialties: input.specialties,
            interests: input.interests,
            educationLevels: input.educationLevels,
            pricePerSession: input.pricePerSession,
            sessionMinutes: input.sessionMinutes,
            isVerified: input.isVerified,
            isActive: input.isActive,
          }
        : m,
    );
    saveState({ ...s, mentors: nextMentors });
    return nextMentors.find((m) => m.id === input.id)!;
  }

  const slugBase = input.displayName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || `mentor-${Date.now()}`;
  const created: StoredMentor = {
    id: `mnt_${Date.now().toString(36)}`,
    username: slugBase,
    email: input.email.trim(),
    displayName: input.displayName.trim(),
    avatarUrl: null,
    headline: input.headline.trim(),
    bio: input.bio.trim() || null,
    institution: input.institution.trim() || null,
    major: input.major.trim() || null,
    specialties: input.specialties,
    interests: input.interests,
    educationLevels: input.educationLevels,
    isVerified: input.isVerified,
    isActive: input.isActive,
    sessionsCompleted: 0,
    pricePerSession: input.pricePerSession,
    sessionMinutes: input.sessionMinutes,
    availability: [
      { weekday: 2, startMinute: 960, endMinute: 1140 },
      { weekday: 5, startMinute: 960, endMinute: 1140 },
    ],
  };
  saveState({ ...s, mentors: [created, ...s.mentors] });
  return created;
}

export function adminListOpportunities(): StoredOpportunity[] {
  return loadState().opportunities;
}

export function adminUpsertOpportunity(input: {
  id?: string;
  title: string;
  slug?: string;
  kind: OpportunityKind;
  organizer: string;
  summary: string;
  description: string;
  requirements: string[];
  benefits: string[];
  educationLevels: EducationLevel[];
  tags: string[];
  location: string;
  registrationUrl: string;
  sourceUrl?: string;
  deadlineAt: string;
  isVerified: boolean;
  status: OpportunityStatus;
}): StoredOpportunity {
  const s = loadState();
  const slug =
    (input.slug ?? input.title)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || `peluang-${Date.now()}`;

  const descHtml = input.description.trim().startsWith("<")
    ? input.description.trim()
    : input.description
        .trim()
        .split(/\n{2,}/)
        .map((p) => `<p>${p}</p>`)
        .join("");

  if (input.id) {
    const next = s.opportunities.map((o) =>
      o.id === input.id
        ? {
            ...o,
            title: input.title.trim(),
            slug,
            kind: input.kind,
            organizer: input.organizer.trim(),
            summary: input.summary.trim(),
            descriptionHtml: descHtml,
            requirements: input.requirements,
            benefits: input.benefits,
            educationLevels: input.educationLevels,
            tags: input.tags,
            location: input.location.trim() || null,
            registrationUrl: input.registrationUrl.trim(),
            sourceUrl: input.sourceUrl?.trim() || null,
            deadlineAt: input.deadlineAt,
            isVerified: input.isVerified,
            status: input.status,
          }
        : o,
    );
    saveState({ ...s, opportunities: next });
    return next.find((o) => o.id === input.id)!;
  }

  const created: StoredOpportunity = {
    id: `opp_${Date.now().toString(36)}`,
    slug,
    kind: input.kind,
    title: input.title.trim(),
    organizer: input.organizer.trim(),
    summary: input.summary.trim(),
    descriptionHtml: descHtml,
    requirements: input.requirements,
    benefits: input.benefits,
    educationLevels: input.educationLevels,
    tags: input.tags,
    location: input.location.trim() || null,
    registrationUrl: input.registrationUrl.trim(),
    sourceUrl: input.sourceUrl?.trim() || null,
    opensAt: new Date().toISOString(),
    deadlineAt: input.deadlineAt,
    isVerified: input.isVerified,
    saveCount: 0,
    status: input.status,
  };
  saveState({ ...s, opportunities: [created, ...s.opportunities] });
  return created;
}

export function adminUpdateKitboxRequestStatus(input: {
  id: string;
  status: KitboxRequestStatus;
  adminNote?: string | null;
}): KitboxRequest {
  const s = loadState();
  const req = s.kitboxRequests.find((r) => r.id === input.id);
  if (!req) throw new Error("Pengajuan tidak ditemukan.");
  const pkg = s.kitboxPackages.find((p) => p.id === req.package.id);

  // Stock rule from CORE_PLAN.md:
  // SUBMITTED -> APPROVED deducts 1 stock (throws OUT_OF_STOCK if 0)
  // APPROVED/SHIPPED -> REJECTED/CANCELED restores 1 stock
  const wasHoldingStock = req.status === "APPROVED" || req.status === "SHIPPED" || req.status === "DELIVERED";
  const willHoldStock = input.status === "APPROVED" || input.status === "SHIPPED" || input.status === "DELIVERED";

  let stockDelta = 0;
  if (!wasHoldingStock && willHoldStock) {
    if (!pkg || pkg.stock <= 0) throw new Error("Stok paket habis (OUT_OF_STOCK). Tidak dapat menyetujui pengajuan.");
    stockDelta = -1;
  } else if (wasHoldingStock && !willHoldStock) {
    stockDelta = 1;
  }

  const nextPackages = s.kitboxPackages.map((p) =>
    p.id === req.package.id ? { ...p, stock: Math.max(0, p.stock + stockDelta) } : p,
  );
  const updated: KitboxRequest = {
    ...req,
    status: input.status,
    adminNote: input.adminNote !== undefined ? input.adminNote : req.adminNote,
    updatedAt: new Date().toISOString(),
  };
  saveState({
    ...s,
    kitboxPackages: nextPackages,
    kitboxRequests: s.kitboxRequests.map((r) => (r.id === input.id ? updated : r)),
  });
  return updated;
}

export function adminUpdateKitboxDonationStatus(input: {
  id: string;
  status: DonationStatus;
  adminNote?: string | null;
}): KitboxDonation {
  const s = loadState();
  const don = s.kitboxDonations.find((d) => d.id === input.id);
  if (!don) throw new Error("Donasi tidak ditemukan.");
  const updated: KitboxDonation = {
    ...don,
    status: input.status,
    adminNote: input.adminNote !== undefined ? input.adminNote : don.adminNote,
  };
  saveState({
    ...s,
    kitboxDonations: s.kitboxDonations.map((d) => (d.id === input.id ? updated : d)),
  });
  return updated;
}

export function adminUpsertKitboxPackage(input: {
  id?: string;
  name: string;
  summary: string;
  contents: string[];
  educationLevels: EducationLevel[];
  stock: number;
  status: KitboxStatus;
}): KitboxPackage & { status: KitboxStatus } {
  const s = loadState();
  const slug =
    input.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || `paket-${Date.now()}`;

  if (input.id) {
    const next = s.kitboxPackages.map((p) =>
      p.id === input.id
        ? {
            ...p,
            name: input.name.trim(),
            slug,
            summary: input.summary.trim(),
            contents: input.contents,
            educationLevels: input.educationLevels,
            stock: Math.max(0, input.stock),
            status: input.status,
          }
        : p,
    );
    saveState({ ...s, kitboxPackages: next });
    return next.find((p) => p.id === input.id)!;
  }

  const created: KitboxPackage & { status: KitboxStatus } = {
    id: `pkg_${Date.now().toString(36)}`,
    slug,
    name: input.name.trim(),
    summary: input.summary.trim(),
    contents: input.contents,
    educationLevels: input.educationLevels,
    stock: Math.max(0, input.stock),
    imageUrl: null,
    status: input.status,
  };
  saveState({ ...s, kitboxPackages: [...s.kitboxPackages, created] });
  return created;
}
