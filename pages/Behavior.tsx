
import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { BehaviorRecord, UserRole } from '../types';
import { 
  Star, 
  Plus, 
  ThumbsUp, 
  ThumbsDown, 
  Trash2, 
  Search, 
  X, 
  Save, 
  Calendar,
  User,
  AlertTriangle,
  Smile,
  Edit2,
  BarChart3,
  PieChart as PieChartIcon,
  Filter
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

const Behavior: React.FC = () => {
  const { t } = useLanguage();
  const { students, behaviorRecords, addBehaviorRecord, updateBehaviorRecord, deleteBehaviorRecord, currentUser } = useData();
  
  // State for Filters
  const [filterType, setFilterType] = useState<'ALL' | 'positive' | 'negative'>('ALL');
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'discipline' | 'hygiene' | 'interaction'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // State for Modal
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [studentSearchInModal, setStudentSearchInModal] = useState('');
  const [showCharts, setShowCharts] = useState(true);
  
  const [formData, setFormData] = useState<Partial<BehaviorRecord>>({
    type: 'negative',
    category: 'discipline',
    date: new Date().toISOString().split('T')[0]
  });

  const canEdit = [UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.TEACHER].includes(currentUser.role);
  const isParent = currentUser.role === UserRole.PARENT;

  // Filter Logic
  const filteredRecords = useMemo(() => {
    let records = behaviorRecords;

    // Filter by Parent's kids
    if (isParent) {
      const linkedIds = currentUser.linkedStudentIds || [];
      records = records.filter(r => linkedIds.includes(r.studentId));
    }

    // Filter by Type
    if (filterType !== 'ALL') {
      records = records.filter(r => r.type === filterType);
    }

    // Filter by Category
    if (filterCategory !== 'ALL') {
      records = records.filter(r => r.category === filterCategory);
    }

    // Filter by Search (Student Name)
    if (searchTerm) {
      records = records.filter(r => {
        const student = students.find(s => s.id === r.studentId);
        return student?.fullName.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    // Sort by Date Descending
    return [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [behaviorRecords, filterType, filterCategory, searchTerm, isParent, currentUser, students]);

  // Statistics for Charts
  const chartData = useMemo(() => {
    const positive = filteredRecords.filter(r => r.type === 'positive').length;
    const negative = filteredRecords.filter(r => r.type === 'negative').length;
    
    const pieData = [
      { name: t('positive_behavior'), value: positive },
      { name: t('negative_behavior'), value: negative }
    ].filter(d => d.value > 0);

    const categoryCounts = filteredRecords.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const barData = [
      { name: t('discipline'), count: categoryCounts['discipline'] || 0, fill: '#8b5cf6' },
      { name: t('hygiene'), count: categoryCounts['hygiene'] || 0, fill: '#06b6d4' },
      { name: t('interaction'), count: categoryCounts['interaction'] || 0, fill: '#f59e0b' }
    ];

    return { pieData, barData, positive, negative };
  }, [filteredRecords, t]);

  const COLORS = ['#10b981', '#ef4444'];

  // Modal Handlers
  const handleOpenAdd = () => {
    setIsEditing(false);
    setFormData({
      type: 'negative',
      category: 'discipline',
      date: new Date().toISOString().split('T')[0],
      reporter: currentUser.name
    });
    setStudentSearchInModal('');
    setShowModal(true);
  };

  const handleOpenEdit = (record: BehaviorRecord) => {
    setIsEditing(true);
    setFormData({ ...record });
    const student = students.find(s => s.id === record.studentId);
    if(student) setStudentSearchInModal(student.fullName);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.studentId) {
      alert("المرجو اختيار تلميذ");
      return;
    }
    if (!formData.description) {
      alert("المرجو إدخال تفاصيل السلوك");
      return;
    }

    const record: BehaviorRecord = {
      id: isEditing && formData.id ? formData.id : crypto.randomUUID(),
      studentId: formData.studentId,
      type: formData.type || 'negative',
      category: formData.category || 'discipline',
      description: formData.description,
      date: formData.date || new Date().toISOString().split('T')[0],
      reporter: formData.reporter || currentUser.name
    };

    if (isEditing) {
      updateBehaviorRecord(record);
    } else {
      addBehaviorRecord(record);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    deleteBehaviorRecord(id);
  };

  const filteredStudentsForModal = students.filter(s => 
    s.fullName.toLowerCase().includes(studentSearchInModal.toLowerCase()) || 
    (s.roomNumber && s.roomNumber.includes(studentSearchInModal))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Star className="w-7 h-7 text-amber-500" />
            {t('behavior_tracking')}
          </h2>
          <p className="text-gray-500 mt-1">{t('behavior_desc')}</p>
        </div>
        
        <div className="flex gap-2">
           <button 
             onClick={() => setShowCharts(!showCharts)}
             className={`px-4 py-2 rounded-xl font-bold text-sm transition-all border flex items-center gap-2 ${
               showCharts ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-white text-gray-600 border-gray-200'
             }`}
           >
             {showCharts ? <BarChart3 className="w-4 h-4" /> : <PieChartIcon className="w-4 h-4" />}
             <span>{showCharts ? 'إخفاء الإحصائيات' : 'عرض الإحصائيات'}</span>
           </button>

           {canEdit && (
            <button 
              onClick={handleOpenAdd}
              className="bg-amber-600 text-white px-5 py-2 rounded-xl font-bold hover:bg-amber-700 flex items-center gap-2 shadow-md transition-all active:scale-95"
            >
              <Plus className="w-5 h-5" />
              <span>{t('add_behavior')}</span>
            </button>
           )}
        </div>
      </div>

      {/* Analytics Section */}
      {showCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          {/* Summary Cards */}
          <div className="space-y-4 lg:col-span-1">
             <div className="bg-white p-5 rounded-2xl shadow-sm border-l-4 border-emerald-500 flex items-center justify-between">
                <div>
                    <p className="text-gray-500 font-bold mb-1">{t('positive_count')}</p>
                    <h3 className="text-3xl font-bold text-emerald-600">{chartData.positive}</h3>
                </div>
                <div className="p-3 bg-emerald-50 rounded-full text-emerald-600">
                    <ThumbsUp className="w-6 h-6" />
                </div>
             </div>
             <div className="bg-white p-5 rounded-2xl shadow-sm border-l-4 border-red-500 flex items-center justify-between">
                <div>
                    <p className="text-gray-500 font-bold mb-1">{t('negative_count')}</p>
                    <h3 className="text-3xl font-bold text-red-600">{chartData.negative}</h3>
                </div>
                <div className="p-3 bg-red-50 rounded-full text-red-600">
                    <ThumbsDown className="w-6 h-6" />
                </div>
             </div>
          </div>

          {/* Charts */}
          <div className="lg:col-span-1 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
             <h4 className="font-bold text-gray-700 mb-2 text-sm text-center">توزيع السلوكيات</h4>
             <div className="flex-1 min-h-[150px]">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie
                      data={chartData.pieData}
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.name === t('positive_behavior') ? '#10b981' : '#ef4444'} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 2px 5px rgba(0,0,0,0.1)'}} />
                    <Legend wrapperStyle={{fontSize: '12px'}} />
                 </PieChart>
               </ResponsiveContainer>
             </div>
          </div>

          <div className="lg:col-span-1 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
             <h4 className="font-bold text-gray-700 mb-2 text-sm text-center">التصنيف حسب الفئة</h4>
             <div className="flex-1 min-h-[150px]">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={chartData.barData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{fontSize: 10}} interval={0} />
                    <YAxis tick={{fontSize: 10}} width={30} />
                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px', border: 'none'}} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {chartData.barData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                 </BarChart>
               </ResponsiveContainer>
             </div>
          </div>
        </div>
      )}

      {/* Toolbar & Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col lg:flex-row gap-4 items-center">
         <div className="relative flex-1 w-full">
            <input 
               type="text" 
               placeholder="بحث باسم التلميذ..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none transition-all hover:border-amber-300"
            />
            <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
         </div>
         
         <div className="flex gap-2 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0">
             {/* Type Filter */}
             <div className="flex bg-gray-100 p-1 rounded-lg flex-shrink-0">
                {(['ALL', 'positive', 'negative'] as const).map(type => (
                    <button
                        key={type}
                        onClick={() => setFilterType(type)}
                        className={`px-3 py-1.5 rounded-md font-bold text-xs transition-all ${
                            filterType === type
                            ? 'bg-white text-gray-800 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {type === 'ALL' ? 'الكل' : t(type === 'positive' ? 'positive_behavior' : 'negative_behavior')}
                    </button>
                ))}
             </div>

             {/* Category Filter */}
             <div className="relative min-w-[150px]">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value as any)}
                  className="w-full appearance-none bg-white border border-gray-300 text-gray-700 py-2.5 px-4 pr-10 rounded-lg leading-tight focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-bold"
                >
                  <option value="ALL">كل الفئات</option>
                  <option value="discipline">{t('discipline')}</option>
                  <option value="hygiene">{t('hygiene')}</option>
                  <option value="interaction">{t('interaction')}</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                  <Filter className="w-4 h-4" />
                </div>
             </div>
         </div>
      </div>

      {/* Records List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {filteredRecords.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-gray-300 flex flex-col items-center">
                <Star className="w-16 h-16 text-gray-200 mb-4" />
                <h3 className="text-lg font-bold text-gray-400">لا توجد سجلات سلوك</h3>
                <p className="text-gray-400 text-sm mt-1">جرب تغيير معايير البحث أو الفلترة</p>
            </div>
         ) : (
            filteredRecords.map(record => {
               const student = students.find(s => s.id === record.studentId);
               if (!student) return null;
               
               return (
                  <div key={record.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all relative group flex flex-col">
                     {/* Edit/Delete Actions */}
                     {canEdit && (
                        <div className="absolute top-3 left-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <button onClick={() => handleOpenEdit(record)} className="p-1.5 bg-white/90 text-blue-600 rounded-md hover:bg-blue-50 shadow-sm border border-gray-100">
                                <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(record.id)} className="p-1.5 bg-white/90 text-red-600 rounded-md hover:bg-red-50 shadow-sm border border-gray-100">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                     )}

                     <div className={`h-2 w-full ${record.type === 'positive' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>

                     <div className="p-5 flex-1 flex flex-col">
                        <div className="flex items-start justify-between mb-4">
                           <div className="flex items-center gap-3">
                              <img src={student.photoUrl} alt="" className="w-12 h-12 rounded-full border-2 border-white shadow-sm object-cover" />
                              <div>
                                 <h3 className="font-bold text-gray-900 line-clamp-1 text-sm">{student.fullName}</h3>
                                 <p className="text-xs text-gray-500 font-mono">{student.grade}</p>
                              </div>
                           </div>
                           <div className={`p-2 rounded-full ${record.type === 'positive' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                               {record.type === 'positive' ? <Smile className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                           </div>
                        </div>

                        <div className="mb-3">
                           <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                              record.category === 'discipline' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                              record.category === 'hygiene' ? 'bg-cyan-50 text-cyan-700 border-cyan-100' :
                              'bg-amber-50 text-amber-700 border-amber-100'
                           }`}>
                             {t(record.category)}
                           </span>
                        </div>

                        <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100 flex-1">
                          {record.description}
                        </p>

                        <div className="flex justify-between items-center text-xs text-gray-400 mt-4 pt-3 border-t border-gray-100">
                            <div className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                <span className="font-medium">{record.date}</span>
                            </div>
                            <div className="flex items-center gap-1" title={t('reporter')}>
                                <User className="w-3.5 h-3.5" />
                                <span className="max-w-[80px] truncate">{record.reporter}</span>
                            </div>
                        </div>
                     </div>
                  </div>
               );
            })
         )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 flex flex-col max-h-[90vh]">
               <div className="p-6 border-b flex justify-between items-center bg-amber-50 rounded-t-2xl">
                  <h3 className="text-xl font-bold text-amber-900 flex items-center gap-2">
                     <Star className="w-6 h-6 text-amber-600" />
                     {isEditing ? 'تعديل السجل' : t('add_behavior')}
                  </h3>
                  <button onClick={() => setShowModal(false)} className="text-amber-400 hover:text-amber-600">
                     <X className="w-6 h-6" />
                  </button>
               </div>

               <div className="p-6 overflow-y-auto">
                  <form className="space-y-4">
                     {/* Student Selection */}
                     <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">{t('student_name')}</label>
                        <div className="relative mb-2">
                           <input 
                              type="text" 
                              placeholder="ابحث عن تلميذ..."
                              value={studentSearchInModal}
                              onChange={(e) => setStudentSearchInModal(e.target.value)}
                              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-amber-500 outline-none"
                           />
                           <Search className="absolute left-2.5 top-2.5 text-gray-400 w-4 h-4" />
                        </div>
                        <div className="border border-gray-300 rounded-xl overflow-y-auto max-h-40 bg-gray-50 custom-scrollbar">
                           {filteredStudentsForModal.length === 0 ? (
                              <p className="p-4 text-center text-gray-400 text-sm">لا توجد نتائج</p>
                           ) : (
                              filteredStudentsForModal.map(s => (
                                 <div 
                                    key={s.id}
                                    onClick={() => setFormData({...formData, studentId: s.id})}
                                    className={`flex items-center gap-3 p-2 cursor-pointer border-b last:border-0 hover:bg-white transition-colors ${
                                       formData.studentId === s.id ? 'bg-amber-100 border-amber-200' : ''
                                    }`}
                                 >
                                    <img src={s.photoUrl} alt="" className="w-8 h-8 rounded-full" />
                                    <div>
                                       <p className="text-sm font-bold text-gray-800">{s.fullName}</p>
                                       <p className="text-[10px] text-gray-500">{s.grade} - غرفة {s.roomNumber}</p>
                                    </div>
                                    {formData.studentId === s.id && <div className="mr-auto text-amber-600"><Star className="w-4 h-4 fill-amber-600" /></div>}
                                 </div>
                              ))
                           )}
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-sm font-bold text-gray-700 mb-2">نوع السلوك</label>
                           <div className="flex gap-2">
                              <button 
                                 type="button"
                                 onClick={() => setFormData({...formData, type: 'positive'})}
                                 className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-colors flex items-center justify-center gap-1 ${
                                    formData.type === 'positive' 
                                    ? 'bg-emerald-100 border-emerald-500 text-emerald-700' 
                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                 }`}
                              >
                                 <ThumbsUp className="w-3.5 h-3.5" />
                                 إيجابي
                              </button>
                              <button 
                                 type="button"
                                 onClick={() => setFormData({...formData, type: 'negative'})}
                                 className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-colors flex items-center justify-center gap-1 ${
                                    formData.type === 'negative' 
                                    ? 'bg-red-100 border-red-500 text-red-700' 
                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                 }`}
                              >
                                 <ThumbsDown className="w-3.5 h-3.5" />
                                 سلبي
                              </button>
                           </div>
                        </div>

                        <div>
                           <label className="block text-sm font-bold text-gray-700 mb-2">{t('category')}</label>
                           <select 
                              value={formData.category}
                              onChange={(e) => setFormData({...formData, category: e.target.value as any})}
                              className="w-full border border-gray-300 rounded-xl p-2.5 bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 outline-none"
                           >
                              <option value="discipline">{t('discipline')}</option>
                              <option value="hygiene">{t('hygiene')}</option>
                              <option value="interaction">{t('interaction')}</option>
                           </select>
                        </div>
                     </div>

                     <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">{t('incident_date')}</label>
                        <input 
                           type="date"
                           value={formData.date}
                           onChange={(e) => setFormData({...formData, date: e.target.value})}
                           onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                           className="w-full border border-gray-300 rounded-xl p-3 bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 outline-none"
                        />
                     </div>

                     <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">{t('details')}</label>
                        <textarea 
                           value={formData.description || ''}
                           onChange={(e) => setFormData({...formData, description: e.target.value})}
                           className="w-full border border-gray-300 rounded-xl p-3 bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 outline-none resize-none h-24"
                           placeholder="وصف السلوك..."
                        />
                     </div>

                     <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">{t('reporter')}</label>
                        <input 
                           type="text"
                           value={formData.reporter || ''}
                           onChange={(e) => setFormData({...formData, reporter: e.target.value})}
                           className="w-full border border-gray-300 rounded-xl p-3 bg-gray-50 text-gray-600 focus:outline-none"
                        />
                     </div>
                  </form>
               </div>

               <div className="p-6 border-t flex gap-3 flex-shrink-0 bg-gray-50 rounded-b-2xl">
                  <button onClick={() => setShowModal(false)} className="flex-1 bg-white border border-gray-300 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-100 transition-colors">
                     {t('cancel')}
                  </button>
                  <button onClick={handleSave} className="flex-1 bg-amber-600 text-white font-bold py-3 rounded-xl hover:bg-amber-700 shadow-md transition-colors flex justify-center items-center gap-2">
                     <Save className="w-5 h-5" />
                     {t('save')}
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default Behavior;
