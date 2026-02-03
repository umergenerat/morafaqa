import React, { useState, useEffect, useMemo } from 'react';
import { Upload, FileSpreadsheet, Image as ImageIcon, FileText, Loader2, X, CheckCircle, AlertTriangle, RefreshCw, PlusCircle, Trash2, Lock, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { analyzeUploadedDocument, ImportContext } from '../services/geminiService';
import * as XLSX from 'xlsx';
import { STANDARDIZED_SUBJECTS } from '../constants';
import { useData } from '../context/DataContext';
import { UserRole } from '../types';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  type: ImportContext;
}

interface PreviewItem {
  _tempId: string;
  _status: 'new' | 'update';
  _existingId?: string;
  [key: string]: any;
}

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, title = "الاستيراد الذكي للبيانات", type }) => {
  const {
    addStudent,
    updateStudent,
    addHealthRecord,
    updateHealthRecord,
    updateAttendance,
    addAcademicRecord,
    updateAcademicRecord,
    students,
    users,
    updateUser,
    healthRecords,
    academicRecords,
    currentUser
  } = useData();

  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [previewData, setPreviewData] = useState<PreviewItem[]>([]);
  const [conflictResolution, setConflictResolution] = useState<'overwrite' | 'skip'>('overwrite');

  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  // Check if user is Admin
  const isAdmin = currentUser?.role === UserRole.ADMIN;

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setPreviewData([]);
      setErrorMsg('');
      setProcessing(false);
      setSortConfig(null);
    }
  }, [isOpen]);

  // Sort Logic
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedPreviewData = useMemo(() => {
    if (!sortConfig) return previewData;

    return [...previewData].sort((a, b) => {
      const valA = a[sortConfig.key];
      const valB = b[sortConfig.key];

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [previewData, sortConfig]);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await processFile(files[0]);
    }
  };

  const processFile = async (file: File) => {
    setProcessing(true);
    setErrorMsg('');
    setPreviewData([]);
    setSortConfig(null);

    try {
      // 1. Try Deterministic Template Parsing for Academics
      if (type === 'academics' && (file.name.endsWith('.xlsx') || file.name.endsWith('.csv'))) {
        const templateData = await parseExcelTemplate(file);
        if (templateData && templateData.length > 0) {
          processParsedData(templateData);
          setProcessing(false);
          return;
        }
      }

      // 2. Fallback to Gemini AI
      const result = await analyzeUploadedDocument(file, type);
      if (result && result.data && Array.isArray(result.data)) {
        processParsedData(result.data);
      } else {
        setErrorMsg("لم يتم العثور على بيانات صالحة في الملف.");
      }
    } catch (error) {
      console.error(error);
      setErrorMsg('حدث خطأ أثناء تحليل الملف. يرجى التأكد من الصيغة.');
    } finally {
      setProcessing(false);
    }
  };

  const parseExcelTemplate = async (file: File): Promise<any[] | null> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(sheet);

          // Check if it looks like our template (has Academic ID column)
          const hasIdCol = jsonData.length > 0 && Object.keys(jsonData[0] as object).some(k => k.includes('Academic ID'));

          if (!hasIdCol) {
            resolve(null); // Not our template, fallback to AI
            return;
          }

          // Parse Rows
          const parsed = jsonData.map((row: any) => {
            // Find ID key
            const idKey = Object.keys(row).find(k => k.includes('Academic ID'));
            const academicId = idKey ? row[idKey] : null;

            const subjects = STANDARDIZED_SUBJECTS.map(sub => {
              const noteKey = Object.keys(row).find(k => k.includes(sub) && k.includes('Note'));
              const coeffKey = Object.keys(row).find(k => k.includes(sub) && k.includes('Coeff'));

              if (noteKey && row[noteKey] !== undefined && row[noteKey] !== "") {
                return {
                  subjectName: sub,
                  grade: Number(row[noteKey]),
                  coefficient: coeffKey ? Number(row[coeffKey]) || 1 : 1
                };
              }
              return null;
            }).filter(s => s !== null);

            // Calculate average if not present (optional, usually recalculated in UI or backend, but let's take provided or 0)
            // Actually, we pass it to processParsedData which handles matching.
            // We return a "Raw Item" structure similar to what AI returns

            return {
              academicId: academicId,
              studentName: row["اسم التلميذ (Name)"] || "",
              semester: "S1", // Default, user can change in UI or we could extract from filename/header if added
              generalAverage: Number(row["المعدل العام (General Avg)"] || 0),
              rank: Number(row["الرتبة (Rank)"] || 0),
              subjects: subjects,
              teacherDecision: row["القرار (Decision)"],
              appreciation: row["التقدير (Appreciation)"]
            };
          });

          resolve(parsed);
        } catch (error) {
          console.error("Template Parse Error", error);
          resolve(null);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsBinaryString(file);
    });
  };

  const processParsedData = (items: any[]) => {
    const processed: PreviewItem[] = items.map(item => {
      let existing = null;
      let status: 'new' | 'update' = 'new';
      let existingId = undefined;

      // Matching Logic
      if (type === 'students') {
        if (item.academicId) {
          existing = students.find(s => s.academicId === String(item.academicId).trim());
        }
        if (!existing && item.fullName) {
          existing = students.find(s => s.fullName.trim().toLowerCase() === item.fullName.trim().toLowerCase());
        }
      } else if (type === 'health') {
        if (item.studentName) {
          const student = students.find(s => s.fullName.trim().toLowerCase().includes(item.studentName.trim().toLowerCase()));
          if (student) {
            const recordDate = item.date || new Date().toISOString().split('T')[0];
            existing = healthRecords.find(h => h.studentId === student.id && h.date === recordDate);
            // Enrich item with studentId if found
            item.studentId = student.id;
          }
        }
      } else if (type === 'academics') {
        const itemAcademicId = item.academicId ? String(item.academicId).trim().toUpperCase() : '';

        // 1. Try match by Massar ID first (Most reliable)
        if (itemAcademicId) {
          existing = academicRecords.find(r => {
            const student = students.find(s => s.academicId && s.academicId.trim().toUpperCase() === itemAcademicId);
            return student && r.studentId === student.id && r.semester === (item.semester || 'S1');
          });

          // Link student if found
          const studentById = students.find(s => s.academicId && s.academicId.trim().toUpperCase() === itemAcademicId);
          if (studentById) item.studentId = studentById.id;
        }

        // 2. Fallback to Name matching if not matched yet
        if (!item.studentId && item.studentName) {
          const normName = item.studentName.trim().toLowerCase();
          const student = students.find(s => s.fullName.trim().toLowerCase() === normName);

          if (student) {
            // Check if record exists for this matched student
            existing = academicRecords.find(r => r.studentId === student.id && r.semester === (item.semester || 'S1'));
            item.studentId = student.id;
          }
        }
      } else if (type === 'attendance') {
        const student = students.find(s => s.fullName.trim().toLowerCase().includes(item.studentName.trim().toLowerCase()));
        if (student) item.studentId = student.id;
      }

      if (existing) {
        status = 'update';
        existingId = existing.id;
        // Merge existing ID into item to ensure update works
        item.id = existing.id;
      }

      return {
        ...item,
        _tempId: crypto.randomUUID(),
        _status: status,
        _existingId: existingId
      };
    });

    setPreviewData(processed);
  };

  const handleUpdateItem = (id: string, field: string, value: any) => {
    if (!isAdmin) return; // Strict check
    setPreviewData(prev => prev.map(item =>
      item._tempId === id ? { ...item, [field]: value } : item
    ));
  };

  const handleDeleteItem = (id: string) => {
    if (!isAdmin) return; // Strict check
    setPreviewData(prev => prev.filter(item => item._tempId !== id));
  };

  const handleSaveData = () => {
    if (previewData.length === 0) return;

    previewData.forEach((item) => {
      // Skip updates if conflict resolution is 'skip'
      if (item._status === 'update' && conflictResolution === 'skip') return;

      try {
        if (type === 'students') {
          const studentId = item._existingId || crypto.randomUUID();
          const studentPayload = {
            id: studentId,
            fullName: item.fullName,
            gender: item.gender?.toLowerCase() === 'female' ? 'female' : 'male',
            academicId: item.academicId ? String(item.academicId) : `GEN-${Math.floor(Math.random() * 10000)}`,
            grade: item.grade || 'Unknown',
            scholarshipNumber: item.scholarshipNumber ? String(item.scholarshipNumber) : '',
            scholarshipType: item.scholarshipType || 'full',
            roomNumber: item.roomNumber ? String(item.roomNumber) : '',
            guardianPhone: item.guardianPhone ? String(item.guardianPhone) : '',
            guardianAddress: item.guardianAddress || '',
            guardianId: item.guardianId || '',
            photoUrl: item.photoUrl || `https://ui-avatars.com/api/?name=${item.fullName}&background=random`
          };

          if (item._status === 'update') {
            updateStudent(studentPayload as any);
          } else {
            addStudent(studentPayload as any);
          }

          // AUTO-LINKING PARENT LOGIC
          if (item.guardianId) {
            const parentUser = users.find(u => u.role === UserRole.PARENT && u.nationalId === item.guardianId);
            if (parentUser) {
              const currentLinks = parentUser.linkedStudentIds || [];
              if (!currentLinks.includes(studentId)) {
                updateUser({
                  ...parentUser,
                  linkedStudentIds: [...currentLinks, studentId]
                });
              }
            }
          }
        }
        else if (type === 'health') {
          let studentId = item.studentId;
          if (!studentId) {
            const student = students.find(s => s.fullName.includes(item.studentName));
            if (student) studentId = student.id;
          }

          if (studentId) {
            const payload = {
              id: item._existingId || crypto.randomUUID(),
              studentId: studentId,
              condition: item.condition,
              medication: item.medication,
              notes: item.notes,
              date: item.date || new Date().toISOString().split('T')[0],
              severity: item.severity || 'medium'
            };
            if (item._status === 'update') {
              updateHealthRecord(payload as any);
            } else {
              addHealthRecord(payload as any);
            }
          }
        }
        else if (type === 'attendance') {
          let studentId = item.studentId;
          if (!studentId) {
            const student = students.find(s => s.fullName.includes(item.studentName));
            if (student) studentId = student.id;
          }
          if (studentId) {
            updateAttendance(studentId, item.status.toLowerCase());
          }
        }
        else if (type === 'academics') {
          let studentId = item.studentId;
          if (!studentId) {
            const student = students.find(s => s.fullName.includes(item.studentName));
            if (student) studentId = student.id;
          }
          if (studentId) {
            const payload = {
              id: item._existingId || crypto.randomUUID(),
              studentId: studentId,
              semester: item.semester || 'S1',
              schoolYear: new Date().getFullYear() + '/' + (new Date().getFullYear() + 1),
              generalAverage: Number(item.generalAverage) || 0,
              rank: item.rank,
              subjects: item.subjects || [],
              teacherDecision: item.teacherDecision || (item.generalAverage >= 10 ? 'ينتقل' : 'يكرر'),
              appreciation: item.appreciation || (item.generalAverage >= 12 ? 'مستحسن' : 'متوسط')
            };
            if (item._status === 'update') {
              updateAcademicRecord(payload as any);
            } else {
              addAcademicRecord(payload as any);
            }
          }
        }
      } catch (e) {
        console.error("Error saving item", item, e);
      }
    });

    // Automatically close after saving
    onClose();
  };

  // Helper to render sortable header
  const SortHeader = ({ label, sortKey }: { label: string, sortKey: string }) => (
    <th
      className="px-4 py-3 text-right font-bold text-gray-700 bg-gray-50 border-b border-gray-200 whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors select-none group"
      onClick={() => handleSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        {label}
        <span className="opacity-50 group-hover:opacity-100 transition-opacity">
          {sortConfig && sortConfig.key === sortKey ? (
            sortConfig.direction === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-emerald-600" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
          )}
        </span>
      </div>
    </th>
  );

  const renderTableHeader = () => {
    return (
      <tr>
        {type === 'students' && (
          <>
            <SortHeader label="الاسم الكامل" sortKey="fullName" />
            <SortHeader label="رقم مسار" sortKey="academicId" />
            <SortHeader label="المستوى" sortKey="grade" />
            <SortHeader label="الغرفة" sortKey="roomNumber" />
            <SortHeader label="رقم بطاقة الولي" sortKey="guardianId" />
          </>
        )}
        {type === 'health' && (
          <>
            <SortHeader label="الطالب" sortKey="studentName" />
            <SortHeader label="الحالة" sortKey="condition" />
            <SortHeader label="الخطورة" sortKey="severity" />
            <SortHeader label="التاريخ" sortKey="date" />
          </>
        )}
        {type === 'attendance' && (
          <>
            <SortHeader label="الطالب" sortKey="studentName" />
            <SortHeader label="حالة الحضور" sortKey="status" />
            <SortHeader label="التاريخ" sortKey="date" />
          </>
        )}
        {type === 'academics' && (
          <>
            <SortHeader label="الطالب" sortKey="studentName" />
            <SortHeader label="المعدل العام" sortKey="generalAverage" />
            <SortHeader label="الدورة" sortKey="semester" />
          </>
        )}

        <SortHeader label="الحالة" sortKey="_status" />
        {isAdmin && <th className="px-4 py-3 text-center font-bold text-gray-700 bg-gray-50 border-b border-gray-200">إجراء</th>}
      </tr>
    );
  };

  // Helper for input styling with validation
  const inputClass = (value: any) => `
    w-full bg-transparent border-b-2 outline-none px-2 py-1 transition-colors rounded-sm
    ${!value ? 'border-red-300 bg-red-50' : 'border-transparent'}
    ${isAdmin ? 'focus:border-emerald-500 hover:bg-gray-50' : 'cursor-default text-gray-600'}
  `;

  const renderRowInputs = (item: PreviewItem) => {
    const disabled = !isAdmin;

    switch (type) {
      case 'students': return (
        <>
          <td className="px-4 py-2">
            <input type="text" disabled={disabled} value={item.fullName || ''} onChange={(e) => handleUpdateItem(item._tempId, 'fullName', e.target.value)} className={inputClass(item.fullName)} placeholder="مطلوب" />
          </td>
          <td className="px-4 py-2">
            <input type="text" disabled={disabled} value={item.academicId || ''} onChange={(e) => handleUpdateItem(item._tempId, 'academicId', e.target.value)} className={inputClass(item.academicId)} placeholder="مطلوب" />
          </td>
          <td className="px-4 py-2">
            <input type="text" disabled={disabled} value={item.grade || ''} onChange={(e) => handleUpdateItem(item._tempId, 'grade', e.target.value)} className={inputClass(item.grade)} />
          </td>
          <td className="px-4 py-2">
            <input type="text" disabled={disabled} value={item.roomNumber || ''} onChange={(e) => handleUpdateItem(item._tempId, 'roomNumber', e.target.value)} className={inputClass(item.roomNumber)} />
          </td>
          <td className="px-4 py-2">
            <input type="text" disabled={disabled} value={item.guardianId || ''} onChange={(e) => handleUpdateItem(item._tempId, 'guardianId', e.target.value)} className={`bg-transparent border-b-2 outline-none px-2 py-1 w-full ${!item.guardianId ? 'border-gray-200 text-gray-400 italic' : 'border-transparent text-gray-800'}`} placeholder="CNIE" />
          </td>
        </>
      );
      case 'health': return (
        <>
          <td className="px-4 py-2">
            <input type="text" disabled={disabled} value={item.studentName || ''} onChange={(e) => handleUpdateItem(item._tempId, 'studentName', e.target.value)} className={inputClass(item.studentName)} placeholder="مطلوب" />
          </td>
          <td className="px-4 py-2">
            <input type="text" disabled={disabled} value={item.condition || ''} onChange={(e) => handleUpdateItem(item._tempId, 'condition', e.target.value)} className={inputClass(item.condition)} placeholder="مطلوب" />
          </td>
          <td className="px-4 py-2">
            <select disabled={disabled} value={item.severity || 'low'} onChange={(e) => handleUpdateItem(item._tempId, 'severity', e.target.value)} className={`bg-transparent outline-none w-full border-b border-transparent ${isAdmin ? 'focus:border-emerald-500' : 'appearance-none'}`}>
              <option value="low">بسيطة</option>
              <option value="medium">متوسطة</option>
              <option value="high">حرجة</option>
            </select>
          </td>
          <td className="px-4 py-2">
            <input type="date" disabled={disabled} value={item.date || ''} onChange={(e) => handleUpdateItem(item._tempId, 'date', e.target.value)} className={`bg-transparent outline-none w-full border-b border-transparent ${isAdmin ? 'focus:border-emerald-500' : ''}`} />
          </td>
        </>
      );
      case 'attendance': return (
        <>
          <td className="px-4 py-2">
            <input type="text" disabled={disabled} value={item.studentName || ''} onChange={(e) => handleUpdateItem(item._tempId, 'studentName', e.target.value)} className={inputClass(item.studentName)} placeholder="مطلوب" />
          </td>
          <td className="px-4 py-2">
            <select disabled={disabled} value={item.status || 'present'} onChange={(e) => handleUpdateItem(item._tempId, 'status', e.target.value)} className={`bg-transparent outline-none w-full border-b border-transparent ${isAdmin ? 'focus:border-emerald-500' : 'appearance-none'}`}>
              <option value="present">حاضر</option>
              <option value="absent">غائب</option>
              <option value="late">متأخر</option>
            </select>
          </td>
          <td className="px-4 py-2">
            <input type="date" disabled={disabled} value={item.date || ''} onChange={(e) => handleUpdateItem(item._tempId, 'date', e.target.value)} className={`bg-transparent outline-none w-full border-b border-transparent ${isAdmin ? 'focus:border-emerald-500' : ''}`} />
          </td>
        </>
      );
      case 'academics': return (
        <>
          <td className="px-4 py-2">
            <input type="text" disabled={disabled} value={item.studentName || ''} onChange={(e) => handleUpdateItem(item._tempId, 'studentName', e.target.value)} className={inputClass(item.studentName)} placeholder="مطلوب" />
          </td>
          <td className="px-4 py-2">
            <input type="number" disabled={disabled} value={item.generalAverage || 0} onChange={(e) => handleUpdateItem(item._tempId, 'generalAverage', e.target.value)} className={inputClass(item.generalAverage)} />
          </td>
          <td className="px-4 py-2">
            <select disabled={disabled} value={item.semester || 'S1'} onChange={(e) => handleUpdateItem(item._tempId, 'semester', e.target.value)} className={`bg-transparent outline-none w-full border-b border-transparent ${isAdmin ? 'focus:border-emerald-500' : 'appearance-none'}`}>
              <option value="S1">S1</option>
              <option value="S2">S2</option>
            </select>
          </td>
        </>
      );
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b flex justify-between items-center bg-white flex-shrink-0 relative z-20">
          <div>
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <div className="bg-emerald-100 p-2 rounded-lg">
                <Upload className="w-5 h-5 text-emerald-600" />
              </div>
              {title}
            </h3>
            <p className="text-sm text-gray-500 mt-1 mr-1">
              {type === 'students' ? 'استيراد وقراءة لوائح التلاميذ' :
                type === 'health' ? 'تحليل التقارير الطبية' :
                  type === 'attendance' ? 'معالجة ورقة الغياب' : 'استيراد كشوف النقاط'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* NEW: Top Confirm Button */}
            {previewData.length > 0 && (
              <button
                onClick={handleSaveData}
                className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-emerald-700 transition-colors shadow-sm animate-fade-in"
              >
                <CheckCircle className="w-4 h-4" />
                <span>تأكيد الاستيراد</span>
              </button>
            )}

            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-0 overflow-hidden flex-1 flex flex-col bg-gray-50/50">
          {errorMsg && (
            <div className="m-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-center gap-3 text-sm animate-shake">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {previewData.length === 0 ? (
            <div className="p-8 overflow-y-auto custom-scrollbar flex-1 flex items-center justify-center">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                    border-3 border-dashed rounded-2xl p-12 text-center transition-all duration-300 w-full max-w-2xl
                    ${isDragging ? 'border-emerald-500 bg-emerald-50 scale-[1.02]' : 'border-gray-300 hover:border-emerald-400 hover:bg-white bg-white/50'}
                `}
              >
                {processing ? (
                  <div className="flex flex-col items-center py-8">
                    <div className="relative mb-6">
                      <div className="w-16 h-16 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-emerald-600 animate-pulse" />
                      </div>
                    </div>
                    <p className="text-xl font-bold text-gray-800 mb-2">جاري تحليل الوثيقة...</p>
                    <p className="text-sm text-gray-500">نقوم بقراءة البيانات واستخراجها باستخدام الذكاء الاصطناعي</p>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-center gap-6 mb-8">
                      <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm"><FileText className="w-7 h-7" /></div>
                      <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center shadow-sm"><FileSpreadsheet className="w-7 h-7" /></div>
                      <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shadow-sm"><ImageIcon className="w-7 h-7" /></div>
                    </div>
                    <h4 className="text-xl font-bold text-gray-800 mb-3">سحب وإفلات الملفات هنا</h4>
                    <p className="text-sm text-gray-500 mb-8 max-w-sm mx-auto">يدعم النظام ملفات Excel، صور المستندات، وملفات PDF. سيتم التعرف على البيانات تلقائياً.</p>

                    <input
                      type="file"
                      id="fileInput"
                      className="hidden"
                      onChange={(e) => e.target.files && e.target.files.length > 0 && processFile(e.target.files[0])}
                      accept="image/*,.pdf,.xlsx,.xls,.csv"
                    />
                    <label
                      htmlFor="fileInput"
                      className="inline-flex items-center gap-2 bg-emerald-600 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-emerald-700 cursor-pointer shadow-lg hover:shadow-emerald-200 transition-all hover:-translate-y-1"
                    >
                      <Upload className="w-5 h-5" />
                      اختيار ملف من الجهاز
                    </label>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full animate-fade-in bg-white">
              {/* Toolbar */}
              <div className="px-6 py-3 bg-gray-50 border-b flex flex-wrap justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-gray-700 bg-white px-3 py-1.5 rounded-lg border shadow-sm">
                    <PlusCircle className="w-4 h-4 text-emerald-600" />
                    <span>سجلات جديدة: <b className="text-emerald-700">{previewData.filter(i => i._status === 'new').length}</b></span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700 bg-white px-3 py-1.5 rounded-lg border shadow-sm">
                    <RefreshCw className="w-4 h-4 text-orange-600" />
                    <span>تحديث سجلات: <b className="text-orange-700">{previewData.filter(i => i._status === 'update').length}</b></span>
                  </div>
                </div>

                {previewData.some(i => i._status === 'update') && isAdmin && (
                  <div className="flex items-center gap-3 bg-orange-50 px-4 py-2 rounded-lg border border-orange-200">
                    <span className="text-xs font-bold text-orange-800 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      بيانات مكررة:
                    </span>
                    <label className="flex items-center gap-1.5 cursor-pointer hover:bg-orange-100/50 px-2 py-0.5 rounded transition-colors">
                      <input type="radio" checked={conflictResolution === 'overwrite'} onChange={() => setConflictResolution('overwrite')} className="text-orange-600 focus:ring-orange-500" />
                      <span className="text-xs font-medium">تحديث</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer hover:bg-orange-100/50 px-2 py-0.5 rounded transition-colors">
                      <input type="radio" checked={conflictResolution === 'skip'} onChange={() => setConflictResolution('skip')} className="text-orange-600 focus:ring-orange-500" />
                      <span className="text-xs font-medium">تجاهل</span>
                    </label>
                  </div>
                )}

                {!isAdmin && (
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg">
                    <Lock className="w-3.5 h-3.5" />
                    وضع المعاينة (للتعديل يرجى التواصل مع المدير)
                  </div>
                )}
              </div>

              {/* Data Table */}
              <div className="flex-1 overflow-auto custom-scrollbar relative">
                <table className="w-full text-sm text-right border-collapse">
                  <thead className="bg-gray-50 text-gray-600 font-bold sticky top-0 z-10 shadow-sm border-b">
                    {renderTableHeader()}
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {sortedPreviewData.map((item) => (
                      <tr key={item._tempId} className={`hover:bg-gray-50 group transition-colors ${item._status === 'update' ? 'bg-orange-50/20' : ''}`}>
                        {renderRowInputs(item)}
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${item._status === 'new' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>
                            {item._status === 'new' ? 'جديد' : 'موجود'}
                          </span>
                        </td>
                        {isAdmin && (
                          <td className="px-4 py-2 text-center">
                            <button
                              onClick={() => handleDeleteItem(item._tempId)}
                              className="text-gray-400 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 transition-colors"
                              title="حذف السجل"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-4 border-t bg-gray-50 flex items-center justify-between gap-4 flex-shrink-0 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <button onClick={() => setPreviewData([])} className="px-6 py-2.5 bg-white border border-gray-300 rounded-xl hover:bg-gray-100 text-gray-700 font-bold text-sm transition-colors shadow-sm">
                  إلغاء / إعادة
                </button>

                <button
                  onClick={handleSaveData}
                  className="px-8 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-bold shadow-lg hover:shadow-emerald-200 transition-all flex items-center gap-2 transform active:scale-95"
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>تأكيد الاستيراد</span>
                  <span className="bg-white/20 px-2 py-0.5 rounded text-xs ml-1">{previewData.length}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportModal;