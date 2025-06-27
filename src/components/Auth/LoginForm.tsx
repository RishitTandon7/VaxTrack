import React, { useState } from 'react';
import { Stethoscope, Heart, User, Lock, AlertCircle, Settings, Database } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import SignupForm from './SignupForm';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<'doctor' | 'patient'>('patient');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login(email, password);
      if (!result.success) {
        setError(result.error || 'Invalid email or password');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (showSignup) {
    return <SignupForm onBackToLogin={() => setShowSignup(false)} />;
  }

  const demoCredentials = {
    doctor: {
      email: 'sarah.johnson@hospital.com',
      password: 'demo123'
    },
    patient: {
      email: 'parent@example.com',
      password: 'demo123'
    }
  };

  const isDatabaseError = error.includes('database configuration') || 
                         error.includes('Row Level Security') || 
                         error.includes('Database error granting user');

  const isConfigError = error.includes('Missing or invalid');

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            {userType === 'doctor' ? (
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-600 rounded-full blur-lg opacity-30 animate-pulse"></div>
                <div className="relative p-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full shadow-xl">
                  <Stethoscope className="h-12 w-12 text-white" />
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-400 to-purple-600 rounded-full blur-lg opacity-30 animate-pulse"></div>
                <div className="relative p-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full shadow-xl">
                  <Heart className="h-12 w-12 text-white animate-pulse" />
                </div>
              </div>
            )}
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-3">
            VacciTracker
          </h1>
          <p className="text-gray-600 text-lg">
            {userType === 'doctor' 
              ? 'Professional vaccination management' 
              : 'Your child\'s health journey'}
          </p>
        </div>

        {/* User Type Toggle */}
        <div className="relative bg-gray-100 rounded-2xl p-1.5 mb-8 shadow-inner">
          <div className="flex relative">
            <div 
              className={`absolute top-1.5 bottom-1.5 w-1/2 bg-white rounded-xl shadow-lg transition-all duration-300 ease-out ${
                userType === 'patient' ? 'left-1.5' : 'left-1/2 ml-1.5'
              }`}
            />
            <button
              type="button"
              onClick={() => setUserType('patient')}
              className={`relative flex-1 flex items-center justify-center space-x-3 py-4 px-6 rounded-xl transition-all duration-300 ${
                userType === 'patient'
                  ? 'text-purple-600 font-semibold'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Heart className="h-5 w-5" />
              <span>Parent</span>
            </button>
            <button
              type="button"
              onClick={() => setUserType('doctor')}
              className={`relative flex-1 flex items-center justify-center space-x-3 py-4 px-6 rounded-xl transition-all duration-300 ${
                userType === 'doctor'
                  ? 'text-blue-600 font-semibold'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Stethoscope className="h-5 w-5" />
              <span>Doctor</span>
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
          {error && (
            <div className={`flex items-start space-x-3 p-4 rounded-2xl mb-6 border ${
              isConfigError 
                ? 'text-red-700 bg-red-50 border-red-200' 
                : isDatabaseError
                ? 'text-amber-700 bg-amber-50 border-amber-200'
                : 'text-red-600 bg-red-50 border-red-100'
            }`}>
              {isConfigError ? (
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              ) : isDatabaseError ? (
                <Database className="h-5 w-5 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              )}
              <div className="text-sm">
                <div className="font-medium mb-1">
                  {isConfigError 
                    ? 'Configuration Error' 
                    : isDatabaseError 
                    ? 'Database Configuration Issue'
                    : 'Login Failed'}
                </div>
                <div className="leading-relaxed">
                  {error}
                </div>
                {isDatabaseError && (
                  <div className="mt-3 text-xs opacity-75 space-y-1">
                    <div>Common fixes:</div>
                    <div>• Check that all database migration files have been applied</div>
                    <div>• Verify Row Level Security policies are correctly configured</div>
                    <div>• Ensure foreign key constraints are properly set up</div>
                    <div>• Check that auth triggers are enabled</div>
                  </div>
                )}
                {isConfigError && (
                  <div className="mt-2 text-xs opacity-75">
                    Please check your .env file and ensure Supabase environment variables are correctly set.
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Email Address
              </label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`relative w-full py-4 px-6 rounded-2xl font-semibold text-white transition-all duration-300 transform hover:scale-[1.02] focus:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl ${
                userType === 'doctor'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 focus:ring-4 focus:ring-blue-200'
                  : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 focus:ring-4 focus:ring-purple-200'
              } ${isLoading ? 'opacity-70 cursor-not-allowed transform-none' : ''}`}
            >
              {isLoading && (
                <div className="absolute left-6 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                </div>
              )}
              <span className={isLoading ? 'ml-8' : ''}>
                {isLoading ? 'Signing In...' : 'Sign In'}
              </span>
            </button>
          </div>

          {/* Signup Link */}
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setShowSignup(true)}
                className={`font-semibold transition-colors ${
                  userType === 'doctor'
                    ? 'text-blue-600 hover:text-blue-500'
                    : 'text-purple-600 hover:text-purple-500'
                }`}
              >
                Sign up here
              </button>
            </p>
          </div>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 text-center">Demo Credentials</h3>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex justify-between items-center">
                <span className="font-medium">Doctor:</span>
                <span className="font-mono">{demoCredentials.doctor.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Patient:</span>
                <span className="font-mono">{demoCredentials.patient.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Password:</span>
                <span className="font-mono">demo123</span>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;