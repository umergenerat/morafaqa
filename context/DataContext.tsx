
import React, { createContext, useContext, useState, useEffect } from 'react';
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
  updateSchoolSettings: (settings: SchoolSettings) => void;

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
  updateWeeklyMenus: (menus: WeeklyMenus) => void;
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
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Auth State with Persistence
  const [currentUser, setCurrentUserState] = useState<User | null>(() => loadData(STORAGE_KEYS.CURRENT_USER, null));
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!currentUser);

  // Dirty Flag for Unsaved Changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Data State with Persistence Initialization
  const [students, setStudents] = useState<Student[]>(() => loadData(STORAGE_KEYS.STUDENTS, MOCK_STUDENTS));

  const [users, setUsers] = useState<User[]>(() => {
    // Load users from storage
    const loadedUsers = loadData<User[]>(STORAGE_KEYS.USERS, DEFAULT_USERS_LIST);
    const adminIndex = loadedUsers.findIndex(u => u.id === 'admin_main');
    if (adminIndex !== -1) {
      loadedUsers[adminIndex] = { ...loadedUsers[adminIndex], ...MOCK_USER };
    } else {
      loadedUsers.unshift(MOCK_USER);
    }
    return loadedUsers;
  });

  const [behaviorRecords, setBehaviorRecords] = useState<BehaviorRecord[]>(() => loadData(STORAGE_KEYS.BEHAVIOR, MOCK_BEHAVIOR));
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>(() => loadData(STORAGE_KEYS.HEALTH, MOCK_HEALTH));
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => loadData(STORAGE_KEYS.ATTENDANCE, MOCK_ATTENDANCE));
  const [exitRecords, setExitRecords] = useState<ExitRecord[]>(() => loadData(STORAGE_KEYS.EXITS, []));
  const [activityRecords, setActivityRecords] = useState<ActivityRecord[]>(() => loadData(STORAGE_KEYS.ACTIVITIES, MOCK_ACTIVITIES));
  const [academicRecords, setAcademicRecords] = useState<AcademicRecord[]>(() => loadData(STORAGE_KEYS.ACADEMICS, MOCK_ACADEMICS));
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>(() => loadData(STORAGE_KEYS.MAINTENANCE, MOCK_MAINTENANCE));

  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(() => loadData(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS));
  const [weeklyMenus, setWeeklyMenus] = useState<WeeklyMenus>(() => loadData(STORAGE_KEYS.MENUS, DEFAULT_MENUS));

  // Persist Auth
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
      setIsAuthenticated(true);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      setIsAuthenticated(false);
    }
  }, [currentUser]);

  // --- Save / Discard Logic ---
  const saveAllChanges = () => {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    localStorage.setItem(STORAGE_KEYS.BEHAVIOR, JSON.stringify(behaviorRecords));
    localStorage.setItem(STORAGE_KEYS.HEALTH, JSON.stringify(healthRecords));
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendanceRecords));
    localStorage.setItem(STORAGE_KEYS.EXITS, JSON.stringify(exitRecords));
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activityRecords));
    localStorage.setItem(STORAGE_KEYS.ACADEMICS, JSON.stringify(academicRecords));
    localStorage.setItem(STORAGE_KEYS.MAINTENANCE, JSON.stringify(maintenanceRequests));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(schoolSettings));
    localStorage.setItem(STORAGE_KEYS.MENUS, JSON.stringify(weeklyMenus));

    setHasUnsavedChanges(false);
  };

  const discardAllChanges = () => {
    setStudents(loadData(STORAGE_KEYS.STUDENTS, MOCK_STUDENTS));

    // Reset users but keep Admin synced
    const resetUsers = loadData(STORAGE_KEYS.USERS, DEFAULT_USERS_LIST);
    const adminIndex = resetUsers.findIndex((u: User) => u.id === 'admin_main');
    if (adminIndex !== -1) {
      resetUsers[adminIndex] = { ...resetUsers[adminIndex], ...MOCK_USER };
    }
    setUsers(resetUsers);

    setBehaviorRecords(loadData(STORAGE_KEYS.BEHAVIOR, MOCK_BEHAVIOR));
    setHealthRecords(loadData(STORAGE_KEYS.HEALTH, MOCK_HEALTH));
    setAttendanceRecords(loadData(STORAGE_KEYS.ATTENDANCE, MOCK_ATTENDANCE));
    setExitRecords(loadData(STORAGE_KEYS.EXITS, []));
    setActivityRecords(loadData(STORAGE_KEYS.ACTIVITIES, MOCK_ACTIVITIES));
    setAcademicRecords(loadData(STORAGE_KEYS.ACADEMICS, MOCK_ACADEMICS));
    setMaintenanceRequests(loadData(STORAGE_KEYS.MAINTENANCE, MOCK_MAINTENANCE));
    setSchoolSettings(loadData(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS));
    setWeeklyMenus(loadData(STORAGE_KEYS.MENUS, DEFAULT_MENUS));

    setHasUnsavedChanges(false);
  };

  // --- Auth Operations ---
  const login = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setCurrentUserState(user);
    }
  };

  const logout = () => {
    setCurrentUserState(null);
  };

  const setCurrentUser = (user: User) => {
    setCurrentUserState(user);
  };

  const updateSchoolSettings = (settings: SchoolSettings) => {
    setSchoolSettings(settings);
    setHasUnsavedChanges(true);
  };

  // --- Data Operations (All trigger setHasUnsavedChanges(true)) ---
  const addStudent = (student: Student) => {
    setStudents(prev => [...prev, student]);
    setHasUnsavedChanges(true);
  };
  const updateStudent = (updated: Student) => {
    setStudents(prev => prev.map(s => s.id === updated.id ? updated : s));
    setHasUnsavedChanges(true);
  };
  const deleteStudent = (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
    setBehaviorRecords(prev => prev.filter(b => b.studentId !== id));
    setHealthRecords(prev => prev.filter(h => h.studentId !== id));
    setExitRecords(prev => prev.filter(e => e.studentId !== id));
    setAcademicRecords(prev => prev.filter(a => a.studentId !== id));
    setHasUnsavedChanges(true);
  };
  const addUser = (user: User) => {
    setUsers(prev => [...prev, user]);
    setHasUnsavedChanges(true);
  };
  const updateUser = (updated: User) => {
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
    if (currentUser && currentUser.id === updated.id) setCurrentUserState(updated);
    setHasUnsavedChanges(true);
  };
  const deleteUser = (id: string) => {
    if (window.confirm('تأكيد حذف المستخدم؟')) {
      setUsers(prev => prev.filter(u => u.id !== id));
      setHasUnsavedChanges(true);
    }
  };
  const addHealthRecord = (record: HealthRecord) => {
    setHealthRecords(prev => [record, ...prev]);
    setHasUnsavedChanges(true);
  };
  const updateHealthRecord = (record: HealthRecord) => {
    setHealthRecords(prev => prev.map(h => h.id === record.id ? record : h));
    setHasUnsavedChanges(true);
  };
  const deleteHealthRecord = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا السجل الصحي؟')) {
      setHealthRecords(prev => prev.filter(h => h.id !== id));
      setHasUnsavedChanges(true);
    }
  };
  const addBehaviorRecord = (record: BehaviorRecord) => {
    setBehaviorRecords(prev => [record, ...prev]);
    setHasUnsavedChanges(true);
  };
  const updateBehaviorRecord = (record: BehaviorRecord) => {
    setBehaviorRecords(prev => prev.map(b => b.id === record.id ? record : b));
    setHasUnsavedChanges(true);
  };
  const deleteBehaviorRecord = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا السجل السلوكي؟')) {
      setBehaviorRecords(prev => prev.filter(b => b.id !== id));
      setHasUnsavedChanges(true);
    }
  };
  const updateAttendance = (studentId: string, status: 'present' | 'absent' | 'late') => {
    const today = new Date().toISOString().split('T')[0];
    setAttendanceRecords(prev => {
      const idx = prev.findIndex(a => a.studentId === studentId && a.date === today);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], status };
        return updated;
      }
      return [...prev, { id: crypto.randomUUID(), studentId, date: today, status, type: 'study' }];
    });
    setHasUnsavedChanges(true);
  };
  const addExitRecord = (record: ExitRecord) => {
    setExitRecords(prev => [record, ...prev]);
    setHasUnsavedChanges(true);
  };
  const deleteExitRecord = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف سجل الخروج هذا؟')) {
      setExitRecords(prev => prev.filter(e => e.id !== id));
      setHasUnsavedChanges(true);
    }
  };

  const addActivity = (activity: ActivityRecord) => {
    setActivityRecords(prev => [activity, ...prev]);
    setHasUnsavedChanges(true);
  };

  const updateActivity = (updated: ActivityRecord) => {
    setActivityRecords(prev => prev.map(a => a.id === updated.id ? updated : a));
    setHasUnsavedChanges(true);
  };

  const deleteActivity = (id: string) => {
    if (window.confirm('تأكيد حذف النشاط؟')) {
      setActivityRecords(prev => prev.filter(a => a.id !== id));
      setHasUnsavedChanges(true);
    }
  };

  const updateWeeklyMenus = (menus: WeeklyMenus) => {
    setWeeklyMenus(menus);
    setHasUnsavedChanges(true);
  };

  const addAcademicRecord = (record: AcademicRecord) => {
    setAcademicRecords(prev => [record, ...prev]);
    setHasUnsavedChanges(true);
  };

  const updateAcademicRecord = (record: AcademicRecord) => {
    setAcademicRecords(prev => prev.map(r => r.id === record.id ? record : r));
    setHasUnsavedChanges(true);
  };

  const deleteAcademicRecord = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا السجل الدراسي؟')) {
      setAcademicRecords(prev => prev.filter(r => r.id !== id));
      setHasUnsavedChanges(true);
    }
  };

  const addMaintenanceRequest = (record: MaintenanceRequest) => {
    setMaintenanceRequests(prev => [record, ...prev]);
    setHasUnsavedChanges(true);
  };

  const updateMaintenanceRequest = (record: MaintenanceRequest) => {
    setMaintenanceRequests(prev => prev.map(r => r.id === record.id ? record : r));
    setHasUnsavedChanges(true);
  };

  const deleteMaintenanceRequest = (id: string) => {
    if (window.confirm('تأكيد حذف طلب الصيانة؟')) {
      setMaintenanceRequests(prev => prev.filter(r => r.id !== id));
      setHasUnsavedChanges(true);
    }
  };

  const resetData = () => {
    if (window.confirm('هل أنت متأكد من إعادة تعيين جميع البيانات؟ سيتم فقدان التغييرة الحالية.')) {
      setStudents(MOCK_STUDENTS);
      setUsers(DEFAULT_USERS_LIST);
      setBehaviorRecords(MOCK_BEHAVIOR);
      setHealthRecords(MOCK_HEALTH);
      setAttendanceRecords(MOCK_ATTENDANCE);
      setExitRecords([]);
      setActivityRecords(MOCK_ACTIVITIES);
      setAcademicRecords(MOCK_ACADEMICS);
      setMaintenanceRequests(MOCK_MAINTENANCE);
      setSchoolSettings(DEFAULT_SETTINGS);
      setWeeklyMenus(DEFAULT_MENUS);

      // Clear storage
      Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
      setHasUnsavedChanges(false);
      window.location.reload(); // Reload to ensure clean state
    }
  };

  return (
    <DataContext.Provider value={{
      students, users, behaviorRecords, healthRecords, attendanceRecords, exitRecords, activityRecords, weeklyMenus, academicRecords, maintenanceRequests,
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
      hasUnsavedChanges, saveAllChanges, discardAllChanges, resetData
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
