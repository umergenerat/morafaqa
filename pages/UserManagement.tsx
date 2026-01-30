import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { User, UserRole } from '../types';
import * as Permissions from '../utils/permissions';
import { UserPlus, Edit2, Trash2, Check, Shield, Search, Filter, Lock, Plus, Users, AlertCircle, Fingerprint } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const UserManagement: React.FC = () => {
  const { users, students, currentUser, addUser, updateUser, deleteUser } = useData();
  const { t } = useLanguage();
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');

  // Modal internal state for filtering students
  const [studentSearchTerm, setStudentSearchTerm] = useState('');

  // Form State
  const [formData, setFormData] = useState<Partial<User>>({
    role: UserRole.SUPERVISOR,
    linkedStudentIds: []
  });

  // Security Check
  if (!Permissions.canManageUsers(currentUser)) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <Shield className="w-16 h-16 mb-4 text-gray-300" />
        <h2 className="text-xl font-bold">غير مصرح لك بالوصول</h2>
        <p>هذه الصفحة خاصة بالمدير فقط.</p>
      </div>
    );
  }

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleOpenAdd = () => {
    setIsEditing(false);
    setFormData({ role: UserRole.SUPERVISOR, name: '', phone: '', email: '', nationalId: '', linkedStudentIds: [], password: '' });
    setStudentSearchTerm('');
    setShowModal(true);
  };

  const handleOpenEdit = (user: User) => {
    setIsEditing(true);
    setFormData({ ...user, password: '' }); // Don't show existing password, allow reset
    setStudentSearchTerm('');
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.role) return;

    // Determine linked students:
    // If role is PARENT and a national ID is provided, automatically find students with that guardian ID
    let finalLinkedStudentIds = formData.linkedStudentIds || [];

    if (formData.role === UserRole.PARENT && formData.nationalId) {
      const studentsWithGuardianId = students.filter(s => s.guardianId === formData.nationalId).map(s => s.id);
      // Merge with manually selected ones, unique values
      finalLinkedStudentIds = Array.from(new Set([...finalLinkedStudentIds, ...studentsWithGuardianId]));
    }

    // Validate Parent Linking
    if (formData.role === UserRole.PARENT && finalLinkedStudentIds.length === 0) {
      if (!window.confirm('تنبيه: أنت تقوم بإنشاء حساب ولي أمر دون ربطه بأي تلميذ (لم يتم العثور على تلاميذ بنفس رقم البطاقة). هل تريد المتابعة؟')) {
        return;
      }
    }

    // Logic to handle password update
    let finalPassword = formData.password;
    if (isEditing) {
      // Find original user to keep password if input is empty
      const originalUser = users.find(u => u.id === formData.id);
      if (!finalPassword && originalUser) {
        finalPassword = originalUser.password;
      }
    }

    // Ensure there's always a password
    if (!finalPassword) finalPassword = '123';

    const userPayload: User = {
      id: isEditing && formData.id ? formData.id : crypto.randomUUID(),
      name: formData.name!,
      role: formData.role,
      phone: formData.phone,
      email: formData.email,
      nationalId: formData.nationalId,
      password: finalPassword,
      linkedStudentIds: formData.role === UserRole.PARENT ? finalLinkedStudentIds : [],
      avatar: formData.avatar || `https://ui-avatars.com/api/?name=${formData.name}&background=random`
    };

    if (isEditing) {
      updateUser(userPayload);
    } else {
      addUser(userPayload);
    }
    setShowModal(false);
  };

  const toggleStudentLink = (studentId: string) => {
    const currentLinks = formData.linkedStudentIds || [];
    if (currentLinks.includes(studentId)) {
      setFormData({ ...formData, linkedStudentIds: currentLinks.filter(id => id !== studentId) });
    } else {
      setFormData({ ...formData, linkedStudentIds: [...currentLinks, studentId] });
    }
  };

  // Filter students inside modal
  const filteredStudentsToLink = students.filter(s =>
    s.fullName.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
    (s.academicId && s.academicId.includes(studentSearchTerm))
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">إدارة المستخدمين</h2>
          <p className="text-gray-500 mt-1">إضافة المستخدمين، تعيين كلمات المرور وإسناد الصلاحيات</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700 shadow-md font-bold transition-all"
        >
          <UserPlus className="w-5 h-5" />
          <span>مستخدم جديد</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="بحث بالاسم أو البريد الإلكتروني..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-900 transition-colors"
          />
          <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
        </div>

        <div className="relative min-w-[200px]">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as UserRole | 'ALL')}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg appearance-none bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="ALL">كل الأدوار</option>
            <option value={UserRole.ADMIN}>{t('admin')}</option>
            <option value={UserRole.BURSAR}>{t('bursar')}</option>
            <option value={UserRole.SUPERVISOR}>{t('supervisor')}</option>
            <option value={UserRole.TEACHER}>{t('teacher')}</option>
            <option value={UserRole.NURSE}>{t('nurse')}</option>
            <option value={UserRole.PARENT}>{t('parent')}</option>
            <option value={UserRole.CATERING_MANAGER}>{t('catering_manager')}</option>
          </select>
          <Filter className="absolute left-3 top-3 text-gray-400 w-5 h-5 pointer-events-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredUsers.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-400 bg-white rounded-xl border border-dashed">
            <p>لا توجد نتائج مطابقة للبحث.</p>
          </div>
        ) : (
          filteredUsers.map(user => (
            <div key={user.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full object-cover border border-gray-200" />
                  <div>
                    <h3 className="font-bold text-gray-900">{user.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${user.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-700' :
                      user.role === UserRole.BURSAR ? 'bg-amber-100 text-amber-700' :
                        user.role === UserRole.PARENT ? 'bg-blue-100 text-blue-700' :
                          user.role === UserRole.CATERING_MANAGER ? 'bg-orange-100 text-orange-700' :
                            'bg-emerald-100 text-emerald-700'
                      }`}>
                      {user.role === UserRole.ADMIN ? t('admin') :
                        user.role === UserRole.BURSAR ? t('bursar') :
                          user.role === UserRole.PARENT ? t('parent') :
                            user.role === UserRole.SUPERVISOR ? t('supervisor') :
                              user.role === UserRole.NURSE ? t('nurse') :
                                user.role === UserRole.CATERING_MANAGER ? t('catering_manager') : t('teacher')}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleOpenEdit(user)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {currentUser && user.id !== currentUser.id && user.id !== 'admin_main' && (
                    <button onClick={() => deleteUser(user.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-600 space-y-1">
                {user.nationalId && <p className="flex items-center gap-1"><Fingerprint className="w-3 h-3 text-gray-400" /> CNIE: <span className="font-mono font-bold text-gray-800">{user.nationalId}</span></p>}
                {user.phone && <p>الهاتف: <span className="dir-ltr inline-block">{user.phone}</span></p>}
                {user.email && <p>البريد: {user.email}</p>}
                {user.role === UserRole.PARENT && (
                  <div className="mt-3 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                    <p className="text-xs font-bold mb-2 text-gray-500 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      الأبناء المرتبطين ({user.linkedStudentIds?.length || 0}):
                    </p>
                    {user.linkedStudentIds && user.linkedStudentIds.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {user.linkedStudentIds.map(sid => {
                          const st = students.find(s => s.id === sid);
                          return st ? (
                            <span key={sid} className="text-[10px] bg-white border border-gray-200 px-2 py-1 rounded-full text-gray-700 font-bold shadow-sm">
                              {st.fullName}
                            </span>
                          ) : null;
                        })}
                      </div>
                    ) : (
                      <p className="text-[10px] text-red-400 font-medium">لم يتم ربط أي تلميذ</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b flex-shrink-0">
              <h3 className="text-xl font-bold text-gray-900">
                {isEditing ? 'تعديل المستخدم' : 'إضافة مستخدم جديد'}
              </h3>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">الاسم الكامل</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none text-gray-900 bg-white"
                    placeholder="الاسم الكامل"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">الصلاحية / الدور</label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-gray-900"
                  >
                    <option value={UserRole.ADMIN}>{t('admin')}</option>
                    <option value={UserRole.BURSAR}>{t('bursar')}</option>
                    <option value={UserRole.SUPERVISOR}>{t('supervisor')}</option>
                    <option value={UserRole.NURSE}>{t('nurse')}</option>
                    <option value={UserRole.TEACHER}>{t('teacher')}</option>
                    <option value={UserRole.PARENT}>{t('parent')}</option>
                    <option value={UserRole.CATERING_MANAGER}>{t('catering_manager')}</option>
                  </select>
                </div>

                {/* Conditional National ID Field for Parents or General Use */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1">
                    <Fingerprint className="w-4 h-4 text-emerald-600" />
                    رقم البطاقة الوطنية (للدخول)
                  </label>
                  <input
                    type="text"
                    value={formData.nationalId || ''}
                    onChange={e => setFormData({ ...formData, nationalId: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none text-gray-900 bg-white font-mono uppercase"
                    placeholder="مثال: AB123456"
                  />
                  {formData.role === UserRole.PARENT && (
                    <p className="text-xs text-emerald-600 mt-1">سيتم ربط هذا الولي تلقائياً بالتلاميذ الذين يحملون نفس رقم البطاقة.</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">رقم الهاتف</label>
                    <input
                      type="text"
                      value={formData.phone || ''}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none dir-ltr text-right text-gray-900 bg-white"
                      placeholder="06..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">البريد الإلكتروني</label>
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none dir-ltr text-right text-gray-900 bg-white"
                      placeholder="example@mail.com"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1">
                    <Lock className="w-4 h-4 text-gray-400" />
                    كلمة المرور
                  </label>
                  <input
                    type="text"
                    value={formData.password || ''}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none dir-ltr text-gray-900 bg-white font-mono"
                    placeholder={isEditing ? "(اتركها فارغة لعدم التغيير)" : "تعيين كلمة مرور"}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {isEditing
                      ? "اترك الحقل فارغاً للاحتفاظ بكلمة المرور الحالية."
                      : "سيتم استخدام '123' إذا تركت هذا الحقل فارغاً."}
                  </p>
                </div>

                {/* Parent Logic: Link Students */}
                {formData.role === UserRole.PARENT && (
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mt-2">
                    <div className="flex justify-between items-center mb-3">
                      <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
                        <Users className="w-4 h-4 text-emerald-600" />
                        ربط بالأبناء (يدوياً)
                      </label>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${(formData.linkedStudentIds?.length || 0) > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'
                        }`}>
                        {formData.linkedStudentIds?.length || 0} محدد
                      </span>
                    </div>

                    {/* Internal Search for Students */}
                    <div className="relative mb-3">
                      <input
                        type="text"
                        placeholder="بحث عن تلميذ..."
                        value={studentSearchTerm}
                        onChange={(e) => setStudentSearchTerm(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-gray-900 bg-white"
                      />
                      <Search className="absolute left-2.5 top-2.5 text-gray-400 w-4 h-4" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                      {filteredStudentsToLink.length === 0 ? (
                        <div className="col-span-full text-center py-4 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">
                          لا توجد نتائج مطابقة للبحث
                        </div>
                      ) : (
                        filteredStudentsToLink.map(student => {
                          const isSelected = formData.linkedStudentIds?.includes(student.id);
                          return (
                            <div key={student.id}
                              onClick={() => toggleStudentLink(student.id)}
                              className={`flex items-center gap-3 p-2 rounded-xl border cursor-pointer transition-all relative overflow-hidden ${isSelected
                                ? 'bg-emerald-50 border-emerald-500 shadow-sm ring-1 ring-emerald-500'
                                : 'bg-white border-gray-200 hover:border-emerald-300 hover:bg-gray-50'
                                }`}
                            >
                              <img src={student.photoUrl} className="w-9 h-9 rounded-full object-cover border border-gray-200 flex-shrink-0" alt="" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-800 truncate">{student.fullName}</p>
                                <p className="text-xs text-gray-500 truncate">{student.grade}</p>
                              </div>
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${isSelected ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-300'}`}>
                                {isSelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {(!formData.linkedStudentIds || formData.linkedStudentIds.length === 0) && !formData.nationalId && (
                      <div className="mt-3 flex items-center gap-2 text-amber-600 bg-amber-50 p-2 rounded-lg text-xs font-bold">
                        <AlertCircle className="w-4 h-4" />
                        تنبيه: يجب ربط تلميذ واحد على الأقل أو إدخال رقم بطاقة وطنية صحيح.
                      </div>
                    )}
                  </div>
                )}
              </form>
            </div>

            <div className="p-6 border-t flex gap-3 flex-shrink-0 bg-gray-50">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-white border border-gray-300 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-100 transition-colors">إلغاء</button>
              <button type="button" onClick={handleSave} className="flex-1 bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition-colors">حفظ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;