import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Users, AlertTriangle, CheckCircle, BedDouble, Upload, Bell, Filter, Phone,
  MessageCircle, Send, Wrench, GraduationCap, HeartPulse, Star
} from 'lucide-react';
import ImportModal from '../components/ImportModal';
import { useData } from '../context/DataContext';
import { Student, HealthRecord, BehaviorRecord, AttendanceRecord, MaintenanceRequest, AcademicRecord, UserRole } from '../types';


// Hardcoded fallback data removed in favor of dynamic calculation


const COLORS = ['#10b981', '#ef4444'];

interface AlertItem {
  id: string;
  type: 'health' | 'behavior';
  studentId: string;
  studentName: string;
  description: string;
  detail: string;
  date: string;
  severity: string;
  isCritical: boolean;
}


const Dashboard: React.FC = () => {
  const {
    students,
    behaviorRecords,
    healthRecords,
    maintenanceRequests,
    academicRecords,
    attendanceRecords,
    currentUser
  } = useData();
  const [showImportModal, setShowImportModal] = useState(false);
  const [alertFilter, setAlertFilter] = useState<'all' | 'health' | 'behavior'>('all');

  // Filter Data for Parents
  const isParent = currentUser?.role === UserRole.PARENT;
  const linkedStudentIds = currentUser?.linkedStudentIds || [];

  const relevantStudents = isParent
    ? students.filter((s: Student) => linkedStudentIds.includes(s.id))
    : students;

  const relevantHealthRecords = isParent
    ? healthRecords.filter((h: HealthRecord) => linkedStudentIds.includes(h.studentId))
    : healthRecords;

  const relevantBehaviorRecords = isParent
    ? behaviorRecords.filter((b: BehaviorRecord) => linkedStudentIds.includes(b.studentId))
    : behaviorRecords;

  // Compute Dynamic Stats
  const activeHealthCases = relevantHealthRecords.length;
  const totalStudents = relevantStudents.length;

  // Compute Maintenance Stats
  const maintenanceStats = useMemo(() => {
    return {
      pending: maintenanceRequests.filter((m: MaintenanceRequest) => m.status === 'pending').length,
      inProgress: maintenanceRequests.filter((m: MaintenanceRequest) => m.status === 'in_progress').length,
      completed: maintenanceRequests.filter((m: MaintenanceRequest) => m.status === 'completed').length
    };
  }, [maintenanceRequests]);

  // Compute Behavior Stats for Chart
  const behaviorStats = useMemo(() => {
    const positive = relevantBehaviorRecords.filter((b: BehaviorRecord) => b.type === 'positive').length;
    const negative = relevantBehaviorRecords.filter((b: BehaviorRecord) => b.type === 'negative').length;
    // Default values if empty to show chart
    if (positive === 0 && negative === 0) return [{ name: 'إيجابي', value: 70 }, { name: 'سلبي', value: 30 }];
    return [
      { name: 'إيجابي', value: positive },
      { name: 'سلبي', value: negative }
    ];
  }, [relevantBehaviorRecords]);

  // Compute Weekly Attendance Stats for Chart
  const dynamicAttendanceData = useMemo(() => {
    const arabicDays = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const today = new Date();
    const result = [];

    // Calculate for the last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = arabicDays[d.getDay()];

      const dayRecords = attendanceRecords.filter((r: AttendanceRecord) => {
        const isDate = r.date === dateStr;
        if (isParent) {
          return isDate && linkedStudentIds.includes(r.studentId);
        }
        return isDate;
      });

      const presentCount = dayRecords.filter((r: AttendanceRecord) => r.status === 'present' || r.status === 'late').length;
      const absentCount = dayRecords.filter((r: AttendanceRecord) => r.status === 'absent').length;
      const total = presentCount + absentCount;

      if (total > 0) {
        result.push({
          name: dayName,
          حضور: Math.round((presentCount / total) * 100),
          غياب: Math.round((absentCount / total) * 100)
        });
      } else {
        // Fallback to 0 if no records found for the day
        result.push({
          name: dayName,
          حضور: 0,
          غياب: 0
        });
      }
    }

    return result;
  }, [attendanceRecords, isParent, linkedStudentIds]);

  // Compute Today's Attendance Rate
  const todayAttendanceRate = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const dayRecords = attendanceRecords.filter((r: AttendanceRecord) => {
      const isToday = r.date === todayStr;
      if (isParent) {
        return isToday && linkedStudentIds.includes(r.studentId);
      }
      return isToday;
    });

    const total = dayRecords.length;
    if (total === 0) return 0;

    const presentCount = dayRecords.filter((r: AttendanceRecord) => r.status === 'present' || r.status === 'late').length;
    return Math.round((presentCount / total) * 100);
  }, [attendanceRecords, isParent, linkedStudentIds]);

  // Compute Alerts Feed
  const alerts = useMemo(() => {
    const combined: AlertItem[] = [];



    // Health Alerts
    relevantHealthRecords.forEach((h: HealthRecord) => {
      const student = students.find((s: Student) => s.id === h.studentId);
      combined.push({
        id: `h-${h.id}`,
        type: 'health',
        studentId: h.studentId, // Added for contact info lookup
        studentName: student?.fullName || 'غير معروف',
        description: h.condition,
        detail: h.notes,
        date: h.date,
        severity: h.severity,
        isCritical: h.severity === 'high' || h.severity === 'medium'
      });
    });

    // Behavior Alerts (Only Negative)
    relevantBehaviorRecords.forEach((b: BehaviorRecord) => {
      if (b.type === 'negative') {
        const student = students.find((s: Student) => s.id === b.studentId);
        combined.push({
          id: `b-${b.id}`,
          type: 'behavior',
          studentId: b.studentId, // Added for contact info lookup
          studentName: student?.fullName || 'غير معروف',
          description: b.category === 'discipline' ? 'مخالفة انضباط' : 'سلوك سلبي',
          detail: b.description,
          date: b.date,
          severity: 'medium',
          isCritical: true
        });
      }
    });

    // Sort by date descending
    return combined.sort((a: AlertItem, b: AlertItem) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [relevantHealthRecords, relevantBehaviorRecords, students]);

  const filteredAlerts = alerts.filter((a: AlertItem) => {
    if (alertFilter === 'all') return true;
    return a.type === alertFilter;
  });

  // Helper to format WhatsApp Message
  const getWhatsAppLink = (phone: string, alert: AlertItem) => {
    if (!phone) return '#';
    const cleanPhone = phone.replace(/\s/g, '').replace(/^0/, '212');

    let message = '';
    if (alert.type === 'health') {
      message = `السلام عليكم، إدارة "مرافقة" تخبركم أن التلميذ ${alert.studentName} يعاني من: ${alert.description}. التفاصيل: ${alert.detail}. المرجو المتابعة.`;
    } else {
      message = `السلام عليكم، إدارة "مرافقة" تود إخباركم بتسجيل ملاحظة سلوكية للتلميذ ${alert.studentName}: ${alert.description}. التفاصيل: ${alert.detail}. المرجو التواصل معنا.`;
    }

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">
          {isParent ? 'متابعة أبنائي - لوحة القيادة الشاملة' : 'لوحة القيادة العامة'}
        </h2>
        {(currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.SUPERVISOR) && (
          <button
            onClick={() => setShowImportModal(true)}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700 shadow-md transition-all hover:scale-105 font-bold"
          >
            <Upload className="w-5 h-5" />
            <span>استيراد ذكي للبيانات</span>
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-emerald-500 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-bold">{isParent ? 'الأبناء المسجلين' : 'مجموع التلاميذ'}</p>
              <h3 className="text-3xl font-bold text-gray-800">{totalStudents}</h3>
            </div>
            <div className="p-3 bg-emerald-100 rounded-full text-emerald-600">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-bold">نسبة الحضور اليوم</p>
              <h3 className="text-3xl font-bold text-gray-800">{todayAttendanceRate}%</h3>
            </div>
            <div className="p-3 bg-blue-100 rounded-full text-blue-600">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-yellow-500 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-bold">ملاحظات صحية</p>
              <h3 className="text-3xl font-bold text-gray-800">{activeHealthCases}</h3>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full text-yellow-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-purple-500 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-500 font-bold mb-2">{isParent ? 'تنبيهات سلوكية' : 'طلبات الصيانة'}</p>
              {isParent ? (
                <h3 className="text-3xl font-bold text-gray-800">
                  {relevantBehaviorRecords.filter(b => b.type === 'negative').length}
                </h3>
              ) : (
                <div className="flex gap-3 text-sm">
                  <div className="flex flex-col items-center">
                    <span className="font-bold text-lg text-red-500 leading-none">{maintenanceStats.pending}</span>
                    <span className="text-[10px] text-gray-400">معلقة</span>
                  </div>
                  <div className="w-px h-8 bg-gray-200"></div>
                  <div className="flex flex-col items-center">
                    <span className="font-bold text-lg text-amber-500 leading-none">{maintenanceStats.inProgress}</span>
                    <span className="text-[10px] text-gray-400">جارية</span>
                  </div>
                  <div className="w-px h-8 bg-gray-200"></div>
                  <div className="flex flex-col items-center">
                    <span className="font-bold text-lg text-emerald-500 leading-none">{maintenanceStats.completed}</span>
                    <span className="text-[10px] text-gray-400">منجزة</span>
                  </div>
                </div>
              )}
            </div>
            <div className="p-3 bg-purple-100 rounded-full text-purple-600">
              {isParent ? <BedDouble className="w-6 h-6" /> : <Wrench className="w-6 h-6" />}
            </div>
          </div>
        </div>
      </div>

      {/* PARENT SPECIFIC OVERVIEW SECTION */}
      {isParent && (
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
            <Users className="w-6 h-6 text-emerald-600" />
            بطاقة متابعة الأبناء
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {relevantStudents.map((student: Student) => {
              // Academics
              const studentAcademics = academicRecords.filter((r: AcademicRecord) => r.studentId === student.id);
              const latestAcademic = studentAcademics.sort((a: AcademicRecord, b: AcademicRecord) => b.schoolYear.localeCompare(a.schoolYear) || b.semester.localeCompare(a.semester))[0];

              // Health
              const studentHealth = healthRecords.filter((r: HealthRecord) => r.studentId === student.id);
              const latestHealth = studentHealth.sort((a: HealthRecord, b: HealthRecord) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

              // Behavior
              const studentBehavior = behaviorRecords.filter((r: BehaviorRecord) => r.studentId === student.id);
              const positiveCount = studentBehavior.filter((b: BehaviorRecord) => b.type === 'positive').length;
              const negativeCount = studentBehavior.filter((b: BehaviorRecord) => b.type === 'negative').length;
              const latestBehavior = studentBehavior.sort((a: BehaviorRecord, b: BehaviorRecord) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

              // Attendance
              const today = new Date().toISOString().split('T')[0];
              const todayAttendance = attendanceRecords.find((a: AttendanceRecord) => a.studentId === student.id && a.date === today);

              return (
                <div key={student.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all">
                  {/* Header */}
                  <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center gap-4">
                    <img src={student.photoUrl} alt={student.fullName} className="w-12 h-12 rounded-full border-2 border-white shadow-sm object-cover" />
                    <div className="min-w-0">
                      <h4 className="font-bold text-gray-900 truncate">{student.fullName}</h4>
                      <p className="text-xs text-gray-500">{student.grade}</p>
                    </div>
                    <div className="mr-auto flex-shrink-0">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${!todayAttendance ? 'bg-gray-100 text-gray-500' :
                        todayAttendance.status === 'present' ? 'bg-emerald-100 text-emerald-700' :
                          todayAttendance.status === 'absent' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                        }`}>
                        {!todayAttendance ? 'غير مسجل' :
                          todayAttendance.status === 'present' ? 'حاضر' :
                            todayAttendance.status === 'absent' ? 'غائب' : 'متأخر'}
                      </span>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="p-4 grid grid-cols-1 gap-3">
                    {/* Academic Summary */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50/50 border border-blue-100">
                      <div className="p-2 bg-blue-100 text-blue-600 rounded-lg flex-shrink-0">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-500 mb-1">النتائج الدراسية</p>
                        {latestAcademic ? (
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-blue-900 text-lg">{latestAcademic.generalAverage} <span className="text-xs font-normal text-gray-400">/ 20</span></span>
                            <span className="text-[10px] bg-white px-2 py-0.5 rounded text-blue-600 border border-blue-100">{latestAcademic.semester}</span>
                          </div>
                        ) : (
                          <p className="text-sm font-medium text-gray-400">لا توجد نتائج مسجلة</p>
                        )}
                      </div>
                    </div>

                    {/* Health Summary */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50/50 border border-red-100">
                      <div className="p-2 bg-red-100 text-red-600 rounded-lg flex-shrink-0">
                        <HeartPulse className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-500 mb-1">الحالة الصحية</p>
                        {latestHealth ? (
                          <div>
                            <p className="font-bold text-gray-800 text-sm truncate">{latestHealth.condition}</p>
                            <p className="text-[10px] text-gray-500 font-mono mt-0.5">{latestHealth.date}</p>
                          </div>
                        ) : (
                          <p className="text-sm font-bold text-emerald-600">سليم ولله الحمد</p>
                        )}
                      </div>
                    </div>

                    {/* Behavior Summary */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50/50 border border-purple-100">
                      <div className="p-2 bg-purple-100 text-purple-600 rounded-lg flex-shrink-0">
                        <Star className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-500 mb-1">السلوك والمواظبة</p>
                        <div className="flex gap-2 mb-1">
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">{positiveCount} إيجابي</span>
                          <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">{negativeCount} ملاحظة</span>
                        </div>
                        {latestBehavior ? (
                          <p className="text-[10px] text-gray-400 truncate w-full">آخر ملاحظة: {latestBehavior.description}</p>
                        ) : <p className="text-[10px] text-gray-400">سجل نظيف</p>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Charts Section - Only show attendance chart to admins/supervisors generally, or simplified for parents */}
        <div className="xl:col-span-2 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold mb-4 text-gray-800">تتبع الحضور الأسبوعي</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dynamicAttendanceData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    />
                    <Legend />
                    <Bar dataKey="حضور" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="غياب" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold mb-4 text-gray-800">توزيع السلوكيات</h3>
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={behaviorStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {behaviorStats.map((entry: { name: string, value: number }, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.name === 'إيجابي' ? '#10b981' : '#ef4444'} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Alerts Feed */}
        <div className="xl:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full max-h-[700px]">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl sticky top-0 z-10">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Bell className="w-5 h-5 text-red-500 animate-pulse" />
                {isParent ? 'مستجدات أبنائي' : 'آخر التنبيهات'}
              </h3>
              <div className="flex gap-1 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                <button
                  onClick={() => setAlertFilter('all')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${alertFilter === 'all' ? 'bg-gray-800 text-white shadow' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  الكل
                </button>
                <button
                  onClick={() => setAlertFilter('health')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${alertFilter === 'health' ? 'bg-red-500 text-white shadow' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  صحة
                </button>
                <button
                  onClick={() => setAlertFilter('behavior')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${alertFilter === 'behavior' ? 'bg-orange-500 text-white shadow' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  سلوك
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3">
              {filteredAlerts.length === 0 ? (
                <div className="text-center py-12 text-gray-400 flex flex-col items-center">
                  <CheckCircle className="w-12 h-12 mb-2 opacity-20" />
                  <p className="font-medium">لا توجد تنبيهات جديدة</p>
                </div>
              ) : (
                filteredAlerts.map((alert: AlertItem) => {
                  const studentInfo = students.find((s: Student) => s.id === alert.studentId);
                  const guardianPhone = studentInfo?.guardianPhone;

                  return (
                    <div key={alert.id} className={`p-4 rounded-xl border-l-4 shadow-sm hover:shadow-md transition-all bg-white border border-gray-100 group ${alert.type === 'health'
                      ? 'border-l-red-500'
                      : 'border-l-orange-500'
                      }`}>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex flex-col">
                          <span className="text-xs font-mono text-gray-400 mb-0.5">{alert.date}</span>
                          <h4 className="font-bold text-gray-800 text-sm">{alert.studentName}</h4>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full text-white font-bold shadow-sm ${alert.type === 'health' ? 'bg-red-500' : 'bg-orange-500'
                          }`}>
                          {alert.type === 'health' ? 'صحي' : 'سلوكي'}
                        </span>
                      </div>

                      <div className="bg-gray-50 p-2.5 rounded-lg mb-2">
                        <p className="text-gray-800 font-bold text-sm mb-1">{alert.description}</p>
                        <p className="text-gray-600 text-xs leading-relaxed">{alert.detail}</p>
                      </div>

                      {alert.isCritical && (
                        <div className="mt-1 flex items-center gap-1 text-red-600 text-xs font-bold">
                          <AlertTriangle className="w-3 h-3" />
                          <span>انتباه: حالة تتطلب المتابعة</span>
                        </div>
                      )}

                      {/* Contact Actions (Only for Admin/Supervisor) */}
                      {!isParent && guardianPhone && (
                        <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                          <a
                            href={getWhatsAppLink(guardianPhone, alert)}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 bg-green-50 text-green-700 text-xs font-bold py-1.5 rounded-lg hover:bg-green-100 flex items-center justify-center gap-1 transition-colors"
                            title="إرسال عبر واتساب"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            واتساب
                          </a>
                          <a
                            href={`tel:${guardianPhone}`}
                            className="flex-1 bg-blue-50 text-blue-700 text-xs font-bold py-1.5 rounded-lg hover:bg-blue-100 flex items-center justify-center gap-1 transition-colors"
                            title="اتصال هاتفي"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            اتصال
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-3 border-t border-gray-100 bg-gray-50 text-center rounded-b-xl">
              <button className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline">عرض كل السجل</button>
            </div>
          </div>
        </div>
      </div>

      <ImportModal isOpen={showImportModal} onClose={() => setShowImportModal(false)} type="students" />
    </div>
  );
};

export default Dashboard;