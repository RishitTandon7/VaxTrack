import React, { useState } from 'react';
import { Plus, Users, FileText, Calendar, Search, QrCode, Camera, Sparkles, TrendingUp } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { usePatients } from '../../hooks/usePatients';
import { useVaccinations } from '../../hooks/useVaccinations';
import { Doctor, Patient } from '../../lib/supabase';
import PatientList from './PatientList';
import VaccinationForm from './VaccinationForm';
import RecordsList from './RecordsList';
import QRCodeGenerator from './QRCodeGenerator';
import CardScanner from './CardScanner';

const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();
  const doctor = user as Doctor;
  const { patients, loading: patientsLoading } = usePatients(doctor?.id);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const { records, loading: recordsLoading, refetch: refetchRecords } = useVaccinations(selectedPatient?.id);
  
  const [showVaccinationForm, setShowVaccinationForm] = useState(false);
  const [showQRGenerator, setShowQRGenerator] = useState(false);
  const [showCardScanner, setShowCardScanner] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'patients' | 'records'>('patients');

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setActiveTab('records');
  };

  const handleVaccinationSaved = () => {
    setShowVaccinationForm(false);
    refetchRecords();
  };

  const handleCardScanned = () => {
    setShowCardScanner(false);
    setShowVaccinationForm(true);
  };

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.patient_details.parent_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRecords = patients.reduce((acc, patient) => {
    return acc + records.length;
  }, 0);

  const stats = {
    totalPatients: patients.length,
    totalRecords,
    upcomingVaccinations: 0
  };

  if (patientsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-600 opacity-20 animate-pulse"></div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-8 mb-8 text-white overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full -ml-24 -mb-24"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                    <Sparkles className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold">Welcome back, Dr. {doctor?.name?.split(' ')[0]}!</h1>
                    <p className="text-blue-100 text-lg">Ready to make a difference in children's health today</p>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-green-300" />
                    <span className="font-semibold">{stats.totalPatients} Active Patients</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-yellow-300" />
                    <span>{stats.totalRecords} Records Managed</span>
                  </div>
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="relative">
                  <div className="absolute inset-0 bg-white/20 rounded-full blur-xl"></div>
                  <div className="relative p-6 bg-white/10 rounded-full backdrop-blur-sm">
                    <FileText className="h-16 w-16 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="group relative bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity"></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Patients</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalPatients}</p>
                  <p className="text-sm text-green-600 font-medium mt-1">Active & Growing</p>
                </div>
                <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                  <Users className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="group relative bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity"></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Records</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalRecords}</p>
                  <p className="text-sm text-green-600 font-medium mt-1">Safely Stored</p>
                </div>
                <div className="p-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-lg">
                  <FileText className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="group relative bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity"></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Due Soon</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.upcomingVaccinations}</p>
                  <p className="text-sm text-orange-600 font-medium mt-1">Upcoming</p>
                </div>
                <div className="p-4 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl shadow-lg">
                  <Calendar className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Sparkles className="h-6 w-6 text-purple-600 mr-2" />
            Quick Actions
          </h3>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setShowQRGenerator(true)}
              className="group flex items-center space-x-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-4 rounded-2xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <QrCode className="h-5 w-5 group-hover:rotate-12 transition-transform" />
              <span className="font-semibold">Generate Patient QR Code</span>
            </button>
            <button
              onClick={() => setShowCardScanner(true)}
              className="group flex items-center space-x-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-2xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <Camera className="h-5 w-5 group-hover:scale-110 transition-transform" />
              <span className="font-semibold">Scan Vaccination Card</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 mb-8 bg-white rounded-t-2xl px-6">
          <button
            onClick={() => setActiveTab('patients')}
            className={`relative px-6 py-4 font-semibold text-sm transition-all duration-300 ${
              activeTab === 'patients'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>My Patients</span>
            {activeTab === 'patients' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('records')}
            disabled={!selectedPatient}
            className={`relative px-6 py-4 font-semibold text-sm transition-all duration-300 ${
              activeTab === 'records' && selectedPatient
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            } ${!selectedPatient ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span>{selectedPatient ? `${selectedPatient.name}'s Records` : 'Vaccination Records'}</span>
            {activeTab === 'records' && selectedPatient && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
            )}
          </button>
        </div>

        {/* Content */}
        {activeTab === 'patients' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">My Patients</h2>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search patients..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-12 pr-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
            <PatientList
              patients={filteredPatients}
              onPatientSelect={handlePatientSelect}
              selectedPatient={selectedPatient}
            />
          </div>
        )}

        {activeTab === 'records' && selectedPatient && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Vaccination Records - {selectedPatient.name}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Born: {new Date(selectedPatient.patient_details.date_of_birth).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowCardScanner(true)}
                    className="group flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-3 rounded-2xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    <Camera className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    <span className="font-semibold">Scan Card</span>
                  </button>
                  <button
                    onClick={() => setShowVaccinationForm(true)}
                    className="group flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-3 rounded-2xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform" />
                    <span className="font-semibold">Add Vaccination</span>
                  </button>
                </div>
              </div>
              
              <RecordsList
                records={records}
                patient={selectedPatient}
                loading={recordsLoading}
                onRecordUpdate={refetchRecords}
              />
            </div>
          </div>
        )}

        {/* Modals */}
        {showQRGenerator && (
          <QRCodeGenerator
            doctorId={doctor?.id || ''}
            onClose={() => setShowQRGenerator(false)}
          />
        )}

        {showCardScanner && (
          <CardScanner
            onCardScanned={handleCardScanned}
            onClose={() => setShowCardScanner(false)}
            selectedPatient={selectedPatient}
          />
        )}

        {showVaccinationForm && selectedPatient && (
          <VaccinationForm
            patient={selectedPatient}
            onSave={handleVaccinationSaved}
            onCancel={() => setShowVaccinationForm(false)}
          />
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;