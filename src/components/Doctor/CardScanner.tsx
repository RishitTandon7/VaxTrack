import React, { useState, useRef } from 'react';
import { X, Camera, Upload, FileText, Calendar, Syringe, AlertTriangle, Info } from 'lucide-react';
import { Patient } from '../../lib/supabase';
import { useVaccinations } from '../../hooks/useVaccinations';
import { useAuth } from '../../hooks/useAuth';

interface CardScannerProps {
  onCardScanned: (data: any) => void;
  onClose: () => void;
  selectedPatient: Patient | null;
}

const CardScanner: React.FC<CardScannerProps> = ({ onCardScanned, onClose, selectedPatient }) => {
  const { user } = useAuth();
  const { addRecord } = useVaccinations(selectedPatient?.id);
  const [scannedImage, setScannedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualEntry, setManualEntry] = useState({
    vaccineName: '',
    dateAdministered: '',
    nextDueDate: '',
    batchNumber: '',
    notes: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Enhanced mock processing that simulates real OCR but clearly indicates it's for demonstration
  const processCardImage = async (imageData: string) => {
    setIsProcessing(true);
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Clear indication that this is simulated data for demonstration
    const mockData = {
      vaccineName: '', // Leave empty to force manual entry
      dateAdministered: new Date().toISOString().split('T')[0],
      batchNumber: '',
      notes: '⚠️ DEMO: Please manually verify and enter accurate vaccination details from the card'
    };
    
    setManualEntry(mockData);
    setIsProcessing(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setScannedImage(result);
        processCardImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveRecord = async () => {
    if (!selectedPatient || !user || !manualEntry.vaccineName || !manualEntry.dateAdministered) {
      alert('Please fill in all required fields (Vaccine Name and Date Administered)');
      return;
    }

    try {
      const recordData = {
        patient_id: selectedPatient.id,
        vaccine_name: manualEntry.vaccineName,
        date_administered: manualEntry.dateAdministered,
        next_due_date: manualEntry.nextDueDate || undefined,
        batch_number: manualEntry.batchNumber || undefined,
        administered_by: user.name,
        notes: manualEntry.notes || undefined,
        card_image: scannedImage || undefined
      };

      await addRecord(recordData);
      onCardScanned(recordData);
    } catch (error) {
      console.error('Error saving record:', error);
      alert('Failed to save record. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Document Vaccination Record</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Important Notice */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-800 mb-2">Important: Manual Data Entry Required</h3>
                <p className="text-sm text-yellow-700">
                  This system requires you to manually enter vaccination details for accuracy. 
                  While you can upload an image for reference, please carefully input all information 
                  by reading from the vaccination card or your records.
                </p>
              </div>
            </div>
          </div>

          {!scannedImage ? (
            <div className="text-center">
              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-12 hover:border-blue-400 transition-colors bg-gray-50">
                <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Upload Vaccination Card Image (Optional)
                </h3>
                <p className="text-gray-500 mb-6">
                  Upload an image for reference, then manually enter the vaccination details below
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-4 rounded-2xl hover:from-blue-600 hover:to-indigo-700 transition-all mx-auto font-semibold shadow-lg"
                >
                  <Upload className="h-5 w-5" />
                  <span>Choose Image (Optional)</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <p className="text-xs text-gray-500 mt-3">
                  You can also proceed directly to manual entry below
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Reference Image */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Info className="h-5 w-5 text-blue-600 mr-2" />
                  Reference Image
                </h3>
                <div className="border border-gray-200 rounded-2xl overflow-hidden">
                  <img
                    src={scannedImage}
                    alt="Vaccination card reference"
                    className="w-full h-64 object-cover"
                  />
                </div>
                <button
                  onClick={() => {
                    setScannedImage(null);
                    setManualEntry({
                      vaccineName: '',
                      dateAdministered: '',
                      nextDueDate: '',
                      batchNumber: '',
                      notes: ''
                    });
                  }}
                  className="mt-3 text-sm text-blue-600 hover:text-blue-500 font-medium"
                >
                  Upload different image
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  Use this image as reference while entering data manually
                </p>
              </div>

              {/* Manual Data Entry */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {isProcessing ? 'Preparing Form...' : 'Enter Vaccination Details'}
                </h3>
                
                {isProcessing ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Preparing form...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedPatient && (
                      <div className="bg-blue-50 rounded-2xl p-4 mb-4 border border-blue-200">
                        <h4 className="font-semibold text-blue-900">Patient: {selectedPatient.name}</h4>
                        <p className="text-sm text-blue-700">
                          DOB: {new Date(selectedPatient.patient_details.date_of_birth).toLocaleDateString()}
                        </p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        <span className="text-red-500">*</span> Vaccine Name
                      </label>
                      <div className="relative">
                        <Syringe className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          value={manualEntry.vaccineName}
                          onChange={(e) => setManualEntry(prev => ({ ...prev, vaccineName: e.target.value }))}
                          className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all"
                          placeholder="Enter vaccine name (e.g., DPT, MMR, BCG)"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        <span className="text-red-500">*</span> Date Administered
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="date"
                          value={manualEntry.dateAdministered}
                          onChange={(e) => setManualEntry(prev => ({ ...prev, dateAdministered: e.target.value }))}
                          className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Next Due Date (Optional)
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="date"
                          value={manualEntry.nextDueDate}
                          onChange={(e) => setManualEntry(prev => ({ ...prev, nextDueDate: e.target.value }))}
                          className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Batch Number (Optional)
                      </label>
                      <input
                        type="text"
                        value={manualEntry.batchNumber}
                        onChange={(e) => setManualEntry(prev => ({ ...prev, batchNumber: e.target.value }))}
                        className="w-full px-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all"
                        placeholder="Enter batch number from vial/card"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Notes (Optional)
                      </label>
                      <div className="relative">
                        <FileText className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                        <textarea
                          value={manualEntry.notes}
                          onChange={(e) => setManualEntry(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="Add any additional notes or observations..."
                          rows={3}
                          className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-gray-50 focus:bg-white transition-all"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-4 pt-6">
                      <button
                        onClick={onClose}
                        className="px-6 py-3 text-gray-700 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-colors font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveRecord}
                        disabled={!manualEntry.vaccineName || !manualEntry.dateAdministered || !selectedPatient}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-lg"
                      >
                        Save Record
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Manual Entry Section (when no image uploaded) */}
          {!scannedImage && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Or Enter Details Directly
              </h3>
              
              <div className="space-y-4">
                {selectedPatient && (
                  <div className="bg-blue-50 rounded-2xl p-4 mb-4 border border-blue-200">
                    <h4 className="font-semibold text-blue-900">Patient: {selectedPatient.name}</h4>
                    <p className="text-sm text-blue-700">
                      DOB: {new Date(selectedPatient.patient_details.date_of_birth).toLocaleDateString()}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      <span className="text-red-500">*</span> Vaccine Name
                    </label>
                    <div className="relative">
                      <Syringe className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={manualEntry.vaccineName}
                        onChange={(e) => setManualEntry(prev => ({ ...prev, vaccineName: e.target.value }))}
                        className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all"
                        placeholder="Enter vaccine name (e.g., DPT, MMR, BCG)"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      <span className="text-red-500">*</span> Date Administered
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="date"
                        value={manualEntry.dateAdministered}
                        onChange={(e) => setManualEntry(prev => ({ ...prev, dateAdministered: e.target.value }))}
                        className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Next Due Date (Optional)
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="date"
                        value={manualEntry.nextDueDate}
                        onChange={(e) => setManualEntry(prev => ({ ...prev, nextDueDate: e.target.value }))}
                        className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Batch Number (Optional)
                    </label>
                    <input
                      type="text"
                      value={manualEntry.batchNumber}
                      onChange={(e) => setManualEntry(prev => ({ ...prev, batchNumber: e.target.value }))}
                      className="w-full px-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all"
                      placeholder="Enter batch number from vial/card"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Notes (Optional)
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                    <textarea
                      value={manualEntry.notes}
                      onChange={(e) => setManualEntry(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Add any additional notes or observations..."
                      rows={3}
                      className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-gray-50 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-6">
                  <button
                    onClick={onClose}
                    className="px-6 py-3 text-gray-700 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveRecord}
                    disabled={!manualEntry.vaccineName || !manualEntry.dateAdministered || !selectedPatient}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-lg"
                  >
                    Save Record
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CardScanner;