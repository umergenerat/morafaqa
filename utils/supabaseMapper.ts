
import {
    Student,
    User,
    BehaviorRecord,
    HealthRecord,
    AttendanceRecord,
    ExitRecord,
    ActivityRecord,
    AcademicRecord,
    MaintenanceRequest,
    WeeklyMenus,
    SchoolSettings
} from '../types';

/**
 * UTILITIES
 */
const toSnakeCase = (str: string) => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
const toCamelCase = (str: string) => str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());

const mapKeys = (obj: any, fn: (key: string) => string): any => {
    if (Array.isArray(obj)) return obj.map(v => mapKeys(v, fn));
    if (obj && typeof obj === 'object') {
        return Object.keys(obj).reduce((res, key) => {
            res[fn(key)] = mapKeys(obj[key], fn);
            return res;
        }, {} as any);
    }
    return obj;
};

// Generic Auto-Mappers (Use with caution, usually safer to be explicit)
export const toSupabaseGeneric = (data: any) => mapKeys(data, toSnakeCase);
export const fromSupabaseGeneric = (data: any) => mapKeys(data, toCamelCase);

/**
 * EXPLICIT MAPPERS
 * These ensure we only map what we expect and handle special cases if needed.
 */

// STUDENT
export const studentToDb = (s: Student) => ({
    id: s.id,
    full_name: s.fullName,
    gender: s.gender,
    academic_id: s.academicId,
    grade: s.grade,
    scholarship_number: s.scholarshipNumber,
    scholarship_type: s.scholarshipType,
    room_number: s.roomNumber,
    guardian_phone: s.guardianPhone,
    guardian_address: s.guardianAddress,
    guardian_id: s.guardianId,
    photo_url: s.photoUrl,
    school_year: s.schoolYear
});

export const studentFromDb = (s: any): Student => ({
    id: s.id,
    fullName: s.full_name || s.fullName, // Fallback if already camelCase
    gender: s.gender,
    academicId: s.academic_id || s.academicId,
    grade: s.grade,
    scholarshipNumber: s.scholarship_number || s.scholarshipNumber,
    scholarshipType: s.scholarship_type || s.scholarshipType,
    roomNumber: s.room_number || s.roomNumber,
    guardianPhone: s.guardian_phone || s.guardianPhone,
    guardianAddress: s.guardian_address || s.guardianAddress,
    guardianId: s.guardian_id || s.guardianId,
    photoUrl: s.photo_url || s.photoUrl,
    schoolYear: s.school_year || s.schoolYear
});

// USER
export const userToDb = (u: User) => ({
    id: u.id,
    name: u.name,
    role: u.role,
    avatar: u.avatar,
    email: u.email,
    phone: u.phone,
    national_id: u.nationalId,
    password: u.password,
    linked_student_ids: u.linkedStudentIds
});

export const userFromDb = (u: any): User => ({
    id: u.id,
    name: u.name,
    role: u.role,
    avatar: u.avatar,
    email: u.email,
    phone: u.phone,
    nationalId: u.national_id || u.nationalId,
    password: u.password,
    linkedStudentIds: u.linked_student_ids || u.linkedStudentIds
});

// BEHAVIOR
export const behaviorToDb = (b: BehaviorRecord) => ({
    id: b.id,
    student_id: b.studentId,
    type: b.type,
    category: b.category,
    description: b.description,
    date: b.date,
    reporter: b.reporter,
    school_year: b.schoolYear
});

export const behaviorFromDb = (b: any): BehaviorRecord => ({
    id: b.id,
    studentId: b.student_id || b.studentId,
    type: b.type,
    category: b.category,
    description: b.description,
    date: b.date,
    reporter: b.reporter,
    schoolYear: b.school_year || b.schoolYear
});

// HEALTH
export const healthToDb = (h: HealthRecord) => ({
    id: h.id,
    student_id: h.studentId,
    condition: h.condition,
    medication: h.medication,
    notes: h.notes,
    date: h.date,
    severity: h.severity,
    school_year: h.schoolYear
});

export const healthFromDb = (h: any): HealthRecord => ({
    id: h.id,
    studentId: h.student_id || h.studentId,
    condition: h.condition,
    medication: h.medication,
    notes: h.notes,
    date: h.date,
    severity: h.severity,
    schoolYear: h.school_year || h.schoolYear
});

// ATTENDANCE
export const attendanceToDb = (a: AttendanceRecord) => ({
    id: a.id,
    student_id: a.studentId,
    date: a.date,
    status: a.status,
    type: a.type,
    school_year: a.schoolYear
});

export const attendanceFromDb = (a: any): AttendanceRecord => ({
    id: a.id,
    studentId: a.student_id || a.studentId,
    date: a.date,
    status: a.status,
    type: a.type,
    schoolYear: a.school_year || a.schoolYear
});

// EXIT
export const exitToDb = (e: ExitRecord) => ({
    id: e.id,
    student_id: e.studentId,
    type: e.type,
    start_date: e.startDate,
    return_date: e.returnDate,
    note: e.notes,
    is_approved: e.isApproved,
    school_year: e.schoolYear
});

export const exitFromDb = (e: any): ExitRecord => ({
    id: e.id,
    studentId: e.student_id || e.studentId,
    type: e.type,
    startDate: e.start_date || e.startDate,
    returnDate: e.return_date || e.returnDate,
    notes: e.note || e.notes,
    isApproved: e.is_approved !== undefined ? e.is_approved : e.isApproved,
    schoolYear: e.school_year || e.schoolYear
});

// ACTIVITY
export const activityToDb = (a: ActivityRecord) => ({
    id: a.id,
    title: a.title,
    type: a.type,
    date: a.date,
    time: a.time,
    location: a.location,
    organizer: a.organizer,
    description: a.description,
    status: a.status,
    participants_count: a.participantsCount,
    participant_ids: a.participantIds,
    images: a.images,
    school_year: a.schoolYear
});

export const activityFromDb = (a: any): ActivityRecord => ({
    id: a.id,
    title: a.title,
    type: a.type,
    date: a.date,
    time: a.time,
    location: a.location,
    organizer: a.organizer,
    description: a.description,
    status: a.status,
    participantsCount: a.participants_count || a.participantsCount,
    participantIds: a.participant_ids || a.participantIds,
    images: a.images,
    schoolYear: a.school_year || a.schoolYear
});

// ACADEMIC
export const academicToDb = (a: AcademicRecord) => ({
    id: a.id,
    student_id: a.studentId,
    semester: a.semester,
    school_year: a.schoolYear,
    general_average: a.generalAverage,
    unified_exam_average: a.unifiedExamAverage,
    rank: a.rank,
    subjects: a.subjects,
    teacher_decision: a.teacherDecision,
    appreciation: a.appreciation
});

export const academicFromDb = (a: any): AcademicRecord => ({
    id: a.id,
    studentId: a.student_id || a.studentId,
    semester: a.semester,
    schoolYear: a.school_year || a.schoolYear,
    generalAverage: a.general_average || a.generalAverage,
    unifiedExamAverage: a.unified_exam_average || a.unifiedExamAverage,
    rank: a.rank,
    subjects: a.subjects,
    teacherDecision: a.teacher_decision || a.teacherDecision,
    appreciation: a.appreciation
});

// MAINTENANCE
export const maintenanceToDb = (m: MaintenanceRequest) => ({
    id: m.id,
    title: m.title,
    type: m.type,
    location: m.location,
    description: m.description,
    priority: m.priority,
    status: m.status,
    date_reported: m.dateReported,
    reporter_name: m.reporterName,
    cost_estimate: m.costEstimate,
    original_values: m.originalValues,
    modified_by: m.modifiedBy,
    modification_date: m.modificationDate,
    modification_reason: m.modificationReason,
    school_year: m.schoolYear
});

export const maintenanceFromDb = (m: any): MaintenanceRequest => ({
    id: m.id,
    title: m.title,
    type: m.type,
    location: m.location,
    description: m.description,
    priority: m.priority,
    status: m.status,
    dateReported: m.date_reported || m.dateReported,
    reporterName: m.reporter_name || m.reporterName,
    costEstimate: m.cost_estimate || m.costEstimate,
    originalValues: m.original_values || m.originalValues,
    modifiedBy: m.modified_by || m.modifiedBy,
    modificationDate: m.modification_date || m.modificationDate,
    modificationReason: m.modification_reason || m.modificationReason,
    schoolYear: m.school_year || m.schoolYear
});

// SETTINGS
export const settingsToDb = (s: SchoolSettings & { weeklyMenus?: WeeklyMenus }) => ({
    institution_name: s.institutionName,
    school_year: s.schoolYear,
    logo_url: s.logoUrl,
    gemini_api_key: s.geminiApiKey,
    weekly_menus: s.weeklyMenus
});

export const settingsFromDb = (s: any): SchoolSettings & { weeklyMenus?: WeeklyMenus } => ({
    institutionName: s.institution_name || s.institutionName,
    schoolYear: s.school_year || s.schoolYear,
    logoUrl: s.logo_url || s.logoUrl,
    geminiApiKey: s.gemini_api_key || s.geminiApiKey,
    weeklyMenus: s.weekly_menus || s.weeklyMenus
});
