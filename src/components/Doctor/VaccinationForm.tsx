import React, { useState } from 'react';
import { X, Calendar, Syringe, User, FileText, Camera } from 'lucide-react';
import { Patient, VaccinationRecord } from '../../lib/supabase';
import { useVaccinations } from '../../hooks/useVaccinations';
import { commonVaccines } from '../../data/vaccines';
import { sendWhatsAppNotification } from '../../utils/notifications';
import { useAuth } from '../../hooks/useAuth';

interface VaccinationFormProps {
  patient: Patient;
  onSave: () => void;
  onCancel: () => void;
  record?: VaccinationRecord;
}

const VaccinationForm: React.FC<VaccinationFormProps> = ({
  patient,
  onSave,
  onCancel,
  record
}) => {
  const { user } = useAuth();
  const { addRecord, updateRecord } = useVaccinations(patient.id);
  const [formData, setFormData] = useState({
    vaccineName: record?.vaccine_name || '',
    dateAdministered: record?.date_administered || new Date().toISOString().split('T')[0],
    nextDueDate: record?.next_due_date || '',
    batchNumber: record?.batch_number || '',
    notes: record?.notes || '',
    cardImage: record?.card_image || ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(record?.card_image || null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);
        setFormData(prev => ({ ...prev, cardImage: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);

    try {
      const vaccinationData = {
        patient_id: patient.id,
        vaccine_name: formData.vaccineName,
        date_administered: formData.dateAdministered,
        next_due_date: formData.nextDueDate || undefined,
        batch_number: formData.batchNumber || undefined,
        administered_by: user.name,
        notes: formData.notes || undefined,
        card_image: formData.cardImage || undefined
      };

      if (record) {
        await updateRecord(record.id, vaccinationData);
      } else {
        await addRecord(vaccinationData);
      }

      // Send WhatsApp notification
      try {
        await sendWhatsAppNotification(
          patient.patient_details.parent_phone,
          patient.name,
          formData.vaccineName,
          user.name
        );
      } catch (notificationError) {
        console.log('Notification failed, but record saved successfully');
      }

      onSave();
    } catch (error) {
      console.error('Error saving vaccination record:', error);
      alert('Failed to save vaccination record. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {record ? 'Update' : 'Add'} Vaccination Record
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Patient Info */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500 rounded-xl">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{patient.name}</h3>
                <p className="text-sm text-gray-600">
                  Born: {new Date(patient.patient_details.date_of_birth).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Vaccine Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Vaccine *
            </label>
            <select
              value={formData.vaccineName}
              onChange={(e) => setFormData(prev => ({ ...prev, vaccineName: e.target.value }))}
              className="w-full p-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all"
              required
            >
              <option value="">Select a vaccine</option>
              {commonVaccines.map((vaccine) => (
                <option key={vaccine.name} value={vaccine.name}>
                  {vaccine.name} - {vaccine.description}
                </option>
              ))}
            </select>
          </div>

          {/* Date Administered */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Date Administered *
            </label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="date"
                value={formData.dateAdministered}
                onChange={(e) => setFormData(prev => ({ ...prev, dateAdministered: e.target.value }))}
                className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all"
                required
              />
            </div>
          </div>

          {/* Next Due Date */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Next Due Date (Optional)
            </label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="date"
                value={formData.nextDueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, nextDueDate: e.target.value }))}
                className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Batch Number */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Batch Number (Optional)
            </label>
            <div className="relative">
              <Syringe className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={formData.batchNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, batchNumber: e.target.value }))}
                placeholder="Enter batch number"
                className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Vaccination Card Image */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Vaccination Card Image (Optional)
            </label>
            <div className="space-y-4">
              {imagePreview && (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Vaccination card preview"
                    className="w-full h-48 object-cover rounded-2xl border border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null);
                      setFormData(prev => ({ ...prev, cardImage: '' }));
                    }}
                    className="absolute top-3 right-3 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow-lg"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-blue-400 transition-colors bg-gray-50">
                <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <label className="cursor-pointer">
                  <span className="text-blue-600 hover:text-blue-500 font-semibold text-lg">
                    Click to upload vaccination card
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-sm text-gray-500 mt-2">PNG, JPG up to 10MB</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Notes (Optional)
            </label>
            <div className="relative">
              <FileText className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add any additional notes or observations..."
                rows={4}
                className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-gray-50 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-8 py-3 text-gray-700 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.vaccineName}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold flex items-center space-x-2 shadow-lg"
            >
              {isLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              )}
              <span>{record ? 'Update' : 'Save'} Record</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VaccinationForm;