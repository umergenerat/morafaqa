import React from 'react';
import { Menu, Bell, Languages, User as UserIcon } from 'lucide-react';
import { User, UserRole } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface HeaderProps {
  user: User | null;
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, toggleSidebar }) => {
  const { t, language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'fr' : 'ar');
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return t('admin');
      case UserRole.SUPERVISOR: return t('supervisor');
      case UserRole.NURSE: return t('nurse');
      case UserRole.TEACHER: return t('teacher');
      case UserRole.PARENT: return t('parent');
      default: return '';
    }
  };

  return (
    <header className="bg-white shadow-sm h-20 flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center">
        <button 
          onClick={toggleSidebar}
          className={`p-2 rounded-md hover:bg-gray-100 lg:hidden text-gray-600 ${language === 'ar' ? 'ml-4' : 'mr-4'}`}
        >
          <Menu className="w-6 h-6" />
        </button>
        {user && (
          <div className="hidden sm:block">
            <h2 className="text-xl font-bold text-gray-800">
              {t('welcome')} {user.name}
            </h2>
            <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              {getRoleLabel(user.role)}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Language Switcher */}
        <button 
          onClick={toggleLanguage}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-gray-200 hover:bg-gray-50 text-sm font-bold text-gray-700 transition-colors"
        >
          <Languages className="w-4 h-4 text-emerald-600" />
          <span>{language === 'ar' ? 'Français' : 'العربية'}</span>
        </button>

        <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
          <Bell className="w-6 h-6" />
          <span className="absolute top-2 left-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        
        {user ? (
          <img 
            src={user.avatar} 
            alt={user.name} 
            className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500 shadow-sm"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
             <UserIcon className="w-6 h-6 text-gray-400" />
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;