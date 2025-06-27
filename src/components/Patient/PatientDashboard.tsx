import React, { useState, useEffect } from 'react';
import { VaccinationRecord, Patient } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useVaccinations } from '../../hooks/useVaccinations';
import { Heart, Star, Download, Calendar, Syringe, Trophy, Gift, UserPlus, Sparkles, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { exportVaccinationRecordsPDF } from '../../utils/pdfExport';
import ConnectToDoctor from './ConnectToDoctor';

const PatientDashboard: React.FC = () => {
  const { user } = useAuth();
  const patient = user as Patient;
  const { records, loading: recordsLoading, refetch: refetchRecords } = useVaccinations(patient?.id);
  const [showConnectModal, setShowConnectModal] = useState(false);

  const handleExportPDF = () => {
    if (patient && records.length > 0) {
      // Convert VaccinationRecord[] to the format expected by exportVaccinationRecordsPDF
      const formattedRecords = records.map(record => ({
        id: record.id,
        patientId: record.patient_id,
        vaccineName: record.vaccine_name,
        dateAdministered: record.date_administered,
        nextDueDate: record.next_due_date,
        batchNumber: record.batch_number,
        administeredBy: record.administered_by,
        notes: record.notes,
        cardImage: record.card_image,
        createdAt: record.created_at,
        updatedAt: record.updated_at
      }));

      const formattedPatient = {
        id: patient.id,
        name: patient.name,
        email: patient.email,
        role: patient.role as 'patient',
        dateOfBirth: patient.patient_details.date_of_birth,
        parentName: patient.patient_details.parent_name,
        parentPhone: patient.patient_details.parent_phone,
        doctorId: patient.patient_details.doctor_id || ''
      };

      exportVaccinationRecordsPDF(formattedPatient, formattedRecords);
    }
  };

  const handleDoctorConnected = () => {
    setShowConnectModal(false);
    refetchRecords();
    window.location.reload();
  };

  const upcomingVaccinations = records.filter(record => 
    record.next_due_date && new Date(record.next_due_date) > new Date()
  );

  const completedVaccinations = records.length;
  const achievements = Math.floor(completedVaccinations / 3);

  const needsDoctorConnection = !patient?.patient_details?.doctor_id;

  if (recordsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mx-auto"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-400 to-purple-600 opacity-20 animate-pulse"></div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Loading your health records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Doctor Connection Alert */}
        {needsDoctorConnection && (
          <div className="relative bg-gradient-to-r from-yellow-400 to-orange-500 rounded-3xl p-6 mb-8 text-white overflow-hidden">
            <div className="absolute inset-0 bg-black opacity-10"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-20 rounded-full -mr-16 -mt-16"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                    <UserPlus className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Connect to Your Doctor</h3>
                    <p className="text-yellow-100">
                      Get your connection code from your doctor to link your vaccination records
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowConnectModal(true)}
                  className="bg-white text-orange-600 px-6 py-3 rounded-2xl hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 font-semibold shadow-lg"
                >
                  Connect Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Welcome Header */}
        <div className="relative bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 rounded-3xl p-8 mb-8 text-white overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full -ml-24 -mb-24"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                    <Heart className="h-8 w-8 text-white animate-pulse" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold">
                      Hi {patient?.name?.split(' ')[0]}! 👋
                    </h1>
                    <p className="text-pink-100 text-lg">
                      You're doing amazing keeping your health up to date! 
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <Trophy className="h-6 w-6 text-yellow-300" />
                    <span className="font-semibold">{achievements} Health Stars!</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Shield className="h-6 w-6 text-green-300" />
                    <span>{completedVaccinations} Shots Complete</span>
                  </div>
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="relative">
                  <div className="absolute inset-0 bg-white/20 rounded-full blur-xl"></div>
                  <div className="relative p-6 bg-white/10 rounded-full backdrop-blur-sm">
                    <Syringe className="h-16 w-16 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="group relative bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity"></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Vaccinations</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">{completedVaccinations}</p>
                  <p className="text-sm text-green-600 font-medium mt-1">Protected & Safe</p>
                </div>
                <div className="p-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl shadow-lg">
                  <Syringe className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="group relative bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity"></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Health Stars</p>
                  <p className="text-3xl font-bold text-yellow-600 mt-1">{achievements}</p>
                  <p className="text-sm text-yellow-600 font-medium mt-1">Keep Collecting!</p>
                </div>
                <div className="p-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl shadow-lg">
                  <Star className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="group relative bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-500 rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity"></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Coming Up</p>
                  <p className="text-3xl font-bold text-purple-600 mt-1">{upcomingVaccinations.length}</p>
                  <p className="text-sm text-purple-600 font-medium mt-1">Stay Ready</p>
                </div>
                <div className="p-4 bg-gradient-to-r from-purple-400 to-pink-500 rounded-2xl shadow-lg">
                  <Calendar className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Vaccinations */}
        {upcomingVaccinations.length > 0 && (
          <div className="relative bg-gradient-to-r from-yellow-400 to-orange-500 rounded-3xl p-6 mb-8 text-white overflow-hidden">
            <div className="absolute inset-0 bg-black opacity-10"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-20 rounded-full -mr-16 -mt-16"></div>
            <div className="relative z-10">
              <div className="flex items-center space-x-3 mb-4">
                <Calendar className="h-6 w-6 text-white" />
                <h2 className="text-xl font-bold">Coming Up Soon! 🗓️</h2>
              </div>
              <div className="space-y-3">
                {upcomingVaccinations.map((record) => (
                  <div key={record.id} className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-white">{record.vaccine_name}</h3>
                        <p className="text-yellow-100">
                          Due: {format(new Date(record.next_due_date!), 'MMMM dd, yyyy')}
                        </p>
                      </div>
                      <div className="bg-yellow-300 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                        Reminder
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Vaccination History */}
        <div className="bg-white rounded-3xl shadow-lg overflow-hidden mb-8 border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">My Vaccination Journey 🌟</h2>
              </div>
              {records.length > 0 && (
                <button
                  onClick={handleExportPDF}
                  className="group flex items-center space-x-2 bg-gradient-to-r from-green-400 to-emerald-500 text-white px-6 py-3 rounded-2xl hover:from-green-500 hover:to-emerald-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  <Download className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  <span className="font-semibold">Download Report</span>
                </button>
              )}
            </div>
          </div>

          {records.length === 0 ? (
            <div className="p-12 text-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-400 to-purple-600 rounded-full blur-xl opacity-20"></div>
                <div className="relative p-6 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full mx-auto w-fit">
                  <Heart className="h-16 w-16 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Your health journey starts here!</h3>
              <p className="text-gray-500 mb-6">
                {needsDoctorConnection 
                  ? 'Connect to your doctor to start tracking your vaccination records.'
                  : 'Your vaccination records will appear here once your doctor adds them.'
                }
              </p>
              {needsDoctorConnection && (
                <button
                  onClick={() => setShowConnectModal(true)}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-3 rounded-2xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 font-semibold shadow-lg"
                >
                  Connect to Doctor
                </button>
              )}
            </div>
          ) : (
            <div className="p-6">
              <div className="space-y-6">
                {records.map((record, index) => (
                  <div key={record.id} className="relative">
                    {index < records.length - 1 && (
                      <div className="absolute left-8 top-20 w-0.5 h-12 bg-gradient-to-b from-pink-400 to-purple-600"></div>
                    )}
                    
                    <div className="flex items-start space-x-4">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-pink-400 to-purple-600 rounded-full blur-lg opacity-30"></div>
                        <div className="relative p-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full shadow-lg">
                          <Syringe className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      
                      <div className="flex-1 bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-6 shadow-sm border border-pink-100">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-bold text-gray-900">{record.vaccine_name}</h3>
                          <div className="flex items-center space-x-2">
                            <div className="p-1 bg-yellow-400 rounded-full">
                              <Gift className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-sm font-medium text-yellow-600">+1 Health Star!</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-pink-500" />
                            <span className="text-gray-600">
                              Given on {format(new Date(record.date_administered), 'MMMM dd, yyyy')}
                            </span>
                          </div>
                          
                          {record.next_due_date && (
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-purple-500" />
                              <span className="text-gray-600">
                                Next: {format(new Date(record.next_due_date), 'MMMM dd, yyyy')}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-3 text-sm text-gray-600">
                          <span className="font-medium">Doctor:</span> {record.administered_by}
                        </div>
                        
                        {record.notes && (
                          <div className="mt-3 p-3 bg-white rounded-xl border border-pink-200">
                            <span className="font-medium text-gray-700 text-sm">Doctor's notes:</span>
                            <p className="text-gray-600 text-sm mt-1">{record.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Connect to Doctor Modal */}
        {showConnectModal && (
          <ConnectToDoctor
            onConnected={handleDoctorConnected}
            onCancel={() => setShowConnectModal(false)}
          />
        )}
      </div>
    </div>
  );
};

export default PatientDashboard;