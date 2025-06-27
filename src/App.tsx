import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { testDatabaseConnection } from './lib/supabase';
import Header from './components/Layout/Header';
import LoginForm from './components/Auth/LoginForm';
import DoctorDashboard from './components/Doctor/DoctorDashboard';
import PatientDashboard from './components/Patient/PatientDashboard';
import { requestNotificationPermission } from './utils/notifications';
import { Database, AlertTriangle, CheckCircle, X } from 'lucide-react';

function App() {
  const { user, loading, isAuthenticated, isDoctor, isPatient } = useAuth();
  const [dbConnectionStatus, setDbConnectionStatus] = useState<{
    tested: boolean;
    success: boolean;
    error?: string;
  }>({ tested: false, success: false });
  const [showDbAlert, setShowDbAlert] = useState(false);

  useEffect(() => {
    // Test database connection on app load
    const testConnection = async () => {
      console.log('🔍 Testing database connection...');
      
      try {
        const result = await testDatabaseConnection();
        
        setDbConnectionStatus({
          tested: true,
          success: result.success,
          error: result.error
        });

        if (result.success) {
          console.log('✅ Database connection successful');
        } else {
          console.error('❌ Database connection failed:', result.error);
          setShowDbAlert(true);
        }
      } catch (error) {
        console.error('❌ Database connection test error:', error);
        setDbConnectionStatus({
          tested: true,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown connection error'
        });
        setShowDbAlert(true);
      }
    };

    testConnection();

    // Request notification permission on app load
    requestNotificationPermission();
  }, []);

  if (loading || !dbConnectionStatus.tested) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-600 opacity-20 animate-pulse"></div>
          </div>
          <p className="text-gray-600 font-medium">
            {!dbConnectionStatus.tested ? 'Connecting to database...' : 'Loading application...'}
          </p>
          {dbConnectionStatus.tested && !dbConnectionStatus.success && (
            <p className="text-red-600 text-sm mt-2">
              Database connection issues detected
            </p>
          )}
        </div>
      </div>
    );
  }

  // Show database connection alert if there are issues
  const DatabaseAlert = () => {
    if (!showDbAlert || dbConnectionStatus.success) return null;

    return (
      <div className="fixed top-4 right-4 z-50 max-w-md">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 shadow-lg">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-red-800 font-semibold mb-1">Database Connection Issue</h3>
              <p className="text-red-700 text-sm mb-2">
                {dbConnectionStatus.error || 'Unable to connect to the database'}
              </p>
              <p className="text-red-600 text-xs">
                Check the console for detailed error information.
              </p>
            </div>
            <button
              onClick={() => setShowDbAlert(false)}
              className="text-red-400 hover:text-red-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Show success indicator briefly if connection is successful
  const DatabaseSuccessAlert = () => {
    const [showSuccess, setShowSuccess] = useState(true);

    useEffect(() => {
      if (dbConnectionStatus.success) {
        const timer = setTimeout(() => setShowSuccess(false), 3000);
        return () => clearTimeout(timer);
      }
    }, []);

    if (!showSuccess || !dbConnectionStatus.success) return null;

    return (
      <div className="fixed top-4 right-4 z-50 max-w-md">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
            <div>
              <h3 className="text-green-800 font-semibold">Database Connected</h3>
              <p className="text-green-700 text-sm">Successfully connected to Supabase</p>
            </div>
            <button
              onClick={() => setShowSuccess(false)}
              className="text-green-400 hover:text-green-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (!isAuthenticated) {
    return (
      <>
        <LoginForm />
        <DatabaseAlert />
        <DatabaseSuccessAlert />
      </>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Routes>
          <Route 
            path="/" 
            element={
              isDoctor ? (
                <DoctorDashboard />
              ) : isPatient ? (
                <PatientDashboard />
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <DatabaseAlert />
        <DatabaseSuccessAlert />
      </div>
    </Router>
  );
}

export default App;