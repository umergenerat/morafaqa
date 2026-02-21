import React, { useState } from 'react';
import { Utensils, Coffee, Moon, ChefHat, Sun, Sunrise, Download, Edit2, Save, X, Printer, FileSpreadsheet, Send, User, MessageCircle, Phone } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import { Meal, UserRole } from '../types';
import * as Permissions from '../utils/permissions';
import * as XLSX from 'xlsx';

const Dining: React.FC = () => {
  const { t, language } = useLanguage();
  const { currentUser, students, users, attendanceRecords, exitRecords, weeklyMenus, updateWeeklyMenus } = useData();
  const [isRamadan, setIsRamadan] = useState(false);

  // Editing State
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [tempEditData, setTempEditData] = useState<Meal | null>(null);
  const [editReason, setEditReason] = useState('');

  // Notification State
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [extraMeals, setExtraMeals] = useState({ m1: 0, m2: 0, m3: 0 });
  const [orderNotes, setOrderNotes] = useState('');
  const [selectedRecipientId, setSelectedRecipientId] = useState('');
  const [notificationChannel, setNotificationChannel] = useState<'whatsapp' | 'sms'>('whatsapp');

  const canEdit = Permissions.canManageDining(currentUser);
  const isAdmin = Permissions.canManageUsers(currentUser);
  const canNotify = Permissions.canNotifyKitchen(currentUser);

  const getCurrentMeals = () => {
    if (isRamadan) return language === 'ar' ? weeklyMenus.ramadanAr : weeklyMenus.ramadanFr;
    return language === 'ar' ? weeklyMenus.normalAr : weeklyMenus.normalFr;
  };

  const handleEditClick = (meal: Meal) => {
    setEditingMeal(meal);
    setTempEditData({ ...meal });
    setEditReason('');
  };

  const handleSaveEdit = () => {
    if (!tempEditData || !editingMeal) return;

    // Check for changes
    const originalSnapshot: any = editingMeal.originalValues || {};
    let hasChanges = false;
    let updatedMeal = { ...tempEditData } as Meal;

    const fields = isRamadan
      ? ['ftour', 'dinner', 'suhoor'] as const
      : ['breakfast', 'lunch', 'dinner'] as const;

    fields.forEach(field => {
      // If value changed from current
      if (tempEditData[field] !== editingMeal[field]) {
        hasChanges = true;
        // If we don't have an original value stored yet, store the current one as original
        if (!originalSnapshot[field]) {
          originalSnapshot[field] = editingMeal[field];
        }
        // If we reverted to original, remove from snapshot
        if (originalSnapshot[field] === tempEditData[field]) {
          delete originalSnapshot[field];
        }
      }
    });

    updatedMeal = {
      ...updatedMeal,
      originalValues: Object.keys(originalSnapshot).length > 0 ? originalSnapshot : undefined,
      modifiedBy: hasChanges ? currentUser?.name : editingMeal.modifiedBy,
      modificationDate: hasChanges ? new Date().toISOString() : editingMeal.modificationDate,
      modificationReason: hasChanges ? editReason : editingMeal.modificationReason
    };

    // Notification Logic (Only for non-admins)
    if (hasChanges && !Permissions.canManageUsers(currentUser)) {
      const changeLog: string[] = [];

      fields.forEach(field => {
        if (updatedMeal[field] !== editingMeal[field]) {
          const label = field === 'ftour' ? t('ftour') :
            field === 'suhoor' ? t('suhoor') :
              field === 'breakfast' ? t('breakfast') :
                field === 'lunch' ? t('lunch') : t('dinner');

          changeLog.push(`- ${label}: ${updatedMeal[field] || '---'} ⬅️ ${editingMeal[field] || '---'}`);
        }
      });

      if (changeLog.length > 0) {
        const admin = users.find(u => u.role === UserRole.ADMIN);

        if (admin && admin.phone) {
          const message = language === 'ar'
            ? `*⚠️ تنبيه: تعديل في قائمة الطعام*\n\n` +
            `👤 *قام بالتعديل:* ${currentUser?.name}\n` +
            `📅 *اليوم:* ${updatedMeal.day}\n\n` +
            `📋 *التغييرات:*\n${changeLog.join('\n')}\n\n` +
            `📝 *السبب:* ${editReason || 'لا يوجد'}\n` +
            `⏰ *التوقيت:* ${new Date().toLocaleString('ar-MA')}\n\n` +
            `🔙 *للتراجع:* يرجى إعادة القيم السابقة يدوياً.`
            : `*⚠️ Alerte: Modification du Menu*\n\n` +
            `👤 *Modifié par:* ${currentUser?.name}\n` +
            `📅 *Jour:* ${updatedMeal.day}\n\n` +
            `📋 *Changements:*\n${changeLog.join('\n')}\n\n` +
            `📝 *Raison:* ${editReason || 'Aucune'}\n` +
            `⏰ *Date:* ${new Date().toLocaleString('fr-FR')}\n\n` +
            `🔙 *Pour annuler:* Veuillez restaurer les anciennes valeurs manuellement.`;

          const phone = admin.phone.replace(/\D/g, '');
          const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

          window.open(whatsappUrl, '_blank');
        }
      }
    }

    // Determine which array we are editing to update it in the global state
    const newMenus = { ...weeklyMenus };
    let targetList: Meal[] = [];
    let listKey: keyof typeof weeklyMenus = 'normalAr';

    if (isRamadan) {
      if (language === 'ar') { listKey = 'ramadanAr'; targetList = [...newMenus.ramadanAr]; }
      else { listKey = 'ramadanFr'; targetList = [...newMenus.ramadanFr]; }
    } else {
      if (language === 'ar') { listKey = 'normalAr'; targetList = [...newMenus.normalAr]; }
      else { listKey = 'normalFr'; targetList = [...newMenus.normalFr]; }
    }

    // Use updatedMeal instead of tempEditData
    const updatedList = targetList.map(m => m.id === updatedMeal.id ? updatedMeal : m);
    newMenus[listKey] = updatedList;

    updateWeeklyMenus(newMenus);
    setEditingMeal(null);
    setTempEditData(null);
  };

  const handleDownloadExcel = () => {
    const data = getCurrentMeals().map(m => ({
      [t('day')]: m.day,
      [isRamadan ? t('ftour') : t('breakfast')]: isRamadan ? m.ftour : m.breakfast,
      [isRamadan ? t('dinner') : t('lunch')]: isRamadan ? m.dinner : m.lunch,
      [isRamadan ? t('suhoor') : t('dinner')]: isRamadan ? m.suhoor : m.dinner,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Menu");
    XLSX.writeFile(wb, `Menu_${isRamadan ? 'Ramadan' : 'Normal'}_${language}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  const calculateDailyCounts = () => {
    const today = new Date().toISOString().split('T')[0];
    const totalStudents = students.length;
    const absents = attendanceRecords.filter(r => r.date === today && r.status === 'absent').length;
    // التلاميذ في خرجة نشطة (تاريخ العودة لم يحن بعد أو يساوي اليوم)
    const onExit = exitRecords.filter(e => {
      const returnDate = new Date(e.returnDate);
      const todayDate = new Date(today);
      return returnDate >= todayDate;
    }).length;
    const presentCount = Math.max(0, totalStudents - absents - onExit);
    return {
      total: totalStudents,
      absents,
      onExit,
      present: presentCount
    };
  };

  const handleSendOrder = () => {
    const counts = calculateDailyCounts();
    const baseCount = counts.present;
    const recipient = users.find(u => u.id === selectedRecipientId);

    if (!recipient || !recipient.phone) {
      alert(language === 'ar' ? 'المرجو اختيار مستلم برقم هاتف صحيح' : 'Veuillez choisir un destinataire avec un numéro valide');
      return;
    }

    const m1Label = isRamadan ? t('ftour') : t('breakfast');
    const m2Label = isRamadan ? t('dinner') : t('lunch');
    const m3Label = isRamadan ? t('suhoor') : t('dinner');

    const message = `*${t('notify_kitchen')}* 👨‍🍳
-------------------
📊 *${t('daily_count')}*:
  👥 إجمالي التلاميذ: ${counts.total}
  ❌ غائبون: ${counts.absents}
  🚶 في خرجة: ${counts.onExit}
  ✅ *الحاضرون الفعليون: ${baseCount}*

📦 *${t('extra_meals')}*:
- ${m1Label}: +${extraMeals.m1}
- ${m2Label}: +${extraMeals.m2}
- ${m3Label}: +${extraMeals.m3}

📝 *${t('notes')}*: ${orderNotes || 'لا توجد'}
-------------------
⏰ تم الإرسال من تطبيق مرافقة.`;

    const phone = recipient.phone.replace(/\D/g, '');

    if (notificationChannel === 'whatsapp') {
      const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    } else {
      // SMS protocol
      const smsUrl = `sms:${phone}${window.navigator.userAgent.match(/iPhone/i) ? '&' : '?'}body=${encodeURIComponent(message)}`;
      window.location.href = smsUrl;
    }

    setShowNotifyModal(false);
    setOrderNotes('');
    setExtraMeals({ m1: 0, m2: 0, m3: 0 });
  };

  const cateringManagers = users.filter(u => u.role === UserRole.CATERING_MANAGER);
  const bursars = users.filter(u => u.role === UserRole.BURSAR);
  const allRecipients = [...cateringManagers, ...bursars];

  // Auto-select first recipient when modal opens
  const handleOpenNotifyModal = () => {
    if (allRecipients.length > 0 && !selectedRecipientId) {
      setSelectedRecipientId(allRecipients[0].id);
    }
    setShowNotifyModal(true);
  };
  const meals = getCurrentMeals();

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Utensils className="w-8 h-8 text-orange-500" />
            {t('dining')}
          </h2>
          <p className="text-gray-500 mt-1">
            {language === 'ar'
              ? 'خدمات الإطعام المدرسي متوفرة لجميع الطلاب المقيمين.'
              : 'Services de restauration scolaire disponibles pour tous les élèves internes.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {canNotify && (
            <button
              onClick={handleOpenNotifyModal}
              className="bg-orange-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-orange-700 flex items-center gap-2 shadow-lg hover:shadow-orange-200 transition-all active:scale-95"
            >
              <Send className="w-5 h-5" />
              <span>{t('notify_kitchen')}</span>
            </button>
          )}

          {/* Action Buttons */}
          <button
            onClick={handleDownloadExcel}
            className="bg-white border border-gray-300 text-green-700 px-3 py-2 rounded-lg font-bold hover:bg-green-50 flex items-center gap-2 shadow-sm transition-colors"
            title="Download Excel"
          >
            <FileSpreadsheet className="w-5 h-5" />
            <span className="hidden sm:inline">Excel</span>
          </button>

          <button
            onClick={handlePrint}
            className="bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg font-bold hover:bg-gray-50 flex items-center gap-2 shadow-sm transition-colors"
            title="Print Menu"
          >
            <Printer className="w-5 h-5" />
            <span className="hidden sm:inline">{language === 'ar' ? 'طباعة' : 'Imprimer'}</span>
          </button>

          {/* Ramadan Toggle */}
          <button
            onClick={() => setIsRamadan(!isRamadan)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all shadow-sm ${isRamadan
              ? 'bg-purple-600 text-white hover:bg-purple-700'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
          >
            {isRamadan ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-orange-500" />}
            <span>{isRamadan ? t('ramadan_mode') : t('normal_mode')}</span>
          </button>
        </div>
      </div>

      {/* Menu Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden print:border-0 print:shadow-none">
        <div className={`p-6 border-b print:p-2 print:border-b-2 ${isRamadan ? 'bg-purple-50 border-purple-100' : 'bg-orange-50 border-orange-100'}`}>
          <h3 className={`text-xl font-bold text-center ${isRamadan ? 'text-purple-900' : 'text-gray-800'}`}>
            {t('weekly_menu')} {isRamadan && <span className="text-purple-600">({t('ramadan_mode')})</span>}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-6 print:grid-cols-3 print:gap-2 print:p-2">
          {meals.map((meal) => (
            <div key={meal.id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col relative group print:break-inside-avoid print:shadow-none print:border-gray-400">
              {/* Edit Button (Admin Only) */}
              {canEdit && (
                <button
                  onClick={() => handleEditClick(meal)}
                  className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full text-gray-500 hover:text-blue-600 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-10 print:hidden"
                  title={language === 'ar' ? 'تعديل الوجبة' : 'Modifier le repas'}
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}

              <div className={`${isRamadan ? 'bg-purple-800' : 'bg-gray-800'} text-white text-center py-2 font-bold rounded-t-xl transition-colors print:bg-gray-200 print:text-black`}>
                {meal.day}
              </div>

              <div className="p-4 flex-1 space-y-4 print:p-2 print:space-y-2">
                {/* Meal 1 */}
                <div>
                  <div className={`flex items-center gap-2 font-bold mb-1 text-sm ${isRamadan ? 'text-purple-600' : 'text-yellow-600'}`}>
                    {isRamadan ? <Moon className="w-4 h-4" /> : <Coffee className="w-4 h-4" />}
                    {isRamadan ? t('ftour') : t('breakfast')}
                  </div>
                  <div className="relative group">
                    <p className={`text-sm leading-relaxed ${meal.originalValues?.[isRamadan ? 'ftour' : 'breakfast'] ? 'text-orange-600 font-bold' : 'text-gray-700'}`}>
                      {isRamadan ? meal.ftour : meal.breakfast}
                    </p>
                    {meal.originalValues?.[isRamadan ? 'ftour' : 'breakfast'] && (
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block w-max max-w-xs p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-20">
                        <div className="font-bold border-b border-gray-600 mb-1 pb-1">{language === 'ar' ? 'الأصل:' : 'Original:'}</div>
                        {meal.originalValues[isRamadan ? 'ftour' : 'breakfast']}
                        <div className="mt-1 text-gray-400 italic font-mono text-[10px]">
                          {meal.modifiedBy} - {meal.modificationReason}
                        </div>
                        {/* Triangle arrow */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Meal 2 */}
                <div className="border-t pt-3 print:pt-2">
                  <div className={`flex items-center gap-2 font-bold mb-1 text-sm ${isRamadan ? 'text-blue-600' : 'text-orange-600'}`}>
                    <Utensils className="w-4 h-4" />
                    {isRamadan ? t('dinner') : t('lunch')}
                  </div>
                  <div className="relative group">
                    <p className={`text-sm leading-relaxed ${meal.originalValues?.[isRamadan ? 'dinner' : 'lunch'] ? 'text-orange-600 font-bold' : 'text-gray-700'}`}>
                      {isRamadan ? meal.dinner : meal.lunch}
                    </p>
                    {meal.originalValues?.[isRamadan ? 'dinner' : 'lunch'] && (
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block w-max max-w-xs p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-20">
                        <div className="font-bold border-b border-gray-600 mb-1 pb-1">{language === 'ar' ? 'الأصل:' : 'Original:'}</div>
                        {meal.originalValues[isRamadan ? 'dinner' : 'lunch']}
                        <div className="mt-1 text-gray-400 italic font-mono text-[10px]">
                          {meal.modifiedBy} - {meal.modificationReason}
                        </div>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Meal 3 */}
                <div className="border-t pt-3 print:pt-2">
                  <div className={`flex items-center gap-2 font-bold mb-1 text-sm ${isRamadan ? 'text-indigo-600' : 'text-indigo-600'}`}>
                    {isRamadan ? <Sunrise className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    {isRamadan ? t('suhoor') : t('dinner')}
                  </div>
                  <div className="relative group">
                    <p className={`text-sm leading-relaxed ${meal.originalValues?.[isRamadan ? 'suhoor' : 'dinner'] ? 'text-orange-600 font-bold' : 'text-gray-700'}`}>
                      {isRamadan ? meal.suhoor : meal.dinner}
                    </p>
                    {meal.originalValues?.[isRamadan ? 'suhoor' : 'dinner'] && (
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block w-max max-w-xs p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-20">
                        <div className="font-bold border-b border-gray-600 mb-1 pb-1">{language === 'ar' ? 'الأصل:' : 'Original:'}</div>
                        {meal.originalValues[isRamadan ? 'suhoor' : 'dinner']}
                        <div className="mt-1 text-gray-400 italic font-mono text-[10px]">
                          {meal.modifiedBy} - {meal.modificationReason}
                        </div>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notify Kitchen Modal */}
      {showNotifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b flex-shrink-0 bg-orange-50 rounded-t-2xl">
              <h3 className="text-xl font-bold text-orange-900 flex items-center gap-2">
                <ChefHat className="w-6 h-6 text-orange-600" />
                {t('notify_kitchen')}
              </h3>
              <button onClick={() => setShowNotifyModal(false)} className="text-orange-400 hover:text-orange-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      {language === 'ar' ? 'المستلم' : 'Destinataire'}
                    </label>
                    <select
                      value={selectedRecipientId}
                      onChange={(e) => setSelectedRecipientId(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl p-3 bg-white text-gray-900 focus:ring-2 focus:ring-orange-500 outline-none"
                    >
                      {allRecipients.length > 0 ? (
                        allRecipients.map(u => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.role === UserRole.CATERING_MANAGER ? (language === 'ar' ? 'مطعمة' : 'Restaur.') : (language === 'ar' ? 'مقتصد' : 'Econ.')})
                          </option>
                        ))
                      ) : (
                        <option value="">{language === 'ar' ? 'لا يوجد مسؤول' : 'Aucun responsable'}</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      {language === 'ar' ? 'وسيلة الإرسال' : 'Canal d\'envoi'}
                    </label>
                    <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setNotificationChannel('whatsapp')}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${notificationChannel === 'whatsapp' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        WhatsApp
                      </button>
                      <button
                        type="button"
                        onClick={() => setNotificationChannel('sms')}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${notificationChannel === 'sms' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        SMS
                      </button>
                    </div>
                  </div>
                </div>

                {/* Daily Count Summary */}
                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-orange-800 text-sm font-medium">👥 إجمالي التلاميذ:</span>
                    <span className="font-bold text-orange-700">{calculateDailyCounts().total}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-red-700 text-sm font-medium">❌ غائبون:</span>
                    <span className="font-bold text-red-600">- {calculateDailyCounts().absents}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-700 text-sm font-medium">🚶 في خرجة نشطة:</span>
                    <span className="font-bold text-blue-600">- {calculateDailyCounts().onExit}</span>
                  </div>
                  <div className="border-t border-orange-200 pt-2 flex justify-between items-center">
                    <span className="text-orange-900 font-bold">{t('daily_count')} (الوجبات):</span>
                    <span className="text-2xl font-bold text-orange-900">{calculateDailyCounts().present}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">{t('extra_meals')}</label>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-gray-50 p-2 rounded-xl border border-gray-200">
                      <label className="text-xs font-bold text-gray-500 mb-1 block text-center truncate">
                        {isRamadan ? t('ftour') : t('breakfast')}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={extraMeals.m1}
                        onChange={(e) => setExtraMeals({ ...extraMeals, m1: Number(e.target.value) })}
                        className="w-full border border-gray-300 rounded-lg p-2 bg-white text-gray-900 focus:ring-2 focus:ring-orange-500 outline-none text-center font-bold"
                      />
                    </div>
                    <div className="bg-gray-50 p-2 rounded-xl border border-gray-200">
                      <label className="text-xs font-bold text-gray-500 mb-1 block text-center truncate">
                        {isRamadan ? t('dinner') : t('lunch')}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={extraMeals.m2}
                        onChange={(e) => setExtraMeals({ ...extraMeals, m2: Number(e.target.value) })}
                        className="w-full border border-gray-300 rounded-lg p-2 bg-white text-gray-900 focus:ring-2 focus:ring-orange-500 outline-none text-center font-bold"
                      />
                    </div>
                    <div className="bg-gray-50 p-2 rounded-xl border border-gray-200">
                      <label className="text-xs font-bold text-gray-500 mb-1 block text-center truncate">
                        {isRamadan ? t('suhoor') : t('dinner')}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={extraMeals.m3}
                        onChange={(e) => setExtraMeals({ ...extraMeals, m3: Number(e.target.value) })}
                        className="w-full border border-gray-300 rounded-lg p-2 bg-white text-gray-900 focus:ring-2 focus:ring-orange-500 outline-none text-center font-bold"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">{t('notes')}</label>
                  <textarea
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="ملاحظات إضافية للمسؤول..."
                    className="w-full border border-gray-300 rounded-xl p-3 h-24 bg-white text-gray-900 focus:ring-2 focus:ring-orange-500 outline-none resize-none"
                  />
                </div>

                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-xs text-blue-700">
                  سيتم إرسال إشعار إلى: {cateringManagers.length > 0 ? cateringManagers.map(u => u.name).join(', ') : 'لا يوجد مسؤول مطعمة مسجل'}
                </div>
              </div>
            </div>

            <div className="p-6 border-t flex gap-3 flex-shrink-0 bg-gray-50 rounded-b-2xl">
              <button type="button" onClick={() => setShowNotifyModal(false)} className="flex-1 bg-white border border-gray-300 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-100 transition-colors">
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={handleSendOrder}
                disabled={!selectedRecipientId}
                className={`flex-1 ${notificationChannel === 'whatsapp' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'} text-white font-bold py-3 rounded-xl shadow-md transition-colors flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {notificationChannel === 'whatsapp' ? (
                  <MessageCircle className="w-5 h-5" />
                ) : (
                  <Phone className="w-5 h-5" />
                )}
                {t('send_order')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingMeal && tempEditData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b flex-shrink-0">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-600" />
                {language === 'ar' ? 'تعديل قائمة: ' : 'Modifier le menu: '} {tempEditData.day}
              </h3>
              <button onClick={() => setEditingMeal(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <form className="space-y-4">
                {/* Meal 1 Input */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    {isRamadan ? t('ftour') : t('breakfast')}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={isRamadan ? tempEditData.ftour : tempEditData.breakfast}
                      onChange={(e) => setTempEditData(prev => ({
                        ...prev!,
                        [isRamadan ? 'ftour' : 'breakfast']: e.target.value
                      }))}
                      className="w-full border border-gray-300 rounded-xl p-3 pr-10 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setTempEditData(prev => ({ ...prev!, [isRamadan ? 'ftour' : 'breakfast']: '' }))}
                      className="absolute left-3 top-3 text-gray-400 hover:text-red-500"
                      title="مسح"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Meal 2 Input */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    {isRamadan ? t('dinner') : t('lunch')}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={isRamadan ? tempEditData.dinner : tempEditData.lunch}
                      onChange={(e) => setTempEditData(prev => ({
                        ...prev!,
                        [isRamadan ? 'dinner' : 'lunch']: e.target.value
                      }))}
                      className="w-full border border-gray-300 rounded-xl p-3 pr-10 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setTempEditData(prev => ({ ...prev!, [isRamadan ? 'dinner' : 'lunch']: '' }))}
                      className="absolute left-3 top-3 text-gray-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Meal 3 Input */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    {isRamadan ? t('suhoor') : t('dinner')}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={isRamadan ? tempEditData.suhoor : tempEditData.dinner}
                      onChange={(e) => setTempEditData(prev => ({
                        ...prev!,
                        [isRamadan ? 'suhoor' : 'dinner']: e.target.value
                      }))}
                      className="w-full border border-gray-300 rounded-xl p-3 pr-10 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setTempEditData(prev => ({ ...prev!, [isRamadan ? 'suhoor' : 'dinner']: '' }))}
                      className="absolute left-3 top-3 text-gray-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </form>

              {/* Reason for Edit (Visible to Non-Admins) */}
              {!Permissions.canManageUsers(currentUser) && (
                <div className="mt-4 p-4 bg-orange-50 rounded-xl border border-orange-100">
                  <label className="block text-sm font-bold text-orange-800 mb-2">
                    {language === 'ar' ? 'سبب التعديل (إلزامي لإرسال الإشعار)' : 'Raison de la modification (Requis)'}
                  </label>
                  <textarea
                    value={editReason}
                    onChange={(e) => setEditReason(e.target.value)}
                    placeholder={language === 'ar' ? 'يرجى ذكر سبب التعديل...' : 'Veuillez indiquer la raison...'}
                    className="w-full border border-orange-200 rounded-xl p-3 h-20 bg-white text-gray-900 focus:ring-2 focus:ring-orange-500 outline-none resize-none text-sm"
                  />
                  <p className="text-xs text-orange-600 mt-2">
                    {language === 'ar'
                      ? '⚠️ سيتم إرسال رسالة تلقائية للمدير بالتعديلات.'
                      : '⚠️ Un message sera envoyé automatiquement au directeur.'}
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 border-t flex gap-3 flex-shrink-0 bg-gray-50">
              <button type="button" onClick={() => setEditingMeal(null)} className="flex-1 bg-white border border-gray-300 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-100 transition-colors">
                {t('cancel')}
              </button>
              <button type="button" onClick={handleSaveEdit} className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 shadow-md transition-colors flex justify-center items-center gap-2">
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

export default Dining;