import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Wand2, Loader2, Check } from 'lucide-react';
import { refineUserText } from '../services/geminiService';

interface RichInputProps {
  label: string;
  subLabel?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  minHeight?: string;
  context: string; // Used for AI refinement context (e.g., "Daily Routine")
}

const RichInput: React.FC<RichInputProps> = ({ 
  label, 
  subLabel, 
  value, 
  onChange, 
  placeholder, 
  minHeight = "h-32",
  context 
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'pt-BR';

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
           // Append with a space if there is existing text
           onChange(value + (value && !value.endsWith(' ') ? ' ' : '') + finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };
      
      recognitionRef.current.onend = () => {
         // Auto-restart if we think we are still listening (unless manually stopped)
         if (isListening) {
             try { recognitionRef.current.start(); } catch(e) {}
         }
      }
    }
  }, [value, onChange, isListening]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Seu navegador não suporta reconhecimento de voz.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleRefine = async () => {
    if (!value || value.length < 5) return;
    setIsRefining(true);
    try {
      const refined = await refineUserText(value, context);
      onChange(refined);
    } catch (error) {
      console.error(error);
    } finally {
      setIsRefining(false);
    }
  };

  const isFilled = value.trim().length > 0;

  return (
    <div className="space-y-2 group">
      <div className="flex justify-between items-end">
         <div>
            <label className={`block font-semibold transition-colors ${isFilled ? 'text-blue-900' : 'text-slate-900'}`}>
                {label}
            </label>
            {subLabel && <p className="text-xs text-slate-500">{subLabel}</p>}
         </div>
         {isFilled && <Check size={16} className="text-blue-600 animate-fadeIn" />}
      </div>
      
      <div className={`relative rounded-xl border-2 transition-all duration-300 overflow-hidden bg-white
        ${isFilled ? 'border-blue-900 shadow-md shadow-blue-900/5' : 'border-slate-200 hover:border-slate-300'}
        ${isListening ? 'ring-2 ring-red-400 border-red-400' : ''}
      `}>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full p-4 pr-14 outline-none resize-none bg-transparent transition-colors
            ${minHeight}
            ${isFilled ? 'bg-blue-50/10 text-blue-900 font-medium' : 'text-slate-700'}
          `}
          placeholder={isListening ? "Ouvindo... (fale agora)" : placeholder}
        />

        <div className="absolute right-2 bottom-2 flex flex-col gap-2">
           {/* AI Refine Button */}
           {isFilled && (
            <button
                onClick={handleRefine}
                disabled={isRefining}
                title="Melhorar texto com IA"
                className={`p-2 rounded-full transition-all shadow-sm
                    ${isRefining 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-white text-purple-600 hover:bg-purple-50 border border-purple-100'
                    }`}
            >
                {isRefining ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}
            </button>
           )}

           {/* Mic Button */}
            <button
                onClick={toggleListening}
                title={isListening ? "Parar gravação" : "Falar (Digitar por voz)"}
                className={`p-2 rounded-full transition-all shadow-sm
                    ${isListening 
                        ? 'bg-red-500 text-white animate-pulse' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                    }`}
            >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
        </div>
      </div>
    </div>
  );
};

export default RichInput;