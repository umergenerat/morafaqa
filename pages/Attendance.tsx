import React, { useState, useMemo } from 'react';
import { Save, Upload, Check, Clock, X, LogOut, Calendar, Plus, MapPin, Search, Users, CheckSquare, Square, Filter, FileDown, ArrowLeftRight, History, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown, Home } from 'lucide-react';
import ImportModal from '../components/ImportModal';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { ExitRecord, ExitType, UserRole } from '../types';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

// Helper Component for Sort Icon
const SortHeader = ({ label, sortKey, activeConfig, onSort }: { label: string, sortKey: string, activeConfig: { key: string, direction: 'asc' | 'desc' } | null, onSort: () => void }) => {
  return (
    <th
      className="px-6 py-4 text-sm font-bold text-gray-700 cursor-pointer hover:bg-gray-200/50 transition-colors select-none group whitespace-nowrap"
      onClick={onSort}
    >
      <div className="flex items-center gap-1">
        {label}
        <span className="opacity-50 group-hover:opacity-100 transition-opacity">
          {activeConfig && activeConfig.key === sortKey ? (
            activeConfig.direction === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-emerald-600" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
          )}
        </span>
      </div>
    </th>
  );
};

const Attendance: React.FC = () => {
  const { t } = useLanguage();
  const { students, attendanceRecords, updateAttendance, exitRecords, addExitRecord, deleteExitRecord, currentUser, schoolSettings } = useData();
  const [showImportModal, setShowImportModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'daily' | 'exits'>('daily');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Sorting State
  const [dailySort, setDailySort] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [exitSort, setExitSort] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  // Exit Modal State
  const [showExitModal, setShowExitModal] = useState(false);
  const [newExit, setNewExit] = useState<Partial<ExitRecord>>({
    type: 'long',
    startDate: new Date().toISOString().split('T')[0],
    returnDate: ''
  });

  // Bulk Selection State
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentFilter, setStudentFilter] = useState('');

  // Exit View Filter State
  const [exitSearchTerm, setExitSearchTerm] = useState('');
  const [exitFilterType, setExitFilterType] = useState<ExitType | 'ALL'>('ALL');
  const [exitStatusFilter, setExitStatusFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRED'>('ALL');

  // Room Filter States
  const [roomFilterDaily, setRoomFilterDaily] = useState<string>('ALL');
  const [roomFilterModal, setRoomFilterModal] = useState<string>('ALL');

  const today = new Date().toISOString().split('T')[0];
  const isParent = currentUser?.role === UserRole.PARENT;

  // Helpers for Status
  const getStatus = (studentId: string) => {
    const record = attendanceRecords.find(r => r.studentId === studentId && r.date === today);
    return record?.status; // undefined (not set), present, absent, late
  };

  // استخراج الغرف الفريدة
  const uniqueRooms = useMemo(() => {
    const rooms = [...new Set(students.map(s => s.roomNumber))];
    return rooms.sort((a, b) => a.localeCompare(b, 'ar', { numeric: true }));
  }, [students]);

  // Filter students for display (Main View)
  const displayedStudents = useMemo(() => {
    let list = isParent
      ? students.filter(s => currentUser?.linkedStudentIds?.includes(s.id))
      : students;

    // تصفية حسب الغرفة
    if (roomFilterDaily !== 'ALL') {
      list = list.filter(s => s.roomNumber === roomFilterDaily);
    }

    if (dailySort) {
      return [...list].sort((a, b) => {
        let valA: any = '';
        let valB: any = '';

        if (dailySort.key === 'student') {
          valA = a.fullName;
          valB = b.fullName;
        } else if (dailySort.key === 'room') {
          valA = a.roomNumber;
          valB = b.roomNumber;
        } else if (dailySort.key === 'status') {
          valA = getStatus(a.id) || 'z'; // 'z' makes empty/unrecorded come last in asc
          valB = getStatus(b.id) || 'z';
        }

        if (valA < valB) return dailySort.direction === 'asc' ? -1 : 1;
        if (valA > valB) return dailySort.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return list;
  }, [students, isParent, currentUser, dailySort, attendanceRecords, today, getStatus, roomFilterDaily]);

  // ----------------------------------------------------------------------
  // Enhanced Exit Logic
  // ----------------------------------------------------------------------

  // Base list of exits based on role
  const baseExits = isParent
    ? exitRecords.filter(e => currentUser?.linkedStudentIds?.includes(e.studentId))
    : exitRecords;

  // Filter exits for display
  const filteredExits = useMemo(() => {
    const result = baseExits.filter(record => {
      const student = students.find(s => s.id === record.studentId);
      const matchesSearch = student?.fullName.toLowerCase().includes(exitSearchTerm.toLowerCase()) ||
        student?.roomNumber.includes(exitSearchTerm);
      const matchesType = exitFilterType === 'ALL' || record.type === exitFilterType;

      const isExpired = new Date(record.returnDate) < new Date(today);
      const matchesStatus = exitStatusFilter === 'ALL'
        ? true
        : exitStatusFilter === 'ACTIVE'
          ? !isExpired
          : isExpired;

      return matchesSearch && matchesType && matchesStatus;
    });

    // Sort Logic
    if (exitSort) {
      result.sort((a, b) => {
        let valA: any = '';
        let valB: any = '';
        const studentA = students.find(s => s.id === a.studentId);
        const studentB = students.find(s => s.id === b.studentId);

        if (exitSort.key === 'student') {
          valA = studentA?.fullName || '';
          valB = studentB?.fullName || '';
        } else if (exitSort.key === 'type') {
          valA = a.type;
          valB = b.type;
        } else if (exitSort.key === 'startDate') {
          valA = a.startDate;
          valB = b.startDate;
        } else if (exitSort.key === 'returnDate') {
          valA = a.returnDate;
          valB = b.returnDate;
        } else if (exitSort.key === 'status') {
          valA = new Date(a.returnDate) >= new Date(today) ? 1 : 0; // 1 = Active, 0 = Expired
          valB = new Date(b.returnDate) >= new Date(today) ? 1 : 0;
        }

        if (valA < valB) return exitSort.direction === 'asc' ? -1 : 1;
        if (valA > valB) return exitSort.direction === 'asc' ? 1 : -1;
        return 0;
      });
    } else {
      // Default Sort: Most recent start date first
      result.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    }

    return result;
  }, [baseExits, exitSearchTerm, exitFilterType, exitStatusFilter, students, today, exitSort]);

  // Statistics for Exits
  const exitStats = useMemo(() => {
    const active = baseExits.filter(e => new Date(e.returnDate) >= new Date(today)).length;
    const short = baseExits.filter(e => e.type === 'short' && new Date(e.returnDate) >= new Date(today)).length;
    const long = baseExits.filter(e => e.type === 'long' && new Date(e.returnDate) >= new Date(today)).length;
    return { active, short, long };
  }, [baseExits, today]);

  // Filter students for Modal Selection
  const filteredStudentsForSelection = useMemo(() => {
    return students.filter(s =>
      (s.fullName.toLowerCase().includes(studentFilter.toLowerCase()) ||
        s.roomNumber.includes(studentFilter)) &&
      (roomFilterModal === 'ALL' || s.roomNumber === roomFilterModal)
    );
  }, [students, studentFilter, roomFilterModal]);

  const saveAttendance = () => {
    alert(t('save') + '!');
  };

  const toggleStudentSelection = (id: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedStudentIds.length === filteredStudentsForSelection.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudentsForSelection.map(s => s.id));
    }
  };

  const handleSaveExit = () => {
    if (selectedStudentIds.length === 0) {
      alert("المرجو اختيار تلميذ واحد على الأقل.");
      return;
    }
    if (!newExit.startDate || !newExit.returnDate) {
      alert("المرجو تحديد تواريخ الخروج والعودة.");
      return;
    }

    // Create a record for each selected student
    selectedStudentIds.forEach(studentId => {
      addExitRecord({
        id: crypto.randomUUID(),
        studentId: studentId,
        type: newExit.type as ExitType,
        startDate: newExit.startDate || '',
        returnDate: newExit.returnDate || '',
        notes: newExit.notes || '',
        isApproved: true
      });
    });

    setShowExitModal(false);
    // Reset States
    setNewExit({ type: 'long', startDate: today, returnDate: '' });
    setSelectedStudentIds([]);
    setStudentFilter('');
  };

  const getExitTypeLabel = (type: ExitType) => {
    switch (type) {
      case 'short': return { text: t('short_exit'), color: 'bg-blue-50 text-blue-700 border-blue-100', icon: <Clock className="w-3 h-3" /> };
      case 'long': return { text: t('long_exit'), color: 'bg-green-50 text-green-700 border-green-100', icon: <Calendar className="w-3 h-3" /> };
      case 'authorized': return { text: t('authorized_exit'), color: 'bg-purple-50 text-purple-700 border-purple-100', icon: <Check className="w-3 h-3" /> };
      default: return { text: type, color: 'bg-gray-100', icon: null };
    }
  };

  const openExitModal = () => {
    setSelectedStudentIds([]);
    setStudentFilter('');
    setRoomFilterModal('ALL');
    setShowExitModal(true);
  }

  const handleDownloadPDF = async () => {
    setIsGeneratingPdf(true);
    const element = document.getElementById('printable-exit-list');

    if (element) {
      try {
        // Temporarily reveal the header for the screenshot
        const headerEl = document.getElementById('pdf-header');
        if (headerEl) headerEl.style.display = 'block';

        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });

        // Hide the header again
        if (headerEl) headerEl.style.display = 'none';

        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Exits_Registry_${today}.pdf`);
      } catch (error) {
        console.error("PDF Generation failed", error);
        alert("حدث خطأ أثناء تحميل الملف.");
      }
    }
    setIsGeneratingPdf(false);
  };

  // Sorting Handler
  const handleSort = (key: string, type: 'daily' | 'exit') => {
    const config = type === 'daily' ? dailySort : exitSort;
    const setConfig = type === 'daily' ? setDailySort : setExitSort;

    let direction: 'asc' | 'desc' = 'asc';
    if (config && config.key === key && config.direction === 'asc') {
      direction = 'desc';
    }
    setConfig({ key, direction });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{t('attendance')}</h2>
          <p className="text-gray-500 mt-1">
            {isParent ? 'سجل حضور أبنائي' : (activeTab === 'daily' ? t('daily_attendance') : t('weekly_exits'))}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="bg-white p-1 rounded-lg border border-gray-200 flex shadow-sm w-full md:w-auto">
          <button
            onClick={() => setActiveTab('daily')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-md font-bold text-sm transition-all ${activeTab === 'daily' ? 'bg-emerald-100 text-emerald-800' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            {t('daily_attendance')}
          </button>
          <button
            onClick={() => setActiveTab('exits')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-md font-bold text-sm transition-all ${activeTab === 'exits' ? 'bg-emerald-100 text-emerald-800' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            {t('weekly_exits')}
          </button>
        </div>

        {activeTab === 'daily' && !isParent && (
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => setShowImportModal(true)}
              className="bg-white border border-gray-300 text-blue-600 px-4 py-2 rounded-lg font-bold hover:bg-blue-50 flex items-center justify-center gap-2 shadow-sm flex-1 md:flex-none"
            >
              <Upload className="w-4 h-4" />
              <span className="inline">{t('import')}</span>
            </button>
            <div className="bg-emerald-100 text-emerald-800 px-4 py-2 rounded-lg font-bold shadow-sm border border-emerald-200 dir-ltr hidden md:block">
              {today}
            </div>
          </div>
        )}

        {activeTab === 'exits' && !isParent && (
          <button
            onClick={openExitModal}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-emerald-700 flex items-center justify-center gap-2 shadow-md w-full md:w-auto"
          >
            <Plus className="w-5 h-5" />
            <span>{t('register_exit')}</span>
          </button>
        )}
      </div>

      {activeTab === 'daily' ? (
        // DAILY ATTENDANCE VIEW
        <>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
            {!isParent && (
              <div className="p-4 md:p-6 border-b bg-gray-50">
                <div className="flex flex-col md:flex-row gap-4">
                  <select className="border border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-800 font-medium focus:ring-2 focus:ring-emerald-500 outline-none w-full md:w-auto">
                    <option>فترة الصباح (دراسة)</option>
                    <option>فترة المساء (مراجعة)</option>
                    <option>الليل (نوم)</option>
                  </select>
                  <div className="relative w-full md:w-auto">
                    <Home className="absolute right-3 top-2.5 text-gray-400 w-4 h-4 pointer-events-none" />
                    <select
                      value={roomFilterDaily}
                      onChange={(e) => setRoomFilterDaily(e.target.value)}
                      className="appearance-none border border-gray-300 rounded-lg pl-4 pr-10 py-2 bg-white text-gray-800 font-medium focus:ring-2 focus:ring-emerald-500 outline-none w-full md:w-auto"
                    >
                      <option value="ALL">كل الغرف</option>
                      {uniqueRooms.map(room => (
                        <option key={room} value={room}>غرفة {room}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <SortHeader label="التلميذ" sortKey="student" activeConfig={dailySort} onSort={() => handleSort('student', 'daily')} />
                    <SortHeader label="الغرفة" sortKey="room" activeConfig={dailySort} onSort={() => handleSort('room', 'daily')} />
                    <SortHeader label="الحالة" sortKey="status" activeConfig={dailySort} onSort={() => handleSort('status', 'daily')} />
                    <th className="px-6 py-4 text-sm font-bold text-gray-700 whitespace-nowrap">ملاحظات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {displayedStudents.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-400 font-medium">
                        {isParent ? 'لا يوجد تلاميذ مرتبطين بحسابك.' : 'لا يوجد تلاميذ في القائمة.'}
                      </td>
                    </tr>
                  ) : (
                    displayedStudents.map(student => {
                      const currentStatus = getStatus(student.id);
                      return (
                        <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 flex items-center gap-3 whitespace-nowrap">
                            <img src={student.photoUrl} alt="" className="w-10 h-10 rounded-full border border-gray-200 flex-shrink-0" />
                            <span className="font-bold text-gray-800 text-base">{student.fullName}</span>
                          </td>
                          <td className="px-6 py-4 text-gray-600 font-medium font-mono whitespace-nowrap">{student.roomNumber}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`flex justify-center gap-2 ${isParent ? '' : 'bg-gray-100'} p-1.5 rounded-xl w-fit mx-auto ${isParent ? '' : 'border border-gray-200'}`}>
                              {/* Parents View Read Only */}
                              {isParent ? (
                                <span className={`px-4 py-2 rounded-lg font-bold text-sm ${currentStatus === 'present' ? 'bg-emerald-100 text-emerald-700' :
                                  currentStatus === 'late' ? 'bg-yellow-100 text-yellow-700' :
                                    currentStatus === 'absent' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'
                                  }`}>
                                  {currentStatus === 'present' ? 'حاضر' :
                                    currentStatus === 'late' ? 'متأخر' :
                                      currentStatus === 'absent' ? 'غائب' : 'غير مسجل'}
                                </span>
                              ) : (
                                <>
                                  <button
                                    onClick={() => updateAttendance(student.id, 'present')}
                                    className={`px-3 md:px-4 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-1 ${currentStatus === 'present' ? 'bg-white text-emerald-600 shadow-md transform scale-105' : 'text-gray-400 hover:text-gray-600'}`}
                                    title="حاضر"
                                  >
                                    <Check className="w-4 h-4" />
                                    <span className={`hidden md:inline ${currentStatus !== 'present' ? 'hidden sm:inline' : ''}`}>حاضر</span>
                                  </button>

                                  <button
                                    onClick={() => updateAttendance(student.id, 'late')}
                                    className={`px-3 md:px-4 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-1 ${currentStatus === 'late' ? 'bg-white text-yellow-500 shadow-md transform scale-105' : 'text-gray-400 hover:text-gray-600'}`}
                                    title="متأخر"
                                  >
                                    <Clock className="w-4 h-4" />
                                    <span className={`hidden md:inline ${currentStatus !== 'late' ? 'hidden sm:inline' : ''}`}>متأخر</span>
                                  </button>

                                  <button
                                    onClick={() => updateAttendance(student.id, 'absent')}
                                    className={`px-3 md:px-4 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-1 ${currentStatus === 'absent' ? 'bg-white text-red-500 shadow-md transform scale-105' : 'text-gray-400 hover:text-gray-600'}`}
                                    title="غائب"
                                  >
                                    <X className="w-4 h-4" />
                                    <span className={`hidden md:inline ${currentStatus !== 'absent' ? 'hidden sm:inline' : ''}`}>غائب</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 min-w-[200px]">
                            {!isParent ? (
                              <input
                                type="text"
                                placeholder="إضافة ملاحظة..."
                                className="text-sm border border-gray-200 bg-white rounded-lg px-3 py-2 w-full focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 outline-none transition-all placeholder-gray-400 text-gray-700"
                              />
                            ) : (
                              <span className="text-gray-500 text-sm">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {!isParent && (
            <div className="flex justify-end pb-20 md:pb-0">
              <button
                onClick={saveAttendance}
                className="w-full md:w-auto flex items-center justify-center gap-2 bg-emerald-600 text-white px-8 py-3 rounded-xl hover:bg-emerald-700 shadow-lg hover:shadow-emerald-200 transition-all font-bold active:scale-95"
              >
                <Save className="w-5 h-5" />
                <span>{t('save')}</span>
              </button>
            </div>
          )}
        </>
      ) : (
        // IMPROVED EXITS REGISTRY VIEW
        <div className="space-y-6">
          {/* Stats Cards (Only for Admin/Supervisor) */}
          {!isParent && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-xs font-bold mb-1">خرجات نشطة (سارية)</p>
                  <h3 className="text-2xl font-bold text-emerald-600">{exitStats.active}</h3>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl text-emerald-500"><LogOut className="w-6 h-6" /></div>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-xs font-bold mb-1">خرجات قصيرة نشطة</p>
                  <h3 className="text-2xl font-bold text-blue-600">{exitStats.short}</h3>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl text-blue-500"><Clock className="w-6 h-6" /></div>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-xs font-bold mb-1">خرجات طويلة نشطة</p>
                  <h3 className="text-2xl font-bold text-orange-600">{exitStats.long}</h3>
                </div>
                <div className="p-3 bg-orange-50 rounded-xl text-orange-500"><Calendar className="w-6 h-6" /></div>
              </div>
            </div>
          )}

          {/* Filters & Toolbar */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col lg:flex-row gap-4 justify-between items-center print:hidden">
            <div className="flex flex-col md:flex-row gap-2 w-full lg:w-auto">
              <div className="relative flex-1 max-w-sm">
                <input
                  type="text"
                  placeholder="بحث عن تلميذ..."
                  value={exitSearchTerm}
                  onChange={(e) => setExitSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
                />
                <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <select
                    value={exitFilterType}
                    onChange={(e) => setExitFilterType(e.target.value as any)}
                    className="appearance-none bg-gray-50 border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-8 pr-4 py-2.5"
                  >
                    <option value="ALL">كل الأنواع</option>
                    <option value="short">{t('short_exit')}</option>
                    <option value="long">{t('long_exit')}</option>
                    <option value="authorized">{t('authorized_exit')}</option>
                  </select>
                  <Filter className="absolute left-2.5 top-2.5 text-gray-400 w-4 h-4 pointer-events-none" />
                </div>

                <div className="relative flex-1">
                  <select
                    value={exitStatusFilter}
                    onChange={(e) => setExitStatusFilter(e.target.value as any)}
                    className="appearance-none bg-gray-50 border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-8 pr-4 py-2.5"
                  >
                    <option value="ALL">كل الحالات</option>
                    <option value="ACTIVE">نشطة (بالخارج)</option>
                    <option value="EXPIRED">منتهية (عاد)</option>
                  </select>
                  <History className="absolute left-2.5 top-2.5 text-gray-400 w-4 h-4 pointer-events-none" />
                </div>
              </div>
            </div>

            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              className="w-full lg:w-auto bg-gray-100 hover:bg-gray-200 text-gray-700 p-2.5 rounded-lg transition-colors border border-gray-200 flex items-center justify-center gap-2 font-bold disabled:opacity-50"
              title="تحميل كملف PDF"
            >
              {isGeneratingPdf ? <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div> : <FileDown className="w-5 h-5" />}
              <span className="text-sm">PDF</span>
            </button>
          </div>

          <div id="printable-exit-list" className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 min-h-[500px] bg-white p-4">
            {/* Hidden Header for PDF Generation */}
            <div id="pdf-header" className="hidden text-center mb-6 border-b pb-4">
              <h2 className="text-2xl font-bold text-gray-800">{schoolSettings.institutionName}</h2>
              <h3 className="text-xl font-medium text-gray-600 mt-1">سجل الخرجات الرسمية</h3>
              <p className="text-sm text-gray-500 mt-2">تاريخ التقرير: {today}</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-emerald-50 border-b border-emerald-100">
                  <tr>
                    <SortHeader label={t('students')} sortKey="student" activeConfig={exitSort} onSort={() => handleSort('student', 'exit')} />
                    <SortHeader label={t('exit_type')} sortKey="type" activeConfig={exitSort} onSort={() => handleSort('type', 'exit')} />
                    <SortHeader label={t('start_date')} sortKey="startDate" activeConfig={exitSort} onSort={() => handleSort('startDate', 'exit')} />
                    <SortHeader label={t('return_date')} sortKey="returnDate" activeConfig={exitSort} onSort={() => handleSort('returnDate', 'exit')} />
                    <SortHeader label="حالة الخرجة" sortKey="status" activeConfig={exitSort} onSort={() => handleSort('status', 'exit')} />
                    <th className="px-6 py-4 text-sm font-bold text-emerald-900 whitespace-nowrap">{t('notes')}</th>
                    {!isParent && <th className="px-6 py-4 text-sm font-bold text-emerald-900 w-20 print:hidden" data-html2canvas-ignore="true"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredExits.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center flex flex-col items-center justify-center text-gray-400">
                        <LogOut className="w-12 h-12 mb-3 opacity-20" />
                        <p className="font-medium">لا توجد نتائج مطابقة للبحث.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredExits.map(record => {
                      const student = students.find(s => s.id === record.studentId);
                      const typeInfo = getExitTypeLabel(record.type);
                      const isActive = new Date(record.returnDate) >= new Date(today);

                      return (
                        <tr key={record.id} className={`hover:bg-gray-50 transition-colors ${!isActive ? 'opacity-60 bg-gray-50/50' : ''}`}>
                          <td className="px-6 py-4 flex items-center gap-3 whitespace-nowrap">
                            {student ? (
                              <>
                                <img src={student.photoUrl} alt="" className="w-10 h-10 rounded-full border border-gray-200 flex-shrink-0" />
                                <div>
                                  <p className="font-bold text-gray-900">{student.fullName}</p>
                                  <p className="text-xs text-gray-500 font-mono">{student.roomNumber}</p>
                                </div>
                              </>
                            ) : 'طالب محذوف'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 w-fit border ${typeInfo.color}`}>
                              {typeInfo.icon}
                              {typeInfo.text}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-mono text-gray-600 dir-ltr text-right whitespace-nowrap">
                            {record.startDate}
                          </td>
                          <td className="px-6 py-4 text-sm font-mono text-gray-800 font-bold dir-ltr text-right whitespace-nowrap">
                            {record.returnDate}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {isActive ? (
                              <span className="flex items-center gap-1 text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100 w-fit">
                                <AlertCircle className="w-3 h-3" />
                                بالخارج
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-gray-500 font-bold text-xs bg-gray-100 px-2 py-1 rounded-full border border-gray-200 w-fit">
                                <Check className="w-3 h-3" />
                                منتهية
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 italic max-w-xs truncate">
                            {record.notes || '-'}
                          </td>
                          {!isParent && (
                            <td className="px-6 py-4 text-center print:hidden" data-html2canvas-ignore="true">
                              <button
                                onClick={() => deleteExitRecord(record.id)}
                                className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-colors"
                                title="حذف"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Improved Bulk Exit Modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4 print:hidden">
          <div className="bg-white rounded-2xl w-full max-w-4xl border border-gray-200 shadow-2xl flex flex-col max-h-[90vh]">
            {/* ... Modal content ... */}
            <div className="flex justify-between items-center p-6 border-b bg-gray-50 rounded-t-2xl">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <LogOut className="w-6 h-6 text-emerald-600" />
                {t('register_exit')}
              </h3>
              <button onClick={() => setShowExitModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                {/* Left Column: Student Selection */}
                <div className="flex flex-col h-full min-h-[300px] border rounded-xl overflow-hidden bg-white shadow-sm">
                  {/* ... Selection List ... */}
                  <div className="p-3 border-b bg-gray-50 flex flex-col gap-2">
                    <h4 className="font-bold text-gray-800 flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-500" />
                      تحديد التلاميذ ({selectedStudentIds.length})
                    </h4>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          placeholder="بحث بالاسم أو الغرفة..."
                          value={studentFilter}
                          onChange={(e) => setStudentFilter(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none bg-white"
                        />
                        <Search className="absolute left-2.5 top-2.5 text-gray-400 w-4 h-4" />
                      </div>
                      <div className="relative">
                        <Home className="absolute left-2 top-2 text-gray-400 w-4 h-4 pointer-events-none" />
                        <select
                          value={roomFilterModal}
                          onChange={(e) => setRoomFilterModal(e.target.value)}
                          className="appearance-none bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full sm:w-36 pl-7 pr-3 py-2"
                        >
                          <option value="ALL">كل الغرف</option>
                          {uniqueRooms.map(room => (
                            <option key={room} value={room}>غرفة {room}</option>
                          ))}
                        </select>
                      </div>
                      <button
                        onClick={toggleSelectAll}
                        className="px-3 py-1.5 text-xs font-bold bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 whitespace-nowrap"
                      >
                        {selectedStudentIds.length === filteredStudentsForSelection.length && filteredStudentsForSelection.length > 0 ? 'إلغاء الكل' : 'تحديد الكل'}
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                    {filteredStudentsForSelection.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <p>لا توجد نتائج</p>
                      </div>
                    ) : (
                      filteredStudentsForSelection.map(s => (
                        <div
                          key={s.id}
                          onClick={() => toggleStudentSelection(s.id)}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all border ${selectedStudentIds.includes(s.id)
                            ? 'bg-emerald-50 border-emerald-500 shadow-sm'
                            : 'border-transparent hover:bg-gray-50'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <img src={s.photoUrl} alt="" className="w-8 h-8 rounded-full border border-gray-200 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-bold text-gray-800">{s.fullName}</p>
                              <p className="text-xs text-gray-500 font-mono">غرفة: {s.roomNumber}</p>
                            </div>
                          </div>
                          <div className={selectedStudentIds.includes(s.id) ? 'text-emerald-600' : 'text-gray-300'}>
                            {selectedStudentIds.includes(s.id) ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Right Column: Exit Details */}
                <div className="space-y-5">
                  <h4 className="font-bold text-gray-800 border-b pb-2">تفاصيل الخرجة</h4>
                  {/* ... Exit Form Fields ... */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">{t('exit_type')}</label>
                    <div className="space-y-2">
                      <label className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${newExit.type === 'short' ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-500' : 'hover:bg-gray-50'}`}>
                        <input type="radio" name="exitType" checked={newExit.type === 'short'} onChange={() => setNewExit({ ...newExit, type: 'short' })} className="text-emerald-600 focus:ring-emerald-500" />
                        <div>
                          <span className="block font-bold text-sm text-gray-800">{t('short_exit')}</span>
                        </div>
                      </label>
                      <label className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${newExit.type === 'long' ? 'bg-green-50 border-green-200 ring-1 ring-green-500' : 'hover:bg-gray-50'}`}>
                        <input type="radio" name="exitType" checked={newExit.type === 'long'} onChange={() => setNewExit({ ...newExit, type: 'long' })} className="text-emerald-600 focus:ring-emerald-500" />
                        <div>
                          <span className="block font-bold text-sm text-gray-800">{t('long_exit')}</span>
                        </div>
                      </label>
                      <label className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${newExit.type === 'authorized' ? 'bg-purple-50 border-purple-200 ring-1 ring-purple-500' : 'hover:bg-gray-50'}`}>
                        <input type="radio" name="exitType" checked={newExit.type === 'authorized'} onChange={() => setNewExit({ ...newExit, type: 'authorized' })} className="text-emerald-600 focus:ring-emerald-500" />
                        <div>
                          <span className="block font-bold text-sm text-gray-800">{t('authorized_exit')}</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">{t('start_date')}</label>
                      <input
                        type="date"
                        className="w-full border border-gray-300 rounded-xl p-3 bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={newExit.startDate}
                        onChange={(e) => setNewExit({ ...newExit, startDate: e.target.value })}
                        onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">{t('return_date')}</label>
                      <input
                        type="date"
                        className="w-full border border-gray-300 rounded-xl p-3 bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={newExit.returnDate}
                        onChange={(e) => setNewExit({ ...newExit, returnDate: e.target.value })}
                        onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">{t('notes')}</label>
                    <textarea
                      className="w-full border border-gray-300 rounded-xl p-3 bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none resize-none h-24"
                      value={newExit.notes || ''}
                      onChange={(e) => setNewExit({ ...newExit, notes: e.target.value })}
                      placeholder="ملاحظات إضافية..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t bg-gray-50 rounded-b-2xl flex gap-4">
              <button
                type="button"
                onClick={() => setShowExitModal(false)}
                className="flex-1 bg-white border border-gray-300 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-100 transition-colors shadow-sm"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={handleSaveExit}
                className="flex-1 bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 shadow-md transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                حفظ التسجيل ({selectedStudentIds.length})
              </button>
            </div>
          </div>
        </div>
      )}

      <ImportModal isOpen={showImportModal} onClose={() => setShowImportModal(false)} title="استيراد ورقة حضور" type="attendance" />
    </div>
  );
};

export default Attendance;