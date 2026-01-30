
import { User, UserRole, Student, BehaviorRecord, HealthRecord, ActivityRecord, Meal, AcademicRecord, MaintenanceRequest, AttendanceRecord } from './types';

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
  { id: 's1', fullName: 'يوسف العمراني', gender: 'male', grade: 'الأولى باكالوريا', academicId: 'K1300254', scholarshipNumber: '23001', scholarshipType: 'full', roomNumber: '101', guardianPhone: '0661123456', guardianAddress: 'حي السلام، الدار البيضاء', photoUrl: 'https://picsum.photos/id/1012/200/200' },
  { id: 's2', fullName: 'سارة بناني', gender: 'female', grade: 'الثانية إعدادي', academicId: 'J1440211', scholarshipNumber: '23045', scholarshipType: 'half', roomNumber: '204', guardianPhone: '0661987654', guardianAddress: 'شارع الحسن الثاني، الرباط', photoUrl: 'https://picsum.photos/id/1027/200/200' },
  { id: 's3', fullName: 'كريم التازي', gender: 'male', grade: 'الجذع المشترك', academicId: 'D1399872', scholarshipNumber: '', scholarshipType: 'lunch', roomNumber: '102', guardianPhone: '0661555555', guardianAddress: 'حي الهدى، أكادير', photoUrl: 'https://picsum.photos/id/1005/200/200' },
  { id: 's4', fullName: 'ليلى العلمي', gender: 'female', grade: 'الأولى باكالوريا', academicId: 'G1300982', scholarshipNumber: '23088', scholarshipType: 'full', roomNumber: '201', guardianPhone: '0661223344', guardianAddress: 'حي الرياض، فاس', photoUrl: 'https://picsum.photos/id/1025/200/200' },
  { id: 's5', fullName: 'أحمد الإدريسي', gender: 'male', grade: 'الثالثة إعدادي', academicId: 'M1455210', scholarshipNumber: '23012', scholarshipType: 'full', roomNumber: '105', guardianPhone: '0661334455', guardianAddress: 'وسط المدينة، طنجة', photoUrl: 'https://picsum.photos/id/1006/200/200' },
  { id: 's6', fullName: 'خديجة منصور', gender: 'female', grade: 'الثانية باكالوريا', academicId: 'P1322451', scholarshipNumber: '23055', scholarshipType: 'full', roomNumber: '205', guardianPhone: '0661445566', guardianAddress: 'حي النرجس، مراكش', photoUrl: 'https://picsum.photos/id/1011/200/200' },
  { id: 's7', fullName: 'محمد الصنهاجي', gender: 'male', grade: 'الثالثة إعدادي', academicId: 'F1288344', scholarshipNumber: '', scholarshipType: 'lunch', roomNumber: '106', guardianPhone: '0661667788', guardianAddress: 'حي المحمدي، وجدة', photoUrl: 'https://picsum.photos/id/1003/200/200' },
  { id: 's8', fullName: 'مريم التازي', gender: 'female', grade: 'الجذع المشترك', academicId: 'S1344219', scholarshipNumber: '23099', scholarshipType: 'half', roomNumber: '202', guardianPhone: '0661778899', guardianAddress: 'شارع الجيش الملكي، مكناس', photoUrl: 'https://picsum.photos/id/1021/200/200' }
];

export const MOCK_BEHAVIOR: BehaviorRecord[] = [
  { id: 'b1', studentId: 's1', type: 'positive', category: 'interaction', description: 'مساعدة زميل في واجبات الرياضيات', date: '2023-10-25', reporter: 'المشرف حسن' },
  { id: 'b2', studentId: 's1', type: 'negative', category: 'discipline', description: 'التأخر عن موعد النوم بـ 15 دقيقة', date: '2023-10-26', reporter: 'المشرف حسن' },
  { id: 'b3', studentId: 's2', type: 'positive', category: 'hygiene', description: 'ترتيب الغرفة بشكل ممتاز', date: '2023-10-27', reporter: 'المشرفة ليلى' },
  { id: 'b4', studentId: 's4', type: 'positive', category: 'interaction', description: 'المشاركة الفعالة في الأنشطة الموازية', date: '2023-10-28', reporter: 'المشرف كمال' },
  { id: 'b5', studentId: 's5', type: 'negative', category: 'discipline', description: 'استعمال الهاتف في وقت الدراسة', date: '2023-10-29', reporter: 'المشرف حسن' },
  { id: 'b6', studentId: 's6', type: 'positive', category: 'hygiene', description: 'المحافظة على نظافة المرافق المشتركة', date: '2023-10-30', reporter: 'المشرفة ليلى' },
  { id: 'b7', studentId: 's7', type: 'negative', category: 'interaction', description: 'نقاش حاد مع زميل في المطعم', date: '2023-11-01', reporter: 'المشرف كمال' },
  { id: 'b8', studentId: 's8', type: 'positive', category: 'discipline', description: 'الالتزام التام بجدول الأوقات الجديد', date: '2023-11-02', reporter: 'المشرف حسن' },
  { id: 'b9', studentId: 's1', type: 'positive', category: 'hygiene', description: 'المساهمة في حملة تنظيف الساحة', date: '2023-11-03', reporter: 'المشرفة ليلى' },
  { id: 'b10', studentId: 's2', type: 'positive', category: 'interaction', description: 'مبادرة لتنظيم مكتبة الجناح', date: '2023-11-04', reporter: 'المشرف حسن' }
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
  { id: 'ar1', studentId: 's1', semester: 'S1', schoolYear: '2025/2026', generalAverage: 15.5, rank: 3, appreciation: 'حسن', teacherDecision: 'ينتقل', subjects: [{ subjectName: 'الرياضيات', grade: 16, coefficient: 4 }, { subjectName: 'الفيزياء', grade: 14.5, coefficient: 4 }, { subjectName: 'العربية', grade: 17, coefficient: 2 }, { subjectName: 'الفرنسية', grade: 15, coefficient: 3 }] },
  { id: 'ar2', studentId: 's2', semester: 'S1', schoolYear: '2025/2026', generalAverage: 18.2, rank: 1, appreciation: 'ممتاز', teacherDecision: 'تنتقل بتنويه', subjects: [{ subjectName: 'الرياضيات', grade: 19, coefficient: 4 }, { subjectName: 'الفيزياء', grade: 18, coefficient: 2 }, { subjectName: 'العربية', grade: 17, coefficient: 2 }, { subjectName: 'الفرنسية', grade: 18.5, coefficient: 3 }] },
  { id: 'ar3', studentId: 's3', semester: 'S1', schoolYear: '2025/2026', generalAverage: 12.4, rank: 15, appreciation: 'مستحسن', teacherDecision: 'ينتقل', subjects: [{ subjectName: 'الرياضيات', grade: 11, coefficient: 4 }, { subjectName: 'الفيزياء', grade: 12, coefficient: 4 }, { subjectName: 'العربية', grade: 14, coefficient: 2 }, { subjectName: 'الفرنسية', grade: 13, coefficient: 3 }] },
  { id: 'ar4', studentId: 's4', semester: 'S1', schoolYear: '2025/2026', generalAverage: 16.8, rank: 2, appreciation: 'حسن جدا', teacherDecision: 'تنتقل', subjects: [{ subjectName: 'الرياضيات', grade: 17, coefficient: 4 }, { subjectName: 'الفيزياء', grade: 16.5, coefficient: 4 }, { subjectName: 'العربية', grade: 16, coefficient: 2 }, { subjectName: 'الفرنسية', grade: 18, coefficient: 3 }] },
  { id: 'ar5', studentId: 's5', semester: 'S1', schoolYear: '2025/2026', generalAverage: 9.75, rank: 25, appreciation: 'متوسط', teacherDecision: 'يكرر', subjects: [{ subjectName: 'الرياضيات', grade: 8, coefficient: 4 }, { subjectName: 'الفيزياء', grade: 9, coefficient: 2 }, { subjectName: 'العربية', grade: 12, coefficient: 2 }, { subjectName: 'الفرنسية', grade: 10, coefficient: 3 }] },
  { id: 'ar6', studentId: 's6', semester: 'S1', schoolYear: '2025/2026', generalAverage: 14.2, rank: 8, appreciation: 'حسن', teacherDecision: 'تنتقل', subjects: [{ subjectName: 'الرياضيات', grade: 13, coefficient: 4 }, { subjectName: 'الفيزياء', grade: 14, coefficient: 3 }, { subjectName: 'العربية', grade: 15, coefficient: 2 }, { subjectName: 'الفرنسية', grade: 16, coefficient: 2 }] },
  { id: 'ar7', studentId: 's7', semester: 'S1', schoolYear: '2025/2026', generalAverage: 11.5, rank: 18, appreciation: 'مستحسن', teacherDecision: 'ينتقل', subjects: [{ subjectName: 'الرياضيات', grade: 10, coefficient: 4 }, { subjectName: 'الفيزياء', grade: 11, coefficient: 2 }, { subjectName: 'العربية', grade: 13, coefficient: 2 }, { subjectName: 'الفرنسية', grade: 12, coefficient: 3 }] },
  { id: 'ar8', studentId: 's8', semester: 'S1', schoolYear: '2025/2026', generalAverage: 15.9, rank: 4, appreciation: 'حسن', teacherDecision: 'تنتقل', subjects: [{ subjectName: 'الرياضيات', grade: 15, coefficient: 4 }, { subjectName: 'الفيزياء', grade: 16, coefficient: 4 }, { subjectName: 'العربية', grade: 17, coefficient: 2 }, { subjectName: 'الفرنسية', grade: 15, coefficient: 3 }] }
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

export const MOCK_ATTENDANCE: AttendanceRecord[] = [
  // Sunday (assuming today is Friday or Saturday for demo purposes)
  { id: 'att1', studentId: 's1', date: '2026-01-25', status: 'present', type: 'study' },
  { id: 'att2', studentId: 's2', date: '2026-01-25', status: 'present', type: 'study' },
  { id: 'att3', studentId: 's3', date: '2026-01-25', status: 'absent', type: 'study' },
  // Monday
  { id: 'att4', studentId: 's1', date: '2026-01-26', status: 'present', type: 'study' },
  { id: 'att5', studentId: 's2', date: '2026-01-26', status: 'present', type: 'study' },
  { id: 'att6', studentId: 's3', date: '2026-01-26', status: 'present', type: 'study' },
  // Tuesday
  { id: 'att7', studentId: 's1', date: '2026-01-27', status: 'present', type: 'study' },
  { id: 'att8', studentId: 's2', date: '2026-01-27', status: 'late', type: 'study' },
  { id: 'att9', studentId: 's3', date: '2026-01-27', status: 'present', type: 'study' },
  // Wednesday
  { id: 'att10', studentId: 's1', date: '2026-01-28', status: 'absent', type: 'study' },
  { id: 'att11', studentId: 's2', date: '2026-01-28', status: 'present', type: 'study' },
  { id: 'att12', studentId: 's3', date: '2026-01-28', status: 'present', type: 'study' },
  // Thursday
  { id: 'att13', studentId: 's1', date: '2026-01-29', status: 'present', type: 'study' },
  { id: 'att14', studentId: 's2', date: '2026-01-29', status: 'present', type: 'study' },
  { id: 'att15', studentId: 's3', date: '2026-01-29', status: 'present', type: 'study' },
  // Friday (Today 2026-01-30)
  { id: 'att16', studentId: 's1', date: '2026-01-30', status: 'present', type: 'study' },
  { id: 'att17', studentId: 's2', date: '2026-01-30', status: 'present', type: 'study' },
  { id: 'att18', studentId: 's3', date: '2026-01-30', status: 'late', type: 'study' },
];
