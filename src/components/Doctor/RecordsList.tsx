import React, { useState } from 'react';
import { VaccinationRecord, Patient, Doctor } from '../../lib/supabase';
import { Calendar, FileText, Edit, Trash2, Download, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useVaccinations } from '../../hooks/useVaccinations';
import { exportVaccinationRecordsPDF } from '../../utils/pdfExport';
import { useAuth } from '../../hooks/useAuth';
import VaccinationForm from './VaccinationForm';

interface RecordsListProps {
  records: VaccinationRecord[];
  patient: Patient;
  loading: boolean;
  onRecordUpdate: () => void;
}

const RecordsList: React.FC<RecordsListProps> = ({ records, patient, loading, onRecordUpdate }) => {
  const { user } = useAuth();
  const { deleteRecord } = useVaccinations(patient.id);
  const [editingRecord, setEditingRecord] = useState<VaccinationRecord | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleDelete = async (recordId: string) => {
    if (window.confirm('Are you sure you want to delete this vaccination record?')) {
      try {
        await deleteRecord(recordId);
        onRecordUpdate();
      } catch (error) {
        console.error('Error deleting record:', error);
      }
    }
  };

  const handleExportPDF = () => {
    if (user?.role === 'doctor') {
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

      const formattedDoctor = user as Doctor;
      const doctorForPDF = {
        id: formattedDoctor.id,
        name: formattedDoctor.name,
        email: formattedDoctor.email,
        role: formattedDoctor.role as 'doctor',
        license: formattedDoctor.doctor_details.license,
        specialization: formattedDoctor.doctor_details.specialization,
        clinic: formattedDoctor.doctor_details.clinic
      };

      exportVaccinationRecordsPDF(formattedPatient, formattedRecords, doctorForPDF);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading records...</span>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No vaccination records</h3>
        <p className="text-gray-500">Add the first vaccination record for this patient.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">
            {records.length} Vaccination Record{records.length !== 1 ? 's' : ''}
          </h3>
          <button
            onClick={handleExportPDF}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export PDF</span>
          </button>
        </div>

        <div className="grid gap-4">
          {records.map((record) => (
            <div key={record.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">{record.vaccine_name}</h4>
                  <div className="flex items-center text-sm text-gray-600 mt-1">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>Administered: {format(new Date(record.date_administered), 'MMMM dd, yyyy')}</span>
                  </div>
                  {record.next_due_date && (
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>Next due: {format(new Date(record.next_due_date), 'MMMM dd, yyyy')}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {record.card_image && (
                    <button
                      onClick={() => setImagePreview(record.card_image!)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      title="View vaccination card"
                    >
                      <ImageIcon className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setEditingRecord(record)}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                    title="Edit record"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(record.id)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    title="Delete record"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Administered by:</span>
                  <p className="text-gray-600">{record.administered_by}</p>
                </div>
                
                {record.batch_number && (
                  <div>
                    <span className="font-medium text-gray-700">Batch number:</span>
                    <p className="text-gray-600">{record.batch_number}</p>
                  </div>
                )}
              </div>

              {record.notes && (
                <div className="mt-4">
                  <span className="font-medium text-gray-700 text-sm">Notes:</span>
                  <p className="text-gray-600 text-sm mt-1">{record.notes}</p>
                </div>
              )}

              <div className="mt-4 text-xs text-gray-500">
                Last updated: {format(new Date(record.updated_at), 'MMM dd, yyyy HH:mm')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Form Modal */}
      {editingRecord && (
        <VaccinationForm
          patient={patient}
          record={editingRecord}
          onSave={() => {
            setEditingRecord(null);
            onRecordUpdate();
          }}
          onCancel={() => setEditingRecord(null)}
        />
      )}

      {/* Image Preview Modal */}
      {imagePreview && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setImagePreview(null)}
              className="absolute top-4 right-4 bg-white text-gray-800 rounded-full p-2 hover:bg-gray-100 transition-colors z-10"
            >
              <span className="sr-only">Close</span>
              ×
            </button>
            <img
              src={imagePreview}
              alt="Vaccination card"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default RecordsList;