import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { Lock, Mail, GraduationCap, ArrowRight, Languages, AlertCircle, Eye, EyeOff, User } from 'lucide-react';

const Login: React.FC = () => {
  const { users, login, schoolSettings, isConnecting } = useData();
  const { t, language, setLanguage, dir } = useLanguage();

  const [identifier, setIdentifier] = useState(''); // Changed from email to identifier
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate API network delay for realism
    setTimeout(() => {
      const input = identifier.trim().toLowerCase();

      // Find user by email OR nationalId OR specific admin username
      const user = users.find(u =>
        (u.email && u.email.toLowerCase() === input) ||
        (u.nationalId && u.nationalId.toLowerCase() === input) ||
        (input === 'aitloutou' && u.id === 'admin_main')
      );

      // Check password strictly
      if (user && user.password === password) {
        login(user.id);
      } else {
        setError(language === 'ar' ? 'بيانات الدخول غير صحيحة' : 'Identifiants incorrects');
        setIsLoading(false);
      }
    }, 1000);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'fr' : 'ar');
    setError('');
  };

  if (isConnecting) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-emerald-900 font-tajawal text-white">
        <div className="relative">
          <div className="w-24 h-24 border-4 border-emerald-400/20 border-t-emerald-400 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <GraduationCap className="w-10 h-10 text-emerald-300 animate-pulse" />
          </div>
        </div>
        <h2 className="mt-8 text-2xl font-bold animate-pulse">
          {language === 'ar' ? 'جاري الاتصال بقاعدة البيانات...' : 'Connexion à la base de données...'}
        </h2>
        <p className="mt-2 text-emerald-200/60 text-sm">
          {language === 'ar' ? 'يرجى الانتظار قليلاً' : 'Veuillez patienter un instant'}
        </p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex ${dir === 'rtl' ? 'flex-row' : 'flex-row-reverse'} bg-white overflow-hidden font-tajawal`} dir={dir}>

      {/* Right Side: Visual & Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-emerald-900 overflow-hidden items-center justify-center">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 transform scale-105 hover:scale-100 transition-transform duration-1000"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/95 via-emerald-800/90 to-emerald-900/95"></div>

        {/* Content */}
        <div className="relative z-10 text-white p-12 text-center max-w-xl">
          <div className="bg-white/10 p-6 rounded-3xl backdrop-blur-md border border-white/10 shadow-2xl mb-8 inline-block animate-float">
            <GraduationCap className="w-20 h-20 text-emerald-300 mx-auto" />
          </div>
          <h1 className="text-4xl font-bold mb-6 tracking-wide">{schoolSettings.institutionName}</h1>
          <p className="text-emerald-100 text-lg mb-10 leading-relaxed font-light opacity-90">
            نظام رقمي متكامل يجمع بين الإدارة التربوية، الرعاية الصحية، والتتبع السلوكي لضمان بيئة تعليمية متميزة.
          </p>

          <div className="grid grid-cols-3 gap-4 text-xs font-medium text-emerald-200 border-t border-emerald-700/50 pt-8">
            <div className="flex flex-col items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
              <span>إدارة ذكية</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
              <span>تتبع دقيق</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
              <span>رعاية شاملة</span>
            </div>
          </div>
        </div>
      </div>

      {/* Left Side: Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 md:p-12 bg-gray-50 relative">

        {/* Language Switcher */}
        <button
          onClick={toggleLanguage}
          className="absolute top-6 right-6 lg:left-6 lg:right-auto flex items-center gap-2 text-gray-500 hover:text-emerald-600 font-bold text-sm bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200 transition-all hover:shadow-md"
        >
          <Languages className="w-4 h-4" />
          {language === 'ar' ? 'Français' : 'العربية'}
        </button>

        <div className="w-full max-w-md bg-white p-8 md:p-10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-3">{t('login_title')}</h2>
            <p className="text-gray-500 text-sm">{t('login_subtitle')}</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-center gap-3 text-sm animate-shake">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                {language === 'ar' ? 'البريد الإلكتروني أو رقم البطاقة الوطنية' : 'Email ou CIN'}
              </label>
              <div className="relative group">
                <User className="absolute top-3.5 right-3 w-5 h-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="name@email.com / AB123456"
                  className="w-full pr-10 pl-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-white transition-all text-gray-900 placeholder-gray-400 hover:border-gray-400"
                  dir="ltr"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-bold text-gray-700">{t('password')}</label>
                <a href="#" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-not-allowed opacity-50" title="يرجى مراجعة الإدارة لاستعادة كلمة المرور">
                  {language === 'ar' ? 'نسيت كلمة المرور؟' : 'Mot de passe oublié ?'}
                </a>
              </div>
              <div className="relative group">
                <Lock className="absolute top-3.5 right-3 w-5 h-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pr-10 pl-12 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-white transition-all text-gray-900 placeholder-gray-400 hover:border-gray-400"
                  dir="ltr"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-3.5 left-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-emerald-700 shadow-lg hover:shadow-emerald-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.98] mt-4"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span className="flex-1 text-center">{t('login_btn')}</span>
                  <div className="bg-emerald-700/30 p-1 rounded-lg">
                    {dir === 'rtl' ? <ArrowRight className="w-5 h-5 rotate-180" /> : <ArrowRight className="w-5 h-5" />}
                  </div>
                </>
              )}
            </button>
          </form>

          {/* Secure Footer */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" />
              اتصال آمن ومحمي 256-bit SSL
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;