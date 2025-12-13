import React, { createContext, useContext, useState, useEffect } from 'react';
import { Student, BehaviorRecord, HealthRecord, AttendanceRecord, ExitRecord, User, UserRole, SchoolSettings, ActivityRecord, WeeklyMenus, AcademicRecord, MaintenanceRequest } from '../types';
import { supabase } from '../services/supabase';
import {
  MOCK_STUDENTS,
  MOCK_BEHAVIOR,
  MOCK_HEALTH,
  MOCK_USER,
  MOCK_BURSAR,
  MOCK_ACTIVITIES,
  MOCK_ACADEMICS,
  MOCK_MAINTENANCE,
  INITIAL_MEALS_AR,
  INITIAL_MEALS_FR,
  INITIAL_RAMADAN_AR,
  INITIAL_RAMADAN_FR
} from '../constants';

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

  // Loading State
  isLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

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

  const [isLoading, setIsLoading] = useState(true);

  // --- Initial Data Load & Subscription ---
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      // Parallel Fetch
      const [
        { data: sData }, { data: uData }, { data: bData }, { data: hData },
        { data: attData }, { data: exData }, { data: actData }, { data: acData },
        { data: maintData }, { data: setData }
      ] = await Promise.all([
        supabase.from('students').select('*'),
        supabase.from('users').select('*'),
        supabase.from('behaviorRecords').select('*'),
        supabase.from('healthRecords').select('*'),
        supabase.from('attendanceRecords').select('*'),
        supabase.from('exitRecords').select('*'),
        supabase.from('activityRecords').select('*'),
        supabase.from('academicRecords').select('*'),
        supabase.from('maintenanceRequests').select('*'),
        supabase.from('settings').select('*')
      ]);

      if (sData) setStudents(sData);
      if (uData && uData.length > 0) setUsers(uData as User[]);
      else {
        // Fallback if no users exist (first run)
        setUsers([MOCK_USER]);
        // Optionally save mock user to DB
        // supabase.from('users').insert(MOCK_USER);
      }

      if (bData) setBehaviorRecords(bData);
      if (hData) setHealthRecords(hData);
      if (attData) setAttendanceRecords(attData);
      if (exData) setExitRecords(exData as any);
      if (actData) setActivityRecords(actData as any);
      if (acData) setAcademicRecords(acData as any);
      if (maintData) setMaintenanceRequests(maintData);

      // Parse settings
      if (setData) {
        const settingsMap: any = {};
        setData.forEach((item: any) => {
          settingsMap[item.key] = item.value;
        });
        if (settingsMap.menus) setWeeklyMenus(settingsMap.menus);
        if (settingsMap.schoolSettings) setSchoolSettings(settingsMap.schoolSettings);
      }

      setIsLoading(false);
    };

    fetchData();

    // --- Realtime Subscriptions ---
    const channels = [
      supabase.channel('public:students').on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, payload => {
        if (payload.eventType === 'INSERT') setStudents(prev => [...prev, payload.new as Student]);
        if (payload.eventType === 'UPDATE') setStudents(prev => prev.map(s => s.id === payload.new.id ? payload.new as Student : s));
        if (payload.eventType === 'DELETE') setStudents(prev => prev.filter(s => s.id !== payload.old.id));
      }).subscribe(),

      supabase.channel('public:users').on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, payload => {
        if (payload.eventType === 'INSERT') setUsers(prev => [...prev, payload.new as User]);
        if (payload.eventType === 'UPDATE') setUsers(prev => prev.map(u => u.id === payload.new.id ? payload.new as User : u));
        if (payload.eventType === 'DELETE') setUsers(prev => prev.filter(u => u.id !== payload.old.id));
      }).subscribe(),

      supabase.channel('public:behaviorRecords').on('postgres_changes', { event: '*', schema: 'public', table: 'behaviorRecords' }, payload => {
        if (payload.eventType === 'INSERT') setBehaviorRecords(prev => [payload.new as BehaviorRecord, ...prev]);
        if (payload.eventType === 'UPDATE') setBehaviorRecords(prev => prev.map(r => r.id === payload.new.id ? payload.new as BehaviorRecord : r));
        if (payload.eventType === 'DELETE') setBehaviorRecords(prev => prev.filter(r => r.id !== payload.old.id));
      }).subscribe(),

      supabase.channel('public:healthRecords').on('postgres_changes', { event: '*', schema: 'public', table: 'healthRecords' }, payload => {
        if (payload.eventType === 'INSERT') setHealthRecords(prev => [payload.new as HealthRecord, ...prev]);
        if (payload.eventType === 'UPDATE') setHealthRecords(prev => prev.map(r => r.id === payload.new.id ? payload.new as HealthRecord : r));
        if (payload.eventType === 'DELETE') setHealthRecords(prev => prev.filter(r => r.id !== payload.old.id));
      }).subscribe(),

      supabase.channel('public:attendanceRecords').on('postgres_changes', { event: '*', schema: 'public', table: 'attendanceRecords' }, payload => {
        if (payload.eventType === 'INSERT') setAttendanceRecords(prev => [...prev, payload.new as AttendanceRecord]);
        if (payload.eventType === 'UPDATE') setAttendanceRecords(prev => prev.map(r => r.id === payload.new.id ? payload.new as AttendanceRecord : r));
        // Attendance usually isn't deleted, but strictly speaking handled here
      }).subscribe(),

      supabase.channel('public:exitRecords').on('postgres_changes', { event: '*', schema: 'public', table: 'exitRecords' }, payload => {
        if (payload.eventType === 'INSERT') setExitRecords(prev => [payload.new as any, ...prev]);
        if (payload.eventType === 'UPDATE') setExitRecords(prev => prev.map(r => r.id === payload.new.id ? payload.new as any : r));
        if (payload.eventType === 'DELETE') setExitRecords(prev => prev.filter(r => r.id !== payload.old.id));
      }).subscribe(),

      supabase.channel('public:activityRecords').on('postgres_changes', { event: '*', schema: 'public', table: 'activityRecords' }, payload => {
        if (payload.eventType === 'INSERT') setActivityRecords(prev => [payload.new as any, ...prev]);
        if (payload.eventType === 'UPDATE') setActivityRecords(prev => prev.map(r => r.id === payload.new.id ? payload.new as any : r));
        if (payload.eventType === 'DELETE') setActivityRecords(prev => prev.filter(r => r.id !== payload.old.id));
      }).subscribe(),

      supabase.channel('public:academicRecords').on('postgres_changes', { event: '*', schema: 'public', table: 'academicRecords' }, payload => {
        if (payload.eventType === 'INSERT') setAcademicRecords(prev => [payload.new as any, ...prev]);
        if (payload.eventType === 'UPDATE') setAcademicRecords(prev => prev.map(r => r.id === payload.new.id ? payload.new as any : r));
        if (payload.eventType === 'DELETE') setAcademicRecords(prev => prev.filter(r => r.id !== payload.old.id));
      }).subscribe(),

      supabase.channel('public:maintenanceRequests').on('postgres_changes', { event: '*', schema: 'public', table: 'maintenanceRequests' }, payload => {
        if (payload.eventType === 'INSERT') setMaintenanceRequests(prev => [payload.new as MaintenanceRequest, ...prev]);
        if (payload.eventType === 'UPDATE') setMaintenanceRequests(prev => prev.map(r => r.id === payload.new.id ? payload.new as MaintenanceRequest : r));
        if (payload.eventType === 'DELETE') setMaintenanceRequests(prev => prev.filter(r => r.id !== payload.old.id));
      }).subscribe(),

      supabase.channel('public:settings').on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, payload => {
        if (payload.new && (payload.new as any).key === 'menus') setWeeklyMenus((payload.new as any).value);
        if (payload.new && (payload.new as any).key === 'schoolSettings') setSchoolSettings((payload.new as any).value);
      }).subscribe(),
    ];

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, []);

  // --- Actions (Direct DB Calls) ---

  // Auth
  const login = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
      setIsAuthenticated(true);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  // Settings
  const updateSchoolSettings = async (settings: SchoolSettings) => {
    // optimistic update
    setSchoolSettings(settings); // Immediate local feedback

    // DB update (upsert)
    const { error } = await supabase.from('settings').upsert({ key: 'schoolSettings', value: settings }, { onConflict: 'key' });
    if (error) console.error("Error updating settings:", error);
  };

  const updateWeeklyMenus = async (menus: WeeklyMenus) => {
    setWeeklyMenus(menus);
    const { error } = await supabase.from('settings').upsert({ key: 'menus', value: menus }, { onConflict: 'key' });
    if (error) console.error("Error updating menus:", error);
  };

  // Students
  const addStudent = async (student: Student) => {
    // We let realtime handle the state update, OR we can do optimistic update
    // For simplicity with Supabase Realtime, we fire and forget usually, but minimal optimistic helps responsiveness.
    // However, existing UI depends on immediate results? Actually realtime is fast enough usually.
    // Let's rely on realtime for "adding" to avoid ID conflicts (though we generate IDs client side often).
    await supabase.from('students').insert(student);
  };

  const updateStudent = async (student: Student) => {
    await supabase.from('students').update(student).eq('id', student.id);
  };

  const deleteStudent = async (id: string) => {
    await supabase.from('students').delete().eq('id', id);
    // Handled by Cascade in SQL but good to be explicit if needed, 
    // though our SQL schema has ON DELETE CASCADE for foreign keys!
  };

  // Users
  const addUser = async (user: User) => {
    await supabase.from('users').insert(user);
  };
  const updateUser = async (user: User) => {
    await supabase.from('users').update(user).eq('id', user.id);
    if (currentUser && currentUser.id === user.id) setCurrentUser(user);
  };
  const deleteUser = async (id: string) => {
    if (window.confirm('تأكيد حذف المستخدم؟')) {
      await supabase.from('users').delete().eq('id', id);
    }
  };

  // Health
  const addHealthRecord = async (record: HealthRecord) => {
    await supabase.from('healthRecords').insert(record);
  };
  const updateHealthRecord = async (record: HealthRecord) => {
    await supabase.from('healthRecords').update(record).eq('id', record.id);
  };
  const deleteHealthRecord = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا السجل الصحي؟')) {
      await supabase.from('healthRecords').delete().eq('id', id);
    }
  };

  // Behavior
  const addBehaviorRecord = async (record: BehaviorRecord) => {
    await supabase.from('behaviorRecords').insert(record);
  };
  const updateBehaviorRecord = async (record: BehaviorRecord) => {
    await supabase.from('behaviorRecords').update(record).eq('id', record.id);
  };
  const deleteBehaviorRecord = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا السجل السلوكي؟')) {
      await supabase.from('behaviorRecords').delete().eq('id', id);
    }
  };

  // Attendance
  const updateAttendance = async (studentId: string, status: 'present' | 'absent' | 'late') => {
    const today = new Date().toISOString().split('T')[0];

    // Check if exists
    const { data: existing } = await supabase.from('attendanceRecords')
      .select('*')
      .eq('studentId', studentId)
      .eq('date', today)
      .maybeSingle();

    if (existing) {
      await supabase.from('attendanceRecords').update({ status }).eq('id', existing.id);
    } else {
      await supabase.from('attendanceRecords').insert({
        id: crypto.randomUUID(),
        studentId,
        date: today,
        status,
        type: 'study'
      });
    }
  };

  // Exits
  const addExitRecord = async (record: ExitRecord) => {
    await supabase.from('exitRecords').insert(record);
  };
  const deleteExitRecord = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف سجل الخروج هذا؟')) {
      await supabase.from('exitRecords').delete().eq('id', id);
    }
  };

  // Activities
  const addActivity = async (activity: ActivityRecord) => {
    await supabase.from('activityRecords').insert(activity);
  };
  const updateActivity = async (activity: ActivityRecord) => {
    await supabase.from('activityRecords').update(activity).eq('id', activity.id);
  };
  const deleteActivity = async (id: string) => {
    if (window.confirm('تأكيد حذف النشاط؟')) {
      await supabase.from('activityRecords').delete().eq('id', id);
    }
  };

  // Academics
  const addAcademicRecord = async (record: AcademicRecord) => {
    await supabase.from('academicRecords').insert(record);
  };
  const updateAcademicRecord = async (record: AcademicRecord) => {
    await supabase.from('academicRecords').update(record).eq('id', record.id);
  };
  const deleteAcademicRecord = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا السجل الدراسي؟')) {
      await supabase.from('academicRecords').delete().eq('id', id);
    }
  };

  // Maintenance
  const addMaintenanceRequest = async (record: MaintenanceRequest) => {
    await supabase.from('maintenanceRequests').insert(record);
  };
  const updateMaintenanceRequest = async (record: MaintenanceRequest) => {
    await supabase.from('maintenanceRequests').update(record).eq('id', record.id);
  };
  const deleteMaintenanceRequest = async (id: string) => {
    if (window.confirm('تأكيد حذف طلب الصيانة؟')) {
      await supabase.from('maintenanceRequests').delete().eq('id', id);
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
      isLoading
    } as any}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) throw new Error('useData must be used within a DataProvider');
  return context;
};
