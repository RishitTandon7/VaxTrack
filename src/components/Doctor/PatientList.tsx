import React from 'react';
import { Patient } from '../../lib/supabase';
import { User, Phone, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface PatientListProps {
  patients: Patient[];
  onPatientSelect: (patient: Patient) => void;
  selectedPatient: Patient | null;
}

const PatientList: React.FC<PatientListProps> = ({
  patients,
  onPatientSelect,
  selectedPatient
}) => {
  if (patients.length === 0) {
    return (
      <div className="p-8 text-center">
        <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No patients found</h3>
        <p className="text-gray-500">You don't have any patients assigned yet.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {patients.map((patient) => (
        <div
          key={patient.id}
          onClick={() => onPatientSelect(patient)}
          className={`p-6 cursor-pointer transition-colors ${
            selectedPatient?.id === patient.id
              ? 'bg-blue-50 border-l-4 border-blue-500'
              : 'hover:bg-gray-50'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div className="bg-blue-100 rounded-full p-3">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{patient.name}</h3>
                <div className="mt-1 space-y-1">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Born: {format(new Date(patient.patient_details.date_of_birth), 'MMMM dd, yyyy')}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="h-4 w-4 mr-2" />
                    <span>Parent: {patient.patient_details.parent_name}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    <span>{patient.patient_details.parent_phone}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Active
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PatientList;