import React from 'react';
import { Upload } from 'lucide-react';

interface PhotoUploadProps {
  label: string;
  image: string | null;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({ label, image, onChange }) => (
  <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center min-h-[200px] relative bg-slate-50 hover:bg-slate-100 transition-colors group overflow-hidden cursor-pointer">
    {image ? (
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        <img src={image} alt={label} className="w-full h-48 object-cover rounded-lg shadow-sm" />
        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
          <p className="text-white font-medium text-sm">Alterar Foto</p>
        </div>
      </div>
    ) : (
      <div className="text-center p-4 pointer-events-none">
        <div className="bg-white p-3 rounded-full shadow-sm border border-gray-200 inline-block mb-3 group-hover:scale-110 transition-transform">
          <Upload className="text-blue-900" size={24} />
        </div>
        <p className="text-sm font-semibold text-slate-700">{label}</p>
        <p className="text-xs text-slate-400 mt-1">Toque para enviar</p>
      </div>
    )}
    <input
      type="file"
      accept="image/*"
      onChange={onChange}
      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
    />
  </div>
);

export default PhotoUpload;