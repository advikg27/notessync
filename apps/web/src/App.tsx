import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { HomePage } from './pages/HomePage';
import { EditorPage } from './pages/EditorPage';
import { ModuleListPage } from './pages/ModuleListPage';
import { BuilderPage } from './pages/BuilderPage';
import { CoursesPage } from './pages/CoursesPage';
import { CourseMembersPage } from './pages/CourseMembersPage';
import { SettingsPage } from './pages/SettingsPage';
import { Layout } from './components/Layout';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(10px)',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 0 40px rgba(0, 0, 0, 0.5)',
          },
          success: {
            duration: 3000,
            style: {
              background: 'rgba(16, 185, 129, 0.15)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
            },
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            style: {
              background: 'rgba(239, 68, 68, 0.15)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
            },
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<HomePage />} />
          <Route path="courses" element={<CoursesPage />} />
          <Route path="courses/:courseId/members" element={<CourseMembersPage />} />
          <Route path="modules" element={<ModuleListPage />} />
          <Route path="modules/new" element={<EditorPage />} />
          <Route path="modules/:id" element={<EditorPage />} />
          <Route path="builder" element={<BuilderPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </>
  );
}

export default App;

