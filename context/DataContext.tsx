
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Student, BehaviorRecord, HealthRecord, AttendanceRecord, ExitRecord, User, UserRole, SchoolSettings, ActivityRecord, WeeklyMenus, AcademicRecord, MaintenanceRequest } from '../types';
import { 
  MOCK_USER, 
  INITIAL_MEALS_AR,
  INITIAL_MEALS_FR,
  INITIAL_RAMADAN_AR,
  INITIAL_RAMADAN_FR,
  MOCK_STUDENTS,
  MOCK_BEHAVIOR,
  MOCK_HEALTH,
  MOCK_ACTIVITIES,
  MOCK_ACADEMICS,
  MOCK_MAINTENANCE
} from '../constants';

const DEFAULT_MENUS: WeeklyMenus = {
  normalAr: INITIAL_MEALS_AR,
  normalFr: INITIAL_MEALS_FR,
  ramadanAr: INITIAL_RAMADAN_AR,
  ramadanFr: INITIAL_RAMADAN_FR
};

const DEFAULT_SETTINGS: SchoolSettings = {
  institutionName: 'مؤسسة مرافقة',
  schoolYear: '2025/2026',
  apiKey: ''
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

  // Bulk Operations
  insertBulk: (table: string, data: any[]) => Promise<void>;

  // Save/Discard Control
  hasUnsavedChanges: boolean;
  saveAllChanges: () => void;
  discardAllChanges: () => void;
  isLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Loading State
  const [isLoading, setIsLoading] = useState(true);

  // Auth State (Persisted in Session Storage for basic session)
  const [currentUser, setCurrentUserState] = useState<User | null>(() => {
    try {
      const stored = sessionStorage.getItem('morafaka_session_user');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!currentUser);
  
  // Mock Mode State
  const [isMockMode, setIsMockMode] = useState(false);
  
  // Dirty Flag (Less relevant in Realtime DB, but kept for UX consistency)
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
    // Load full suite of mock data
    setUsers([MOCK_USER]); 
    setStudents(MOCK_STUDENTS);
    setBehaviorRecords(MOCK_BEHAVIOR);
    setHealthRecords(MOCK_HEALTH);
    setActivityRecords(MOCK_ACTIVITIES);
    setAcademicRecords(MOCK_ACADEMICS);
    setMaintenanceRequests(MOCK_MAINTENANCE);
    // Note: Settings and Menus keep default values
  };

  // --- Initial Data Fetch (Supabase) ---
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      try {
        // 1. Connection Probe
        const { error: probeError } = await supabase.from('settings').select('id').limit(1).maybeSingle();
        
        // Check for specific fetch errors that indicate connection issues
        if (probeError && (probeError.message.includes('fetch') || probeError.message.includes('Failed to fetch') || probeError.message.includes('URL'))) {
           throw new Error("Connection failed");
        }

        // 2. Fetch All Tables in Parallel if probe succeeds
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

        // If 'students' fetch specifically failed with an error, it might be a configuration issue.
        if (sRes.error) throw sRes.error;

        // Set State
        if (sRes.data) setStudents(sRes.data);
        if (uRes.data) setUsers(uRes.data);
        
        if (setRes.data) {
          setSchoolSettings({
            institutionName: setRes.data.institutionName || DEFAULT_SETTINGS.institutionName,
            schoolYear: setRes.data.schoolYear || DEFAULT_SETTINGS.schoolYear,
            apiKey: setRes.data.apiKey || ''
          });
          if (setRes.data.weeklyMenus && Object.keys(setRes.data.weeklyMenus).length > 0) {
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

        // Fallback: If DB is valid but totally empty (e.g. fresh Supabase project), 
        // we might want to initialize at least the mock user so they can login.
        if ((!uRes.data || uRes.data.length === 0) && (!sRes.data || sRes.data.length === 0)) {
           console.log("Database connected but empty. Loading mock data for demo purposes.");
           loadMockData();
        }

      } catch (error: any) {
        console.warn("Running in Offline/Mock Mode due to connection error:", error.message || "Unknown error");
        setIsMockMode(true);
        loadMockData();
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

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

  // --- CRUD Operations (Sync with Supabase + Optimistic Update) ---

  const updateSchoolSettings = async (settings: SchoolSettings) => {
    setSchoolSettings(settings);
    if (isMockMode) return;
    
    const { data } = await supabase.from('settings').select('id').limit(1).maybeSingle();
    
    if (data) {
       await supabase.from('settings').update({
        institutionName: settings.institutionName,
        schoolYear: settings.schoolYear,
        apiKey: settings.apiKey
      }).eq('id', data.id);
    } else {
       await supabase.from('settings').insert([{
         institutionName: settings.institutionName,
         schoolYear: settings.schoolYear,
         apiKey: settings.apiKey,
         weeklyMenus: weeklyMenus
       }]);
    }
  };

  const updateWeeklyMenus = async (menus: WeeklyMenus) => {
    setWeeklyMenus(menus);
    if (isMockMode) return;

    const { data } = await supabase.from('settings').select('id').limit(1).maybeSingle();
    if (data) {
        await supabase.from('settings').update({ weeklyMenus: menus }).eq('id', data.id);
    }
  };

  const syncSupabase = async (table: string, action: 'insert' | 'update' | 'delete', data: any, id?: string) => {
    if (isMockMode) return; 

    try {
      let result;
      
      if (action === 'insert') {
        result = await supabase.from(table).insert([data]).select();
      } else if (action === 'update' && id) {
        result = await supabase.from(table).update(data).eq('id', id).select();
      } else if (action === 'delete' && id) {
        result = await supabase.from(table).delete().eq('id', id);
      }

      if (result?.error) {
        console.warn(`Supabase Error [${table}] [${action}]:`, result.error.message);
      }
    } catch (e: any) {
      console.error(`System Error syncing ${table}:`, e.message || e);
    }
  };

  // --- Bulk Operation ---
  const insertBulk = async (table: string, data: any[]) => {
    if (!data || data.length === 0) return;

    // 1. Optimistic UI Update
    switch(table) {
        case 'students': setStudents(prev => [...prev, ...data]); break;
        case 'health_records': setHealthRecords(prev => [...data, ...prev]); break;
        case 'attendance_records': setAttendanceRecords(prev => [...prev, ...data]); break;
        case 'academic_records': setAcademicRecords(prev => [...prev, ...data]); break;
    }

    // 2. DB Sync
    if (isMockMode) return;

    try {
        const { error } = await supabase.from(table).insert(data);
        if (error) {
            console.error(`Bulk insert failed for ${table}:`, error.message);
            alert("حدث خطأ أثناء حفظ البيانات في قاعدة البيانات. يرجى التحقق من الاتصال.");
        }
    } catch (e) {
        console.error("System error during bulk insert:", e);
    }
  };

  // -- Students --
  const addStudent = (student: Student) => {
    setStudents(prev => [...prev, student]);
    syncSupabase('students', 'insert', student);
  };
  const updateStudent = (updated: Student) => {
    setStudents(prev => prev.map(s => s.id === updated.id ? updated : s));
    syncSupabase('students', 'update', updated, updated.id);
  };
  const deleteStudent = (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
    syncSupabase('students', 'delete', null, id);
  };

  // -- Users --
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
    setUsers(prev => prev.filter(u => u.id !== id));
    syncSupabase('users', 'delete', null, id);
  };

  // -- Health --
  const addHealthRecord = (record: HealthRecord) => {
    setHealthRecords(prev => [record, ...prev]);
    syncSupabase('health_records', 'insert', record);
  };
  const updateHealthRecord = (record: HealthRecord) => {
    setHealthRecords(prev => prev.map(h => h.id === record.id ? record : h));
    syncSupabase('health_records', 'update', record, record.id);
  };
  const deleteHealthRecord = (id: string) => {
    setHealthRecords(prev => prev.filter(h => h.id !== id));
    syncSupabase('health_records', 'delete', null, id);
  };

  // -- Behavior --
  const addBehaviorRecord = (record: BehaviorRecord) => {
    setBehaviorRecords(prev => [record, ...prev]);
    syncSupabase('behavior_records', 'insert', record);
  };
  const updateBehaviorRecord = (record: BehaviorRecord) => {
    setBehaviorRecords(prev => prev.map(b => b.id === record.id ? record : b));
    syncSupabase('behavior_records', 'update', record, record.id);
  };
  const deleteBehaviorRecord = (id: string) => {
    setBehaviorRecords(prev => prev.filter(b => b.id !== id));
    syncSupabase('behavior_records', 'delete', null, id);
  };

  // -- Attendance --
  const updateAttendance = async (studentId: string, status: 'present' | 'absent' | 'late') => {
    const today = new Date().toISOString().split('T')[0];
    
    const existing = attendanceRecords.find(a => a.studentId === studentId && a.date === today);
    let newRecord: AttendanceRecord;
    
    if (existing) {
      newRecord = { ...existing, status };
      setAttendanceRecords(prev => prev.map(a => a.id === existing.id ? newRecord : a));
      syncSupabase('attendance_records', 'update', newRecord, existing.id);
    } else {
      newRecord = { id: crypto.randomUUID(), studentId, date: today, status, type: 'study' };
      setAttendanceRecords(prev => [...prev, newRecord]);
      syncSupabase('attendance_records', 'insert', newRecord);
    }
  };

  // -- Exits --
  const addExitRecord = (record: ExitRecord) => {
    setExitRecords(prev => [record, ...prev]);
    syncSupabase('exit_records', 'insert', record);
  };
  const deleteExitRecord = (id: string) => {
    setExitRecords(prev => prev.filter(e => e.id !== id));
    syncSupabase('exit_records', 'delete', null, id);
  };

  // -- Activities --
  const addActivity = (activity: ActivityRecord) => {
    setActivityRecords(prev => [activity, ...prev]);
    syncSupabase('activity_records', 'insert', activity);
  };
  const updateActivity = (updated: ActivityRecord) => {
    setActivityRecords(prev => prev.map(a => a.id === updated.id ? updated : a));
    syncSupabase('activity_records', 'update', updated, updated.id);
  };
  const deleteActivity = (id: string) => {
    setActivityRecords(prev => prev.filter(a => a.id !== id));
    syncSupabase('activity_records', 'delete', null, id);
  };

  // -- Academics --
  const addAcademicRecord = (record: AcademicRecord) => {
    setAcademicRecords(prev => [record, ...prev]);
    syncSupabase('academic_records', 'insert', record);
  };
  const updateAcademicRecord = (record: AcademicRecord) => {
    setAcademicRecords(prev => prev.map(r => r.id === record.id ? record : r));
    syncSupabase('academic_records', 'update', record, record.id);
  };
  const deleteAcademicRecord = (id: string) => {
    setAcademicRecords(prev => prev.filter(r => r.id !== id));
    syncSupabase('academic_records', 'delete', null, id);
  };

  // -- Maintenance --
  const addMaintenanceRequest = (record: MaintenanceRequest) => {
    setMaintenanceRequests(prev => [record, ...prev]);
    syncSupabase('maintenance_requests', 'insert', record);
  };
  const updateMaintenanceRequest = (record: MaintenanceRequest) => {
    setMaintenanceRequests(prev => prev.map(r => r.id === record.id ? record : r));
    syncSupabase('maintenance_requests', 'update', record, record.id);
  };
  const deleteMaintenanceRequest = (id: string) => {
    setMaintenanceRequests(prev => prev.filter(r => r.id !== id));
    syncSupabase('maintenance_requests', 'delete', null, id);
  };

  const saveAllChanges = () => { setHasUnsavedChanges(false); };
  const discardAllChanges = () => { window.location.reload(); };

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
      insertBulk,
      hasUnsavedChanges, saveAllChanges, discardAllChanges, isLoading
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
