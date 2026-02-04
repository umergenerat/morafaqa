
import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { UserRole, AcademicRecord, SubjectGrade } from '../types';
import * as Permissions from '../utils/permissions';
import {
  LineChart,
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
  Upload,
  FileText,
  TrendingUp,
  Award,
  BookOpen,
  Search,
  Download,
  CheckCircle,
  GraduationCap,
  Plus,
  Trash2,
  Edit2,
  X,
  Save,
  Calculator,
  Users,
  Percent,
  FileSpreadsheet, // Added icon
  Filter,
  AlertTriangle
} from 'lucide-react';
import ImportModal from '../components/ImportModal';
import * as XLSX from 'xlsx';
import { STANDARDIZED_SUBJECTS } from '../constants';

const Academics: React.FC = () => {
  const { students, academicRecords, addAcademicRecord, updateAcademicRecord, deleteAcademicRecord, currentUser, schoolSettings } = useData();
  const { t } = useLanguage();
  const [activeSemester, setActiveSemester] = useState<'S1' | 'S2'>('S1');
  const [showImportModal, setShowImportModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [showMissingOnly, setShowMissingOnly] = useState(false);

  // Manual Add/Edit State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<AcademicRecord>>({
    subjects: []
  });

  const isParent = Permissions.isParent(currentUser);
  const isAdminOrTeacher = Permissions.canEditAcademicRecords(currentUser);

  // Filter Data Logic
  const filteredRecords = useMemo(() => {
    let records = academicRecords.filter(r => r.semester === activeSemester && students.some(s => s.id === r.studentId));

    // Grade Filter
    if (selectedGrade !== 'all') {
      records = records.filter(r => {
        const student = students.find(s => s.id === r.studentId);
        return student?.grade === selectedGrade;
      });
    }

    // Parent Filter
    if (isParent && currentUser) {
      const linkedIds = currentUser.linkedStudentIds || [];
      records = records.filter(r => linkedIds.includes(r.studentId));
    }

    // Search Filter
    if (searchTerm) {
      records = records.filter(r => {
        const student = students.find(s => s.id === r.studentId);
        return student?.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student?.academicId.includes(searchTerm);
      });
    }

    return records;
  }, [academicRecords, activeSemester, isParent, currentUser, searchTerm, students, selectedGrade]);

  // Duplicate Name Detection
  const duplicateStudentNames = useMemo(() => {
    const nameCounts: Record<string, number> = {};
    const recordsWithStudents = filteredRecords.map(r => ({
      ...r,
      studentName: students.find(s => s.id === r.studentId)?.fullName || ''
    }));

    recordsWithStudents.forEach(r => {
      if (r.studentName) {
        nameCounts[r.studentName] = (nameCounts[r.studentName] || 0) + 1;
      }
    });

    return Object.keys(nameCounts).filter(name => nameCounts[name] > 1);
  }, [filteredRecords, students]);

  // All Unique Grades for Filter
  const uniqueGrades = useMemo(() => {
    const grades = new Set(students.map(s => s.grade));
    return Array.from(grades).sort();
  }, [students]);

  // Students Missing Records for selected semester/grade
  const missingRecordsStudents = useMemo(() => {
    if (isParent) return [];

    let studentsToCheck = students;
    if (selectedGrade !== 'all') {
      studentsToCheck = students.filter(s => s.grade === selectedGrade);
    }

    // Apply search filter if present
    if (searchTerm) {
      studentsToCheck = studentsToCheck.filter(s =>
        s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.academicId.includes(searchTerm)
      );
    }

    return studentsToCheck.filter(s =>
      !academicRecords.some(r => r.studentId === s.id && r.semester === activeSemester)
    );
  }, [students, academicRecords, activeSemester, selectedGrade, isParent, searchTerm]);

  // Calculations for Stats (Only for Admins/Teachers)
  const stats = useMemo(() => {
    if (filteredRecords.length === 0) return null;

    const total = filteredRecords.length;
    const sumAverage = filteredRecords.reduce((acc, curr) => acc + curr.generalAverage, 0);
    const classAverage = (sumAverage / total).toFixed(2);

    const passed = filteredRecords.filter(r => r.generalAverage >= 10).length;
    const successRate = ((passed / total) * 100).toFixed(1);

    const sorted = [...filteredRecords].sort((a, b) => b.generalAverage - a.generalAverage);
    const topStudent = students.find(s => s.id === sorted[0].studentId);

    // Distribution for Pie Chart
    const distribution = [
      { name: '< 10', value: filteredRecords.filter(r => r.generalAverage < 10).length, fill: '#ef4444' },
      { name: '10 - 12', value: filteredRecords.filter(r => r.generalAverage >= 10 && r.generalAverage < 12).length, fill: '#f59e0b' },
      { name: '12 - 14', value: filteredRecords.filter(r => r.generalAverage >= 12 && r.generalAverage < 14).length, fill: '#fbbf24' },
      { name: '14 - 16', value: filteredRecords.filter(r => r.generalAverage >= 14 && r.generalAverage < 16).length, fill: '#34d399' },
      { name: '16+', value: filteredRecords.filter(r => r.generalAverage >= 16).length, fill: '#10b981' },
    ].filter(d => d.value > 0);

    // --- NEW: Gender Analysis ---
    const recordsWithInfo = filteredRecords.map(r => ({
      ...r,
      student: students.find(s => s.id === r.studentId)
    })).filter(r => r.student);

    const maleRecords = recordsWithInfo.filter(r => r.student?.gender === 'male');
    const femaleRecords = recordsWithInfo.filter(r => r.student?.gender === 'female');

    const maleAvg = maleRecords.length > 0 ? (maleRecords.reduce((acc, r) => acc + r.generalAverage, 0) / maleRecords.length) : 0;
    const femaleAvg = femaleRecords.length > 0 ? (femaleRecords.reduce((acc, r) => acc + r.generalAverage, 0) / femaleRecords.length) : 0;

    const malePass = maleRecords.filter(r => r.generalAverage >= 10).length;
    const femalePass = femaleRecords.filter(r => r.generalAverage >= 10).length;

    const genderStats = [
      { name: 'ذكور', average: Number(maleAvg.toFixed(2)), passRate: maleRecords.length ? Math.round((malePass / maleRecords.length) * 100) : 0, count: maleRecords.length, fill: '#3b82f6' },
      { name: 'إناث', average: Number(femaleAvg.toFixed(2)), passRate: femaleRecords.length ? Math.round((femalePass / femaleRecords.length) * 100) : 0, count: femaleRecords.length, fill: '#ec4899' }
    ];

    // --- NEW: Grade Level Analysis ---
    const gradeMap: Record<string, { total: number, count: number, passed: number }> = {};

    recordsWithInfo.forEach(r => {
      const grade = r.student?.grade || 'غير محدد';
      if (!gradeMap[grade]) gradeMap[grade] = { total: 0, count: 0, passed: 0 };
      gradeMap[grade].total += r.generalAverage;
      gradeMap[grade].count += 1;
      if (r.generalAverage >= 10) gradeMap[grade].passed += 1;
    });

    const gradeLevelStats = Object.keys(gradeMap).map(grade => ({
      name: grade,
      average: Number((gradeMap[grade].total / gradeMap[grade].count).toFixed(2)),
      passRate: Math.round((gradeMap[grade].passed / gradeMap[grade].count) * 100),
      count: gradeMap[grade].count
    })).sort((a, b) => b.average - a.average); // Sort by highest average

    return {
      classAverage,
      successRate,
      topStudent,
      topScore: sorted[0].generalAverage,
      distribution,
      genderStats,
      gradeLevelStats
    };
  }, [filteredRecords, students]);

  const handleDownloadReport = (record: AcademicRecord) => {
    const student = students.find(s => s.id === record.studentId);
    const data = [
      ["المملكة المغربية", "", "", ""],
      ["وزارة التربية الوطنية", "", "", ""],
      ["بيان النقط", "", "", ""],
      ["الاسم الكامل:", student?.fullName, "رقم مسار:", student?.academicId],
      ["المستوى:", student?.grade, "الدورة:", record.semester],
      [],
      ["المادة", "النقطة / 20", "المعامل", "المجموع"],
      ...record.subjects.map(sub => [sub.subjectName, sub.grade, sub.coefficient, sub.grade * sub.coefficient]),
      [],
      ["المعدل العام:", record.generalAverage, "الرتبة:", record.rank || '-'],
      ["التقدير:", record.appreciation || '-', "قرار المجلس:", record.teacherDecision || '-']
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report Card");
    XLSX.writeFile(wb, `${student?.fullName}_Report_${record.semester}.xlsx`);
  };

  // --- NEW: Download Excel Template ---
  const handleDownloadTemplate = () => {
    // 1. Prepare Headers: Basic Info + Subjects (Grade & Coeff)
    const headers = [
      "رقم التلميذ (Academic ID)",
      "اسم التلميذ (Name)",
      "المعدل العام (General Avg)",
      "الرتبة (Rank)",
      "القرار (Decision)",
      "التقدير (Appreciation)"
    ];

    STANDARDIZED_SUBJECTS.forEach(sub => {
      headers.push(`${sub} (Note)`);
      headers.push(`${sub} (Coeff)`);
    });

    // 2. Prepare Data Rows (Pre-fill students)
    const data = students.map(s => {
      const row: any[] = [
        s.academicId,
        s.fullName,
        "", // Avg
        "", // Rank
        "", // Decision
        ""  // Appreciation
      ];
      // Empty cells for subjects
      STANDARDIZED_SUBJECTS.forEach(() => {
        row.push(""); // Note
        row.push("1"); // Default Coeff
      });
      return row;
    });

    // 3. Create Sheet
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);

    // Auto-adjust column width (heuristic)
    ws['!cols'] = headers.map(() => ({ wch: 15 }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Morafaqah_Grades_Template.xlsx");
  };

  // --- CRUD Operations ---

  const handleOpenAdd = () => {
    setIsEditing(false);
    setFormData({
      studentId: '',
      semester: activeSemester,
      schoolYear: schoolSettings.schoolYear,
      subjects: [
        { subjectName: 'الرياضيات', grade: 0, coefficient: 1 },
        { subjectName: 'اللغة العربية', grade: 0, coefficient: 1 },
        { subjectName: 'الفرنسية', grade: 0, coefficient: 1 },
        { subjectName: 'الفيزياء', grade: 0, coefficient: 1 },
      ],
      generalAverage: 0,
      appreciation: '',
      teacherDecision: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (record: AcademicRecord) => {
    setIsEditing(true);
    setFormData({ ...record });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    deleteAcademicRecord(id);
  };

  const handleSubjectChange = (index: number, field: keyof SubjectGrade, value: string | number) => {
    const newSubjects = [...(formData.subjects || [])];
    newSubjects[index] = { ...newSubjects[index], [field]: value };
    setFormData({ ...formData, subjects: newSubjects });

    // Auto-calculate average when grades/coeffs change
    calculateAverage(newSubjects);
  };

  const addSubjectRow = () => {
    setFormData({
      ...formData,
      subjects: [...(formData.subjects || []), { subjectName: '', grade: 0, coefficient: 1 }]
    });
  };

  const removeSubjectRow = (index: number) => {
    const newSubjects = [...(formData.subjects || [])];
    newSubjects.splice(index, 1);
    setFormData({ ...formData, subjects: newSubjects });
    calculateAverage(newSubjects);
  };

  const calculateAverage = (subjects: SubjectGrade[]) => {
    let totalScore = 0;
    let totalCoeff = 0;
    subjects.forEach(sub => {
      const grade = Number(sub.grade) || 0;
      const coeff = Number(sub.coefficient) || 1;
      totalScore += grade * coeff;
      totalCoeff += coeff;
    });

    const average = totalCoeff > 0 ? Number((totalScore / totalCoeff).toFixed(2)) : 0;

    let decision = '';
    let appreciation = '';

    if (average >= 10) decision = 'ينتقل'; else decision = 'يكرر';

    if (average >= 16) appreciation = 'حسن جداً';
    else if (average >= 14) appreciation = 'حسن';
    else if (average >= 12) appreciation = 'مستحسن';
    else if (average >= 10) appreciation = 'متوسط';
    else appreciation = 'ضعيف';

    setFormData(prev => ({
      ...prev,
      generalAverage: average,
      teacherDecision: decision,
      appreciation: appreciation
    }));
  };

  const handleSave = () => {
    if (!formData.studentId || !formData.subjects) {
      alert("المرجو اختيار تلميذ وإضافة مواد.");
      return;
    }

    const record: AcademicRecord = {
      id: isEditing && formData.id ? formData.id : crypto.randomUUID(),
      studentId: formData.studentId,
      semester: formData.semester || activeSemester,
      schoolYear: formData.schoolYear || schoolSettings.schoolYear,
      generalAverage: formData.generalAverage || 0,
      rank: formData.rank || 0,
      subjects: formData.subjects,
      teacherDecision: formData.teacherDecision,
      appreciation: formData.appreciation
    };

    if (isEditing) {
      updateAcademicRecord(record);
    } else {
      addAcademicRecord(record);
    }
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <GraduationCap className="w-8 h-8 text-blue-600" />
            {t('academics_title')}
          </h2>
          <p className="text-gray-500 mt-1">{t('academics_desc')}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white p-1 rounded-lg border border-gray-200 flex shadow-sm">
            <button
              onClick={() => setActiveSemester('S1')}
              className={`px-4 py-2 rounded-md font-bold text-sm transition-all ${activeSemester === 'S1' ? 'bg-blue-100 text-blue-800' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              {t('semester_1')}
            </button>
            <button
              onClick={() => setActiveSemester('S2')}
              className={`px-4 py-2 rounded-md font-bold text-sm transition-all ${activeSemester === 'S2' ? 'bg-blue-100 text-blue-800' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              {t('semester_2')}
            </button>
          </div>

          {!isParent && (
            <>
              <button
                onClick={handleDownloadTemplate}
                className="bg-white border border-gray-300 text-emerald-700 px-3 py-2.5 rounded-lg font-bold hover:bg-emerald-50 flex items-center gap-2 shadow-sm transition-all"
                title="تحميل نموذج Excel للتعبئة"
              >
                <FileSpreadsheet className="w-5 h-5" />
                <span className="hidden xl:inline text-sm">تحميل نموذج</span>
              </button>
              <button
                onClick={() => setShowImportModal(true)}
                className="bg-white border border-gray-300 text-gray-700 px-3 py-2.5 rounded-lg font-bold hover:bg-gray-50 flex items-center gap-2 shadow-sm transition-all"
                title={t('import_grades')}
              >
                <Upload className="w-5 h-5" />
                <span className="hidden xl:inline text-sm">استيراد</span>
              </button>
              <button
                onClick={handleOpenAdd}
                className="bg-emerald-600 text-white px-4 py-2.5 rounded-lg font-bold hover:bg-emerald-700 flex items-center gap-2 shadow-md transition-all active:scale-95"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">{t('add_record')}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Parent Welcome Banner */}
      {isParent && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-6 rounded-xl flex items-start gap-4 shadow-sm">
          <div className="bg-white p-3 rounded-full shadow-sm text-blue-600 hidden sm:block">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-blue-900">نتائج التحصيل الدراسي</h3>
            <p className="text-blue-700/80 text-sm mt-1 leading-relaxed">
              مرحباً بك ولي الأمر الكريم. تجد أسفله النتائج الدراسية الخاصة بأبنائك للدورة الحالية.
              يمكنك تحميل بيان النقط بصيغة Excel أو التواصل مع الإدارة للتفاصيل.
            </p>
          </div>
        </div>
      )}

      {/* Admin/Teacher Dashboard Stats */}
      {isAdminOrTeacher && stats && (
        <div className="space-y-6 animate-fade-in">
          {/* Top Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-bold text-gray-500">{t('class_average')}</p>
                  <h3 className="text-3xl font-bold text-gray-800 mt-1">{stats.classAverage} <span className="text-sm text-gray-400">/ 20</span></h3>
                </div>
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><TrendingUp className="w-6 h-6" /></div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-emerald-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-bold text-gray-500">{t('success_rate')}</p>
                  <h3 className="text-3xl font-bold text-gray-800 mt-1">{stats.successRate}%</h3>
                </div>
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><CheckCircle className="w-6 h-6" /></div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-amber-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-bold text-gray-500">{t('top_student')}</p>
                  <h3 className="text-xl font-bold text-gray-800 mt-1 truncate max-w-[150px]">{stats.topStudent?.fullName || '-'}</h3>
                  <p className="text-xs font-bold text-amber-600 mt-1">{stats.topScore.toFixed(2)} / 20</p>
                </div>
                <div className="p-2 bg-amber-50 rounded-lg text-amber-600"><Award className="w-6 h-6" /></div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-indigo-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-bold text-gray-500">عدد التلاميذ</p>
                  <h3 className="text-3xl font-bold text-gray-800 mt-1">{filteredRecords.length}</h3>
                </div>
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><Users className="w-6 h-6" /></div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Gender Comparison Chart */}
            <div className="lg:col-span-1 bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-gray-400" />
                مقارنة الأداء حسب الجنس
              </h3>
              <div className="flex-1 min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.genderStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 20]} tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}
                      formatter={(value: any, name: any) => [value, name === 'average' ? 'المعدل' : name]}
                    />
                    <Bar dataKey="average" name="المعدل" radius={[5, 5, 0, 0]} barSize={40}>
                      {stats.genderStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {/* Gender Summary Footer */}
              <div className="grid grid-cols-2 gap-2 mt-4 text-center">
                {stats.genderStats.map((stat, idx) => (
                  <div key={idx} className="bg-gray-50 p-2 rounded-lg">
                    <span className="block text-xs text-gray-500">{stat.name}</span>
                    <div className="flex justify-center items-center gap-2">
                      <span className="font-bold text-gray-800">{stat.average}</span>
                      <span className={`text-[10px] font-bold px-1.5 rounded ${stat.passRate >= 50 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {stat.passRate}% نجاح
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Grade Levels Chart */}
            <div className="lg:col-span-2 bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-sm">
                <BookOpen className="w-4 h-4 text-gray-400" />
                ترتيب المستويات الدراسية (المعدل العام)
              </h3>
              <div className="flex-1 min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.gradeLevelStats} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" domain={[0, 20]} hide />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11, fontWeight: 'bold' }} />
                    <Tooltip
                      cursor={{ fill: 'transparent' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-3 border shadow-lg rounded-xl text-sm">
                              <p className="font-bold text-gray-800 mb-1">{data.name}</p>
                              <p className="text-blue-600">المعدل: <b>{data.average}</b></p>
                              <p className="text-green-600">نسبة النجاح: <b>{data.passRate}%</b></p>
                              <p className="text-gray-500 text-xs mt-1">عدد التلاميذ: {data.count}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="average" radius={[0, 5, 5, 0]} barSize={20} fill="#6366f1">
                      {stats.gradeLevelStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.average >= 12 ? '#10b981' : entry.average >= 10 ? '#3b82f6' : '#ef4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Distribution Pie Chart */}
            <div className="lg:col-span-1 bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center items-center">
              <h3 className="font-bold text-gray-800 mb-2 w-full text-right text-sm flex items-center gap-2">
                <Percent className="w-4 h-4 text-gray-400" />
                {t('grade_distribution')}
              </h3>
              <div className="w-full h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.distribution}
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {stats.distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
                    <Legend wrapperStyle={{ fontSize: '10px' }} iconSize={8} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      {isAdminOrTeacher && (
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="بحث عن تلميذ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white shadow-sm"
            />
            <Search className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
          </div>

          <div className="flex items-center gap-2 min-w-[200px]">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none bg-white shadow-sm font-bold text-gray-700"
            >
              <option value="all">كل المستويات</option>
              {uniqueGrades.map(grade => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer bg-blue-50 px-4 py-3 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors shadow-sm">
              <input
                type="checkbox"
                checked={showMissingOnly}
                onChange={(e) => setShowMissingOnly(e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="font-bold text-blue-800 text-sm whitespace-nowrap">عرض غير المسجلين فقط</span>
            </label>
          </div>
        </div>
      )}

      {/* Results Grid / Missing Students List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {showMissingOnly ? (
          missingRecordsStudents.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-gray-300">
              <CheckCircle className="w-16 h-16 mx-auto text-emerald-200 mb-4" />
              <p className="text-gray-400 font-medium">جميع تلاميذ هذا المستوى مسجلة نتائجهم.</p>
            </div>
          ) : (
            missingRecordsStudents.map(student => (
              <div key={student.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col sm:flex-row items-center p-5 gap-4 hover:shadow-md transition-shadow group">
                <div className="relative">
                  <img src={student.photoUrl} alt="" className="w-16 h-16 rounded-full border-2 border-gray-100" />
                  <div className="absolute -top-1 -right-1 bg-amber-500 text-white p-1 rounded-full shadow-sm">
                    <AlertTriangle className="w-3 h-3" />
                  </div>
                </div>
                <div className="flex-grow text-center sm:text-right">
                  <h3 className="font-bold text-gray-900">{student.fullName}</h3>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1 mt-1">
                    <span className="text-xs text-gray-500 font-mono">ID: {student.academicId}</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold">{student.grade}</span>
                  </div>
                  <p className="text-[10px] text-red-500 font-bold mt-2">النتائج غير مسجلة حالياً لهذه الدورة</p>
                </div>
                <button
                  onClick={() => {
                    handleOpenAdd();
                    setFormData(prev => ({ ...prev, studentId: student.id }));
                  }}
                  className="bg-blue-600 text-white px-4 py-2.5 rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2 shadow-sm transition-all active:scale-95 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  تسجيل النتيجة
                </button>
              </div>
            ))
          )
        ) : filteredRecords.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-gray-300">
            <FileText className="w-16 h-16 mx-auto text-gray-200 mb-4" />
            <p className="text-gray-400 font-medium">
              {isParent && currentUser && (!currentUser.linkedStudentIds || currentUser.linkedStudentIds.length === 0)
                ? "لا يوجد تلاميذ مرتبطين بحسابك. المرجو مراجعة الإدارة."
                : "لا توجد نتائج مسجلة لهذه الدورة."}
            </p>
          </div>
        ) : (
          filteredRecords.map(record => {
            const student = students.find(s => s.id === record.studentId);
            if (!student) return null;

            return (
              <div key={record.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow relative group">
                {/* Admin Actions */}
                {isAdminOrTeacher && (
                  <div className="absolute top-4 left-4 flex gap-1 opacity-100 transition-opacity">
                    <button onClick={() => handleOpenEdit(record)} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(record.id)} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <img src={student.photoUrl} alt="" className="w-12 h-12 rounded-full border border-gray-200" />
                    <div>
                      <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        {student.fullName}
                        {duplicateStudentNames.includes(student.fullName) && (
                          <span className="bg-red-100 text-red-600 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 border border-red-200" title="يوجد أكثر من تلميذ بهذا الاسم">
                            <AlertTriangle className="w-3 h-3" />
                            اسم مكرر
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-gray-500 font-mono">ID: {student.academicId} • {student.grade}</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <span className={`block text-2xl font-bold ${record.generalAverage >= 10 ? 'text-blue-600' : 'text-red-500'}`}>{record.generalAverage}</span>
                    <span className="text-[10px] text-gray-500 font-bold bg-white px-2 py-0.5 rounded border border-gray-200">الرتبة: {record.rank || '-'}</span>
                  </div>
                </div>

                <div className="p-5">
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-bold text-gray-700 text-sm">المواد الأساسية</h4>
                      <span className="text-xs text-gray-400">{record.subjects.length} مادة</span>
                    </div>
                    <div className="space-y-2">
                      {record.subjects.slice(0, 3).map((sub, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-gray-600">{sub.subjectName}</span>
                          <span className={`font-bold ${sub.grade >= 10 ? 'text-emerald-600' : 'text-red-500'}`}>{sub.grade}</span>
                        </div>
                      ))}
                      {record.subjects.length > 3 && (
                        <p className="text-xs text-center text-gray-400 mt-2">+ {record.subjects.length - 3} مواد أخرى...</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500">التقدير:</span>
                      <span className="font-bold text-gray-800">{record.appreciation || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">قرار المجلس:</span>
                      <span className="font-bold text-blue-700">{record.teacherDecision || '-'}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t border-gray-100 flex justify-end bg-gray-50/50">
                  <button
                    onClick={() => handleDownloadReport(record)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-bold flex items-center gap-2 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    تحميل البيان (Excel)
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b flex justify-between items-center bg-blue-50 rounded-t-2xl">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                {isEditing ? <Edit2 className="w-6 h-6 text-blue-600" /> : <Plus className="w-6 h-6 text-blue-600" />}
                {isEditing ? t('edit_record') : t('add_record')}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">التلميذ</label>
                  <select
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl p-2.5 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    disabled={isEditing}
                  >
                    <option value="">اختر التلميذ...</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.fullName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">الدورة</label>
                  <select
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value as 'S1' | 'S2' })}
                    className="w-full border border-gray-300 rounded-xl p-2.5 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="S1">{t('semester_1')}</option>
                    <option value="S2">{t('semester_2')}</option>
                  </select>
                </div>
              </div>

              {/* Subjects Editor */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold text-gray-800 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-gray-500" />
                    المواد والنقاط
                  </h4>
                  <button onClick={addSubjectRow} className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded">
                    <Plus className="w-3 h-3" /> {t('add_subject')}
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                  {formData.subjects?.map((sub, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder={t('subject')}
                        value={sub.subjectName}
                        onChange={(e) => handleSubjectChange(idx, 'subjectName', e.target.value)}
                        className="flex-grow border border-gray-300 rounded-lg p-2 text-sm"
                      />
                      <div className="w-20">
                        <input
                          type="number"
                          placeholder={t('grade')}
                          value={sub.grade}
                          max={20}
                          min={0}
                          onChange={(e) => handleSubjectChange(idx, 'grade', Number(e.target.value))}
                          className={`w-full border rounded-lg p-2 text-sm text-center font-bold ${sub.grade < 10 ? 'text-red-500 border-red-200' : 'text-emerald-600 border-gray-300'}`}
                        />
                      </div>
                      <div className="w-16">
                        <input
                          type="number"
                          placeholder="معامل"
                          value={sub.coefficient}
                          min={1}
                          onChange={(e) => handleSubjectChange(idx, 'coefficient', Number(e.target.value))}
                          className="w-full border border-gray-300 rounded-lg p-2 text-sm text-center text-gray-500"
                        />
                      </div>
                      <button onClick={() => removeSubjectRow(idx)} className="text-gray-400 hover:text-red-500 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Calculations Preview */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500">{t('class_average')}</label>
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-blue-500" />
                    <span className="text-xl font-bold text-blue-700">{formData.generalAverage}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500">{t('decision')}</label>
                  <input
                    type="text"
                    value={formData.teacherDecision}
                    onChange={(e) => setFormData({ ...formData, teacherDecision: e.target.value })}
                    className="bg-white border border-gray-200 rounded p-1 text-sm font-bold text-gray-700 w-full"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-gray-500">{t('appreciation')}</label>
                  <input
                    type="text"
                    value={formData.appreciation}
                    onChange={(e) => setFormData({ ...formData, appreciation: e.target.value })}
                    className="bg-white border border-gray-200 rounded p-1 text-sm text-gray-700 w-full mt-1"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t flex gap-3 flex-shrink-0 bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowModal(false)} className="flex-1 bg-white border border-gray-300 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-100 transition-colors">
                {t('cancel')}
              </button>
              <button onClick={handleSave} className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 shadow-md transition-colors flex justify-center items-center gap-2">
                <Save className="w-5 h-5" />
                {t('save')}
              </button>
            </div>
          </div>
        </div>
      )}

      <ImportModal isOpen={showImportModal} onClose={() => setShowImportModal(false)} title="استيراد النتائج الدراسية" type="academics" />
    </div>
  );
};

export default Academics;
