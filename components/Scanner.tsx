
import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5Qrcode, Html5QrcodeSupportedFormats } from 'https://esm.sh/html5-qrcode';

interface ScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

const Scanner: React.FC<ScannerProps> = ({ onScan, onClose }) => {
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const regionId = "barcode-scanner-region";

  useEffect(() => {
    const startScanner = async () => {
      try {
        const html5QrCode = new Html5Qrcode(regionId);
        scannerRef.current = html5QrCode;

        const config = {
          fps: 15,
          qrbox: { width: 280, height: 150 }, // مستطيل مناسب للباركود الطولي
          aspectRatio: 1.0,
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.QR_CODE
          ]
        };

        await html5QrCode.start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            // نجاح المسح
            onScan(decodedText);
            stopScanner();
          },
          (errorMessage) => {
            // تجاهل أخطاء البحث المستمر عن باركود
          }
        );
      } catch (err: any) {
        console.error("Scanner Error:", err);
        setError("تعذر تشغيل الكاميرا. يرجى التأكد من إعطاء الصلاحيات واختيار متصفح يدعم الكاميرا.");
      }
    };

    const stopScanner = async () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        try {
          await scannerRef.current.stop();
        } catch (err) {
          console.error("Stop Error:", err);
        }
      }
    };

    startScanner();

    return () => {
      stopScanner();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-4">
      <div className="relative w-full max-w-lg aspect-square bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border-4 border-blue-600">
        <div id={regionId} className="w-full h-full"></div>
        
        {/* إطار توجيه بصري */}
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
          <div className="w-72 h-40 border-2 border-blue-400 rounded-xl flex items-center justify-center relative bg-blue-500/5">
             <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-400 rounded-tl-lg"></div>
             <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-400 rounded-tr-lg"></div>
             <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-400 rounded-bl-lg"></div>
             <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-400 rounded-br-lg"></div>
             
             {/* خط المسح المتحرك */}
             <div className="w-full h-0.5 bg-blue-400 absolute top-1/2 animate-bounce opacity-50 shadow-[0_0_15px_rgba(96,165,250,0.8)]"></div>
          </div>
          <p className="text-white font-bold mt-8 bg-black/50 px-4 py-2 rounded-full backdrop-blur-md">ضع الباركود داخل الإطار</p>
        </div>

        {error && (
          <div className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center p-8 text-center">
            <p className="text-red-400 font-bold mb-4">{error}</p>
            <button onClick={onClose} className="px-6 py-2 bg-white text-black rounded-xl font-bold">رجوع</button>
          </div>
        )}
      </div>
      
      <div className="mt-8 flex gap-4 w-full max-w-sm">
        <button 
          onClick={onClose}
          className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black text-lg shadow-lg active:scale-95 transition"
        >
          إلغاء المسح
        </button>
      </div>
    </div>
  );
};

export default Scanner;
