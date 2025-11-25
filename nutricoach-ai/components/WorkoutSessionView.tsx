import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause, RotateCcw, CheckCircle2, Save, X, Timer as TimerIcon, Youtube, Dumbbell, Flame, Activity } from 'lucide-react';
import { WorkoutDay } from '../types';

interface WorkoutSessionViewProps {
  day: WorkoutDay;
  dayIndex: number;
  onClose: () => void;
  onFinish: () => void;
}

interface ExerciseLog {
  completed: boolean;
  weight: string;
  reps: string;
}

interface SessionLogs {
  warmup?: boolean;
  stretching?: boolean;
  [key: string]: ExerciseLog | boolean | undefined;
}

const WorkoutSessionView: React.FC<WorkoutSessionViewProps> = ({ day, dayIndex, onClose, onFinish }) => {
  // Start at -1 to represent the Warm-up phase
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(-1); 
  const [logs, setLogs] = useState<SessionLogs>({});
  
  // Timer State
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<number | null>(null);

  const totalExercises = day.exercises.length;
  // Total steps = Exercises + 1 (Warmup)
  const totalSteps = totalExercises + 1;
  const currentStep = currentExerciseIndex + 2; // Display value (1-based, considering warmup as step 1)

  // Determine content based on index
  const isWarmupPhase = currentExerciseIndex === -1;
  const currentExercise = !isWarmupPhase ? day.exercises[currentExerciseIndex] : null;

  // Load existing logs
  useEffect(() => {
    const savedLogs = localStorage.getItem('nutricoach_workout_logs');
    if (savedLogs) {
      try {
        setLogs(JSON.parse(savedLogs));
      } catch (e) {
        console.error("Error loading workout logs", e);
      }
    }
  }, []);

  // Save logs on change
  useEffect(() => {
    if (Object.keys(logs).length > 0) {
      const existing = localStorage.getItem('nutricoach_workout_logs');
      const parsed = existing ? JSON.parse(existing) : {};
      const merged = { ...parsed, ...logs };
      localStorage.setItem('nutricoach_workout_logs', JSON.stringify(merged));
    }
  }, [logs]);

  // Timer Logic
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = window.setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  const toggleTimer = () => setIsTimerRunning(!isTimerRunning);
  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(0);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const updateLog = (key: string, value: any) => {
    setLogs(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  const updateExerciseLog = (field: keyof ExerciseLog, value: any) => {
    if (isWarmupPhase) return;
    
    const key = `${dayIndex}-${currentExerciseIndex}`;
    const currentLog = (logs[key] as ExerciseLog) || { completed: false, weight: '', reps: '' };
    
    setLogs(prev => ({
      ...prev,
      [key]: {
        ...currentLog,
        [field]: value
      }
    }));
  };

  const handleNext = () => {
    if (currentExerciseIndex < totalExercises - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
      resetTimer(); 
    } else {
      onFinish();
    }
  };

  const handlePrev = () => {
    if (currentExerciseIndex >= -1) {
      setCurrentExerciseIndex(prev => prev - 1);
      resetTimer();
    }
  };

  // Dynamic Warmup Suggestions
  const getWarmupSuggestions = () => {
    const focus = day.focus.toLowerCase();
    let cardio = "5-10 min de caminhada rápida ou elíptico leve.";
    let mobility = "Rotação de ombros, pulsos e pescoço.";

    if (focus.includes('perna') || focus.includes('inferior') || focus.includes('agachamento')) {
        cardio = "5-10 min de bicicleta ou esteira inclinada.";
        mobility = "Agachamento com peso do corpo, mobilidade de quadril e tornozelo.";
    } else if (focus.includes('peito') || focus.includes('costas') || focus.includes('superior')) {
        cardio = "5 min de Remo ou Elíptico (usando braços).";
        mobility = "Rotação de tronco, alongamento dinâmico de peitoral e ombros com elástico.";
    }

    return { cardio, mobility };
  };

  const suggestions = getWarmupSuggestions();
  const warmupKey = `warmup-${dayIndex}`;
  const stretchingKey = `stretching-${dayIndex}`;
  const isWarmupDone = !!logs[warmupKey];
  const isStretchingDone = !!logs[stretchingKey];

  return (
    <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col overflow-hidden text-white">
      {/* Header */}
      <div className="bg-slate-800 p-4 flex items-center justify-between shrink-0">
        <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors">
          <X size={24} />
        </button>
        <div className="text-center">
          <h2 className="text-lg font-bold">{isWarmupPhase ? 'Preparação' : day.focus}</h2>
          <p className="text-xs text-slate-400">
             {isWarmupPhase ? 'Antes de começar' : `Exercício ${currentExerciseIndex + 1} de ${totalExercises}`}
          </p>
        </div>
        <div className="w-10"></div> {/* Spacer */}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-700 h-1">
        <div 
          className="bg-blue-500 h-full transition-all duration-300" 
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>

      {/* Main Content (Scrollable) */}
      <div className="flex-1 overflow-y-auto bg-slate-900 pb-32">
        {/* Video Embed */}
        <div className="aspect-video w-full bg-black relative shadow-lg">
          <iframe 
            width="100%" 
            height="100%" 
            src={`https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(
                isWarmupPhase 
                ? `Aquecimento treino ${day.focus} exercício` 
                : `${currentExercise?.name} execução exercício`
            )}`}
            title="Exercise Video"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen
            className="absolute inset-0"
          ></iframe>
        </div>

        <div className="p-6 space-y-8">
          
          {/* --- WARMUP PHASE CONTENT --- */}
          {isWarmupPhase ? (
            <div className="space-y-6 animate-fadeIn">
               <div>
                  <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
                    <Flame className="text-orange-500" /> Aquecimento & Mobilidade
                  </h1>
                  <p className="text-slate-400 text-sm">Prepare seu corpo para evitar lesões e melhorar a performance.</p>
               </div>

               {/* Cardio Card */}
               <div 
                  onClick={() => updateLog(warmupKey, !isWarmupDone)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-4 ${
                      isWarmupDone 
                      ? 'bg-orange-900/20 border-orange-500/50' 
                      : 'bg-slate-800 border-slate-700 hover:bg-slate-750'
                  }`}
               >
                  <div className={`mt-1 p-1 rounded-full border ${isWarmupDone ? 'bg-orange-500 border-orange-500 text-white' : 'border-slate-500 text-transparent'}`}>
                     <CheckCircle2 size={16} />
                  </div>
                  <div>
                     <h3 className={`font-bold text-lg ${isWarmupDone ? 'text-orange-400' : 'text-white'}`}>Aquecimento Geral</h3>
                     <p className="text-sm text-slate-400 mt-1">{suggestions.cardio}</p>
                  </div>
               </div>

               {/* Stretching Card */}
               <div 
                  onClick={() => updateLog(stretchingKey, !isStretchingDone)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-4 ${
                      isStretchingDone 
                      ? 'bg-blue-900/20 border-blue-500/50' 
                      : 'bg-slate-800 border-slate-700 hover:bg-slate-750'
                  }`}
               >
                  <div className={`mt-1 p-1 rounded-full border ${isStretchingDone ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-500 text-transparent'}`}>
                     <CheckCircle2 size={16} />
                  </div>
                  <div>
                     <h3 className={`font-bold text-lg ${isStretchingDone ? 'text-blue-400' : 'text-white'}`}>Alongamento Dinâmico</h3>
                     <p className="text-sm text-slate-400 mt-1">{suggestions.mobility}</p>
                  </div>
               </div>

               {/* Tip */}
               <div className="bg-slate-800 p-4 rounded-lg text-xs text-slate-400 italic border-l-2 border-yellow-500">
                  Dica: Use o cronômetro abaixo para marcar o tempo do seu cardio.
               </div>
            </div>
          ) : (
            /* --- EXERCISE PHASE CONTENT --- */
            <div className="space-y-6 animate-fadeIn">
                <div>
                    <h1 className="text-2xl font-bold mb-2 flex items-start justify-between">
                    {currentExercise?.name}
                    <button 
                        onClick={() => updateExerciseLog('completed', !(logs[`${dayIndex}-${currentExerciseIndex}`] as ExerciseLog)?.completed)}
                        className={`p-2 rounded-full transition-all ${
                            (logs[`${dayIndex}-${currentExerciseIndex}`] as ExerciseLog)?.completed 
                            ? 'text-green-400 bg-green-400/10' 
                            : 'text-slate-500 bg-slate-800'
                        }`}
                    >
                        <CheckCircle2 size={32} fill={(logs[`${dayIndex}-${currentExerciseIndex}`] as ExerciseLog)?.completed ? "currentColor" : "none"} />
                    </button>
                    </h1>
                    <div className="flex gap-4 text-sm text-slate-300">
                        <span className="bg-slate-800 px-3 py-1 rounded-full border border-slate-700">Meta: {currentExercise?.sets} séries</span>
                        <span className="bg-slate-800 px-3 py-1 rounded-full border border-slate-700">Meta: {currentExercise?.reps} reps</span>
                    </div>
                    {currentExercise?.notes && (
                        <p className="mt-4 text-sm text-slate-400 italic bg-slate-800/50 p-3 rounded-lg border-l-2 border-slate-600">
                            "{currentExercise.notes}"
                        </p>
                    )}
                </div>

                {/* Inputs */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Carga (kg)</label>
                    <input 
                        type="number" 
                        value={(logs[`${dayIndex}-${currentExerciseIndex}`] as ExerciseLog)?.weight || ''}
                        onChange={(e) => updateExerciseLog('weight', e.target.value)}
                        placeholder="0"
                        className="w-full bg-transparent text-3xl font-bold outline-none text-white placeholder:text-slate-600"
                    />
                    </div>
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Reps Feitas</label>
                    <input 
                        type="text" 
                        value={(logs[`${dayIndex}-${currentExerciseIndex}`] as ExerciseLog)?.reps || ''}
                        onChange={(e) => updateExerciseLog('reps', e.target.value)}
                        placeholder="0"
                        className="w-full bg-transparent text-3xl font-bold outline-none text-white placeholder:text-slate-600"
                    />
                    </div>
                </div>
            </div>
          )}

          {/* Shared Timer Section */}
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
             <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-slate-300 font-medium">
                   <TimerIcon size={20} className="text-blue-400" />
                   {isWarmupPhase ? 'Cronômetro (Cardio)' : 'Descanso'}
                </div>
                <div className="text-3xl font-mono font-bold text-white tracking-widest">
                   {formatTime(timerSeconds)}
                </div>
             </div>
             
             <div className="flex gap-2">
                 <button 
                   onClick={toggleTimer}
                   className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                     isTimerRunning 
                     ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                     : 'bg-blue-600 hover:bg-blue-700 text-white'
                   }`}
                 >
                    {isTimerRunning ? <Pause size={20} fill="currentColor"/> : <Play size={20} fill="currentColor"/>}
                    {isTimerRunning ? 'Pausar' : 'Iniciar'}
                 </button>
                 <button 
                   onClick={resetTimer}
                   className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
                 >
                    <RotateCcw size={20} />
                 </button>
             </div>
             <div className="grid grid-cols-3 gap-2 mt-3">
                 {[30, 60, 90, 300].map(sec => (
                     <button 
                       key={sec} 
                       onClick={() => { setIsTimerRunning(false); setTimerSeconds(sec); }}
                       className="py-1 text-xs font-medium bg-slate-900 text-slate-400 hover:bg-slate-950 hover:text-white rounded border border-slate-700"
                     >
                         {sec >= 60 ? `${sec/60}m` : `${sec}s`}
                     </button>
                 ))}
             </div>
          </div>

        </div>
      </div>

      {/* Footer Navigation */}
      <div className="bg-slate-800 p-4 border-t border-slate-700 flex justify-between items-center shrink-0">
         <button 
           onClick={handlePrev}
           disabled={currentExerciseIndex === -1}
           className={`p-3 rounded-lg flex items-center gap-2 font-medium transition-colors ${
             currentExerciseIndex === -1 ? 'text-slate-600 cursor-not-allowed' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
           }`}
         >
            <ChevronLeft size={20} />
            Anterior
         </button>

         <button 
           onClick={handleNext}
           className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg ${
             currentExerciseIndex === totalExercises - 1 
             ? 'bg-green-600 hover:bg-green-700 text-white shadow-green-900/20' 
             : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-900/20'
           }`}
         >
            {currentExerciseIndex === totalExercises - 1 ? (
                <>Finalizar <Save size={20} /></>
            ) : (
                <>{isWarmupPhase ? 'Iniciar Treino' : 'Próximo'} <ChevronRight size={20} /></>
            )}
         </button>
      </div>
    </div>
  );
};

export default WorkoutSessionView;