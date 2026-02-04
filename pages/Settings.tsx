import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { UserRole } from '../types';
import { Save, School, Calendar, CheckCircle, ShieldAlert, Key } from 'lucide-react';

const Settings: React.FC = () => {
  const { schoolSettings, updateSchoolSettings, currentUser, resetData } = useData();
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    institutionName: schoolSettings.institutionName,
    schoolYear: schoolSettings.schoolYear,
    geminiApiKey: schoolSettings.geminiApiKey || ''
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Security Check
  if (currentUser?.role !== UserRole.ADMIN) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-gray-500">
        <ShieldAlert className="w-16 h-16 mb-4 text-gray-300" />
        <h2 className="text-xl font-bold">{t('access_denied')}</h2>
        <p>{t('admin_only')}</p>
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    const result = await updateSchoolSettings({
      ...schoolSettings,
      institutionName: formData.institutionName,
      schoolYear: formData.schoolYear,
      geminiApiKey: formData.geminiApiKey
    });

    setIsSaving(false);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(result.error || 'حدث خطأ أثناء الحفظ');
      setTimeout(() => setError(null), 5000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">{t('general_settings')}</h2>
        <p className="text-gray-500 mt-1">{t('settings_desc')}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <School className="w-5 h-5 text-emerald-600" />
            هوية المؤسسة
          </h3>
        </div>

        <form onSubmit={handleSave} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                {t('institution_name')}
              </label>
              <div className="relative">
                <School className="absolute top-3.5 right-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.institutionName}
                  onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
                  className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-shadow text-gray-900 bg-white"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">سيظهر هذا الاسم في صفحة الدخول والتقارير المطبوعة.</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                {t('school_year')}
              </label>
              <div className="relative">
                <Calendar className="absolute top-3.5 right-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.schoolYear}
                  onChange={(e) => setFormData({ ...formData, schoolYear: e.target.value })}
                  className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-shadow text-gray-900 bg-white"
                  placeholder="YYYY/YYYY"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">يحدد الأرشيف والسجلات الحالية.</p>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 flex items-center justify-between flex-wrap gap-3">
            {success ? (
              <div className="flex items-center gap-2 text-emerald-600 font-bold animate-fade-in bg-emerald-50 px-4 py-2 rounded-lg">
                <CheckCircle className="w-5 h-5" />
                {t('success_update')}
              </div>
            ) : error ? (
              <div className="flex items-center gap-2 text-red-600 font-bold animate-fade-in bg-red-50 px-4 py-2 rounded-lg">
                <ShieldAlert className="w-5 h-5" />
                {error}
              </div>
            ) : <div></div>}

            <button
              type="submit"
              disabled={isSaving}
              className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 shadow-lg hover:shadow-emerald-100 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  جاري الحفظ...
                </span>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {t('save_changes')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Key className="w-5 h-5 text-amber-600" />
            {t('connection_keys')}
          </h3>
        </div>

        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 gap-8">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                {t('gemini_api_key')}
              </label>
              <div className="relative">
                <Key className="absolute top-3.5 right-3 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={formData.geminiApiKey}
                  onChange={(e) => setFormData({ ...formData, geminiApiKey: e.target.value })}
                  className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-shadow text-gray-900 bg-white font-mono"
                  placeholder={t('key_placeholder')}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">{t('gemini_api_desc')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-red-50 rounded-2xl p-6 border border-red-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h3 className="text-red-800 font-bold flex items-center gap-2">
            <ShieldAlert className="w-5 h-5" />
            منطقة الخطر
          </h3>
          <p className="text-red-600 text-sm mt-1">
            إعادة تعيين جميع البيانات إلى الإعدادات الافتراضية (بيانات تجريبية واقعية).
          </p>
        </div>
        <button
          onClick={resetData}
          className="px-6 py-2.5 bg-white text-red-600 border border-red-200 rounded-xl font-bold hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-95 whitespace-nowrap"
        >
          إعادة تعيين البيانات
        </button>
      </div>
    </div>
  );
};

export default Settings;