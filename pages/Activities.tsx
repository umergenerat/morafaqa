import React, { useState } from 'react';
import {
  BookOpen,
  Calendar,
  MapPin,
  User,
  Plus,
  Trophy,
  Music,
  Palette,
  Mic2,
  Clock,
  Trash2,
  X,
  Users,
  CheckCircle,
  Clock3,
  Edit2,
  Image as ImageIcon,
  Upload,
  Search,
  Check
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { ActivityRecord, ActivityType, UserRole } from '../types';

const Activities: React.FC = () => {
  const { t } = useLanguage();
  const { activityRecords, addActivity, updateActivity, deleteActivity, currentUser, students } = useData();

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [filterType, setFilterType] = useState<ActivityType | 'ALL'>('ALL');
  const [viewParticipantsActivity, setViewParticipantsActivity] = useState<ActivityRecord | null>(null);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');

  const [newActivity, setNewActivity] = useState<Partial<ActivityRecord>>({
    type: 'cultural',
    date: new Date().toISOString().split('T')[0],
    status: 'upcoming',
    images: [],
    participantIds: []
  });

  const canEdit =
    currentUser &&
    [UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.TEACHER].includes(currentUser.role);

  const filteredActivities = activityRecords.filter(
    a => filterType === 'ALL' || a.type === filterType
  );

  const upcomingCount = activityRecords.filter(a => a.status === 'upcoming').length;
  const completedCount = activityRecords.filter(a => a.status === 'completed').length;
  const totalParticipants = activityRecords.reduce(
    (sum, a) => sum + (a.participantsCount || 0),
    0
  );

  const getTypeColor = (type: ActivityType) => {
    switch (type) {
      case 'sport': return 'text-orange-600 bg-orange-50 border-orange-100';
      case 'cultural': return 'text-purple-600 bg-purple-50 border-purple-100';
      case 'religious': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'educational': return 'text-blue-600 bg-blue-50 border-blue-100';
      default: return 'text-gray-600 bg-gray-50 border-gray-100';
    }
  };

  const getTypeIcon = (type: ActivityType) => {
    switch (type) {
      case 'sport': return <Trophy className="w-5 h-5" />;
      case 'cultural': return <Palette className="w-5 h-5" />;
      case 'religious': return <Mic2 className="w-5 h-5" />;
      case 'educational': return <BookOpen className="w-5 h-5" />;
      default: return <Music className="w-5 h-5" />;
    }
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setNewActivity({
      type: 'cultural',
      date: new Date().toISOString().split('T')[0],
      status: 'upcoming',
      images: [],
      participantIds: []
    });
    setStudentSearchTerm('');
    setShowModal(true);
  };

  const handleOpenEdit = (activity: ActivityRecord) => {
    setIsEditing(true);
    setNewActivity({
      ...activity,
      images: activity.images || [],
      participantIds: activity.participantIds || []
    });
    setStudentSearchTerm('');
    setShowModal(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    Array.from(e.target.files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setNewActivity(prev => ({
            ...prev,
            images: [...(prev.images || []), reader.result as string]
          }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setNewActivity(prev => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== index)
    }));
  };

  const toggleParticipant = (studentId: string) => {
    const ids = newActivity.participantIds || [];
    const newIds = ids.includes(studentId)
      ? ids.filter(id => id !== studentId)
      : [...ids, studentId];

    setNewActivity(prev => ({
      ...prev,
      participantIds: newIds
    }));
  };

  const handleSave = () => {
    if (!newActivity.title || !newActivity.date) return;

    const payload: ActivityRecord = {
      ...(newActivity as ActivityRecord),
      images: newActivity.images || [],
      participantIds: newActivity.participantIds || []
    };

    if (isEditing && payload.id) {
      updateActivity(payload);
    } else {
      addActivity({ ...payload, id: crypto.randomUUID() });
    }

    setShowModal(false);
  };

  const filteredStudents = students.filter(s =>
    s.fullName.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
    s.grade.toLowerCase().includes(studentSearchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="w-8 h-8 text-purple-600" />
            {t('activities_title')}
          </h2>
          <p className="text-gray-500 mt-1">{t('activities_desc')}</p>
        </div>

        {canEdit && (
          <button
            onClick={handleOpenAdd}
            className="w-full md:w-auto bg-purple-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-purple-700 flex items-center justify-center gap-2 shadow-lg shadow-purple-100 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            {t('add_activity')}
          </button>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">{t('upcoming_activities')}</p>
            <h3 className="text-2xl font-bold text-gray-800">{upcomingCount}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">{t('completed_activities')}</p>
            <h3 className="text-2xl font-bold text-gray-800">{completedCount}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">{t('participants')}</p>
            <h3 className="text-2xl font-bold text-gray-800">{totalParticipants}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-orange-50 rounded-xl text-orange-600">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">إجمالي الأنشطة</p>
            <h3 className="text-2xl font-bold text-gray-800">{activityRecords.length}</h3>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 pb-2 overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setFilterType('ALL')}
          className={`px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${filterType === 'ALL'
              ? 'bg-gray-800 text-white shadow-md'
              : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-800'
            }`}
        >
          الكل
        </button>
        {(['sport', 'cultural', 'religious', 'educational', 'entertainment'] as ActivityType[]).map(type => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${filterType === type
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-purple-600'
              }`}
          >
            {getTypeIcon(type)}
            {t(type)}
          </button>
        ))}
      </div>

      {/* Activities Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredActivities.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-3xl border-2 border-dashed border-gray-100">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">لا توجد أنشطة حالياً</h3>
            <p className="text-gray-500 mt-1">ابدأ بإضافة أول نشاط للمؤسسة</p>
          </div>
        ) : (
          filteredActivities.map(activity => (
            <div key={activity.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getTypeColor(activity.type)} flex items-center gap-1.5`}>
                    {getTypeIcon(activity.type)}
                    {t(activity.type)}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${activity.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                      {t(activity.status === 'completed' ? 'completed' : 'upcoming')}
                    </span>
                    {canEdit && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenEdit(activity)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteActivity(activity.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-purple-600 transition-colors">
                  {activity.title}
                </h3>
                <p className="text-gray-500 text-sm line-clamp-2 mb-4 leading-relaxed">
                  {activity.description}
                </p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-xl">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    <span className="font-medium">{activity.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-xl">
                    <MapPin className="w-4 h-4 text-purple-600" />
                    <span className="font-medium truncate">{activity.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-xl">
                    <User className="w-4 h-4 text-purple-600" />
                    <span className="font-medium truncate">{activity.organizer}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-xl">
                    <Users className="w-4 h-4 text-purple-600" />
                    <span className="font-medium">{activity.participantsCount || 0} مشارك</span>
                  </div>
                </div>

                {/* Event Images */}
                {activity.images && activity.images.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-1 px-1 custom-scrollbar">
                    {activity.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt=""
                        className="w-20 h-20 rounded-xl object-cover border border-gray-100 flex-shrink-0"
                      />
                    ))}
                  </div>
                )}

                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                  <button
                    onClick={() => setViewParticipantsActivity(activity)}
                    className="text-purple-600 hover:text-purple-700 text-sm font-bold flex items-center gap-1.5"
                  >
                    <Users className="w-4 h-4" />
                    عرض المشتركين
                  </button>
                  {activity.time && (
                    <div className="flex items-center gap-1.5 text-gray-400 text-xs font-bold">
                      <Clock className="w-3.5 h-3.5" />
                      {activity.time}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Participants Modal */}
      {viewParticipantsActivity && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg border border-gray-200 overflow-hidden animate-in zoom-in duration-200">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-xl font-bold text-gray-900">المشاركين في النشاط</h3>
                <p className="text-sm text-gray-500 font-medium mt-0.5">{viewParticipantsActivity.title}</p>
              </div>
              <button
                onClick={() => setViewParticipantsActivity(null)}
                className="p-2 hover:bg-white rounded-xl text-gray-400 hover:text-gray-600 transition-all border border-transparent hover:border-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-3">
                {viewParticipantsActivity.participantIds?.map(id => {
                  const student = students.find(s => s.id === id);
                  if (!student) return null;
                  return (
                    <div key={id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                      <img src={student.photoUrl} alt="" className="w-10 h-10 rounded-full border border-white shadow-sm" />
                      <div>
                        <p className="font-bold text-gray-800 text-sm">{student.fullName}</p>
                        <p className="text-xs text-gray-500 font-medium">{student.grade}</p>
                      </div>
                    </div>
                  );
                })}
                {(!viewParticipantsActivity.participantIds || viewParticipantsActivity.participantIds.length === 0) && (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 font-medium text-sm">لا يوجد مشاركين مسجلين لهذا النشاط</p>
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 bg-gray-50/50 border-t flex justify-end">
              <button
                onClick={() => setViewParticipantsActivity(null)}
                className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-all"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl border border-gray-200 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in duration-200">
            <div className="p-6 border-b flex justify-between items-center bg-purple-50/50">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 uppercase tracking-wide">
                <div className="p-2 bg-purple-100 rounded-xl">
                  {isEditing ? <Edit2 className="w-5 h-5 text-purple-600" /> : <Plus className="w-5 h-5 text-purple-600" />}
                </div>
                {isEditing ? 'تعديل نشاط' : 'نشاط جديد'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white rounded-xl text-gray-400 hover:text-gray-600 transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">عنوان النشاط</label>
                    <input
                      type="text"
                      value={newActivity.title || ''}
                      onChange={e => setNewActivity({ ...newActivity, title: e.target.value })}
                      placeholder="مثال: دوري كرة القدم، ورشة الرسم..."
                      className="w-full border border-gray-200 rounded-2xl p-4 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-purple-100 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">نوع النشاط</label>
                    <select
                      value={newActivity.type}
                      onChange={e => setNewActivity({ ...newActivity, type: e.target.value as ActivityType })}
                      className="w-full border border-gray-200 rounded-2xl p-4 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-purple-100 outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="cultural">{t('cultural')}</option>
                      <option value="sport">{t('sport')}</option>
                      <option value="religious">{t('religious')}</option>
                      <option value="educational">{t('educational')}</option>
                      <option value="entertainment">{t('entertainment')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">الحالة</label>
                    <select
                      value={newActivity.status}
                      onChange={e => setNewActivity({ ...newActivity, status: e.target.value as 'upcoming' | 'completed' })}
                      className="w-full border border-gray-200 rounded-2xl p-4 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-purple-100 outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="upcoming">قادم</option>
                      <option value="completed">منجز</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">التاريخ</label>
                    <div className="relative">
                      <input
                        type="date"
                        value={newActivity.date}
                        onChange={e => setNewActivity({ ...newActivity, date: e.target.value })}
                        className="w-full border border-gray-200 rounded-2xl p-4 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-purple-100 outline-none transition-all cursor-pointer"
                      />
                      <Calendar className="absolute left-4 top-4 text-gray-400 pointer-events-none w-5 h-5" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">التوقيت</label>
                    <div className="relative">
                      <input
                        type="time"
                        value={newActivity.time || ''}
                        onChange={e => setNewActivity({ ...newActivity, time: e.target.value })}
                        className="w-full border border-gray-200 rounded-2xl p-4 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-purple-100 outline-none transition-all cursor-pointer"
                      />
                      <Clock3 className="absolute left-4 top-4 text-gray-400 pointer-events-none w-5 h-5" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">المكان</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={newActivity.location || ''}
                        onChange={e => setNewActivity({ ...newActivity, location: e.target.value })}
                        placeholder="قاعة الرياضة، الحديقة..."
                        className="w-full border border-gray-200 rounded-2xl p-4 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-purple-100 outline-none transition-all"
                      />
                      <MapPin className="absolute left-4 top-4 text-gray-400 pointer-events-none w-5 h-5" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">المشرف/المنظم</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={newActivity.organizer || ''}
                        onChange={e => setNewActivity({ ...newActivity, organizer: e.target.value })}
                        placeholder="اسم النادي أو المشرف..."
                        className="w-full border border-gray-200 rounded-2xl p-4 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-purple-100 outline-none transition-all"
                      />
                      <User className="absolute left-4 top-4 text-gray-400 pointer-events-none w-5 h-5" />
                    </div>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">الوصف</label>
                    <textarea
                      value={newActivity.description || ''}
                      onChange={e => setNewActivity({ ...newActivity, description: e.target.value })}
                      rows={3}
                      placeholder="وصف مختصر للنشاط وأهدافه..."
                      className="w-full border border-gray-200 rounded-2xl p-4 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-purple-100 outline-none transition-all resize-none"
                    />
                  </div>
                </div>

                {/* Participant Selection */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-bold text-gray-700">تحديد المشاركين</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="بحث عن تلميذ..."
                        value={studentSearchTerm}
                        onChange={e => setStudentSearchTerm(e.target.value)}
                        className="pr-9 pl-4 py-2 bg-gray-100 border-none rounded-xl text-xs focus:ring-2 focus:ring-purple-200 outline-none w-48"
                      />
                      <Search className="absolute right-3 top-2.5 text-gray-400 w-4 h-4" />
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-2xl p-2 bg-gray-50 max-h-48 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {filteredStudents.map(student => {
                        const isSelected = newActivity.participantIds?.includes(student.id);
                        return (
                          <button
                            key={student.id}
                            type="button"
                            onClick={() => toggleParticipant(student.id)}
                            className={`flex items-center gap-3 p-2 rounded-xl border transition-all ${isSelected
                                ? 'bg-purple-600 border-purple-600 text-white shadow-md'
                                : 'bg-white border-gray-100 text-gray-700 hover:border-purple-200'
                              }`}
                          >
                            <img src={student.photoUrl} alt="" className="w-8 h-8 rounded-full border border-gray-100 flex-shrink-0" />
                            <div className="text-right overflow-hidden">
                              <p className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-gray-800'}`}>{student.fullName}</p>
                              <p className={`text-[10px] ${isSelected ? 'text-purple-100' : 'text-gray-500'}`}>{student.grade}</p>
                            </div>
                            {isSelected && <Check className="w-4 h-4 mr-auto" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2 font-bold px-1">
                    تم تحديد {newActivity.participantIds?.length || 0} مشاركين من إجمالي {students.length} تلميذ
                  </p>
                </div>

                {/* Photos */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-purple-600" />
                    صور من النشاط
                  </label>
                  <div className="flex flex-wrap gap-4">
                    {newActivity.images?.map((img, idx) => (
                      <div key={idx} className="relative w-24 h-24 group">
                        <img src={img} alt="" className="w-full h-full rounded-2xl object-cover border-2 border-white shadow-md group-hover:opacity-75 transition-opacity" />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute -top-2 -left-2 bg-red-500 text-white p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <label className="w-24 h-24 border-2 border-dashed border-purple-100 bg-purple-50 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-purple-100 hover:border-purple-200 transition-all group">
                      <Upload className="w-6 h-6 text-purple-400 group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-bold text-purple-500 mt-1">إضافة</span>
                      <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 border-t bg-gray-50 flex gap-4 shrink-0">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 bg-white border border-gray-200 text-gray-700 font-bold py-4 rounded-2xl hover:bg-gray-100 transition-all active:scale-95"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!newActivity.title || !newActivity.date}
                className="flex-[2] bg-purple-600 text-white font-bold py-4 rounded-2xl hover:bg-purple-700 shadow-xl shadow-purple-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100"
              >
                {isEditing ? 'تحديث النشاط' : 'حفظ النشاط'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Activities;
