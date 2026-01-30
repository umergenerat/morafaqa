
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Stethoscope, 
  ClipboardCheck, 
  Settings, 
  LogOut,
  ShieldCheck,
  Utensils,
  GraduationCap,
  BookOpen,
  LineChart,
  Wrench,
  Star
} from 'lucide-react';
import { UserRole } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { t, language } = useLanguage();
  const { currentUser, logout, schoolSettings, hasUnsavedChanges, saveAllChanges } = useData();
  const role = currentUser?.role || UserRole.PARENT;

  const links = [
    { to: '/', label: 'dashboard', icon: LayoutDashboard, roles: [UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.PARENT, UserRole.CATERING_MANAGER, UserRole.BURSAR] },
    { to: '/students', label: 'students', icon: Users, roles: [UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.TEACHER, UserRole.NURSE, UserRole.PARENT, UserRole.BURSAR] },
    { to: '/academics', label: 'academics', icon: LineChart, roles: [UserRole.ADMIN, UserRole.TEACHER, UserRole.PARENT, UserRole.SUPERVISOR] },
    { to: '/behavior', label: 'behavior_tracking', icon: Star, roles: [UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.TEACHER, UserRole.PARENT] }, // New
    { to: '/health', label: 'health', icon: Stethoscope, roles: [UserRole.ADMIN, UserRole.NURSE, UserRole.PARENT] },
    { to: '/attendance', label: 'attendance', icon: ClipboardCheck, roles: [UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.PARENT] },
    { to: '/dining', label: 'dining', icon: Utensils, roles: [UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.PARENT, UserRole.TEACHER, UserRole.NURSE, UserRole.CATERING_MANAGER, UserRole.BURSAR] },
    { to: '/maintenance', label: 'maintenance', icon: Wrench, roles: [UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.BURSAR, UserRole.CATERING_MANAGER, UserRole.TEACHER] },
    { to: '/activities', label: 'activities', icon: BookOpen, roles: [UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.TEACHER, UserRole.PARENT] },
    { to: '/users', label: 'users', icon: ShieldCheck, roles: [UserRole.ADMIN] }, // User Management
    { to: '/settings', label: 'settings', icon: Settings, roles: [UserRole.ADMIN] }, // General Settings
  ];

  const handleLogout = () => {
    // Auto-save changes if any exist before logging out
    if (hasUnsavedChanges) {
      saveAllChanges();
    }
    
    // Execute logout immediately
    logout();
    // Close sidebar on mobile if open
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <aside className={`
        fixed top-0 ${language === 'ar' ? 'right-0' : 'left-0'} z-30 h-full w-64 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : (language === 'ar' ? 'translate-x-full' : '-translate-x-full')}
        lg:translate-x-0 lg:static lg:h-screen lg:shadow-none lg:border-l lg:border-gray-200
        flex flex-col
      `}>
        {/* Fixed Header */}
        <div className="shrink-0 flex flex-col items-center justify-center py-6 bg-emerald-600 text-white shadow-md relative z-10">
          <div className="bg-white/10 p-2 rounded-full mb-2">
             <GraduationCap className="w-8 h-8 text-emerald-50" />
          </div>
          <h1 className="text-lg font-bold tracking-wide text-center px-4 leading-tight">
            {schoolSettings.institutionName}
          </h1>
          <span className="text-[10px] bg-emerald-800/50 px-2 py-0.5 rounded-full mt-2 text-emerald-50 font-mono border border-emerald-500/30">
            {schoolSettings.schoolYear}
          </span>
        </div>

        {/* Scrollable Navigation Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar py-4 px-3 space-y-1">
          <nav className="space-y-1">
            {links.filter(l => l.roles.includes(role)).map((link) => (
              <NavLink
                key={link.to + link.label}
                to={link.to}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) => `
                  flex items-center px-4 py-3 rounded-xl transition-all duration-200 group
                  ${isActive 
                    ? 'bg-emerald-50 text-emerald-700 font-bold shadow-sm' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-emerald-600 font-medium'}
                `}
              >
                <link.icon className={`w-5 h-5 ${language === 'ar' ? 'ml-3' : 'mr-3'} ${
                   // Icon specific transition
                   'group-hover:scale-110 transition-transform duration-200'
                }`} />
                <span>{t(link.label)}</span>
              </NavLink>
            ))}
          </nav>

          <div className="my-4 border-t border-gray-100 mx-2"></div>

          <button 
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors font-medium"
          >
            <LogOut className={`w-5 h-5 ${language === 'ar' ? 'ml-3' : 'mr-3'}`} />
            <span>{t('logout')}</span>
          </button>
        </div>

        {/* Fixed Footer */}
        <div className="shrink-0 p-4 border-t border-gray-100 bg-gray-50/50">
          <p className="text-center text-[10px] text-gray-400 font-medium mb-0.5">
            {t('developed_by')}
          </p>
          <p className="text-center text-xs font-bold text-emerald-700/80 dir-ltr tracking-wider">
            AOMAR AITLOUTOU
          </p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
