
export enum UserRole {
  ADMIN = 'ADMIN', // Director/General Supervisor
  SUPERVISOR = 'SUPERVISOR', // Dorm Monitor
  NURSE = 'NURSE', // Health professional
  TEACHER = 'TEACHER', // Academic support
  PARENT = 'PARENT', // Guardian
  CATERING_MANAGER = 'CATERING_MANAGER', // Kitchen/Dining Manager
  BURSAR = 'BURSAR' // Financial and Material Services Manager (Moktasid)
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
  email?: string;
  phone?: string;
  nationalId?: string; // CNIE used for login
  password?: string; // Added for mock auth
  // For parents, link them to specific students
  linkedStudentIds?: string[];
}

export interface SchoolSettings {
  institutionName: string;
  schoolYear: string;
  logoUrl?: string;
}

export type ScholarshipType = 'full' | 'half' | 'lunch' | 'none';
export type Gender = 'male' | 'female';

export interface Student {
  id: string;
  fullName: string;
  gender: Gender;
  academicId: string; // Massar Number
  grade: string;
  scholarshipNumber: string;
  scholarshipType: ScholarshipType;
  roomNumber: string;
  guardianPhone: string;
  guardianAddress: string;
  guardianId?: string; // Parent's National ID (CNIE) for auto-linking
  photoUrl: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  type: 'study' | 'sleep' | 'class';
}

export type ExitType = 'short' | 'long' | 'authorized'; // قصيرة، طويلة، إذن خاص

export interface ExitRecord {
  id: string;
  studentId: string;
  type: ExitType;
  startDate: string;
  returnDate: string; // Expected return
  notes?: string;
  isApproved: boolean;
}

export interface HealthRecord {
  id: string;
  studentId: string;
  condition: string;
  medication?: string;
  notes: string;
  date: string;
  severity: 'low' | 'medium' | 'high';
}

export interface BehaviorRecord {
  id: string;
  studentId: string;
  type: 'positive' | 'negative';
  category: 'discipline' | 'hygiene' | 'interaction';
  description: string;
  date: string;
  reporter: string;
}

export interface GeminReportResponse {
  summary: string;
  recommendations: string[];
}

export interface Meal {
  id: string;
  day: string;
  breakfast?: string; // Normal days
  lunch?: string;     // Normal days
  dinner?: string;    // Both
  ftour?: string;     // Ramadan
  suhoor?: string;    // Ramadan
  calories?: number;
  // Modification tracking
  originalValues?: {
    breakfast?: string;
    lunch?: string;
    dinner?: string;
    ftour?: string;
    suhoor?: string;
  };
  modifiedBy?: string;
  modificationDate?: string;
  modificationReason?: string;
}

export interface WeeklyMenus {
  normalAr: Meal[];
  normalFr: Meal[];
  ramadanAr: Meal[];
  ramadanFr: Meal[];
}

export type ActivityType = 'cultural' | 'sport' | 'religious' | 'educational' | 'entertainment';

export interface ActivityRecord {
  id: string;
  title: string;
  type: ActivityType;
  date: string;
  time: string;
  location: string;
  organizer: string;
  description: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  participantsCount?: number;
  participantIds?: string[]; // List of student IDs
  images?: string[]; // Added for documentation
}

export interface SubjectGrade {
  subjectName: string;
  grade: number;
  coefficient: number; // المعامل
}

export interface AcademicRecord {
  id: string;
  studentId: string;
  semester: 'S1' | 'S2'; // الدورة الأولى أو الثانية
  schoolYear: string;
  generalAverage: number; // المعدل العام
  rank?: number; // الرتبة
  subjects: SubjectGrade[];
  teacherDecision?: string; // قرار المجلس/الأستاذ
  appreciation?: string; // التقدير (ممتاز، حسن...)
}

export type MaintenanceType = 'plumbing' | 'electricity' | 'cleaning' | 'equipment' | 'other';
export type MaintenanceStatus = 'pending' | 'in_progress' | 'completed';
export type PriorityLevel = 'low' | 'medium' | 'high';

export interface MaintenanceRequest {
  id: string;
  title: string;
  type: MaintenanceType;
  location: string;
  description: string;
  priority: PriorityLevel;
  status: MaintenanceStatus;
  dateReported: string;
  reporterName: string;
  costEstimate?: number; // Optional cost tracking
}