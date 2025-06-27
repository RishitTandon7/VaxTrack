import React, { useState, useEffect } from 'react';
import { X, Download, Copy, QrCode } from 'lucide-react';
import QRCodeLib from 'qrcode';
import { supabase } from '../../lib/supabase';

interface QRCodeGeneratorProps {
  doctorId: string;
  onClose: () => void;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ doctorId, onClose }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [connectionCode, setConnectionCode] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    generateConnectionCode();
  }, [doctorId]);

  const generateConnectionCode = async () => {
    setIsGenerating(true);
    setError('');

    try {
      // Generate a unique connection code
      const code = `DOC-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`;
      setConnectionCode(code);

      if (supabase) {
        // Store in Supabase
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now

        const { error: insertError } = await supabase
          .from('connection_codes')
          .insert({
            code: code,
            doctor_id: doctorId,
            expires_at: expiresAt.toISOString(),
            used: false
          });

        if (insertError) {
          console.error('Error storing connection code:', insertError);
          setError('Failed to generate connection code. Please try again.');
          return;
        }
      } else {
        // Fallback to localStorage
        localStorage.setItem(`connection_${code}`, JSON.stringify({
          doctorId,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        }));
      }

      // Create connection URL
      const connectionUrl = `${window.location.origin}/connect/${code}`;
      
      // Generate QR code
      const qrUrl = await QRCodeLib.toDataURL(connectionUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#1f2937',
          light: '#ffffff'
        }
      });
      
      setQrCodeUrl(qrUrl);
    } catch (error) {
      console.error('Error generating connection code:', error);
      setError('Failed to generate connection code. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(connectionCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = connectionCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadQR = () => {
    if (!qrCodeUrl) return;
    
    const link = document.createElement('a');
    link.download = `doctor-qr-${connectionCode}.png`;
    link.href = qrCodeUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Patient Connection QR Code</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 text-center">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {isGenerating ? (
            <div className="py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Generating connection code...</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <div className="bg-blue-50 rounded-2xl p-4 mb-4 border border-blue-200">
                  <QrCode className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-blue-800 font-medium">
                    Share this QR code with patients so they can connect to your practice
                  </p>
                </div>
                
                {qrCodeUrl && (
                  <div className="bg-white border-2 border-gray-200 rounded-2xl p-4 inline-block shadow-inner">
                    <img src={qrCodeUrl} alt="Connection QR Code" className="w-64 h-64" />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Connection Code
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={connectionCode}
                      readOnly
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-2xl bg-gray-50 text-center font-mono text-lg font-semibold"
                    />
                    <button
                      onClick={handleCopyCode}
                      className="px-4 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-colors shadow-lg"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                  {copied && (
                    <p className="text-sm text-green-600 mt-2 font-medium">Code copied to clipboard!</p>
                  )}
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleDownloadQR}
                    disabled={!qrCodeUrl}
                    className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-3 rounded-2xl hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download QR</span>
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-colors font-medium"
                  >
                    Close
                  </button>
                </div>

                <button
                  onClick={generateConnectionCode}
                  className="w-full px-4 py-2 text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors text-sm font-medium"
                >
                  Generate New Code
                </button>
              </div>

              <div className="mt-6 p-4 bg-yellow-50 rounded-2xl border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> This connection code expires in 24 hours for security.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRCodeGenerator;