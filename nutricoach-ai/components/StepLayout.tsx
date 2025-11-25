import React from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';

interface StepLayoutProps {
  title: string;
  description: string;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onBack?: () => void;
  isNextDisabled?: boolean;
  children: React.ReactNode;
  isSubmit?: boolean;
}

const StepLayout: React.FC<StepLayoutProps> = ({
  title,
  description,
  currentStep,
  totalSteps,
  onNext,
  onBack,
  isNextDisabled = false,
  children,
  isSubmit = false,
}) => {
  const progress = ((currentStep) / totalSteps) * 100;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Header / Progress */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
              Etapa {currentStep} de {totalSteps}
            </span>
            <span className="text-xs text-gray-500 font-medium">{Math.round(progress)}% Concluído</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-blue-900 h-1.5 rounded-full transition-all duration-500 ease-in-out shadow-[0_0_10px_rgba(30,58,138,0.3)]" 
              style={{ width: `${progress}%` }} 
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-2xl w-full mx-auto px-6 py-8 pb-32">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">{title}</h2>
          <p className="text-slate-600 leading-relaxed">{description}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          {children}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="bg-white border-t border-gray-200 p-6 fixed bottom-0 w-full z-20">
        <div className="max-w-2xl mx-auto flex justify-between items-center gap-4">
          <button
            onClick={onBack}
            disabled={!onBack}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors
              ${!onBack 
                ? 'text-gray-300 cursor-not-allowed' 
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
          >
            <ArrowLeft size={20} />
            Voltar
          </button>

          <button
            onClick={onNext}
            disabled={isNextDisabled}
            className={`flex items-center gap-2 px-8 py-3 rounded-lg font-medium shadow-lg transition-all
              ${isNextDisabled
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                : 'bg-blue-900 text-white hover:bg-blue-950 transform hover:-translate-y-0.5 shadow-blue-900/20'
              }`}
          >
            {isSubmit ? 'Gerar Plano' : 'Próximo'}
            {isSubmit ? <Check size={20} /> : <ArrowRight size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StepLayout;