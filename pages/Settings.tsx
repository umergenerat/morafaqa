import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { UserRole } from '../types';
import { Save, School, Calendar, CheckCircle, ShieldAlert } from 'lucide-react';

const Settings: React.FC = () => {
  const { schoolSettings, updateSchoolSettings, currentUser } = useData();
  const { t } = useLanguage();
  
  const [formData, setFormData] = useState({
    institutionName: schoolSettings.institutionName,
    schoolYear: schoolSettings.schoolYear
  });
  const [success, setSuccess] = useState(false);

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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSchoolSettings({
        ...schoolSettings,
        institutionName: formData.institutionName,
        schoolYear: formData.schoolYear
    });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
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
                            onChange={(e) => setFormData({...formData, institutionName: e.target.value})}
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
                            onChange={(e) => setFormData({...formData, schoolYear: e.target.value})}
                            className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-shadow text-gray-900 bg-white"
                            placeholder="YYYY/YYYY"
                            required
                        />
                    </div>
                     <p className="text-xs text-gray-500 mt-2">يحدد الأرشيف والسجلات الحالية.</p>
                </div>
            </div>

            <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                {success ? (
                    <div className="flex items-center gap-2 text-emerald-600 font-bold animate-fade-in bg-emerald-50 px-4 py-2 rounded-lg">
                        <CheckCircle className="w-5 h-5" />
                        {t('success_update')}
                    </div>
                ) : <div></div>}

                <button 
                    type="submit" 
                    className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 shadow-lg hover:shadow-emerald-200 transition-all flex items-center gap-2"
                >
                    <Save className="w-5 h-5" />
                    {t('save')}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;