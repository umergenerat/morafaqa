import React, { useState } from 'react';
import {
  Search, Plus, Filter, Phone, MapPin, User, MessageCircle,
  FileText, GraduationCap, Edit2, Trash2, X, Sparkles, Send, Check,
  HeartPulse, AlertTriangle, Clock, Upload, AlertOctagon, Fingerprint, ArrowRight
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { Student, UserRole } from '../types';
import { generateStudentReport, draftParentMessage } from '../services/geminiService';
import ImportModal from '../components/ImportModal';

const StudentList: React.FC = () => {
  const {
    students, addStudent, updateStudent, deleteStudent,
    currentUser, behaviorRecords, healthRecords,
    users, updateUser
  } = useData();
  const { t, language } = useLanguage();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Parent Linking State
  const [selectedParentIds, setSelectedParentIds] = useState<string[]>([]);

  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Student>>({});

  // Message AI State
  const [messageTopic, setMessageTopic] = useState<'absence' | 'health' | 'behavior' | 'general'>('general');
  const [messageDetails, setMessageDetails] = useState('');
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [isGeneratingMsg, setIsGeneratingMsg] = useState(false);

  // Report AI State
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [aiReport, setAiReport] = useState<{ summary: string; recommendations: string[] } | null>(null);

  const canEdit = currentUser && [UserRole.ADMIN, UserRole.SUPERVISOR].includes(currentUser.role);
  const isParent = currentUser?.role === UserRole.PARENT;

  // Filter logic
  const filteredStudents = students.filter(student => {
    // If parent, only show linked students
    if (isParent && !currentUser?.linkedStudentIds?.includes(student.id)) return false;

    return student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.academicId.includes(searchTerm);
  });

  const handleOpenAdd = () => {
    setIsEditing(false);
    setFormData({ gender: 'male', scholarshipType: 'full', grade: 'الأولى إعدادي', guardianId: '' });
    setSelectedParentIds([]);
    setShowAddModal(true);
  };

  const handleOpenEdit = (student: Student, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsEditing(true);
    setFormData({ ...student });

    // Find linked parents
    const linkedParents = users
      .filter(u => u.role === UserRole.PARENT && u.linkedStudentIds?.includes(student.id))
      .map(u => u.id);
    setSelectedParentIds(linkedParents);

    setShowAddModal(true);
  };

  const handleDeleteClick = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setStudentToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (studentToDelete) {
      deleteStudent(studentToDelete);
      if (selectedStudent?.id === studentToDelete) setSelectedStudent(null);
      setShowDeleteModal(false);
      setStudentToDelete(null);
    }
  };

  const handleSaveStudent = () => {
    if (!formData.fullName || !formData.academicId) return;

    const newId = isEditing && formData.id ? formData.id : crypto.randomUUID();

    const studentData = {
      ...formData,
      id: newId,
      photoUrl: formData.photoUrl || `https://ui-avatars.com/api/?name=${formData.fullName}&background=random`
    } as Student;

    if (isEditing) {
      updateStudent(studentData);
    } else {
      addStudent(studentData);
    }

    // Update Parents Links
    // 1. Handle Automatic Link via Guardian ID
    if (formData.guardianId) {
      const autoLinkParent = users.find(u => u.role === UserRole.PARENT && u.nationalId === formData.guardianId);
      if (autoLinkParent && !selectedParentIds.includes(autoLinkParent.id)) {
        selectedParentIds.push(autoLinkParent.id);
      }
    }

    // 2. Process all parent links
    const parentUsers = users.filter(u => u.role === UserRole.PARENT);
    parentUsers.forEach(parent => {
      const isSelected = selectedParentIds.includes(parent.id);
      const currentLinks = parent.linkedStudentIds || [];
      const isLinked = currentLinks.includes(newId);

      if (isSelected && !isLinked) {
        updateUser({ ...parent, linkedStudentIds: [...currentLinks, newId] });
      } else if (!isSelected && isLinked) {
        updateUser({ ...parent, linkedStudentIds: currentLinks.filter(id => id !== newId) });
      }
    });

    setShowAddModal(false);
  };

  const handleGenerateMessage = async () => {
    if (!selectedStudent) return;
    setIsGeneratingMsg(true);
    const msg = await draftParentMessage(selectedStudent.fullName, messageTopic, messageDetails);
    setGeneratedMessage(msg);
    setIsGeneratingMsg(false);
  };

  const handleGenerateReport = async () => {
    if (!selectedStudent) return;
    setIsGeneratingReport(true);
    const sBehavior = behaviorRecords.filter(b => b.studentId === selectedStudent.id);
    const sHealth = healthRecords.filter(h => h.studentId === selectedStudent.id);

    const report = await generateStudentReport(selectedStudent, sBehavior, sHealth);
    setAiReport(report);
    setIsGeneratingReport(false);
  };

  // Helper for topic icons
  const getTopicIcon = (topic: string) => {
    switch (topic) {
      case 'absence': return <Clock className="w-5 h-5" />;
      case 'health': return <HeartPulse className="w-5 h-5" />;
      case 'behavior': return <AlertTriangle className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6 relative h-[calc(100vh-140px)] flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{t('students')}</h2>
          <p className="text-gray-500 mt-1">{t('total_students')}: {filteredStudents.length}</p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <input
              type="text"
              placeholder={t('search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
            />
            <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
          </div>
          {canEdit && (
            <>
              <button
                onClick={() => setShowImportModal(true)}
                className="bg-white border border-gray-300 text-gray-700 px-3 py-2.5 rounded-xl font-bold hover:bg-gray-50 flex items-center gap-2 shadow-sm transition-all"
                title="استيراد لائحة"
              >
                <Upload className="w-5 h-5" />
                <span className="hidden sm:inline">{t('import')}</span>
              </button>
              <button
                onClick={handleOpenAdd}
                className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-emerald-700 flex items-center gap-2 shadow-md transition-all active:scale-95 whitespace-nowrap hidden md:flex"
              >
                <Plus className="w-5 h-5" />
                <span>{t('add_student')}</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 relative min-h-0">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          {/* Student List - Hidden on mobile if student selected */}
          <div className={`
             lg:col-span-${selectedStudent ? '2' : '3'} 
             overflow-y-auto pr-2 custom-scrollbar transition-all duration-300 pb-20
             ${selectedStudent ? 'hidden lg:block' : 'block'}
          `}>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredStudents.map(student => (
                <div
                  key={student.id}
                  onClick={() => { setSelectedStudent(student); setAiReport(null); }}
                  className={`bg-white p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md group relative
                      ${selectedStudent?.id === student.id ? 'border-emerald-500 ring-1 ring-emerald-500 shadow-md' : 'border-gray-200'}
                    `}
                >
                  <div className="flex items-start gap-4">
                    <img src={student.photoUrl} alt={student.fullName} className="w-14 h-14 rounded-full object-cover border border-gray-100 flex-shrink-0" />
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-800 line-clamp-1">{student.fullName}</h3>
                      <p className="text-xs text-gray-500 font-mono mb-1">{student.academicId}</p>
                      <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold">{student.grade}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-50 flex justify-between items-center">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <MapPin className="w-3 h-3" />
                      <span>غرفة {student.roomNumber}</span>
                    </div>
                    {canEdit && (
                      <div className="flex gap-1 opacity-100 transition-opacity">
                        <button onClick={(e) => handleOpenEdit(student, e)} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={(e) => handleDeleteClick(student.id, e)} className="p-1.5 hover:bg-red-50 text-red-600 rounded"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {filteredStudents.length === 0 && (
              <div className="text-center py-20 text-gray-400">
                <User className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p>لا توجد نتائج</p>
              </div>
            )}
          </div>

          {/* Student Detail Panel - Fixed overlay on mobile, static on desktop */}
          {selectedStudent && (
            <div className={`
              lg:col-span-1 bg-white lg:rounded-2xl shadow-lg border border-gray-200 flex flex-col 
              fixed inset-0 z-[60] lg:static lg:z-auto lg:h-full overflow-hidden animate-slide-up lg:animate-none
            `}>
              {/* Header */}
              <div className="relative h-32 bg-emerald-600 flex-shrink-0">
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="absolute top-4 left-4 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full backdrop-blur-sm transition-colors z-10 lg:p-1.5"
                >
                  {/* On mobile use arrow back if preferred, or X */}
                  <span className="lg:hidden"><ArrowRight className={`w-6 h-6 ${language === 'ar' ? 'rotate-180' : ''}`} /></span>
                  <span className="hidden lg:block"><X className="w-5 h-5" /></span>
                </button>

                {/* Edit/Delete Actions for Detail View */}
                {canEdit && (
                  <div className="absolute top-4 right-4 flex gap-2 z-10">
                    <button
                      onClick={(e) => handleOpenEdit(selectedStudent, e)}
                      className="bg-white/20 hover:bg-white/30 text-white p-1.5 rounded-full backdrop-blur-sm transition-colors"
                      title="تعديل"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteClick(selectedStudent.id, e)}
                      className="bg-white/20 hover:bg-red-500/50 text-white p-1.5 rounded-full backdrop-blur-sm transition-colors"
                      title="حذف"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                )}

                <div className="absolute -bottom-10 right-1/2 translate-x-1/2">
                  <img src={selectedStudent.photoUrl} alt="" className="w-24 h-24 rounded-full border-4 border-white shadow-md object-cover bg-white" />
                </div>
              </div>

              {/* Content */}
              <div className="pt-12 px-6 pb-6 overflow-y-auto flex-1 custom-scrollbar bg-white">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800">{selectedStudent.fullName}</h2>
                  <p className="text-sm text-gray-500 font-mono">{selectedStudent.academicId}</p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 p-3 rounded-xl text-center">
                      <p className="text-xs text-gray-400 font-bold mb-1">المستوى</p>
                      <p className="font-bold text-gray-800">{selectedStudent.grade}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl text-center">
                      <p className="text-xs text-gray-400 font-bold mb-1">الغرفة</p>
                      <p className="font-bold text-gray-800">{selectedStudent.roomNumber}</p>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-xs text-gray-400 font-bold mb-1">ولي الأمر</p>
                    <p className="font-bold text-gray-800 dir-ltr text-right font-mono flex items-center gap-2 justify-end mb-1">
                      {selectedStudent.guardianPhone}
                      <Phone className="w-4 h-4 text-emerald-500" />
                    </p>
                    {selectedStudent.guardianAddress && (
                      <p className="text-xs text-gray-600 border-t pt-1 mt-1">
                        {selectedStudent.guardianAddress}
                      </p>
                    )}
                    {selectedStudent.guardianId && (
                      <p className="text-xs text-gray-400 mt-2 flex items-center gap-1 justify-end">
                        CNIE: {selectedStudent.guardianId}
                        <Fingerprint className="w-3 h-3" />
                      </p>
                    )}
                  </div>

                  {canEdit && (
                    <div className="flex gap-2 mt-4">
                      <a
                        href={`tel:${selectedStudent.guardianPhone}`}
                        className="flex-1 bg-emerald-600 text-white py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors shadow-md font-bold"
                      >
                        <Phone className="w-5 h-5" />
                        اتصال
                      </a>
                      <button
                        onClick={() => setShowMessageModal(true)}
                        className="flex-1 bg-blue-600 text-white py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-md font-bold"
                      >
                        <MessageCircle className="w-5 h-5" />
                        مراسلة
                      </button>
                    </div>
                  )}

                  {/* AI Report Section */}
                  <div className="mt-6 border-t pt-4 pb-20 lg:pb-0">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        التقرير الذكي
                      </h3>
                      <button
                        onClick={handleGenerateReport}
                        disabled={isGeneratingReport}
                        className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-bold hover:bg-purple-200 transition-colors disabled:opacity-50"
                      >
                        {isGeneratingReport ? 'جاري التحليل...' : 'توليد تقرير'}
                      </button>
                    </div>

                    {aiReport && (
                      <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 text-sm animate-fade-in">
                        <p className="font-bold text-purple-900 mb-2">الملخص:</p>
                        <p className="text-purple-800 mb-3 leading-relaxed">{aiReport.summary}</p>
                        <p className="font-bold text-purple-900 mb-2">التوصيات:</p>
                        <ul className="list-disc list-inside text-purple-800 space-y-1">
                          {aiReport.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button for Adding Student (Mobile) */}
      {canEdit && !selectedStudent && (
        <button
          onClick={handleOpenAdd}
          className="fixed bottom-24 left-6 md:bottom-12 md:left-12 bg-emerald-600 text-white p-4 rounded-full shadow-2xl hover:bg-emerald-700 transition-all hover:scale-110 z-30 flex items-center justify-center md:hidden"
          title={t('add_student')}
        >
          <Plus className="w-7 h-7" />
        </button>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200 p-6 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertOctagon className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">تأكيد الحذف</h3>
            <p className="text-gray-500 text-sm mb-6">
              هل أنت متأكد من رغبتك في حذف هذا الطالب؟ سيتم حذف جميع البيانات المرتبطة به.
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-white border border-gray-300 text-gray-700 font-bold py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 bg-red-600 text-white font-bold py-2.5 rounded-xl hover:bg-red-700 shadow-md transition-colors"
              >
                نعم، احذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">{isEditing ? 'تعديل بيانات تلميذ' : t('add_student')}</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6 overflow-y-auto">
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">الاسم الكامل</label>
                  <input type="text" value={formData.fullName || ''} onChange={e => setFormData({ ...formData, fullName: e.target.value })} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">رقم مسار (CNE)</label>
                    <input type="text" value={formData.academicId || ''} onChange={e => setFormData({ ...formData, academicId: e.target.value })} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">رقم المنحة</label>
                    <input type="text" value={formData.scholarshipNumber || ''} onChange={e => setFormData({ ...formData, scholarshipNumber: e.target.value })} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">المستوى</label>
                    <input type="text" value={formData.grade || ''} onChange={e => setFormData({ ...formData, grade: e.target.value })} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">الغرفة</label>
                    <input type="text" value={formData.roomNumber || ''} onChange={e => setFormData({ ...formData, roomNumber: e.target.value })} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">هاتف ولي الأمر</label>
                  <input type="text" value={formData.guardianPhone || ''} onChange={e => setFormData({ ...formData, guardianPhone: e.target.value })} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none dir-ltr text-right" placeholder="06..." />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">عنوان ولي الأمر</label>
                  <input type="text" value={formData.guardianAddress || ''} onChange={e => setFormData({ ...formData, guardianAddress: e.target.value })} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1">
                    <Fingerprint className="w-4 h-4 text-gray-400" />
                    رقم بطاقة ولي الأمر (للربط التلقائي)
                  </label>
                  <input
                    type="text"
                    value={formData.guardianId || ''}
                    onChange={e => setFormData({ ...formData, guardianId: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none font-mono uppercase"
                    placeholder="مثال: AB123456"
                  />
                </div>

                {/* Link Parents Section */}
                <div className="mt-4 border-t pt-4">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    ربط بحساب ولي أمر (يدوي)
                  </label>
                  <div className="border border-gray-300 rounded-xl overflow-hidden">
                    <div className="max-h-32 overflow-y-auto bg-gray-50 p-2 space-y-1 custom-scrollbar">
                      {users.filter(u => u.role === UserRole.PARENT).length === 0 && (
                        <p className="text-xs text-gray-400 text-center py-2">لا يوجد حسابات أولياء أمور.</p>
                      )}
                      {users.filter(u => u.role === UserRole.PARENT).map(parent => (
                        <div
                          key={parent.id}
                          onClick={() => {
                            setSelectedParentIds(prev =>
                              prev.includes(parent.id)
                                ? prev.filter(id => id !== parent.id)
                                : [...prev, parent.id]
                            );
                          }}
                          className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors border ${selectedParentIds.includes(parent.id) ? 'bg-white border-emerald-500 shadow-sm' : 'border-transparent hover:bg-gray-200/50'}`}
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${selectedParentIds.includes(parent.id) ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-400 bg-white'}`}>
                            {selectedParentIds.includes(parent.id) && <Check className="w-3 h-3" />}
                          </div>
                          <div className="flex items-center gap-2">
                            <img src={parent.avatar} className="w-6 h-6 rounded-full" alt="" />
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-gray-700">{parent.name}</span>
                              {parent.nationalId && <span className="text-[10px] text-gray-400 font-mono">{parent.nationalId}</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </form>
            </div>
            <div className="p-6 border-t flex gap-3 bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowAddModal(false)} className="flex-1 bg-white border border-gray-300 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-100">{t('cancel')}</button>
              <button onClick={handleSaveStudent} className="flex-1 bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700">{t('save')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {showMessageModal && selectedStudent && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 flex flex-col max-h-[90vh] overflow-hidden">
            <div className="p-5 border-b bg-gradient-to-l from-blue-50 to-white flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-1">
                  <MessageCircle className="w-6 h-6 text-blue-600" />
                  مراسلة ولي الأمر
                </h3>
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <span className="font-bold">{selectedStudent.fullName}</span>
                  <span className="dir-ltr">{selectedStudent.guardianPhone}</span>
                </p>
              </div>
              <button onClick={() => setShowMessageModal(false)} className="text-gray-400 hover:text-gray-600 bg-white p-1 rounded-full shadow-sm">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar">
              <div className="space-y-6">
                {/* Topic Selection */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">اختر موضوع الرسالة</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { id: 'absence', label: 'غياب', icon: <Clock />, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
                      { id: 'health', label: 'صحة', icon: <HeartPulse />, color: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-200' },
                      { id: 'behavior', label: 'سلوك', icon: <AlertTriangle />, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
                      { id: 'general', label: 'عام', icon: <FileText />, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' }
                    ].map((topic) => (
                      <button
                        key={topic.id}
                        onClick={() => setMessageTopic(topic.id as any)}
                        className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 ${messageTopic === topic.id
                            ? `${topic.bg} ${topic.border} ${topic.color} ring-1 ring-offset-1`
                            : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200 hover:bg-gray-50'
                          }`}
                      >
                        <div className={messageTopic === topic.id ? '' : 'grayscale opacity-70'}>
                          {React.cloneElement(topic.icon as React.ReactElement<any>, { className: "w-6 h-6" })}
                        </div>
                        <span className="text-xs font-bold">{topic.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Details Input */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">التفاصيل / الملاحظات</label>
                  <textarea
                    value={messageDetails}
                    onChange={(e) => setMessageDetails(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl p-4 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none resize-none h-28 transition-colors"
                    placeholder="اكتب تفاصيل الرسالة هنا..."
                  />
                </div>

                {/* AI Generator Button */}
                <button
                  onClick={handleGenerateMessage}
                  disabled={isGeneratingMsg || !messageDetails}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3 rounded-xl hover:shadow-lg hover:shadow-blue-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
                >
                  {isGeneratingMsg ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Sparkles className="w-5 h-5 text-yellow-300" />
                  )}
                  {isGeneratingMsg ? 'جاري الصياغة...' : 'توليد الرسالة بالذكاء الاصطناعي'}
                </button>

                {/* Preview Bubble */}
                {generatedMessage && (
                  <div className="animate-fade-in">
                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">معاينة الرسالة</label>
                    <div className="bg-[#DCF8C6] p-4 rounded-xl rounded-tr-none border border-green-200 shadow-sm relative">
                      <div className="absolute -right-2 top-0 w-4 h-4 bg-[#DCF8C6] border-t border-green-200 transform -rotate-45"></div>
                      <textarea
                        value={generatedMessage}
                        onChange={(e) => setGeneratedMessage(e.target.value)}
                        className="w-full bg-transparent border-none p-0 text-gray-800 text-sm focus:ring-0 resize-none h-32 leading-relaxed"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-5 border-t flex gap-3 bg-gray-50">
              <button onClick={() => setShowMessageModal(false)} className="px-6 bg-white border border-gray-300 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-100 transition-colors">
                {t('cancel')}
              </button>
              <a
                href={`https://wa.me/${selectedStudent.guardianPhone?.replace(/\s/g, '').replace(/^0/, '212')}?text=${encodeURIComponent(generatedMessage)}`}
                target="_blank"
                rel="noreferrer"
                className={`flex-1 bg-[#25D366] text-white font-bold py-3 rounded-xl hover:bg-[#128C7E] shadow-md transition-colors flex justify-center items-center gap-2 ${!generatedMessage ? 'pointer-events-none opacity-50 grayscale' : ''}`}
              >
                <Send className="w-5 h-5" />
                إرسال عبر WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      <ImportModal isOpen={showImportModal} onClose={() => setShowImportModal(false)} title="استيراد لائحة التلاميذ" type="students" />
    </div>
  );
};

export default StudentList;