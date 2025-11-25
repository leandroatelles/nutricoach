
import React, { useState } from 'react';
import { X, Save, User, Camera } from 'lucide-react';
import { UserProfile } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSave: (updatedData: Partial<UserProfile>) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, profile, onSave }) => {
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    name: profile.name,
    age: profile.age,
    height: profile.height,
    currentWeight: profile.currentWeight,
    goal: profile.goal,
    gender: profile.gender,
    instagram: profile.instagram,
    profilePicture: profile.profilePicture
  });

  if (!isOpen) return null;

  const handleChange = (key: keyof UserProfile, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, profilePicture: url }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  // Updated styles: Light background, Dark text (High contrast)
  const getInputClass = "w-full p-3 bg-slate-50 border border-gray-200 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-blue-900 focus:border-transparent text-slate-900 font-medium placeholder:text-slate-400 transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <User className="text-blue-900" size={24} />
            Editar Perfil
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-6">
          <div className="flex justify-center">
            <div className="relative group cursor-pointer w-24 h-24">
              <div className="w-24 h-24 rounded-full border-4 border-slate-100 shadow-md overflow-hidden flex items-center justify-center bg-slate-50">
                {formData.profilePicture ? (
                  <img src={formData.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={40} className="text-slate-300" />
                )}
              </div>
              <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                <Camera className="text-white" size={24} />
              </div>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer rounded-full"
              />
            </div>
          </div>

          <form id="settings-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Nome de Exibição</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
                className={getInputClass}
                placeholder="Seu nome"
              />
            </div>
            
            {/* Instagram Field */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Instagram</label>
              <div className="relative">
                <span className="absolute left-3 top-3.5 text-slate-400 font-medium z-10">@</span>
                <input
                  type="text"
                  value={formData.instagram || ''}
                  onChange={(e) => handleChange('instagram', e.target.value)}
                  className={`${getInputClass} pl-8`}
                  placeholder="seu.usuario"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Idade</label>
                <input
                  type="number"
                  value={formData.age || ''}
                  onChange={(e) => handleChange('age', e.target.value)}
                  className={getInputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Gênero</label>
                <select
                  value={formData.gender || 'male'}
                  onChange={(e) => handleChange('gender', e.target.value as any)}
                  className={getInputClass}
                >
                  <option value="male">Masculino</option>
                  <option value="female">Feminino</option>
                  <option value="other">Outro</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Altura (cm)</label>
                <input
                  type="number"
                  value={formData.height || ''}
                  onChange={(e) => handleChange('height', e.target.value)}
                  className={getInputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Peso (kg)</label>
                <input
                  type="number"
                  value={formData.currentWeight || ''}
                  onChange={(e) => handleChange('currentWeight', e.target.value)}
                  className={getInputClass}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Objetivo Atual</label>
              <select
                value={formData.goal || 'lose_weight'}
                onChange={(e) => handleChange('goal', e.target.value as any)}
                className={getInputClass}
              >
                <option value="lose_weight">Perder Peso / Secar</option>
                <option value="gain_muscle">Ganhar Massa / Hipertrofia</option>
                <option value="maintain">Manter / Recomposição</option>
                <option value="performance">Performance Atlética</option>
              </select>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 bg-slate-50 flex justify-end gap-3">
          <button 
            type="button"
            onClick={onClose} 
            className="px-5 py-2.5 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            form="settings-form"
            className="px-6 py-2.5 bg-blue-900 hover:bg-blue-950 text-white rounded-lg font-medium shadow-lg shadow-blue-900/20 flex items-center gap-2 transition-transform transform active:scale-95"
          >
            <Save size={18} />
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
