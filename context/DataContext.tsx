import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Student, BehaviorRecord, HealthRecord, AttendanceRecord, ExitRecord, User, UserRole, SchoolSettings, ActivityRecord, WeeklyMenus, AcademicRecord, MaintenanceRequest } from '../types';
import {
  MOCK_STUDENTS,
  MOCK_BEHAVIOR,
  MOCK_HEALTH,
  MOCK_USER,
  MOCK_BURSAR,
  MOCK_ACTIVITIES,
  MOCK_ACADEMICS,
  MOCK_MAINTENANCE,
  MOCK_ATTENDANCE,
  INITIAL_MEALS_AR,
  INITIAL_MEALS_FR,
  INITIAL_RAMADAN_AR,
  INITIAL_RAMADAN_FR
} from '../constants';

// Storage Keys
const STORAGE_KEYS = {
  STUDENTS: 'morafaka_students',
  USERS: 'morafaka_users',
  BEHAVIOR: 'morafaka_behavior',
  HEALTH: 'morafaka_health',
  ATTENDANCE: 'morafaka_attendance',
  EXITS: 'morafaka_exits',
  ACTIVITIES: 'morafaka_activities',
  ACADEMICS: 'morafaka_academics',
  MAINTENANCE: 'morafaka_maintenance',
  SETTINGS: 'morafaka_settings',
  MENUS: 'morafaka_menus',
  CURRENT_USER: 'morafaka_current_user'
};

// Helper to load data safely
const loadData = <T,>(key: string, fallback: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch (e) {
    console.error(`Error loading data for key: ${key}`, e);
    return fallback;
  }
};

// Mock Users for Login Simulation
const DEFAULT_USERS_LIST: User[] = [
  MOCK_USER, // The Main Admin
  MOCK_BURSAR, // The Bursar
  { id: 'u2', name: 'سعيد المراقب', role: UserRole.SUPERVISOR, avatar: 'https://ui-avatars.com/api/?name=Said', phone: '0600000000', email: 'sup@morafaka.ma', password: '123' },
  { id: 'u3', name: 'فاطمة الممرضة', role: UserRole.NURSE, avatar: 'https://ui-avatars.com/api/?name=Fatima', phone: '0611111111', email: 'nurse@morafaka.ma', password: '123' },
  { id: 'u4', name: 'أب يوسف', role: UserRole.PARENT, avatar: 'https://ui-avatars.com/api/?name=Parent', phone: '0661123456', linkedStudentIds: ['s1'], email: 'parent@morafaka.ma', password: '123' }
];

const DEFAULT_SETTINGS: SchoolSettings = {
  institutionName: 'داخلية ثانوية المختار السوسي الإعدادية',
  schoolYear: '2025/2026'
};

const DEFAULT_MENUS: WeeklyMenus = {
  normalAr: INITIAL_MEALS_AR,
  normalFr: INITIAL_MEALS_FR,
  ramadanAr: INITIAL_RAMADAN_AR,
  ramadanFr: INITIAL_RAMADAN_FR
};

interface DataContextType {
  // Data State
  students: Student[];
  behaviorRecords: BehaviorRecord[];
  healthRecords: HealthRecord[];
  attendanceRecords: AttendanceRecord[];
  exitRecords: ExitRecord[];
  activityRecords: ActivityRecord[];
  academicRecords: AcademicRecord[];
  maintenanceRequests: MaintenanceRequest[];
  users: User[];
  weeklyMenus: WeeklyMenus;

  // Settings
  schoolSettings: SchoolSettings;
  updateSchoolSettings: (settings: SchoolSettings) => Promise<{ success: boolean; error?: string }>;

  // Auth State
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (userId: string) => void;
  logout: () => void;
  setCurrentUser: (user: User) => void;

  // Actions
  addStudent: (student: Student) => void;
  updateStudent: (student: Student) => void;
  deleteStudent: (id: string) => void;
  addUser: (user: User) => void;
  updateUser: (user: User) => void;
  deleteUser: (id: string) => void;
  addHealthRecord: (record: HealthRecord) => void;
  updateHealthRecord: (record: HealthRecord) => void;
  deleteHealthRecord: (id: string) => void;
  addBehaviorRecord: (record: BehaviorRecord) => void;
  updateBehaviorRecord: (record: BehaviorRecord) => void;
  deleteBehaviorRecord: (id: string) => void;
  updateAttendance: (studentId: string, status: 'present' | 'absent' | 'late') => void;
  addExitRecord: (record: ExitRecord) => void;
  deleteExitRecord: (id: string) => void;
  addActivity: (activity: ActivityRecord) => void;
  updateActivity: (activity: ActivityRecord) => void;
  deleteActivity: (id: string) => void;
  updateWeeklyMenus: (menus: WeeklyMenus) => Promise<{ success: boolean; error?: string }>;
  addAcademicRecord: (record: AcademicRecord) => void;
  updateAcademicRecord: (record: AcademicRecord) => void;
  deleteAcademicRecord: (id: string) => void;
  addMaintenanceRequest: (record: MaintenanceRequest) => void;
  updateMaintenanceRequest: (record: MaintenanceRequest) => void;
  deleteMaintenanceRequest: (id: string) => void;

  // Save/Discard Control
  hasUnsavedChanges: boolean;
  saveAllChanges: () => void;
  discardAllChanges: () => void;
  resetData: () => void;

  // Connection State
  isConnecting: boolean;

  // Archiving
  selectedSchoolYear: string;
  setSelectedSchoolYear: (year: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Connection & Loading State
  const [isConnecting, setIsConnecting] = useState(true);
  const [isMockMode, setIsMockMode] = useState(false);

  // Auth State
  const [currentUser, setCurrentUserState] = useState<User | null>(() => {
    try {
      const stored = sessionStorage.getItem('morafaka_session_user');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!currentUser);

  // Dirty Flag for Unsaved Changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Data State
  const [students, setStudents] = useState<Student[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [behaviorRecords, setBehaviorRecords] = useState<BehaviorRecord[]>([]);
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [exitRecords, setExitRecords] = useState<ExitRecord[]>([]);
  const [activityRecords, setActivityRecords] = useState<ActivityRecord[]>([]);
  const [academicRecords, setAcademicRecords] = useState<AcademicRecord[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(DEFAULT_SETTINGS);
  const [weeklyMenus, setWeeklyMenus] = useState<WeeklyMenus>(DEFAULT_MENUS);

  const loadMockData = () => {
    setUsers(DEFAULT_USERS_LIST);
    setStudents(MOCK_STUDENTS);
    setBehaviorRecords(MOCK_BEHAVIOR);
    setHealthRecords(MOCK_HEALTH);
    setAttendanceRecords(MOCK_ATTENDANCE);
    setActivityRecords(MOCK_ACTIVITIES);
    setAcademicRecords(MOCK_ACADEMICS);
    setMaintenanceRequests(MOCK_MAINTENANCE);
  };

  // School Year State
  const [selectedSchoolYear, setSelectedSchoolYear] = useState<string>(DEFAULT_SETTINGS.schoolYear);

  useEffect(() => {
    if (schoolSettings.schoolYear) {
      setSelectedSchoolYear(schoolSettings.schoolYear);
    }
  }, [schoolSettings.schoolYear]);

  // --- Filtered Data Getters ---
  const getFilteredData = <T extends { schoolYear?: string; date?: string }>(data: T[], year: string) => {
    return data.filter(item => {
      // 1. Explicit School Year (Highest Priority)
      if (item.schoolYear) {
        return item.schoolYear === year;
      }
      // 2. Fallback: Deduce from Date (if available)
      if (item.date) {
        // Simple logic: If month is >= 9 (Sep), it's the start of year X e.g., 2025 -> 2025/2026
        // If month is < 9, it's the end of year X-1 e.g., 2026 -> 2025/2026
        const d = new Date(item.date);
        const y = d.getFullYear();
        const m = d.getMonth() + 1; // 1-12

        // Format: "YYYY/YYYY+1"
        const derivedYear = m >= 9 ? `${y}/${y + 1}` : `${y - 1}/${y}`;
        return derivedYear === year;
      }
      // 3. Fallback: Show all untagged data (optional: or hide it)
      // For now, let's include untagged data in CURRENT year only to avoid "hiding" legacy data
      return year === schoolSettings.schoolYear;
    });
  };

  const filteredStudents = React.useMemo(() =>
    students.filter(s => s.schoolYear ? s.schoolYear === selectedSchoolYear : true), // Show legacy students in all years or just current? Let's show untagged in all for safety, or current.
    [students, selectedSchoolYear]);

  const filteredBehavior = React.useMemo(() => getFilteredData(behaviorRecords, selectedSchoolYear), [behaviorRecords, selectedSchoolYear]);
  const filteredHealth = React.useMemo(() => getFilteredData(healthRecords, selectedSchoolYear), [healthRecords, selectedSchoolYear]);
  const filteredAttendance = React.useMemo(() => getFilteredData(attendanceRecords, selectedSchoolYear), [attendanceRecords, selectedSchoolYear]);
  const filteredExits = React.useMemo(() => getFilteredData(exitRecords, selectedSchoolYear), [exitRecords, selectedSchoolYear]);
  const filteredActivities = React.useMemo(() => getFilteredData(activityRecords, selectedSchoolYear), [activityRecords, selectedSchoolYear]);
  const filteredAcademic = React.useMemo(() => academicRecords.filter(r => r.schoolYear === selectedSchoolYear), [academicRecords, selectedSchoolYear]);
  const filteredMaintenance = React.useMemo(() => getFilteredData(maintenanceRequests, selectedSchoolYear), [maintenanceRequests, selectedSchoolYear]);

  // --- Initial Data Fetch & Connection Simulation ---
  useEffect(() => {
    const fetchData = async () => {
      setIsConnecting(true);

      try {
        // 1. Connection Probe
        const { error: probeError } = await supabase.from('settings').select('id').limit(1).maybeSingle();

        if (probeError && (probeError.message.includes('fetch') || probeError.message.includes('Failed to fetch'))) {
          throw new Error("Connection failed");
        }

        // 2. Fetch All Tables in Parallel
        const [
          sRes, uRes, setRes, bRes, hRes, aRes, eRes, actRes, acaRes, mRes
        ] = await Promise.all([
          supabase.from('students').select('*'),
          supabase.from('users').select('*'),
          supabase.from('settings').select('*').limit(1).maybeSingle(),
          supabase.from('behavior_records').select('*'),
          supabase.from('health_records').select('*'),
          supabase.from('attendance_records').select('*'),
          supabase.from('exit_records').select('*'),
          supabase.from('activity_records').select('*'),
          supabase.from('academic_records').select('*'),
          supabase.from('maintenance_requests').select('*')
        ]);

        if (sRes.error) throw sRes.error;

        // Set State
        if (sRes.data) setStudents(sRes.data);
        if (uRes.data) setUsers(uRes.data.length > 0 ? uRes.data : DEFAULT_USERS_LIST);

        if (setRes.data) {
          setSchoolSettings({
            institutionName: setRes.data.institutionName || DEFAULT_SETTINGS.institutionName,
            schoolYear: setRes.data.schoolYear || DEFAULT_SETTINGS.schoolYear,
            geminiApiKey: setRes.data.geminiApiKey
          });
          if (setRes.data.weeklyMenus) {
            setWeeklyMenus(setRes.data.weeklyMenus);
          }
        }

        if (bRes.data) setBehaviorRecords(bRes.data);
        if (hRes.data) setHealthRecords(hRes.data);
        if (aRes.data) setAttendanceRecords(aRes.data);
        if (eRes.data) setExitRecords(eRes.data);
        if (actRes.data) setActivityRecords(actRes.data);
        if (acaRes.data) setAcademicRecords(acaRes.data);
        if (mRes.data) setMaintenanceRequests(mRes.data);

        // Fallback for empty DB
        if ((!uRes.data || uRes.data.length === 0) && (!sRes.data || sRes.data.length === 0)) {
          loadMockData();
        }

      } catch (error: any) {
        console.warn("Falling back to Mock Mode:", error.message);
        setIsMockMode(true);
        loadMockData();
      } finally {
        setTimeout(() => setIsConnecting(false), 1000); // Small extra delay for UX smoothness
      }
    };

    fetchData();
  }, []);

  // --- Supabase Sync Helper ---
  const syncSupabase = async (table: string, action: 'insert' | 'update' | 'delete' | 'upsert', data: any, id?: string): Promise<{ success: boolean; error?: string }> => {
    if (isMockMode) return { success: true }; // In mock mode, pretend success

    try {
      let result;
      if (action === 'insert') {
        result = await supabase.from(table).insert([data]);
      } else if (action === 'upsert') {
        // Upsert is used for single-record tables like 'settings'
        result = await supabase.from(table).upsert([{ id: id || 'current', ...data }], { onConflict: 'id' });
      } else if (action === 'update' && id) {
        result = await supabase.from(table).update(data).eq('id', id);
      } else if (action === 'delete' && id) {
        result = await supabase.from(table).delete().eq('id', id);
      }

      if (result?.error) {
        console.error(`Sync error [${table}]:`, result.error.message);
        return { success: false, error: result.error.message };
      }
      return { success: true };
    } catch (e: any) {
      console.error(`System error syncing ${table}:`, e.message);
      return { success: false, error: e.message };
    }
  };


  // --- Auth Operations ---
  const login = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setCurrentUserState(user);
      setIsAuthenticated(true);
      sessionStorage.setItem('morafaka_session_user', JSON.stringify(user));
    }
  };

  const logout = () => {
    setCurrentUserState(null);
    setIsAuthenticated(false);
    sessionStorage.removeItem('morafaka_session_user');
  };

  const setCurrentUser = (user: User) => {
    setCurrentUserState(user);
    sessionStorage.setItem('morafaka_session_user', JSON.stringify(user));
  };

  const updateSchoolSettings = async (settings: SchoolSettings): Promise<{ success: boolean; error?: string }> => {
    setSchoolSettings(settings);
    // Use upsert to ensure the 'current' settings record exists or is created
    return syncSupabase('settings', 'upsert', settings, 'current');
  };

  const saveAllChanges = () => { setHasUnsavedChanges(false); };
  const discardAllChanges = () => { window.location.reload(); };

  // --- Data Operations (Modified to inject School Year) ---
  const addStudent = (student: Student) => {
    const s = { ...student, schoolYear: selectedSchoolYear };
    setStudents(prev => [...prev, s]);
    syncSupabase('students', 'insert', s);
  };
  // Other updates generally don't change school year, except maybe academic updates?
  const updateStudent = (updated: Student) => {
    setStudents(prev => prev.map(s => s.id === updated.id ? updated : s));
    syncSupabase('students', 'update', updated, updated.id);
  };
  const deleteStudent = (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
    syncSupabase('students', 'delete', null, id);
  };
  const addUser = (user: User) => {
    setUsers(prev => [...prev, user]);
    syncSupabase('users', 'insert', user);
  };
  const updateUser = (updated: User) => {
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
    if (currentUser && currentUser.id === updated.id) setCurrentUser(updated);
    syncSupabase('users', 'update', updated, updated.id);
  };
  const deleteUser = (id: string) => {
    if (window.confirm('تأكيد حذف المستخدم؟')) {
      setUsers(prev => prev.filter(u => u.id !== id));
      syncSupabase('users', 'delete', null, id);
    }
  };
  const addHealthRecord = (record: HealthRecord) => {
    const r = { ...record, schoolYear: selectedSchoolYear };
    setHealthRecords(prev => [r, ...prev]);
    syncSupabase('health_records', 'insert', r);
  };
  const updateHealthRecord = (record: HealthRecord) => {
    setHealthRecords(prev => prev.map(h => h.id === record.id ? record : h));
    syncSupabase('health_records', 'update', record, record.id);
  };
  const deleteHealthRecord = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا السجل الصحي؟')) {
      setHealthRecords(prev => prev.filter(h => h.id !== id));
      syncSupabase('health_records', 'delete', null, id);
    }
  };
  const addBehaviorRecord = (record: BehaviorRecord) => {
    const r = { ...record, schoolYear: selectedSchoolYear };
    setBehaviorRecords(prev => [r, ...prev]);
    syncSupabase('behavior_records', 'insert', r);
  };
  const updateBehaviorRecord = (record: BehaviorRecord) => {
    setBehaviorRecords(prev => prev.map(b => b.id === record.id ? record : b));
    syncSupabase('behavior_records', 'update', record, record.id);
  };
  const deleteBehaviorRecord = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا السجل السلوكي؟')) {
      setBehaviorRecords(prev => prev.filter(b => b.id !== id));
      syncSupabase('behavior_records', 'delete', null, id);
    }
  };
  const updateAttendance = async (studentId: string, status: 'present' | 'absent' | 'late') => {
    const today = new Date().toISOString().split('T')[0];
    const existing = attendanceRecords.find(a => a.studentId === studentId && a.date === today);
    let newRecord: AttendanceRecord;

    if (existing) {
      newRecord = { ...existing, status };
      setAttendanceRecords(prev => prev.map(a => a.id === existing.id ? newRecord : a));
      syncSupabase('attendance_records', 'update', newRecord, existing.id);
    } else {
      newRecord = { id: crypto.randomUUID(), studentId, date: today, status, type: 'study', schoolYear: selectedSchoolYear };
      setAttendanceRecords(prev => [...prev, newRecord]);
      syncSupabase('attendance_records', 'insert', newRecord);
    }
  };
  const addExitRecord = (record: ExitRecord) => {
    const r = { ...record, schoolYear: selectedSchoolYear };
    setExitRecords(prev => [r, ...prev]);
    syncSupabase('exit_records', 'insert', r);
  };
  const deleteExitRecord = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف سجل الخروج هذا؟')) {
      setExitRecords(prev => prev.filter(e => e.id !== id));
      syncSupabase('exit_records', 'delete', null, id);
    }
  };
  const addActivity = (activity: ActivityRecord) => {
    const a = { ...activity, schoolYear: selectedSchoolYear };
    setActivityRecords(prev => [a, ...prev]);
    syncSupabase('activity_records', 'insert', a);
  };
  const updateActivity = (updated: ActivityRecord) => {
    setActivityRecords(prev => prev.map(a => a.id === updated.id ? updated : a));
    syncSupabase('activity_records', 'update', updated, updated.id);
  };
  const deleteActivity = (id: string) => {
    if (window.confirm('تأكيد حذف النشاط؟')) {
      setActivityRecords(prev => prev.filter(a => a.id !== id));
      syncSupabase('activity_records', 'delete', null, id);
    }
  };
  const updateWeeklyMenus = async (menus: WeeklyMenus) => {
    setWeeklyMenus(menus);
    return syncSupabase('settings', 'upsert', { weeklyMenus: menus }, 'current');
  };
  const addAcademicRecord = (record: AcademicRecord) => {
    const r = { ...record, schoolYear: selectedSchoolYear }; // Academic Record usually has its own schoolYear, but default to context
    setAcademicRecords(prev => [r, ...prev]);
    syncSupabase('academic_records', 'insert', r);
  };
  const updateAcademicRecord = (record: AcademicRecord) => {
    setAcademicRecords(prev => prev.map(r => r.id === record.id ? record : r));
    syncSupabase('academic_records', 'update', record, record.id);
  };
  const deleteAcademicRecord = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا السجل الدراسي؟')) {
      setAcademicRecords(prev => prev.filter(r => r.id !== id));
      syncSupabase('academic_records', 'delete', null, id);
    }
  };
  const addMaintenanceRequest = (record: MaintenanceRequest) => {
    const r = { ...record, schoolYear: selectedSchoolYear };
    setMaintenanceRequests(prev => [r, ...prev]);
    syncSupabase('maintenance_requests', 'insert', r);
  };
  const updateMaintenanceRequest = (record: MaintenanceRequest) => {
    setMaintenanceRequests(prev => prev.map(r => r.id === record.id ? record : r));
    syncSupabase('maintenance_requests', 'update', record, record.id);
  };
  const deleteMaintenanceRequest = (id: string) => {
    if (window.confirm('تأكيد حذف طلب الصيانة؟')) {
      setMaintenanceRequests(prev => prev.filter(r => r.id !== id));
      syncSupabase('maintenance_requests', 'delete', null, id);
    }
  };
  const resetData = () => {
    if (window.confirm('هل أنت متأكد من إعادة تعيين جميع البيانات؟ سيتم فقدان التغييرة الحالية.')) {
      window.location.reload();
    }
  };

  return (
    <DataContext.Provider value={{
      students: filteredStudents,
      users,
      behaviorRecords: filteredBehavior,
      healthRecords: filteredHealth,
      attendanceRecords: filteredAttendance,
      exitRecords: filteredExits,
      activityRecords: filteredActivities,
      weeklyMenus,
      academicRecords: filteredAcademic,
      maintenanceRequests: filteredMaintenance,

      schoolSettings, updateSchoolSettings,
      currentUser, isAuthenticated, login, logout, setCurrentUser,

      addStudent, updateStudent, deleteStudent,
      addUser, updateUser, deleteUser,
      addHealthRecord, updateHealthRecord, deleteHealthRecord,
      addBehaviorRecord, updateBehaviorRecord, deleteBehaviorRecord,
      updateAttendance, addExitRecord, deleteExitRecord,
      addActivity, updateActivity, deleteActivity,
      updateWeeklyMenus,
      addAcademicRecord, updateAcademicRecord, deleteAcademicRecord,
      addMaintenanceRequest, updateMaintenanceRequest, deleteMaintenanceRequest,

      hasUnsavedChanges, saveAllChanges, discardAllChanges, resetData,
      isConnecting,

      // New Exports
      selectedSchoolYear,
      setSelectedSchoolYear
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) throw new Error('useData must be used within a DataProvider');
  return context;
};
