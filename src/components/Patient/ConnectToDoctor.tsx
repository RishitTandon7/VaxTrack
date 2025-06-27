import React, { useState } from 'react';
import { QrCode, Hash, User, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import QrScanner from 'qr-scanner';

interface ConnectToDoctorProps {
  onConnected: () => void;
  onCancel: () => void;
}

const ConnectToDoctor: React.FC<ConnectToDoctorProps> = ({ onConnected, onCancel }) => {
  const { user } = useAuth();
  const [connectionCode, setConnectionCode] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);

  const handleConnect = async () => {
    if (!connectionCode.trim() || !user) return;

    setIsConnecting(true);
    setError('');

    try {
      const codeToCheck = connectionCode.toUpperCase().trim();

      if (supabase) {
        // Check connection code in Supabase
        const { data: connectionData, error: fetchError } = await supabase
          .from('connection_codes')
          .select('*')
          .eq('code', codeToCheck)
          .single();

        if (fetchError || !connectionData) {
          setError('Invalid connection code. Please check and try again.');
          setIsConnecting(false);
          return;
        }

        // Check if code has expired
        if (new Date() > new Date(connectionData.expires_at)) {
          setError('Connection code has expired. Please get a new code from your doctor.');
          setIsConnecting(false);
          return;
        }

        // Check if code has already been used
        if (connectionData.used) {
          setError('This connection code has already been used. Please get a new code from your doctor.');
          setIsConnecting(false);
          return;
        }

        // Mark the connection code as used (but keep it in database for tracking)
        const { error: updateError } = await supabase
          .from('connection_codes')
          .update({ 
            used: true,
            used_at: new Date().toISOString(),
            used_by: user.id
          })
          .eq('id', connectionData.id);

        if (updateError) {
          console.error('Error updating connection code:', updateError);
        }

        // Update patient's doctor assignment
        const { error: patientUpdateError } = await supabase
          .from('patients')
          .update({ doctor_id: connectionData.doctor_id })
          .eq('id', user.id);

        if (patientUpdateError) {
          setError('Failed to connect to doctor. Please try again.');
          setIsConnecting(false);
          return;
        }

      } else {
        // Fallback to localStorage
        const connectionData = localStorage.getItem(`connection_${codeToCheck}`);
        
        if (!connectionData) {
          setError('Invalid connection code. Please check and try again.');
          setIsConnecting(false);
          return;
        }

        const { doctorId, expiresAt, used } = JSON.parse(connectionData);
        
        // Check if code has expired
        if (new Date() > new Date(expiresAt)) {
          setError('Connection code has expired. Please get a new code from your doctor.');
          setIsConnecting(false);
          return;
        }

        // Check if code has already been used
        if (used) {
          setError('This connection code has already been used. Please get a new code from your doctor.');
          setIsConnecting(false);
          return;
        }

        // Update patient's doctor assignment (localStorage fallback)
        const users = JSON.parse(localStorage.getItem('vaccination_users') || '[]');
        const userIndex = users.findIndex((u: any) => u.id === user.id);
        if (userIndex >= 0) {
          users[userIndex] = { ...users[userIndex], doctorId: doctorId };
          localStorage.setItem('vaccination_users', JSON.stringify(users));
          localStorage.setItem('current_user', JSON.stringify(users[userIndex]));
        }

        // Mark code as used but keep it for tracking
        const updatedConnectionData = {
          ...JSON.parse(connectionData),
          used: true,
          usedAt: new Date().toISOString(),
          usedBy: user.id
        };
        localStorage.setItem(`connection_${codeToCheck}`, JSON.stringify(updatedConnectionData));
      }

      setSuccess(true);
      setTimeout(() => {
        onConnected();
      }, 2000);

    } catch (err) {
      console.error('Connection error:', err);
      setError('Connection failed. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleQRScan = (result: string) => {
    // Extract connection code from URL
    const match = result.match(/\/connect\/([A-Z0-9-]+)$/);
    if (match) {
      setConnectionCode(match[1]);
      setShowQRScanner(false);
    } else {
      setError('Invalid QR code. Please scan the correct doctor connection QR code.');
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-green-400 rounded-full blur-xl opacity-30"></div>
            <div className="relative p-4 bg-green-500 rounded-full mx-auto w-fit">
              <CheckCircle className="h-16 w-16 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Successfully Connected! 🎉</h2>
          <p className="text-gray-600">
            You are now connected to your doctor. Your vaccination records will be managed by your healthcare provider.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Connect to Your Doctor</h2>
          <p className="text-gray-600 mt-1">
            Use the connection code or QR code provided by your doctor
          </p>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-4 rounded-2xl border border-red-200">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          {/* Connection Methods */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Connection Code
              </label>
              <div className="relative">
                <Hash className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={connectionCode}
                  onChange={(e) => setConnectionCode(e.target.value.toUpperCase())}
                  placeholder="DOC-XXXXXX-XXXX"
                  className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono bg-gray-50 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="text-center">
              <span className="text-gray-500 text-sm">or</span>
            </div>

            <button
              onClick={() => setShowQRScanner(true)}
              className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 px-4 py-4 rounded-2xl hover:from-purple-100 hover:to-pink-100 transition-all border border-purple-200 font-semibold"
            >
              <QrCode className="h-5 w-5" />
              <span>Scan QR Code</span>
            </button>
          </div>

          {/* Patient Info */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 border border-purple-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-500 rounded-xl">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{user?.name}</h3>
                <p className="text-sm text-gray-600">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-4">
            <button
              onClick={onCancel}
              className="flex-1 px-6 py-3 text-gray-700 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleConnect}
              disabled={!connectionCode.trim() || isConnecting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-2xl hover:from-purple-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-lg flex items-center justify-center space-x-2"
            >
              {isConnecting && (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              )}
              <span>{isConnecting ? 'Connecting...' : 'Connect'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-60">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Scan QR Code</h3>
            <div className="bg-gray-50 rounded-2xl p-8 text-center border border-gray-200">
              <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                Point your camera at the QR code provided by your doctor
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    QrScanner.scanImage(file)
                      .then(result => handleQRScan(result))
                      .catch(() => setError('Could not read QR code from image'));
                  }
                }}
                className="hidden"
                id="qr-upload"
              />
              <label
                htmlFor="qr-upload"
                className="inline-block bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-2xl hover:from-purple-600 hover:to-pink-700 transition-all cursor-pointer font-semibold shadow-lg"
              >
                Upload QR Image
              </label>
            </div>
            <button
              onClick={() => setShowQRScanner(false)}
              className="w-full mt-4 px-4 py-3 text-gray-700 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectToDoctor;