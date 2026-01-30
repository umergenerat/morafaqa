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
import * as Permissions from '../utils/permissions';

const Activities: React.FC = () => {
  const { t } = useLanguage();
  const { activityRecords, addActivity, updateActivity, deleteActivity, currentUser, students } = useData();
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [filterType, setFilterType] = useState<ActivityType | 'ALL'>('ALL');

  // View Participants State
  const [viewParticipantsActivity, setViewParticipantsActivity] = useState<ActivityRecord | null>(null);

  // New Activity State
  const [newActivity, setNewActivity] = useState<Partial<ActivityRecord>>({
    type: 'cultural',
    date: new Date().toISOString().split('T')[0],
    status: 'upcoming',
    images: [],
    participantIds: []
  });

  // Student Search in Modal
  const [studentSearchTerm, setStudentSearchTerm] = useState('');

  const canEdit = Permissions.canManageBehavior(currentUser);
  const isParent = Permissions.isParent(currentUser);

  const filteredActivities = activityRecords.filter(a => filterType === 'ALL' || a.type === filterType);

  // Stats
  const upcomingCount = activityRecords.filter(a => a.status === 'upcoming').length;
  const completedCount = activityRecords.filter(a => a.status === 'completed').length;
  const totalParticipants = activityRecords.reduce((sum, a) => sum + (a.participantsCount || 0), 0);

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
      participantsCount: 0,
      images: [],
      participantIds: []
    });
    setStudentSearchTerm('');
    setShowModal(true);
  };

  const handleOpenEdit = (activity: ActivityRecord) => {
    setIsEditing(true);
    setNewActivity({ ...activity, images: activity.images || [], participantIds: activity.participantIds || [] });
    setStudentSearchTerm('');
    setShowModal(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);

      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            setNewActivity(prev => ({
              ...prev,
              images: [...(prev.images || []), reader.result as string]
            }));
          }
        };
        reader.readAsDataURL(file as Blob);
      });
    }
  };

  const removeImage = (index: number) => {
    setNewActivity(prev => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== index)
    }));
  };

  const toggleParticipant = (studentId: string) => {
    const currentIds = newActivity.participantIds || [];
    let newIds: string[];

    if (currentIds.includes(studentId)) {
      newIds = currentIds.filter(id => id !== studentId);
    } else {
      newIds = [...currentIds, studentId];
    }

    setNewActivity(prev => ({
      ...prev,
      participantIds: newIds,
      participantsCount: newIds.length
    }));
  };

  const handleSave = () => {
    if (!newActivity.title || !newActivity.date) return;

    const payload = {
      ...newActivity,
      images: newActivity.images || [],
      participantIds: newActivity.participantIds || [],
      participantsCount: newActivity.participantIds?.length || newActivity.participantsCount || 0
    } as ActivityRecord;

    if (isEditing && newActivity.id) {
      updateActivity(payload);
    } else {
      addActivity({
        ...payload,
        id: crypto.randomUUID()
      });
    }

    setShowModal(false);
  };

  const filteredStudents = students.filter(s =>
    s.fullName.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
    s.grade.toLowerCase().includes(studentSearchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-indigo-600" />
            {t('activities_title')}
          </h2>
          <p className="text-gray-500 mt-1">{t('activities_desc')}</p>
        </div>

        {canEdit && (
          <button
            onClick={handleOpenAdd}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-lg hover:shadow-indigo-200 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span>{t('add_activity')}</span>
          </button>
        )}
      </div>

      {/* Stats Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-gray-500 text-sm font-bold">{t('upcoming_activities')}</p>
            <h3 className="text-2xl font-bold text-gray-800">{upcomingCount}</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-gray-500 text-sm font-bold">{t('completed_activities')}</p>
            <h3 className="text-2xl font-bold text-gray-800">{completedCount}</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-gray-500 text-sm font-bold">إجمالي المشاركين</p>
            <h3 className="text-2xl font-bold text-gray-800">{totalParticipants}</h3>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 pb-2">
        {['ALL', 'cultural', 'sport', 'religious', 'educational', 'entertainment'].map(type => (
          <button
            key={type}
            onClick={() => setFilterType(type as any)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all border ${filterType === type
              ? 'bg-gray-800 text-white border-gray-800 shadow-md'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
          >
            {type === 'ALL' ? 'الكل' : t(type)}
          </button>
        ))}
      </div>

      {/* Activities List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredActivities.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-gray-300">
            <Trophy className="w-16 h-16 mx-auto text-gray-200 mb-4" />
            <p className="text-gray-400 font-medium">لا توجد أنشطة مسجلة في هذا التصنيف.</p>
          </div>
        ) : (
          filteredActivities.map(activity => (
            <div key={activity.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all group relative flex flex-col">
              {/* Status Strip */}
              <div className={`h-2 w-full ${activity.status === 'upcoming' ? 'bg-indigo-500' : activity.status === 'completed' ? 'bg-green-500' : 'bg-red-500'}`}></div>

              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-2 rounded-lg border flex items-center gap-2 text-xs font-bold ${getTypeColor(activity.type)}`}>
                    {getTypeIcon(activity.type)}
                    {t(activity.type)}
                  </div>
                  {canEdit && (
                    <div className="flex items-center gap-1 opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenEdit(activity)}
                        className="text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-all p-1.5 rounded-md"
                        title="تعديل"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteActivity(activity.id)}
                        className="text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all p-1.5 rounded-md"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <h3 className="text-xl font-bold text-gray-800 mb-2 leading-tight">{activity.title}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                  {activity.description}
                </p>

                {/* Images Gallery */}
                {activity.images && activity.images.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-400 font-bold mb-2 flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" />
                      صور التوثيق ({activity.images.length})
                    </p>
                    <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                      {activity.images.map((img, idx) => (
                        <div key={idx} className="relative h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden border border-gray-100 group/img">
                          <img
                            src={img}
                            alt={`activity-${idx}`}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2 text-sm text-gray-600 mt-auto">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{activity.date}</span>
                    <span className="text-gray-300">|</span>
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{activity.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{activity.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span>{t('organizer')}: <span className="font-bold text-gray-800">{activity.organizer}</span></span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex justify-between items-center text-sm">
                <span className={`font-bold flex items-center gap-1 ${activity.status === 'upcoming' ? 'text-indigo-600' : activity.status === 'completed' ? 'text-green-600' : 'text-red-600'}`}>
                  {activity.status === 'upcoming' && <Clock3 className="w-4 h-4" />}
                  {activity.status === 'completed' && <CheckCircle className="w-4 h-4" />}
                  {activity.status === 'upcoming' ? 'قادم' : activity.status === 'completed' ? 'منجز' : 'ملغى'}
                </span>

                {activity.participantsCount !== undefined && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (activity.participantIds && activity.participantIds.length > 0) {
                        setViewParticipantsActivity(activity);
                      }
                    }}
                    className={`flex items-center gap-1 text-gray-600 bg-white px-2 py-1 rounded-md border border-gray-200 text-xs font-bold transition-colors ${activity.participantIds?.length ? 'hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 cursor-pointer' : 'cursor-default'}`}
                  >
                    <Users className="w-3 h-3" />
                    {activity.participantsCount}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Participants View Modal */}
      {viewParticipantsActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 flex flex-col max-h-[80vh]">
            <div className="p-5 border-b bg-gray-50 rounded-t-2xl flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gray-800 text-lg">قائمة المشاركين</h3>
                <p className="text-sm text-gray-500">{viewParticipantsActivity.title}</p>
              </div>
              <button onClick={() => setViewParticipantsActivity(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto custom-scrollbar">
              <div className="space-y-2">
                {viewParticipantsActivity.participantIds?.map(id => {
                  const student = students.find(s => s.id === id);
                  return student ? (
                    <div key={id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg border border-gray-100">
                      <img src={student.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                      <div>
                        <p className="font-bold text-gray-800 text-sm">{student.fullName}</p>
                        <p className="text-xs text-gray-500">{student.grade} - غرفة {student.roomNumber}</p>
                      </div>
                    </div>
                  ) : null;
                })}
                {(!viewParticipantsActivity.participantIds || viewParticipantsActivity.participantIds.length === 0) && (
                  <p className="text-center text-gray-400 py-4">لا توجد بيانات للمشاركين</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                {isEditing ? <Edit2 className="w-6 h-6 text-blue-600" /> : <Plus className="w-6 h-6 text-indigo-600" />}
                {isEditing ? 'تعديل نشاط' : t('add_activity')}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-1">عنوان النشاط</label>
                    <input
                      type="text"
                      value={newActivity.title || ''}
                      onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl p-3 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="مثال: دوري كرة القدم"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">{t('activity_type')}</label>
                    <select
                      value={newActivity.type}
                      onChange={(e) => setNewActivity({ ...newActivity, type: e.target.value as any })}
                      className="w-full border border-gray-300 rounded-xl p-3 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="cultural">{t('cultural')}</option>
                      <option value="sport">{t('sport')}</option>
                      <option value="religious">{t('religious')}</option>
                      <option value="educational">{t('educational')}</option>
                      <option value="entertainment">{t('entertainment')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">حالة النشاط</label>
                    <select
                      value={newActivity.status}
                      onChange={(e) => setNewActivity({ ...newActivity, status: e.target.value as any })}
                      className="w-full border border-gray-300 rounded-xl p-3 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="upcoming">قادم</option>
                      <option value="completed">منجز</option>
                      <option value="cancelled">ملغى</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">التاريخ</label>
                    <input
                      type="date"
                      value={newActivity.date}
                      onChange={(e) => setNewActivity({ ...newActivity, date: e.target.value })}
                      onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                      className="w-full border border-gray-300 rounded-xl p-3 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">التوقيت</label>
                    <input
                      type="time"
                      value={newActivity.time || ''}
                      onChange={(e) => setNewActivity({ ...newActivity, time: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl p-3 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">{t('organizer')}</label>
                    <input
                      type="text"
                      value={newActivity.organizer || ''}
                      onChange={(e) => setNewActivity({ ...newActivity, organizer: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl p-3 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="النادي/المسؤول"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">{t('location')}</label>
                    <input
                      type="text"
                      value={newActivity.location || ''}
                      onChange={(e) => setNewActivity({ ...newActivity, location: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl p-3 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="القاعة، الملعب..."
                    />
                  </div>
                </div>

                {/* Student Selection */}
                <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-500" />
                      قائمة المشاركين
                      <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs">
                        {newActivity.participantIds?.length || 0}
                      </span>
                    </label>
                    <div className="text-xs text-gray-400">
                      (يتم تحديث العدد تلقائياً)
                    </div>
                  </div>

                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="بحث عن تلميذ..."
                      value={studentSearchTerm}
                      onChange={(e) => setStudentSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                    {filteredStudents.length === 0 ? (
                      <p className="text-center text-gray-400 col-span-full py-2 text-xs">لا توجد نتائج</p>
                    ) : (
                      filteredStudents.map(student => {
                        const isSelected = newActivity.participantIds?.includes(student.id);
                        return (
                          <div
                            key={student.id}
                            onClick={() => toggleParticipant(student.id)}
                            className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer border transition-all ${isSelected ? 'bg-indigo-50 border-indigo-300' : 'bg-white border-gray-200 hover:border-indigo-200'
                              }`}
                          >
                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-white border-gray-300'}`}>
                              {isSelected && <Check className="w-3 h-3" />}
                            </div>
                            <span className="text-sm text-gray-700 truncate">{student.fullName}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">الوصف</label>
                  <textarea
                    value={newActivity.description || ''}
                    onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl p-3 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-24"
                    placeholder="تفاصيل النشاط..."
                  />
                </div>

                {/* Image Upload Section */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-indigo-500" />
                    توثيق الصور
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {newActivity.images?.map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                        <img src={img} alt="evidence" className="w-full h-full object-cover" />
                        <button
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <label className="border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 aspect-square text-gray-400 hover:text-indigo-500 transition-colors bg-white">
                      <Upload className="w-6 h-6 mb-1" />
                      <span className="text-xs font-bold">إضافة</span>
                      <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">يمكنك إضافة صور متعددة لتوثيق النشاط.</p>
                </div>
              </form>
            </div>

            <div className="p-6 border-t flex gap-3 flex-shrink-0 bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowModal(false)} className="flex-1 bg-white border border-gray-300 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-100 transition-colors">
                {t('cancel')}
              </button>
              <button onClick={handleSave} className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 shadow-md transition-colors">
                {isEditing ? t('save') : t('add_activity')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Activities;