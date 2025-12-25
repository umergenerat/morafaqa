
import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import StudentList from './pages/StudentList';
import Attendance from './pages/Attendance';
import Health from './pages/Health';
import UserManagement from './pages/UserManagement';
import Dining from './pages/Dining';
import Login from './pages/Login';
import Settings from './pages/Settings';
import Activities from './pages/Activities';
import Academics from './pages/Academics';
import Maintenance from './pages/Maintenance'; 
import Behavior from './pages/Behavior'; // New
import SaveControls from './components/SaveControls';
import { DataProvider, useData } from './context/DataContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';

// Protected Layout Component
const MainLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { currentUser, isAuthenticated } = useData();
  const { dir } = useLanguage();

  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className={`flex min-h-screen bg-gray-50 ${dir === 'rtl' ? 'font-sans' : 'font-sans'} ${dir}`} dir={dir}>
      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
      />

      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 relative">
        <Header 
          user={currentUser} 
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
        />

        <main className="flex-1 p-4 lg:p-8 overflow-y-auto pb-24">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/students" element={<StudentList />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/health" element={<Health />} />
            <Route path="/behavior" element={<Behavior />} /> 
            <Route path="/dining" element={<Dining />} />
            <Route path="/activities" element={<Activities />} /> 
            <Route path="/academics" element={<Academics />} />
            <Route path="/maintenance" element={<Maintenance />} /> 
            <Route path="/users" element={<UserManagement />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Floating Save Controls */}
        <SaveControls />
      </div>
    </div>
  );
};

const AppRoutes = () => {
  const { isAuthenticated } = useData();
  
  return (
    <Router>
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" replace />} />
        <Route path="/*" element={<MainLayout />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <LanguageProvider>
      <DataProvider>
        <AppRoutes />
      </DataProvider>
    </LanguageProvider>
  );
}

export default App;
