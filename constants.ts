
import { User, UserRole, Student, BehaviorRecord, HealthRecord, ActivityRecord, Meal, AcademicRecord, MaintenanceRequest } from './types';

// Admin Account - The entry point
export const MOCK_USER: User = {
  id: 'admin_main',
  name: 'Aomar Aitloutou',
  role: UserRole.ADMIN,
  avatar: 'https://ui-avatars.com/api/?name=Aomar+Aitloutou&background=10b981&color=fff',
  email: 'aitloutou@morafaka.ma',
  password: '123456A' // Updated password
};

export const MOCK_BURSAR: User = {
  id: 'bursar1',
  name: 'محمد المقتصد',
  role: UserRole.BURSAR,
  avatar: 'https://ui-avatars.com/api/?name=Bursar&background=f59e0b&color=fff',
  email: 'bursar@morafaka.ma',
  password: '123',
  phone: '0661998877'
};

export const MOCK_STUDENTS: Student[] = [
  {
    id: 's1',
    fullName: 'يوسف العمراني',
    gender: 'male',
    grade: 'الأولى باكالوريا',
    academicId: 'K1300254',
    scholarshipNumber: '23001',
    scholarshipType: 'full',
    roomNumber: '101',
    guardianPhone: '0661123456',
    guardianAddress: 'حي السلام، الزنقة 4، الدار البيضاء',
    photoUrl: 'https://picsum.photos/id/1012/200/200'
  },
  {
    id: 's2',
    fullName: 'سارة بناني',
    gender: 'female',
    grade: 'الثانية إعدادي',
    academicId: 'J1440211',
    scholarshipNumber: '23045',
    scholarshipType: 'half',
    roomNumber: '204',
    guardianPhone: '0661987654',
    guardianAddress: 'شارع الحسن الثاني، رقم 12، الرباط',
    photoUrl: 'https://picsum.photos/id/1027/200/200'
  },
  {
    id: 's3',
    fullName: 'كريم التازي',
    gender: 'male',
    grade: 'الجذع المشترك',
    academicId: 'D1399872',
    scholarshipNumber: '',
    scholarshipType: 'lunch',
    roomNumber: '102',
    guardianPhone: '0661555555',
    guardianAddress: 'حي الهدى، أكادير',
    photoUrl: 'https://picsum.photos/id/1005/200/200'
  }
];

export const MOCK_BEHAVIOR: BehaviorRecord[] = [
  {
    id: 'b1',
    studentId: 's1',
    type: 'positive',
    category: 'interaction',
    description: 'مساعدة زميل في واجبات الرياضيات',
    date: '2023-10-25',
    reporter: 'المشرف حسن'
  },
  {
    id: 'b2',
    studentId: 's1',
    type: 'negative',
    category: 'discipline',
    description: 'التأخر عن موعد النوم بـ 15 دقيقة',
    date: '2023-10-26',
    reporter: 'المشرف حسن'
  },
  {
    id: 'b3',
    studentId: 's2',
    type: 'positive',
    category: 'hygiene',
    description: 'ترتيب الغرفة بشكل ممتاز',
    date: '2023-10-27',
    reporter: 'المشرفة ليلى'
  }
];

export const MOCK_HEALTH: HealthRecord[] = [
  {
    id: 'h1',
    studentId: 's1',
    condition: 'حساسية موسمية',
    medication: 'Loratadine',
    notes: 'يجب أخذ الدواء قبل النوم عند الحاجة',
    date: '2023-09-10',
    severity: 'low'
  },
  {
    id: 'h2',
    studentId: 's3',
    condition: 'زكام حاد',
    medication: 'Paracetamol',
    notes: 'راحة لمدة يومين',
    date: '2023-10-28',
    severity: 'medium'
  }
];

export const MOCK_ACTIVITIES: ActivityRecord[] = [
  {
    id: 'a1',
    title: 'دوري كرة القدم المصغر',
    type: 'sport',
    date: '2023-11-15',
    time: '16:00',
    location: 'الملعب الرياضي',
    organizer: 'النادي الرياضي',
    description: 'دوري سنوي بين طوابق الداخلية لتعزيز الروح الرياضية.',
    status: 'upcoming',
    participantsCount: 40
  },
  {
    id: 'a2',
    title: 'أمسية دينية (تجويد القرآن)',
    type: 'religious',
    date: '2023-11-10',
    time: '19:30',
    location: 'قاعة الصلاة',
    organizer: 'جمعية التربية الإسلامية',
    description: 'مسابقة في تجويد القرآن الكريم بمناسبة ذكرى المولد النبوي.',
    status: 'completed',
    participantsCount: 25
  },
  {
    id: 'a3',
    title: 'ورشة الدعم النفسي والتحضير للامتحانات',
    type: 'educational',
    date: '2023-11-20',
    time: '15:00',
    location: 'قاعة المطالعة',
    organizer: 'المستشار في التوجيه',
    description: 'تقنيات التعامل مع قلق الامتحانات وتنظيم الوقت.',
    status: 'upcoming',
    participantsCount: 60
  }
];

export const MOCK_ACADEMICS: AcademicRecord[] = [
  {
    id: 'ar1',
    studentId: 's1', // Youssef (1st Bac)
    semester: 'S1',
    schoolYear: '2025/2026',
    generalAverage: 15.5,
    rank: 3,
    appreciation: 'حسن',
    teacherDecision: 'ينتقل',
    subjects: [
      { subjectName: 'الرياضيات', grade: 16, coefficient: 4 },
      { subjectName: 'الفيزياء', grade: 14.5, coefficient: 4 },
      { subjectName: 'العربية', grade: 17, coefficient: 2 },
      { subjectName: 'الفرنسية', grade: 15, coefficient: 3 }
    ]
  },
  {
    id: 'ar2',
    studentId: 's2', // Sara (2nd Prep)
    semester: 'S1',
    schoolYear: '2025/2026',
    generalAverage: 18.2,
    rank: 1,
    appreciation: 'ممتاز',
    teacherDecision: 'تنتقل بتنويه',
    subjects: [
      { subjectName: 'الرياضيات', grade: 19, coefficient: 4 },
      { subjectName: 'الفيزياء', grade: 18, coefficient: 2 },
      { subjectName: 'العربية', grade: 17, coefficient: 2 },
      { subjectName: 'الفرنسية', grade: 18.5, coefficient: 3 }
    ]
  }
];

export const MOCK_MAINTENANCE: MaintenanceRequest[] = [
  {
    id: 'm1',
    title: 'تسرب في صنبور الحمام',
    type: 'plumbing',
    location: 'الجناح أ - الطابق 2',
    description: 'صنبور المياه في المغسلة رقم 3 يسرب الماء بشكل مستمر.',
    priority: 'medium',
    status: 'pending',
    dateReported: '2023-11-10',
    reporterName: 'سعيد المراقب'
  },
  {
    id: 'm2',
    title: 'استبدال مصابيح الرواق',
    type: 'electricity',
    location: 'الممر الرئيسي - الجناح ب',
    description: 'ثلاثة مصابيح معطلة تحتاج لاستبدال لضمان الإضاءة ليلاً.',
    priority: 'high',
    status: 'in_progress',
    dateReported: '2023-11-08',
    reporterName: 'الحارس الليلي'
  },
  {
    id: 'm3',
    title: 'نقص مواد التنظيف',
    type: 'equipment',
    location: 'مخزن النظافة',
    description: 'نحتاج لتزويد المخزن بماء جافيل ومسحوق الغسيل.',
    priority: 'low',
    status: 'completed',
    dateReported: '2023-11-01',
    reporterName: 'مسؤول النظافة'
  }
];

// Dining Constants
export const INITIAL_MEALS_AR: Meal[] = [
  { id: '1', day: 'الإثنين', breakfast: 'خبز + زبدة + مربى + شاي', lunch: 'طاجين باللحم والبرقوق + سلطة', dinner: 'حساء الخضر + ياغورت' },
  { id: '2', day: 'الثلاثاء', breakfast: 'حرشة + جبن + حليب', lunch: 'عدس + سمك مقلي + فواكه', dinner: 'معكرونة بالصلصة البيضاء' },
  { id: '3', day: 'الأربعاء', breakfast: 'خبز + زيت زيتون + شاي', lunch: 'كسكس بالخضر والدجاج', dinner: 'أرز بالحليب + بيض مسلوق' },
  { id: '4', day: 'الخميس', breakfast: 'مسمن + عسل + قهوة', lunch: 'دجاج محمر + بطاطس مقلية', dinner: 'شربة حريرة + تمر' },
  { id: '5', day: 'الجمعة', breakfast: 'خبز + شكولاتة + حليب', lunch: 'سمك طاجين + أرز', dinner: 'بيتزا + عصير' },
  { id: '6', day: 'السبت', breakfast: 'بغرير + عسل + شاي', lunch: 'لوبيا بيضاء + نقانق', dinner: 'سندويتشات متنوعة' },
  { id: '7', day: 'الأحد', breakfast: 'كرواسون + عصير', lunch: 'لحم مشوي + خضر مبخرة', dinner: 'حساء الشعير + جبن' }
];

export const INITIAL_MEALS_FR: Meal[] = [
  { id: '1', day: 'Lundi', breakfast: 'Pain + Beurre + Confiture + Thé', lunch: 'Tajine de viande aux pruneaux + Salade', dinner: 'Soupe de légumes + Yaourt' },
  { id: '2', day: 'Mardi', breakfast: 'Harcha + Fromage + Lait', lunch: 'Lentilles + Poisson frit + Fruits', dinner: 'Pâtes à la sauce blanche' },
  { id: '3', day: 'Mercredi', breakfast: 'Pain + Huile d\'olive + Thé', lunch: 'Couscous au poulet et légumes', dinner: 'Riz au lait + Œuf dur' },
  { id: '4', day: 'Jeudi', breakfast: 'Msemen + Miel + Café', lunch: 'Poulet rôti + Frites', dinner: 'Soupe Harira + Dattes' },
  { id: '5', day: 'Vendredi', breakfast: 'Pain + Chocolat + Lait', lunch: 'Tajine de poisson + Riz', dinner: 'Pizza + Jus' },
  { id: '6', day: 'Samedi', breakfast: 'Baghrir + Miel + Thé', lunch: 'Haricots blancs + Saucisses', dinner: 'Sandwichs variés' },
  { id: '7', day: 'Dimanche', breakfast: 'Croissant + Jus', lunch: 'Viande grillée + Légumes vapeur', dinner: 'Soupe d\'orge + Fromage' }
];

export const INITIAL_RAMADAN_AR: Meal[] = [
  { id: '1', day: 'الإثنين', ftour: 'حريرة + تمر + شباكية + عصير + بيض', dinner: 'طاجين كفتة', suhoor: 'ياغورت + فواكه + ماء' },
  { id: '2', day: 'الثلاثاء', ftour: 'حساء السميد + تمر + بريوات + حليب', dinner: 'دجاج بالفرن', suhoor: 'رايب + خبز' },
  { id: '3', day: 'الأربعاء', ftour: 'حريرة + تمر + بيتزا صغيرة + قهوة', dinner: 'سمك في الفرن', suhoor: 'سلو + حليب' },
  { id: '4', day: 'الخميس', ftour: 'حساء الشعير + تمر + مسمن معمر', dinner: 'شواء (لحم)', suhoor: 'فلو + تمر' },
  { id: '5', day: 'الجمعة', ftour: 'حريرة + تمر + شباكية + عصير', dinner: 'كسكس (خفيف)', suhoor: 'ياغورت + كعك' },
  { id: '6', day: 'السبت', ftour: 'شربة خضار + تمر + بطبوط معمر', dinner: 'معكرونة بالكفتة', suhoor: 'جبن + فواكه جافة' },
  { id: '7', day: 'الأحد', ftour: 'حريرة + تمر + كرواسون + حليب', dinner: 'طاجين دجاج', suhoor: 'رايب + تمر' }
];

export const INITIAL_RAMADAN_FR: Meal[] = [
  { id: '1', day: 'Lundi', ftour: 'Harira + Dattes + Chebakia + Jus + Oeufs', dinner: 'Tajine Kefta', suhoor: 'Yaourt + Fruits' },
  { id: '2', day: 'Mardi', ftour: 'Soupe Semoule + Dattes + Briouates + Lait', dinner: 'Poulet au four', suhoor: 'Raib + Pain' },
  { id: '3', day: 'Mercredi', ftour: 'Harira + Dattes + Mini Pizza + Café', dinner: 'Poisson au four', suhoor: 'Sellou + Lait' },
  { id: '4', day: 'Jeudi', ftour: 'Soupe Orge + Dattes + Msemen farci', dinner: 'Grillade (Viande)', suhoor: 'Flan + Dattes' },
  { id: '5', day: 'Vendredi', ftour: 'Harira + Dattes + Chebakia + Jus', dinner: 'Couscous (Léger)', suhoor: 'Yaourt + Gâteaux' },
  { id: '6', day: 'Samedi', ftour: 'Soupe Légumes + Dattes + Batbout farci', dinner: 'Pâtes Bolognaise', suhoor: 'Fromage + Fruits secs' },
  { id: '7', day: 'Dimanche', ftour: 'Harira + Dattes + Croissant + Lait', dinner: 'Tajine Poulet', suhoor: 'Raib + Dattes' }
];
