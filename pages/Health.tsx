import React, { useState } from 'react';
import { Plus, Pill, Clock, Upload, Trash2, X, Calendar } from 'lucide-react';
import { useData } from '../context/DataContext';
import ImportModal from '../components/ImportModal';
import { HealthRecord, UserRole } from '../types';

const Health: React.FC = () => {
  const { students, healthRecords, addHealthRecord, deleteHealthRecord, currentUser } = useData();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  
  // Form State
  const [newRecord, setNewRecord] = useState<Partial<HealthRecord>>({ 
    severity: 'low',
    date: new Date().toISOString().split('T')[0]
  });

  const isParent = currentUser?.role === UserRole.PARENT;

  // Filter records based on role
  const displayedHealthRecords = isParent
    ? healthRecords.filter(h => currentUser?.linkedStudentIds?.includes(h.studentId))
    : healthRecords;

  const handleSaveRecord = () => {
    if (!newRecord.studentId || !newRecord.condition) return;

    addHealthRecord({
      id: crypto.randomUUID(),
      date: newRecord.date || new Date().toISOString().split('T')[0],
      studentId: newRecord.studentId,
      condition: newRecord.condition,
      notes: newRecord.notes || '',
      severity: newRecord.severity as 'low' | 'medium' | 'high',
      medication: newRecord.medication || ''
    });
    
    setShowAddModal(false);
    setNewRecord({ severity: 'low', date: new Date().toISOString().split('T')[0] }); // Reset
  };

  // Mock medication schedule logic (filtering for demo)
  const medicationSchedule = isParent 
    ? [] // In real app, filter medication schedule based on linked students
    : [{ studentName: 'يوسف العمراني', med: 'Loratadine - 10mg', time: '12:30 م' }];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{isParent ? 'الملف الطبي لأبنائي' : 'وحدة الرعاية الصحية'}</h2>
          <p className="text-gray-500 font-medium mt-1">
             {isParent ? 'متابعة الحالة الصحية والوصفات الطبية' : 'إدارة الملفات الطبية والزيارات اليومية'}
          </p>
        </div>
        {!isParent && (
          <div className="flex gap-3 w-full sm:w-auto">
            <button 
              onClick={() => setShowImportModal(true)}
              className="flex-1 sm:flex-none bg-white border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 font-medium shadow-sm transition-colors"
            >
              <Upload className="w-5 h-5" />
              <span className="hidden sm:inline">استيراد تقرير</span>
            </button>
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex-1 sm:flex-none bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 font-bold shadow-md transition-transform active:scale-95"
            >
              <Plus className="w-5 h-5" />
              <span>تسجيل زيارة</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Medication Schedule - Hide for parents if empty or customize */}
        {!isParent && (
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-xl shadow-sm p-6 border-t-4 border-yellow-400">
              <h3 className="font-bold text-gray-800 mb-5 flex items-center gap-2 text-lg">
                <Clock className="w-6 h-6 text-yellow-500" />
                مواعيد الدواء القادمة
              </h3>
              <div className="space-y-3">
                {/* Demo Content for Schedule */}
                {medicationSchedule.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-yellow-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{item.studentName}</p>
                        <p className="text-xs text-gray-600 font-medium">{item.med}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-gray-400 bg-white px-2 py-1 rounded shadow-sm">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recent Health Records */}
        <div className={isParent ? "col-span-full" : "lg:col-span-2"}>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
             <div className="p-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
               <h3 className="font-bold text-gray-800 text-lg">
                 {isParent ? 'سجل الزيارات والوصفات' : 'سجل الزيارات الأخير'}
               </h3>
               {!isParent && <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded border">آخر 7 أيام</span>}
             </div>
             <div className="divide-y divide-gray-100">
               {displayedHealthRecords.length === 0 ? (
                 <div className="p-8 text-center text-gray-400">
                   {isParent ? 'سجل طفلك سليم، لا توجد زيارات طبية مسجلة.' : 'لا توجد سجلات طبية'}
                 </div>
               ) : (
                 displayedHealthRecords.map(record => {
                   const student = students.find(s => s.id === record.studentId);
                   return (
                     <div key={record.id} className="p-5 hover:bg-gray-50 transition-colors group">
                       <div className="flex justify-between items-start">
                          <div className="flex gap-4">
                            <div className={`p-3 rounded-xl h-fit ${record.severity === 'high' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                              <Pill className="w-6 h-6" />
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900 text-lg">{student?.fullName || 'طالب غير معروف'}</h4>
                              <p className="text-sm text-blue-700 font-bold mt-0.5">{record.condition}</p>
                              <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded border border-gray-100">{record.notes}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className="text-xs text-gray-400 font-medium bg-gray-100 px-2 py-1 rounded">{record.date}</span>
                            {!isParent && (
                              <button 
                                onClick={() => deleteHealthRecord(record.id)}
                                className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-full transition-colors opacity-100"
                                title="حذف السجل"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                       </div>
                     </div>
                   );
                 })
               )}
             </div>
          </div>
        </div>
      </div>

      {/* Add Visit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg border border-gray-200 shadow-2xl flex flex-col max-h-[90vh]">
            {/* ... Modal Content ... */}
            <div className="flex justify-between items-center p-6 border-b flex-shrink-0">
               <h3 className="text-2xl font-bold text-gray-900">تسجيل حالة صحية</h3>
               <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                 <X className="w-6 h-6" />
               </button>
            </div>
            
            <div className="p-8 overflow-y-auto">
              <form className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">الطالب</label>
                  <select 
                    className="w-full border border-gray-300 rounded-xl p-3 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                    onChange={(e) => setNewRecord({...newRecord, studentId: e.target.value})}
                    value={newRecord.studentId || ''}
                  >
                    <option value="">اختر الطالب...</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.fullName}</option>)}
                  </select>
                </div>
                
                {/* Date Input */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">تاريخ الزيارة</label>
                  <div className="relative">
                    <input 
                      type="date"
                      className="w-full border border-gray-300 rounded-xl p-3 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                      onChange={(e) => setNewRecord({...newRecord, date: e.target.value})}
                      value={newRecord.date}
                      onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                    />
                    <Calendar className="absolute left-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">التشخيص</label>
                    <input 
                      type="text" 
                      className="w-full border border-gray-300 rounded-xl p-3 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                      onChange={(e) => setNewRecord({...newRecord, condition: e.target.value})}
                      placeholder="مثلاً: زكام"
                    />
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-gray-700 mb-2">الخطورة</label>
                     <select 
                       className="w-full border border-gray-300 rounded-xl p-3 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                       onChange={(e) => setNewRecord({...newRecord, severity: e.target.value as any})}
                       value={newRecord.severity}
                     >
                       <option value="low">بسيطة</option>
                       <option value="medium">متوسطة</option>
                       <option value="high">حرجة</option>
                     </select>
                   </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">الدواء / الإجراء</label>
                  <input 
                     type="text"
                     className="w-full border border-gray-300 rounded-xl p-3 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                     onChange={(e) => setNewRecord({...newRecord, medication: e.target.value})}
                     placeholder="اسم الدواء..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">ملاحظات إضافية</label>
                  <textarea 
                    className="w-full border border-gray-300 rounded-xl p-3 h-24 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm resize-none"
                    onChange={(e) => setNewRecord({...newRecord, notes: e.target.value})}
                    placeholder="وصف الحالة بالتفصيل..."
                  ></textarea>
                </div>
              </form>
            </div>

            <div className="p-6 border-t flex gap-3 flex-shrink-0 bg-gray-50">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 bg-white border border-gray-300 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-100 transition-colors">إلغاء</button>
                <button type="button" onClick={handleSaveRecord} className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 shadow-md transition-colors">حفظ السجل</button>
            </div>
          </div>
        </div>
      )}

      <ImportModal isOpen={showImportModal} onClose={() => setShowImportModal(false)} title="استيراد تقرير طبي" type="health" />
    </div>
  );
};

export default Health;