
import React, { useState, useEffect } from 'react';
import { UserProfile, AppStep, AIPlanResponse, UserMeasurements } from './types';
import StepLayout from './components/StepLayout';
import ResultsView from './components/ResultsView';
import DashboardView from './components/DashboardView';
import WorkoutSessionView from './components/WorkoutSessionView';
import PhotoUpload from './components/PhotoUpload';
import RichInput from './components/RichInput';
import Notification from './components/Notification';
import { generatePersonalizedPlan } from './services/geminiService';
import { Camera, User, Calendar, Utensils, AlertCircle, Dumbbell, LayoutDashboard, Save, Trophy, Mail, Lock, Sparkles, Brain, Ruler } from 'lucide-react';

const INITIAL_PROFILE: UserProfile = {
  name: '',
  age: '',
  height: '',
  currentWeight: '',
  gender: 'male',
  goal: 'lose_weight',
  instagram: '',
  profilePicture: null,
  photoFront: null,
  photoSide: null,
  photoBack: null,
  dailyRoutine: '',
  currentDiet: '',
  foodSubstitutions: '',
  foodPreferences: '',
  workoutRoutine: '',
  supplementation: '',
  measurements: undefined,
};

export default function App() {
  const [step, setStep] = useState<AppStep>(AppStep.WELCOME);
  const [profile, setProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [plan, setPlan] = useState<AIPlanResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAutoLoaded, setIsAutoLoaded] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState(0);
  
  // Active Workout State
  const [activeWorkoutDayIndex, setActiveWorkoutDayIndex] = useState<number | null>(null);

  // Notification State
  const [notification, setNotification] = useState<{title: string, message: string, visible: boolean}>({
    title: '', message: '', visible: false
  });
  
  // Fake registration fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Measurement state for ASSESSMENT step
  const [measurements, setMeasurements] = useState<UserMeasurements>({
    neck: '', shoulders: '', chest: '', arms: '', waist: '', hips: '', thigh: '', calf: ''
  });

  // --- Auto-load / Auto-save Logic ---

  useEffect(() => {
    // Load Profile
    const savedProfile = localStorage.getItem('nutricoach_profile');
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        setProfile({ ...INITIAL_PROFILE, ...parsed });
        if (parsed.measurements) {
            setMeasurements(parsed.measurements);
        }
      } catch (e) {
        console.error("Failed to load saved profile", e);
      }
    }
    
    // Load Plan
    const savedPlan = localStorage.getItem('nutricoach_plan');
    if (savedPlan) {
      try {
        setPlan(JSON.parse(savedPlan));
      } catch (e) {
        console.error("Failed to load saved plan", e);
      }
    }

    setIsAutoLoaded(true);

    // Simulated Push Notification Cycle
    const timer = setTimeout(() => {
       showNotification("Hora de beber água!", "Mantenha-se hidratado para otimizar seus resultados.");
    }, 15000); // 15 seconds after app load

    return () => clearTimeout(timer);

  }, []);

  // Cycle loading phases during generation
  useEffect(() => {
    if (step === AppStep.GENERATING) {
      const interval = setInterval(() => {
        setLoadingPhase(prev => (prev + 1) % 4);
      }, 2000); // Change phase every 2 seconds
      return () => clearInterval(interval);
    }
    setLoadingPhase(0);
  }, [step]);

  // Save profile on change
  useEffect(() => {
    if (isAutoLoaded) {
      const profileToSave = { ...profile, measurements };
      localStorage.setItem('nutricoach_profile', JSON.stringify(profileToSave));
    }
  }, [profile, measurements, isAutoLoaded]);

  // Save plan on change
  useEffect(() => {
    if (isAutoLoaded && plan) {
      localStorage.setItem('nutricoach_plan', JSON.stringify(plan));
      // Show notification on save if not loading
      if (step === AppStep.RESULTS) {
        showNotification("Plano Salvo", "Seu plano foi salvo automaticamente.");
      }
    }
  }, [plan, isAutoLoaded]);

  const showNotification = (title: string, message: string) => {
    setNotification({ title, message, visible: true });
  };

  const updateProfile = (key: keyof UserProfile, value: any) => {
    setProfile(prev => ({ ...prev, [key]: value }));
  };
  
  const handleBatchUpdateProfile = (updatedData: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...updatedData }));
    if (updatedData.measurements) {
        setMeasurements(updatedData.measurements);
    }
    showNotification("Perfil Atualizado", "Suas informações foram salvas com sucesso.");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, key: 'photoFront' | 'photoSide' | 'photoBack' | 'profilePicture') => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      updateProfile(key, url);
    }
  };
  
  const updateMeasurement = (key: keyof UserMeasurements, value: string) => {
    setMeasurements(prev => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    // If leaving assessment step, save measurements to profile
    if (step === AppStep.ASSESSMENT) {
        updateProfile('measurements', measurements);
    }
    setStep(prev => prev + 1);
    window.scrollTo(0, 0);
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
    window.scrollTo(0, 0);
  };
  
  const handleRegisterAndGenerate = async () => {
      setLoading(true);
      setStep(AppStep.GENERATING);
      setError(null);
      
      // Ensure measurements are in profile before generating
      const finalProfile = { ...profile, measurements };
      
      try {
        const generatedPlan = await generatePersonalizedPlan(finalProfile);
        setPlan(generatedPlan);
        setStep(AppStep.RESULTS);
      } catch (err) {
        setError("Falha ao gerar o plano. Verifique sua chave de API ou tente novamente.");
        setStep(AppStep.REGISTER); 
      } finally {
        setLoading(false);
      }
  }

  const resetPlan = () => {
      setStep(AppStep.WELCOME);
      setProfile(INITIAL_PROFILE);
      setPlan(null);
      localStorage.removeItem('nutricoach_profile'); 
      localStorage.removeItem('nutricoach_plan');
  }

  const handleStartWorkout = (dayIndex: number) => {
      setActiveWorkoutDayIndex(dayIndex);
      setStep(AppStep.WORKOUT_SESSION);
  }

  const handleFinishWorkout = () => {
      setActiveWorkoutDayIndex(null);
      setStep(AppStep.RESULTS);
      showNotification("Treino Concluído!", "Bom trabalho! Continue assim.");
  }

  const getInputClass = (value: string | number) => `
    w-full px-4 py-3 rounded-lg border outline-none transition-all duration-300
    ${value 
      ? 'border-blue-900 bg-blue-50/20 ring-1 ring-blue-900/20 text-blue-900 font-medium' 
      : 'border-slate-300 bg-slate-50 text-slate-600 focus:bg-white focus:border-blue-900 focus:ring-2 focus:ring-blue-900/20 focus:text-slate-900'
    }
  `;

  // --- RENDER HELPERS ---

  // Main Render Logic
  const renderCurrentView = () => {
    if (step === AppStep.WELCOME) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 text-center overflow-hidden relative">
          <div className="absolute top-0 left-0 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-x-1/2 -translate-y-1/2 animate-blob"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 translate-x-1/2 -translate-y-1/2 animate-blob animation-delay-2000"></div>

          <div className="max-w-md w-full space-y-8 relative z-10 animate-fadeIn flex-1 flex flex-col justify-center">
            
            {/* Logo Estático */}
            <div className="flex justify-center mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-900 to-slate-900 rounded-2xl shadow-2xl flex items-center justify-center border-4 border-white/20 transform rotate-3">
                    <Dumbbell size={48} className="text-white" strokeWidth={1.5} />
                </div>
            </div>

            <div>
              <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-3">NutriCoach AI</h1>
              <p className="text-lg text-slate-600 leading-relaxed">
                Transforme seu esforço em resultado.
                <br/>Seu plano personalizado começa agora.
              </p>
            </div>
            <div className="space-y-4">
               <button
                onClick={() => setStep(AppStep.BASICS)}
                className="w-full py-4 bg-blue-900 text-white text-lg font-bold rounded-xl shadow-xl shadow-blue-900/20 hover:bg-blue-950 transition-all transform hover:-translate-y-1"
              >
                {profile.name ? 'Continuar Avaliação' : 'Iniciar Avaliação'}
              </button>
              <button
                onClick={() => setStep(AppStep.DASHBOARD)}
                className="w-full py-3.5 bg-white text-slate-700 border border-slate-200 text-lg font-semibold rounded-xl hover:bg-slate-50 hover:text-blue-900 transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <LayoutDashboard size={20} />
                Acompanhar Progresso
              </button>
            </div>
            
            <div className="bg-white p-6 rounded-2xl text-left text-sm text-slate-600 space-y-4 border border-slate-200 shadow-sm mt-8">
              <p className="font-bold text-slate-900 uppercase text-xs tracking-wider flex justify-between items-center">
                <span>A avaliação inclui:</span>
                {profile.name && <span className="text-green-600 flex items-center gap-1"><Save size={12}/> Rascunho salvo</span>}
              </p>
              <ul className="space-y-3">
                 <li className="flex gap-3 items-center"><Camera size={18} className="text-blue-600"/> Fotos em jejum</li>
                 <li className="flex gap-3 items-center"><Ruler size={18} className="text-blue-600"/> Avaliação física completa</li>
                 <li className="flex gap-3 items-center"><Calendar size={18} className="text-blue-600"/> Rotina diária detalhada</li>
                 <li className="flex gap-3 items-center"><Utensils size={18} className="text-blue-600"/> Histórico alimentar e preferências</li>
              </ul>
            </div>
          </div>
          
           {/* Footer */}
           <footer className="mt-12 py-6 text-center text-sm text-slate-500 relative z-10 w-full">
            <p>
                Feito por humanos, aprimorado com IA.{" "}
                <a
                href="https://leandrotelles.com.br"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-900 font-bold hover:underline"
                >
                LT Marketing
                </a>
            </p>
            </footer>
        </div>
      );
    }

    if (step === AppStep.WORKOUT_SESSION && plan && activeWorkoutDayIndex !== null) {
        return (
            <WorkoutSessionView
                day={plan.workoutPlan[activeWorkoutDayIndex]}
                dayIndex={activeWorkoutDayIndex}
                onClose={() => setStep(AppStep.RESULTS)}
                onFinish={handleFinishWorkout}
            />
        );
    }

    if (step === AppStep.RESULTS && plan) {
      return (
        <ResultsView 
          plan={plan} 
          onReset={resetPlan} 
          onBackToDashboard={() => setStep(AppStep.DASHBOARD)}
          onStartWorkout={handleStartWorkout}
        />
      );
    }

    if (step === AppStep.DASHBOARD) {
      return (
        <DashboardView 
          profile={profile} 
          onBack={() => setStep(AppStep.WELCOME)}
          onViewPlan={() => setStep(AppStep.RESULTS)} 
          hasPlan={!!plan}
          onUpdateProfile={handleBatchUpdateProfile}
        />
      );
    }

    if (step === AppStep.GENERATING) {
      const phases = [
        { icon: User, text: "Analisando Perfil...", sub: "Processando medidas e metabolismo basal" },
        { icon: Utensils, text: "Calculando Dieta...", sub: "Definindo macros, opções e substituições" },
        { icon: Dumbbell, text: "Montando Treino...", sub: "Estruturando periodização e volume" },
        { icon: Sparkles, text: "Finalizando Plano...", sub: "Refinando detalhes com IA Avançada" }
      ];
      
      const currentPhase = phases[loadingPhase];
      const PhaseIcon = currentPhase.icon;

      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-100/40 via-slate-50 to-slate-50"></div>
          
          <div className="text-center max-w-md w-full relative z-10 animate-fadeIn">
            
            {/* Custom Complex Loader */}
            <div className="relative w-40 h-40 mx-auto mb-12">
              {/* Pulsing Aura */}
              <div className="absolute inset-0 bg-blue-900/5 rounded-full animate-ping opacity-75"></div>
              
              {/* Outer Orbit */}
              <div className="absolute inset-0 border-[3px] border-slate-200 rounded-full"></div>
              <div className="absolute inset-0 border-[3px] border-blue-900 border-t-transparent border-l-transparent rounded-full animate-spin transition-all duration-700 shadow-[0_0_15px_rgba(30,58,138,0.2)]"></div>
              
              {/* Inner Orbit (Reverse) */}
              <div className="absolute inset-6 border-[3px] border-slate-200 rounded-full"></div>
              <div className="absolute inset-6 border-[3px] border-blue-500 border-b-transparent border-r-transparent rounded-full animate-spin-reverse transition-all duration-700"></div>
              
              {/* Central Hub */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 bg-white rounded-full shadow-xl flex items-center justify-center border border-slate-100 relative z-20">
                   <PhaseIcon className="text-blue-900 animate-bounce-slight transition-all duration-500" size={36} />
                </div>
              </div>

              {/* Orbiting Satellite (Decorative) */}
              <div className="absolute inset-0 animate-spin" style={{ animationDuration: '4s' }}>
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-4 h-4 bg-blue-900 rounded-full shadow-lg border-2 border-white"></div>
              </div>
            </div>

            {/* Text Content */}
            <div className="space-y-2 min-h-[80px]">
              <h2 className="text-2xl font-bold text-slate-900 transition-all duration-500 animate-fadeIn">
                {currentPhase.text}
              </h2>
              <p className="text-slate-500 transition-all duration-500 animate-fadeIn">
                {currentPhase.sub}
              </p>
            </div>

            {/* Progress Stepper */}
            <div className="flex justify-center gap-2 mt-8">
              {phases.map((_, idx) => (
                <div 
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-500 ease-in-out ${
                    idx === loadingPhase ? 'w-10 bg-blue-900' : 'w-2 bg-slate-300'
                  }`}
                />
              ))}
            </div>
            
            <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400 font-medium bg-slate-100 py-1.5 px-4 rounded-full w-fit mx-auto">
                <Brain size={14} />
                <span>Powered by Gemini 2.5</span>
            </div>
          </div>
        </div>
      );
    }

    // Wizard Steps
    const renderStepContent = () => {
      switch (step) {
        case AppStep.BASICS:
          return (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Nome Completo</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => updateProfile('name', e.target.value)}
                    className={getInputClass(profile.name)}
                    placeholder="Seu nome"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Idade</label>
                  <input
                    type="number"
                    value={profile.age}
                    onChange={(e) => updateProfile('age', e.target.value)}
                    className={getInputClass(profile.age)}
                    placeholder="30"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Gênero</label>
                  <select
                    value={profile.gender}
                    onChange={(e) => updateProfile('gender', e.target.value)}
                    className={getInputClass(profile.gender)}
                  >
                    <option value="male">Masculino</option>
                    <option value="female">Feminino</option>
                    <option value="other">Outro</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Objetivo Principal</label>
                  <select
                    value={profile.goal}
                    onChange={(e) => updateProfile('goal', e.target.value)}
                    className={getInputClass(profile.goal)}
                  >
                    <option value="lose_weight">Perder Peso / Secar</option>
                    <option value="gain_muscle">Ganhar Massa / Hipertrofia</option>
                    <option value="maintain">Manter / Recomposição</option>
                    <option value="performance">Performance Atlética</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Altura (cm)</label>
                  <input
                    type="number"
                    value={profile.height}
                    onChange={(e) => updateProfile('height', e.target.value)}
                    className={getInputClass(profile.height)}
                    placeholder="175"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Peso em Jejum (kg)</label>
                  <input
                    type="number"
                    value={profile.currentWeight}
                    onChange={(e) => updateProfile('currentWeight', e.target.value)}
                    className={getInputClass(profile.currentWeight)}
                    placeholder="70.5"
                  />
                  <p className="text-xs text-slate-500">Pese-se imediatamente após acordar.</p>
                </div>
              </div>
            </div>
          );

        case AppStep.PHOTOS:
          return (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg text-sm text-blue-900 mb-6 flex items-start gap-3">
                <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                <div>
                  Por favor, envie fotos em <strong>estado de jejum</strong>. Use roupas justas ou roupa de banho. Essas fotos são essenciais para estimar a composição corporal.
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <PhotoUpload
                  label="Frente"
                  image={profile.photoFront}
                  onChange={(e) => handleFileChange(e, 'photoFront')}
                />
                <PhotoUpload
                  label="Lado"
                  image={profile.photoSide}
                  onChange={(e) => handleFileChange(e, 'photoSide')}
                />
                <PhotoUpload
                  label="Costas"
                  image={profile.photoBack}
                  onChange={(e) => handleFileChange(e, 'photoBack')}
                />
              </div>
            </div>
          );
        
        case AppStep.ASSESSMENT:
          return (
              <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg text-sm text-blue-900 mb-6 flex items-start gap-3">
                    <Ruler size={20} className="flex-shrink-0 mt-0.5" />
                    <div>
                      Informe suas medidas em centímetros (cm). Se não souber alguma, pode deixar em branco, mas quanto mais dados, melhor o plano.
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 uppercase">Pescoço</label>
                          <input type="number" value={measurements.neck} onChange={e => updateMeasurement('neck', e.target.value)} className={getInputClass(measurements.neck)} placeholder="cm" />
                      </div>
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 uppercase">Ombros</label>
                          <input type="number" value={measurements.shoulders} onChange={e => updateMeasurement('shoulders', e.target.value)} className={getInputClass(measurements.shoulders)} placeholder="cm" />
                      </div>
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 uppercase">Peitoral</label>
                          <input type="number" value={measurements.chest} onChange={e => updateMeasurement('chest', e.target.value)} className={getInputClass(measurements.chest)} placeholder="cm" />
                      </div>
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 uppercase">Braços</label>
                          <input type="number" value={measurements.arms} onChange={e => updateMeasurement('arms', e.target.value)} className={getInputClass(measurements.arms)} placeholder="cm" />
                      </div>
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 uppercase">Cintura</label>
                          <input type="number" value={measurements.waist} onChange={e => updateMeasurement('waist', e.target.value)} className={getInputClass(measurements.waist)} placeholder="cm" />
                      </div>
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 uppercase">Quadril</label>
                          <input type="number" value={measurements.hips} onChange={e => updateMeasurement('hips', e.target.value)} className={getInputClass(measurements.hips)} placeholder="cm" />
                      </div>
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 uppercase">Coxas</label>
                          <input type="number" value={measurements.thigh} onChange={e => updateMeasurement('thigh', e.target.value)} className={getInputClass(measurements.thigh)} placeholder="cm" />
                      </div>
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 uppercase">Panturrilhas</label>
                          <input type="number" value={measurements.calf} onChange={e => updateMeasurement('calf', e.target.value)} className={getInputClass(measurements.calf)} placeholder="cm" />
                      </div>
                  </div>
              </div>
          );

        case AppStep.ROUTINE:
          return (
            <div className="space-y-4">
               <RichInput
                  label="Rotina Diária Detalhada"
                  subLabel="Descreva seu dia: horários de acordar, trabalho, intervalos e sono."
                  value={profile.dailyRoutine}
                  onChange={(val) => updateProfile('dailyRoutine', val)}
                  placeholder="Ex: Acordo às 06h, tomo café. Trabalho das 08h às 17h sentado..."
                  minHeight="h-64"
                  context="Rotina diária e horários"
               />
            </div>
          );

        case AppStep.NUTRITION:
          return (
            <div className="space-y-8">
              <RichInput
                label="Dieta Atual / Usual"
                subLabel="O que você come normalmente? Seja sincero sobre quantidades."
                value={profile.currentDiet}
                onChange={(val) => updateProfile('currentDiet', val)}
                placeholder="Café: 2 ovos, pão. Almoço: Prato feito..."
                context="Dieta atual e hábitos alimentares"
              />
              
              <RichInput
                label="Substituições Comuns"
                subLabel="Se não tem o alimento X, o que você usa no lugar?"
                value={profile.foodSubstitutions}
                onChange={(val) => updateProfile('foodSubstitutions', val)}
                placeholder="Se não tem frango, como atum. Se não tem arroz, como macarrão."
                minHeight="h-32"
                context="Substituições de alimentos"
              />
            </div>
          );
        
        case AppStep.PREFERENCES:
          return (
            <div className="space-y-4">
              <RichInput
                  label="Gostos e Aversões"
                  subLabel="Ajude-nos a criar um plano realista que você consiga seguir."
                  value={profile.foodPreferences}
                  onChange={(val) => updateProfile('foodPreferences', val)}
                  placeholder="Amo abacate e salmão. Odeio brócolis e comida apimentada. Sou intolerante a lactose."
                  minHeight="h-48"
                  context="Preferências e restrições alimentares"
              />
            </div>
          );

        case AppStep.TRAINING:
          return (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg text-sm text-blue-900 mb-2 flex items-center gap-2">
                <Dumbbell size={18} />
                Conte-nos sobre seu nível de atividade atual e acesso a equipamentos.
              </div>
              <RichInput
                  label="Rotina de Treino Atual"
                  value={profile.workoutRoutine}
                  onChange={(val) => updateProfile('workoutRoutine', val)}
                  placeholder="Vou à academia 3x na semana. Faço mais máquinas. Faço 20 min de cardio..."
                  minHeight="h-64"
                  context="Histórico de treino e equipamentos disponíveis"
              />
            </div>
          );

        case AppStep.SUPPLEMENTS:
          return (
            <div className="space-y-4">
               <RichInput
                  label="Suplementação Atual e Desejada"
                  subLabel="O que você já toma ou pretende tomar?"
                  value={profile.supplementation}
                  onChange={(val) => updateProfile('supplementation', val)}
                  placeholder="Atualmente tomo Creatina 5g e Whey Protein. Tenho interesse em Pré-treino."
                  minHeight="h-48"
                  context="Suplementos alimentares"
              />
            </div>
          );

        case AppStep.REGISTER:
          return (
            <div className="space-y-8 animate-fadeIn">
               <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-4 items-center">
                  <div className="bg-white p-2 rounded-full shadow-sm text-blue-900">
                     <User size={24} />
                  </div>
                  <div>
                     <h3 className="font-bold text-blue-900">Quase lá!</h3>
                     <p className="text-sm text-blue-700">Crie seu perfil para salvar seu progresso e gerar o plano.</p>
                  </div>
               </div>

               <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="relative group cursor-pointer">
                     <div className={`w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden flex items-center justify-center bg-slate-100 ${!profile.profilePicture ? 'border-dashed border-slate-300' : ''}`}>
                        {profile.profilePicture ? (
                          <img src={profile.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <User size={48} className="text-slate-300" />
                        )}
                        
                        <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                           <Camera className="text-white" size={24} />
                        </div>
                     </div>
                     <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleFileChange(e, 'profilePicture')}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer rounded-full"
                     />
                  </div>
                  <p className="text-sm text-slate-500 font-medium">Foto de Perfil</p>
               </div>

               <div className="space-y-4">
                  <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700">Nome de Exibição</label>
                      <input
                        type="text"
                        value={profile.name}
                        onChange={(e) => updateProfile('name', e.target.value)}
                        className={getInputClass(profile.name)}
                      />
                  </div>
                  <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700">E-mail</label>
                      <div className="relative">
                         <Mail className="absolute left-3 top-3.5 text-slate-400" size={18} />
                         <input
                           type="email"
                           value={email}
                           onChange={(e) => setEmail(e.target.value)}
                           className={`pl-10 ${getInputClass(email)}`}
                           placeholder="seu@email.com"
                         />
                      </div>
                  </div>
                  <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700">Senha</label>
                      <div className="relative">
                         <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
                         <input
                           type="password"
                           value={password}
                           onChange={(e) => setPassword(e.target.value)}
                           className={`pl-10 ${getInputClass(password)}`}
                           placeholder="••••••••"
                         />
                      </div>
                  </div>
               </div>
               
               {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm flex items-center gap-2">
                  <AlertCircle size={18} /> {error}
                </div>
              )}
            </div>
          );

        default:
          return null;
      }
    };

    const getStepInfo = () => {
      switch (step) {
        case AppStep.BASICS: return { title: "Informações Básicas", desc: "Vamos começar com seus dados vitais." };
        case AppStep.PHOTOS: return { title: "Avaliação Corporal", desc: "Envie fotos em jejum para análise." };
        case AppStep.ASSESSMENT: return { title: "Medidas Corporais", desc: "Informe suas medidas para maior precisão." };
        case AppStep.ROUTINE: return { title: "Rotina Diária", desc: "Entender seus horários é fundamental." };
        case AppStep.NUTRITION: return { title: "Nutrição Atual", desc: "Vamos analisar seus hábitos alimentares." };
        case AppStep.PREFERENCES: return { title: "Preferências", desc: "Personalize o plano ao seu paladar." };
        case AppStep.TRAINING: return { title: "Treino e Atividade", desc: "Seu histórico de exercícios e equipamentos." };
        case AppStep.SUPPLEMENTS: return { title: "Suplementação", desc: "Otimizando seus micronutrientes." };
        case AppStep.REGISTER: return { title: "Criar Conta", desc: "Configure seu perfil para salvar o plano." };
        default: return { title: "", desc: "" };
      }
    };

    const { title, desc } = getStepInfo();

    return (
      <StepLayout
        title={title}
        description={desc}
        currentStep={step}
        totalSteps={9}
        onNext={step === AppStep.REGISTER ? handleRegisterAndGenerate : handleNext}
        onBack={step === AppStep.BASICS ? undefined : handleBack}
        isSubmit={step === AppStep.REGISTER}
        isNextDisabled={
          (step === AppStep.BASICS && !profile.name) || 
          (step === AppStep.REGISTER && (!email || !password)) ||
          loading
        }
      >
        {renderStepContent()}
      </StepLayout>
    );
  };

  return (
    <>
      <Notification 
        title={notification.title} 
        message={notification.message} 
        isVisible={notification.visible}
        onClose={() => setNotification(prev => ({ ...prev, visible: false }))}
      />
      {renderCurrentView()}
    </>
  );
}
