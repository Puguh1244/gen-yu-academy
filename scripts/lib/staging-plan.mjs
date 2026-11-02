import { randomUUID } from "node:crypto";
import { schoolContent } from "./editorial.mjs";
export const testIdentities = [
  {
    key: "parent1",
    email: "rahaya@genyuparent.id",
    name: "Rahaya — Parent 1 (Test)",
    role: "parent",
  },
  {
    key: "parent2",
    email: "nabila@genyuparent.id",
    name: "Nabila — Parent 2 (Test)",
    role: "parent",
  },
  {
    key: "teacher",
    email: "rahayu@genyuteacher.id",
    name: "Ms Rahayu — Teacher (Test)",
    role: "teacher",
  },
  {
    key: "admin",
    email: "rahayu@genyuadmin.id",
    name: "Rahayu — Admin (Test)",
    role: "admin",
  },
];
export function createSeedPlan(users, now = new Date()) {
  const uuid = () => randomUUID(),
    future = (days) => new Date(now.getTime() + days * 86400000).toISOString();
  const classNames = [
    ["T1", "Toddler"],
    ["PG1", "Playgroup"],
    ["PK1", "Pre-Kindergarten"],
    ["K2A", "Kindergarten"],
    ["K2B", "Kindergarten"],
  ];
  const classes = classNames.map(([name, programme]) => ({
    id: uuid(),
    name,
    programme,
  }));
  const families = [
    { id: uuid(), name: "Family Rahaya (Fictional)" },
    { id: uuid(), name: "Family Nabila (Fictional)" },
  ];
  const students = [
    {
      id: uuid(),
      name: "Alya (Fictional)",
      class_id: classes[3].id,
      family_id: families[0].id,
    },
    {
      id: uuid(),
      name: "Nara (Fictional)",
      class_id: classes[4].id,
      family_id: families[1].id,
    },
  ];
  const profiles = testIdentities.map((u) => ({
    id: users[u.key],
    display_name: u.name,
    role: u.role,
    active: true,
  }));
  const guardians = students.map((s, i) => ({
    student_id: s.id,
    parent_id: users["parent" + (i + 1)],
  }));
  const teaching_assignments = [
    { class_id: classes[3].id, teacher_id: users.teacher },
  ];
  const assignments = [
    {
      id: uuid(),
      class_id: classes[3].id,
      title: "Demo: My Independent Morning",
      title_id: "Demo: Pagi Mandiriku",
      body: "Choose a morning routine, try with support and share what happened.",
      body_id:
        "Pilih rutinitas pagi, coba dengan bantuan, lalu ceritakan hasilnya.",
      goals: "Practise self-care and explain an action.",
      goals_id: "Berlatih merawat diri dan menjelaskan tindakan.",
      materials: "A bag, a large picture label and a water bottle.",
      materials_id: "Tas, label gambar besar, dan botol minum.",
      parent_role: "Offer two choices, allow time and help when asked.",
      parent_role_id:
        "Tawarkan dua pilihan, beri waktu, dan bantu saat diminta.",
      expected_result:
        "A short note or picture of the routine, without real child data.",
      expected_result_id:
        "Catatan atau gambar rutinitas, tanpa data anak asli.",
      published_at: future(-1),
      due_at: future(7),
      allow_late: true,
      created_by: users.teacher,
    },
  ];
  const progress_reports = [
    {
      id: uuid(),
      student_id: students[0].id,
      title: "Demo: Caring for Shared Materials",
      title_id: "Demo: Merawat Bahan Bersama",
      body: "Alya returned blocks and invited a friend to help. Fictional observation for demonstration.",
      body_id:
        "Alya mengembalikan balok dan mengajak teman membantu. Pengamatan fiktif untuk demonstrasi.",
      published: true,
      created_by: users.teacher,
      achievement: "Explained where materials belong.",
      achievement_id: "Menjelaskan tempat menyimpan bahan.",
      support: "A picture label and one reminder.",
      support_id: "Label gambar dan satu pengingat.",
      home_activity: "Invite one small tidying task.",
      home_activity_id: "Ajak merapikan satu kelompok kecil benda.",
    },
    {
      id: uuid(),
      student_id: students[0].id,
      title: "Teacher draft — not shared",
      title_id: "Draf guru — belum dibagikan",
      body: "Fictional draft observation.",
      body_id: "Draf pengamatan fiktif.",
      published: false,
      created_by: users.teacher,
    },
  ];
  const invoices = students.map((s, i) => ({
    id: uuid(),
    student_id: s.id,
    invoice_number: `DEMO-2027-00${i + 1}`,
    title: "Demonstration learning contribution",
    title_id: "Kontribusi belajar demonstrasi",
    fee_type: "Demo tuition",
    period: "January 2027 — fictional",
    amount: 100000 + i * 50000,
    paid: 0,
    due_on: future(10).slice(0, 10),
    instructions:
      "TEST ONLY. Do not transfer money. Upload a fictional receipt for the verification exercise.",
    instructions_id:
      "KHUSUS UJI. Jangan transfer uang. Unggah bukti fiktif untuk latihan verifikasi.",
    created_by: users.admin,
  }));
  const announcements = [
    {
      id: uuid(),
      title: "Demo semester information",
      title_id: "Informasi semester demo",
      body: "The January–June 2027 calendar is a fictional academic-project schedule, not an operating-school timetable.",
      body_id:
        "Kalender Januari–Juni 2027 merupakan jadwal fiktif proyek kuliah, bukan jadwal operasional sekolah.",
      audience: "public",
      requires_ack: false,
      created_by: users.admin,
    },
    {
      id: uuid(),
      title: "Demo K2A family reminder",
      title_id: "Pengingat keluarga K2A demo",
      body: "Please read the weekly activity and confirm that you have received this class notice.",
      body_id:
        "Silakan baca kegiatan mingguan dan konfirmasi penerimaan informasi kelas.",
      audience: "class",
      class_id: classes[3].id,
      requires_ack: true,
      response_due: future(7),
      created_by: users.admin,
    },
  ];
  const months = [
    ["01-11", "Welcome and settling in", "Penyambutan dan adaptasi"],
    ["02-12", "Little Explorers Garden Day", "Hari Kebun Little Explorers"],
    ["03-12", "STEAM Bridge Workshop", "Lokakarya Jembatan STEAM"],
    ["04-16", "Stories and Friendship", "Cerita dan Persahabatan"],
    ["05-14", "Caring Leaders Showcase", "Pameran Pemimpin Peduli"],
    ["06-18", "Family Reflection Day", "Hari Refleksi Keluarga"],
  ];
  const events = months.map(([day, title, title_id]) => ({
    id: uuid(),
    title: "Demo: " + title,
    title_id: "Demo: " + title_id,
    body: "Fictional semester event. Families and children explore and reflect together; all arrangements are for testing only.",
    body_id:
      "Acara semester fiktif. Keluarga dan anak menjelajah serta berefleksi bersama; seluruh pengaturan hanya untuk uji.",
    starts_at: `2027-${day}T02:00:00Z`,
    ends_at: `2027-${day}T04:00:00Z`,
    arrival_at: `2027-${day}T01:45:00Z`,
    location: "Demonstration campus — unconfirmed",
    preparation: "Bring labelled belongings in this fictional scenario.",
    preparation_id: "Bawa perlengkapan berlabel dalam skenario fiktif ini.",
    parent_required: true,
    audience: "all",
    scope_kind: "family",
    response_due: future(7),
    created_by: users.admin,
  }));
  const class_schedule = [];
  const routine = [
    [
      "01:00",
      "01:30",
      "Welcome and Choice Play",
      "Penyambutan dan Bermain Pilihan",
    ],
    ["01:30", "02:00", "Stories and Circle Time", "Cerita dan Lingkar Kelas"],
    ["02:00", "02:45", "Explore and Create", "Eksplorasi dan Berkarya"],
    ["02:45", "03:15", "Snack and Self Care", "Makan dan Perawatan Diri"],
    ["03:15", "03:45", "Movement and Garden Play", "Gerak dan Bermain Kebun"],
    ["03:45", "04:00", "Reflection and Goodbye", "Refleksi dan Pulang"],
  ];
  // A complete fictional semester of weekday routines, five classes. No official holidays are asserted.
  for (
    let d = new Date("2027-01-11T00:00:00Z");
    d <= new Date("2027-06-18T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + 1)
  ) {
    if ([0, 6].includes(d.getUTCDay())) continue;
    for (const c of classes)
      for (const [start, end, title, title_id] of routine) {
        const day = d.toISOString().slice(0, 10);
        class_schedule.push({
          id: uuid(),
          class_id: c.id,
          title: "Demo: " + title,
          title_id: "Demo: " + title_id,
          body: `Fictional ${c.programme} routine; duration and support must be adapted and approved by the school.`,
          body_id: `Rutinitas ${c.programme} fiktif; durasi dan pendampingan perlu disesuaikan serta disahkan sekolah.`,
          starts_at: day + "T" + start + ":00Z",
          ends_at: day + "T" + end + ":00Z",
          created_by: users.teacher,
        });
      }
  }
  const school_content = [
    ...schoolContent.articles.map((a) => ({
      id: uuid(),
      kind: "article",
      title: a.title[0],
      title_id: a.title[1],
      summary: a.summary[0],
      summary_id: a.summary[1],
      body: a.paragraphs.map((p) => p[0]).join("\n\n"),
      body_id: a.paragraphs.map((p) => p[1]).join("\n\n"),
    })),
    ...schoolContent.teachers.map((t) => ({
      id: uuid(),
      kind: "teacher",
      title: t.name + " (Fictional)",
      title_id: t.name + " (Fiktif)",
      summary: t.className,
      summary_id: t.className,
      body: t.approach[0],
      body_id: t.approach[1],
      metadata: {
        role: t.role[0],
        role_id: t.role[1],
        qualifications: t.qualification[0],
        qualifications_id: t.qualification[1],
        class_name: t.className,
        fictional: true,
      },
    })),
    {
      id: uuid(),
      kind: "news",
      class_id: classes[3].id,
      title: "Demo: K2A Builds a Bridge Together",
      title_id: "Demo: K2A Membangun Jembatan Bersama",
      summary: "A fictional classroom story celebrating cooperation.",
      summary_id: "Cerita kelas fiktif yang mengapresiasi kerja sama.",
      body: "In this demonstration story, K2A children share blocks, test a bridge and explain their ideas. The class celebrates listening and perseverance. This is not a claim of a real award or competition result.",
      body_id:
        "Dalam cerita demonstrasi ini, anak K2A berbagi balok, menguji jembatan, dan menjelaskan gagasan. Kelas mengapresiasi mendengarkan dan ketekunan. Ini bukan klaim penghargaan atau hasil lomba nyata.",
    },
  ].map((c) => ({
    ...c,
    status: "published",
    verified: true,
    photo_permission: false,
    created_by: users.admin,
    published_at: now.toISOString(),
  }));
  return {
    classes,
    families,
    students,
    profiles,
    guardians,
    teaching_assignments,
    assignments,
    progress_reports,
    invoices,
    announcements,
    events,
    class_schedule,
    school_content,
  };
}
