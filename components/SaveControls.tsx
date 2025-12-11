import React from 'react';
import { Save, X, AlertTriangle, RotateCcw } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { UserRole } from '../types';

const SaveControls: React.FC = () => {
  const { hasUnsavedChanges, saveAllChanges, discardAllChanges, currentUser } = useData();
  const { t } = useLanguage();

  if (!hasUnsavedChanges || !currentUser) return null;

  // Only allow Admin, Supervisor, Teacher, Nurse, Catering Manager to save data.
  // Parents usually only view data or edit their own profile (which we might want to autosave, but let's standardise).
  const canSave = [
    UserRole.ADMIN, 
    UserRole.SUPERVISOR, 
    UserRole.TEACHER, 
    UserRole.NURSE, 
    UserRole.CATERING_MANAGER,
    UserRole.PARENT // Allowing parents to save if they edit their profile/link settings
  ].includes(currentUser.role);

  if (!canSave) return null;

  const handleDiscard = () => {
    if (window.confirm(t('confirm_discard'))) {
      discardAllChanges();
    }
  };

  const handleSave = () => {
    saveAllChanges();
    // Optional: Add a toast notification here
    // alert(t('changes_saved')); 
  };

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[100] animate-slide-up">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-2 pl-4 pr-2 flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="bg-amber-100 text-amber-600 p-2 rounded-full animate-pulse">
             <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-800">{t('unsaved_changes')}</p>
            <p className="text-[10px] text-gray-500">اضغط للحفظ لتأكيد التعديلات</p>
          </div>
        </div>

        <div className="flex items-center gap-2 border-r pr-4 border-gray-200 mr-2">
           <button 
             onClick={handleDiscard}
             className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors text-sm font-bold"
           >
             <RotateCcw className="w-4 h-4" />
             <span className="hidden sm:inline">{t('discard_changes')}</span>
           </button>
           
           <button 
             onClick={handleSave}
             className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl shadow-lg hover:shadow-emerald-200 transition-all text-sm font-bold active:scale-95"
           >
             <Save className="w-4 h-4" />
             <span>{t('save_changes')}</span>
           </button>
        </div>
      </div>
    </div>
  );
};

export default SaveControls;