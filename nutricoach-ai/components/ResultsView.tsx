import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { AIPlanResponse } from '../types';
import { Utensils, Dumbbell, Activity, Pill, Download, ArrowLeft, RefreshCw, Play, CheckCircle2, Circle, ChevronUp, ChevronDown, Info } from 'lucide-react';
import Modal from './Modal';

interface ResultsViewProps {
  plan: AIPlanResponse;
  onReset: () => void;
  onBackToDashboard: () => void;
  onStartWorkout: (dayIndex: number) => void;
}

interface ExerciseLog {
  completed: boolean;
  weight: string;
  reps: string;
  notes: string;
}

interface WorkoutLogs {
  [key: string]: ExerciseLog; // Key format: "dayIndex-exerciseIndex"
}

const ResultsView: React.FC<ResultsViewProps> = ({ plan, onReset, onBackToDashboard, onStartWorkout }) => {
  const [activeTab, setActiveTab] = useState<'nutrition' | 'training' | 'overview'>('overview');
  const [showResetModal, setShowResetModal] = useState(false);
  const [logs, setLogs] = useState<WorkoutLogs>({});
  
  // State to track expanded accordion items
  const [expandedExercises, setExpandedExercises] = useState<Set<string>>(new Set());

  // Load logs from local storage on mount (Read-only view mostly)
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

  const toggleExercise = (id: string) => {
    const newSet = new Set(expandedExercises);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedExercises(newSet);
  };

  const macroData = [
    { name: 'Proteína', value: plan.dailyMacros.protein, color: '#1e3a8a' }, // Blue 900
    { name: 'Carbo', value: plan.dailyMacros.carbs, color: '#3b82f6' },    // Blue 500
    { name: 'Gordura', value: plan.dailyMacros.fats, color: '#94a3b8' },      // Slate 400
  ];

  const NavButton = ({ tab, icon: Icon, label }: { tab: string, icon: any, label: string }) => (
    <button
      onClick={() => setActiveTab(tab as any)}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium transition-all text-sm sm:text-base border
        ${activeTab === tab 
          ? 'bg-blue-900 text-white border-blue-900 shadow-lg shadow-blue-900/20' 
          : 'bg-white text-slate-600 hover:bg-slate-50 border-gray-200'}`}
    >
      <Icon size={18} />
      {label}
    </button>
  );

  return (
    <>
      {/* --- SCREEN VIEW (Interactive) --- */}
      <div className="min-h-screen bg-slate-50 pb-12 relative print:hidden flex flex-col">
        {/* Header */}
        <header className="bg-slate-900 text-white px-6 py-6 sticky top-0 z-30 shadow-lg">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <button onClick={onBackToDashboard} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700" title="Voltar ao Dashboard">
                  <ArrowLeft size={20} />
              </button>
              <div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Seu Plano</h1>
                  <p className="text-sm text-slate-400">NutriCoach AI</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => window.print()} className="p-2 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors" title="Imprimir / Salvar PDF">
                  <Download size={20} />
              </button>
              <button 
                  onClick={() => setShowResetModal(true)} 
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors border border-slate-700 flex items-center gap-2"
              >
                  <RefreshCw size={16} /> Novo
              </button>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="max-w-6xl mx-auto px-6 py-8 flex-1 w-full">
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar mb-6">
            <NavButton tab="overview" icon={Activity} label="Visão Geral" />
            <NavButton tab="nutrition" icon={Utensils} label="Dieta" />
            <NavButton tab="training" icon={Dumbbell} label="Treino" />
          </div>

          {/* Overview Content */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Strategy Cards */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <div className="p-2 bg-blue-50 rounded-lg"><Utensils className="text-blue-900" size={20} /></div>
                    Estratégia Nutricional
                  </h3>
                  <p className="text-slate-600 leading-relaxed text-sm">{plan.nutritionStrategy}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <div className="p-2 bg-slate-100 rounded-lg"><Dumbbell className="text-slate-700" size={20} /></div>
                    Foco do Treino
                  </h3>
                  <p className="text-slate-600 leading-relaxed text-sm">{plan.workoutStrategy}</p>
                </div>

                {/* Macro Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 md:col-span-2">
                  <h3 className="text-lg font-bold text-slate-900 mb-6 border-b border-gray-100 pb-2">Metas Diárias (Macros)</h3>
                  <div className="flex flex-col sm:flex-row items-center justify-around gap-8">
                    <div className="w-48 h-48 relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={macroData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {macroData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-3xl font-bold text-slate-900">{plan.dailyMacros.calories}</span>
                          <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Kcal</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 w-full max-w-md">
                      <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-100">
                          <div className="text-xs font-semibold text-blue-900 mb-1 uppercase tracking-wide">Proteína</div>
                          <div className="text-2xl font-bold text-blue-900">{plan.dailyMacros.protein}g</div>
                      </div>
                      <div className="text-center p-4 bg-blue-500/10 rounded-xl border border-blue-200">
                          <div className="text-xs font-semibold text-blue-700 mb-1 uppercase tracking-wide">Carbo</div>
                          <div className="text-2xl font-bold text-blue-700">{plan.dailyMacros.carbs}g</div>
                      </div>
                      <div className="text-center p-4 bg-slate-100 rounded-xl border border-slate-200">
                          <div className="text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">Gordura</div>
                          <div className="text-2xl font-bold text-slate-700">{plan.dailyMacros.fats}g</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Supplements */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 md:col-span-2">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <div className="p-2 bg-purple-50 rounded-lg"><Pill className="text-purple-700" size={20} /></div>
                    Suplementação Recomendada
                  </h3>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {plan.supplementRecommendations.map((supp, idx) => (
                      <li key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg text-slate-700 text-sm border border-slate-100">
                        <span className="mt-1.5 w-2 h-2 rounded-full bg-blue-900 flex-shrink-0" />
                        {supp}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Nutrition Content */}
          {activeTab === 'nutrition' && (
            <div className="space-y-4 animate-fadeIn max-w-4xl mx-auto">
              {plan.mealPlan.map((meal, idx) => (
                <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group hover:border-blue-200 transition-colors">
                  <div className="p-5 border-b border-gray-100 bg-slate-50/50 flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-lg text-slate-900">{meal.name}</h4>
                      <span className="text-sm text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded">{meal.time}</span>
                    </div>
                    {meal.macros && (
                      <div className="text-xs font-medium text-slate-500 text-right hidden sm:block bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                        P: {meal.macros.protein}g <span className="text-gray-300 mx-1">|</span> C: {meal.macros.carbs}g <span className="text-gray-300 mx-1">|</span> G: {meal.macros.fats}g
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="mb-4">
                      <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Ingredientes</h5>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {meal.ingredients.map((ing, i) => (
                          <li key={i} className="text-slate-700 text-sm flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0"></span>
                            {ing}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {meal.instructions && (
                      <div className="bg-amber-50 p-4 rounded-lg text-sm text-amber-900 border border-amber-100 flex gap-3">
                          <span className="font-bold">Dica:</span> {meal.instructions}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Training Content - Grid on Desktop */}
          {activeTab === 'training' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn items-start">
              {plan.workoutPlan.map((day, dayIdx) => {
                const exercisesCompleted = day.exercises.filter((_, exIdx) => logs[`${dayIdx}-${exIdx}`]?.completed).length;
                const totalExercises = day.exercises.length;
                const progress = Math.round((exercisesCompleted / totalExercises) * 100);

                return (
                <div key={dayIdx} id={`workout-day-${dayIdx}`} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:border-blue-200 transition-colors h-full flex flex-col">
                  <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-slate-50 text-slate-900">
                      <div className="flex items-center gap-3">
                          <div className="flex flex-col">
                              <h4 className="font-bold text-lg">{day.day}</h4>
                              <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full uppercase tracking-wide w-fit mt-1">
                                  {day.focus}
                              </span>
                          </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                          {exercisesCompleted > 0 && (
                              <div className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">
                                  {progress}%
                              </div>
                          )}
                          <button 
                              onClick={() => onStartWorkout(dayIdx)}
                              className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white border border-transparent rounded-lg text-xs font-bold flex items-center gap-1 transition-all shadow-md shadow-blue-900/10"
                          >
                              <Play size={14} fill="currentColor" /> Treinar
                          </button>
                      </div>
                  </div>

                  {/* Exercise List (Read Only View with Accordion) */}
                  <div className="divide-y divide-gray-100 flex-1">
                      {day.exercises.map((ex, exIdx) => {
                          const logKey = `${dayIdx}-${exIdx}`;
                          const log = logs[logKey] || { completed: false, weight: '', reps: '', notes: '' };
                          const isExpanded = expandedExercises.has(logKey);

                          return (
                              <div 
                                key={exIdx} 
                                onClick={() => toggleExercise(logKey)}
                                className={`
                                  p-4 transition-all duration-300 relative cursor-pointer
                                  hover:bg-slate-50 active:scale-[0.99]
                                  ${log.completed ? 'bg-green-50/30' : 'bg-white'}
                                `}
                              >
                                  <div className="flex flex-col sm:flex-row gap-4 items-center">
                                      
                                      {/* Indicator */}
                                      <div className="flex items-start">
                                          {log.completed ? (
                                              <CheckCircle2 size={24} className="text-green-600" fill="#dcfce7" />
                                          ) : (
                                              <Circle size={24} className="text-slate-200" />
                                          )}
                                      </div>

                                      {/* Exercise Header */}
                                      <div className="flex-1 w-full">
                                          <div className="flex justify-between items-center">
                                              <h5 className={`font-semibold text-base ${log.completed ? 'text-slate-500' : 'text-slate-900'}`}>{ex.name}</h5>
                                              <div className="flex items-center gap-3">
                                                  <div className="text-sm text-slate-500 flex gap-2">
                                                      <span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap">{ex.sets} séries</span>
                                                      <span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap">{ex.reps}</span>
                                                  </div>
                                                  <div className="text-slate-400">
                                                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                  </div>
                                              </div>
                                          </div>
                                          
                                          {/* Collapsible Details */}
                                          {isExpanded && (
                                            <div className="mt-4 pt-4 border-t border-slate-100 text-sm animate-fadeIn">
                                                <div className="grid grid-cols-1 gap-4">
                                                    <div>
                                                        <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Notas</span>
                                                        <p className="text-slate-600 italic">
                                                            {ex.notes || "Sem notas."}
                                                        </p>
                                                    </div>
                                                    
                                                    {(log.weight || log.reps) ? (
                                                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                                            <span className="block text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">Último Registro</span>
                                                            <div className="flex gap-4">
                                                                {log.weight && <span><strong>Carga:</strong> {log.weight}kg</span>}
                                                                {log.reps && <span><strong>Reps:</strong> {log.reps}</span>}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 text-slate-400 bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
                                                            <Info size={14} />
                                                            <span>Inicie o treino para salvar dados.</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                          )}
                                      </div>
                                  </div>
                              </div>
                          );
                      })}
                  </div>
                </div>
              )})}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-8 py-6 border-t border-slate-200 text-center text-sm text-slate-500 bg-slate-50">
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

        <Modal 
          isOpen={showResetModal}
          onClose={() => setShowResetModal(false)}
          onConfirm={onReset}
          title="Gerar Novo Plano?"
          description="Isso apagará o plano atual e você terá que preencher a avaliação novamente. O histórico do Dashboard será mantido."
          confirmText="Sim, novo plano"
          isDestructive={true}
        />
      </div>

      {/* --- PRINT VIEW (Hidden on screen, Visible on Print) --- */}
      <div className="hidden print:block bg-white p-8 font-serif text-black">
         {/* Print Header */}
         <div className="flex justify-between items-center border-b-2 border-black pb-4 mb-6">
            <div>
               <h1 className="text-3xl font-bold uppercase tracking-wide">Plano Personalizado</h1>
               <div className="flex items-center gap-2 text-gray-600 mt-1">
                  <span className="font-bold">NutriCoach AI</span> • Gerado em {new Date().toLocaleDateString('pt-BR')}
               </div>
            </div>
            <div className="text-right">
                <div className="text-lg font-bold">Resumo</div>
                <div className="text-sm">Calorias: {plan.dailyMacros.calories} kcal</div>
                <div className="text-sm">Proteína: {plan.dailyMacros.protein}g</div>
            </div>
         </div>

         {/* Sections */}
         <div className="space-y-8">
            
            {/* Overview Section */}
            <div className="avoid-break">
               <h2 className="text-xl font-bold border-b border-gray-300 mb-3 pb-1 uppercase">1. Estratégia Geral</h2>
               <div className="grid grid-cols-2 gap-8 mb-4">
                  <div>
                      <h3 className="font-bold mb-1">Nutrição</h3>
                      <p className="text-sm text-justify leading-relaxed">{plan.nutritionStrategy}</p>
                  </div>
                  <div>
                      <h3 className="font-bold mb-1">Treino</h3>
                      <p className="text-sm text-justify leading-relaxed">{plan.workoutStrategy}</p>
                  </div>
               </div>
            </div>

            {/* Macros Section */}
            <div className="avoid-break">
                <h2 className="text-xl font-bold border-b border-gray-300 mb-3 pb-1 uppercase">2. Metas de Macronutrientes</h2>
                <table className="w-full text-sm border-collapse border border-gray-300">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="border border-gray-300 p-2">Calorias Totais</th>
                            <th className="border border-gray-300 p-2">Proteínas</th>
                            <th className="border border-gray-300 p-2">Carboidratos</th>
                            <th className="border border-gray-300 p-2">Gorduras</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="border border-gray-300 p-2 text-center font-bold">{plan.dailyMacros.calories} kcal</td>
                            <td className="border border-gray-300 p-2 text-center">{plan.dailyMacros.protein}g</td>
                            <td className="border border-gray-300 p-2 text-center">{plan.dailyMacros.carbs}g</td>
                            <td className="border border-gray-300 p-2 text-center">{plan.dailyMacros.fats}g</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Nutrition Plan */}
            <div className="page-break">
                <h2 className="text-xl font-bold border-b border-gray-300 mb-4 pb-1 uppercase">3. Plano Alimentar</h2>
                <div className="space-y-4">
                    {plan.mealPlan.map((meal, idx) => (
                        <div key={idx} className="avoid-break border border-gray-300 rounded p-4">
                             <div className="flex justify-between items-center mb-2">
                                <span className="font-bold text-lg">{meal.name}</span>
                                <span className="text-sm bg-gray-100 px-2 py-1 rounded border border-gray-200">{meal.time}</span>
                             </div>
                             <div className="text-sm mb-2">
                                <span className="font-bold">Ingredientes:</span>
                                <ul className="list-disc list-inside mt-1 ml-2">
                                    {meal.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
                                </ul>
                             </div>
                             {meal.instructions && (
                                 <div className="text-xs italic text-gray-600 bg-gray-50 p-2 mt-2 border-l-2 border-gray-400">
                                     Nota: {meal.instructions}
                                 </div>
                             )}
                             {meal.macros && (
                                <div className="text-xs text-gray-500 mt-2 text-right">
                                    P: {meal.macros.protein}g | C: {meal.macros.carbs}g | G: {meal.macros.fats}g
                                </div>
                             )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Workout Plan */}
            <div className="page-break">
                <h2 className="text-xl font-bold border-b border-gray-300 mb-4 pb-1 uppercase">4. Rotina de Treino</h2>
                <div className="space-y-6">
                    {plan.workoutPlan.map((day, idx) => (
                        <div key={idx} className="avoid-break">
                            <h3 className="font-bold text-lg mb-2 bg-gray-100 p-2 border border-gray-300">{day.day} - {day.focus}</h3>
                            <table className="w-full text-sm border-collapse border border-gray-300">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="border border-gray-300 p-2 w-1/2">Exercício</th>
                                        <th className="border border-gray-300 p-2">Séries</th>
                                        <th className="border border-gray-300 p-2">Repetições</th>
                                        <th className="border border-gray-300 p-2">Notas</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {day.exercises.map((ex, exIdx) => (
                                        <tr key={exIdx}>
                                            <td className="border border-gray-300 p-2 font-medium">{ex.name}</td>
                                            <td className="border border-gray-300 p-2 text-center">{ex.sets}</td>
                                            <td className="border border-gray-300 p-2 text-center">{ex.reps}</td>
                                            <td className="border border-gray-300 p-2 text-xs italic">{ex.notes || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Supplements */}
            <div className="avoid-break pt-4">
                 <h2 className="text-xl font-bold border-b border-gray-300 mb-3 pb-1 uppercase">5. Suplementação</h2>
                 <ul className="list-disc list-inside space-y-1">
                    {plan.supplementRecommendations.map((s, i) => (
                        <li key={i} className="text-sm">{s}</li>
                    ))}
                 </ul>
            </div>
         </div>
         
         <div className="mt-12 text-center text-xs text-gray-400 border-t pt-4">
            Gerado por NutriCoach AI • Consulte sempre um profissional de saúde antes de iniciar.
         </div>
      </div>
    </>
  );
};

export default ResultsView;