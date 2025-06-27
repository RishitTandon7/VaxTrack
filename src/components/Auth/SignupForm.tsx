import React, { useState } from 'react';
import { Stethoscope, Heart, User, Lock, AlertCircle, Mail, ArrowLeft, Calendar, Phone, Settings, LogIn } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface SignupFormProps {
  onBackToLogin: () => void;
}

const SignupForm: React.FC<SignupFormProps> = ({ onBackToLogin }) => {
  const [userType, setUserType] = useState<'doctor' | 'patient'>('patient');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signup } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    // Doctor fields
    specialization: '',
    clinic: '',
    // Patient fields
    dateOfBirth: '',
    parentName: '',
    parentPhone: ''
  });

  const validateForm = (): string | null => {
    if (!formData.name.trim()) return 'Name is required';
    if (!formData.email.trim()) return 'Email is required';
    if (!formData.email.includes('@')) return 'Please enter a valid email';
    if (formData.password.length < 6) return 'Password must be at least 6 characters';
    
    if (userType === 'doctor') {
      if (!formData.specialization.trim()) return 'Specialization is required';
      if (!formData.clinic.trim()) return 'Clinic name is required';
    } else {
      if (!formData.dateOfBirth) return 'Date of birth is required';
      if (!formData.parentName.trim()) return 'Parent/Guardian name is required';
      if (!formData.parentPhone.trim()) return 'Parent/Guardian phone is required';
    }
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      const userData = {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: userType,
        ...(userType === 'doctor' ? {
          doctorDetails: {
            license: 'AUTO-GENERATED', // Auto-generate license
            specialization: formData.specialization,
            clinic: formData.clinic
          }
        } : {
          patientDetails: {
            dateOfBirth: formData.dateOfBirth,
            parentName: formData.parentName,
            parentPhone: formData.parentPhone
          }
        })
      };

      const result = await signup(userData);
      if (!result.success) {
        setError(result.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isEmailDisabledError = error.includes('Email registration is currently disabled');
  const isUserExistsError = error.includes('User already registered') || error.includes('user_already_exists');

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
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
            Join VacciTracker
          </h1>
          <p className="text-gray-600 text-lg">
            {userType === 'doctor' 
              ? 'Create your professional account' 
              : 'Register your child\'s health profile'}
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

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
          {error && (
            <div className={`flex items-start space-x-3 p-4 rounded-2xl mb-6 border ${
              isEmailDisabledError 
                ? 'text-amber-700 bg-amber-50 border-amber-200' 
                : isUserExistsError
                ? 'text-blue-700 bg-blue-50 border-blue-200'
                : 'text-red-600 bg-red-50 border-red-100'
            }`}>
              {isEmailDisabledError ? (
                <Settings className="h-5 w-5 flex-shrink-0 mt-0.5" />
              ) : isUserExistsError ? (
                <LogIn className="h-5 w-5 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              )}
              <div className="text-sm">
                <div className="font-medium mb-1">
                  {isEmailDisabledError 
                    ? 'Configuration Required' 
                    : isUserExistsError 
                    ? 'Account Already Exists'
                    : 'Registration Error'}
                </div>
                <div className="leading-relaxed">
                  {isUserExistsError 
                    ? 'An account with this email address already exists. Please use a different email or sign in to your existing account.'
                    : error}
                </div>
                {isEmailDisabledError && (
                  <div className="mt-2 text-xs opacity-75">
                    To fix this, go to your Supabase project dashboard → Authentication → Providers and enable Email authentication.
                  </div>
                )}
                {isUserExistsError && (
                  <button
                    type="button"
                    onClick={onBackToLogin}
                    className="mt-3 inline-flex items-center space-x-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>Sign in instead</span>
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* Common Fields */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Full Name *
              </label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                  placeholder="Enter your full name"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Email Address *
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Password *
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                  placeholder="Create a secure password"
                  required
                />
              </div>
            </div>

            {/* Doctor-specific fields */}
            {userType === 'doctor' && (
              <>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Specialization *
                  </label>
                  <select
                    value={formData.specialization}
                    onChange={(e) => setFormData(prev => ({ ...prev, specialization: e.target.value }))}
                    className="w-full px-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                    required
                  >
                    <option value="">Select your specialization</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="General Practice">General Practice</option>
                    <option value="Family Medicine">Family Medicine</option>
                    <option value="Internal Medicine">Internal Medicine</option>
                    <option value="Immunology">Immunology</option>
                    <option value="Public Health">Public Health</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Clinic/Hospital *
                  </label>
                  <input
                    type="text"
                    value={formData.clinic}
                    onChange={(e) => setFormData(prev => ({ ...prev, clinic: e.target.value }))}
                    className="w-full px-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                    placeholder="Enter clinic or hospital name"
                    required
                  />
                </div>
              </>
            )}

            {/* Patient-specific fields */}
            {userType === 'patient' && (
              <>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Child's Date of Birth *
                  </label>
                  <div className="relative group">
                    <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                      className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Parent/Guardian Name *
                  </label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                    <input
                      type="text"
                      value={formData.parentName}
                      onChange={(e) => setFormData(prev => ({ ...prev, parentName: e.target.value }))}
                      className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                      placeholder="Enter parent/guardian name"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Parent/Guardian Phone *
                  </label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                    <input
                      type="tel"
                      value={formData.parentPhone}
                      onChange={(e) => setFormData(prev => ({ ...prev, parentPhone: e.target.value }))}
                      className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                      placeholder="Enter phone number"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {/* Form Actions */}
            <div className="flex flex-col space-y-4 pt-6">
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
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </span>
              </button>

              <button
                type="button"
                onClick={onBackToLogin}
                className="flex items-center justify-center space-x-2 w-full py-4 px-6 text-gray-600 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-all duration-300 font-medium"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Login</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignupForm;