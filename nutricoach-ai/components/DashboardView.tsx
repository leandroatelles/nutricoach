import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, Calendar, Camera, Scale, TrendingDown, ArrowLeft, Save, Trash2, StickyNote, Flame, User, Settings, FileText, ChevronRight } from 'lucide-react';
import { ProgressEntry, UserProfile } from '../types';
import PhotoUpload from './PhotoUpload';
import SettingsModal from './SettingsModal';

interface DashboardViewProps {
  onBack: () => void;
  onViewPlan: () => void;
  profile?: UserProfile;
  hasPlan: boolean;
  onUpdateProfile: (updatedData: Partial<UserProfile>) => void;
}

const generateMockData = (): ProgressEntry[] => {
  const today = new Date();
  const data: ProgressEntry[] = [];
  
  for (let i = 4; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - (i * 7)); 
    data.push({
      id: Math.random().toString(36).substr(2, 9),
      date: d.toISOString(),
      weight: 85 - (Math.random() * 0.5 + (4-i)),
      calories: Math.floor(2200 + (Math.random() * 400 - 200)), // Random kcal between 2000-2400
      photos: { front: null, side: null, back: null },
      notes: i === 4 ? "Início da jornada!" : "Sentindo mais força, energia melhor."
    });
  }
  return data;
};

const DashboardView: React.FC<DashboardViewProps> = ({ onBack, onViewPlan, profile, hasPlan, onUpdateProfile }) => {
  const [entries, setEntries] = useState<ProgressEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'chart' | 'photos' | 'log'>('chart');
  const [chartType, setChartType] = useState<'weight' | 'calories'>('weight');
  const [isAdding, setIsAdding] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [date1, setDate1] = useState<string>('');
  const [date2, setDate2] = useState<string>('');

  const [newWeight, setNewWeight] = useState('');
  const [newCalories, setNewCalories] = useState('');
  const [newNote, setNewNote] = useState('');
  const [newPhotos, setNewPhotos] = useState<{front: string|null, side: string|null, back: string|null}>({
    front: null, side: null, back: null
  });

  useEffect(() => {
    const saved = localStorage.getItem('nutricoach_progress');
    if (saved) {
      const parsed = JSON.parse(saved);
      setEntries(parsed.sort((a: ProgressEntry, b: ProgressEntry) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    } else {
      const mock = generateMockData();
      setEntries(mock);
      localStorage.setItem('nutricoach_progress', JSON.stringify(mock));
    }
  }, []);

  useEffect(() => {
    if (entries.length >= 2) {
      setDate1(entries[0].id);
      setDate2(entries[entries.length - 1].id);
    } else if (entries.length === 1) {
      setDate1(entries[0].id);
      setDate2(entries[0].id);
    }
  }, [entries]);

  const handleSaveEntry = () => {
    if (!newWeight) return;

    const newEntry: ProgressEntry = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      weight: parseFloat(newWeight),
      calories: newCalories ? parseInt(newCalories) : undefined,
      photos: newPhotos,
      notes: newNote
    };

    const updated = [...entries, newEntry].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setEntries(updated);
    localStorage.setItem('nutricoach_progress', JSON.stringify(updated));
    
    setIsAdding(false);
    setNewWeight('');
    setNewCalories('');
    setNewNote('');
    setNewPhotos({ front: null, side: null, back: null });
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este registro?')) {
      const updated = entries.filter(e => e.id !== id);
      setEntries(updated);
      localStorage.setItem('nutricoach_progress', JSON.stringify(updated));
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>, view: 'front'|'side'|'back') => {
    if (e.target.files?.[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setNewPhotos(prev => ({ ...prev, [view]: url }));
    }
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const renderChart = () => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 animate-fadeIn">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
         <div>
            <h3 className="text-lg font-bold text-slate-900">
               {chartType === 'weight' ? 'Evolução do Peso' : 'Calorias Consumidas'}
            </h3>
            <p className="text-sm text-slate-500">{entries.length} registros acompanhados</p>
         </div>
         
         <div className="flex bg-slate-100 p-1 rounded-lg">
             <button 
                onClick={() => setChartType('weight')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                    chartType === 'weight' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
             >
                Peso
             </button>
             <button 
                onClick={() => setChartType('calories')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                    chartType === 'calories' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
             >
                Calorias
             </button>
         </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'weight' ? (
              <LineChart data={entries} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate} 
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                />
                <YAxis 
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    domain={['auto', 'auto']}
                    unit="kg"
                />
                <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    labelFormatter={(label) => new Date(label).toLocaleDateString('pt-BR')}
                    formatter={(value: number) => [`${value} kg`, 'Peso']}
                />
                <Line 
                    type="monotone" 
                    dataKey="weight" 
                    stroke="#1e3a8a" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#1e3a8a', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, fill: '#3b82f6' }}
                    animationDuration={1000}
                />
              </LineChart>
          ) : (
              <LineChart data={entries} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate} 
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                />
                <YAxis 
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    domain={['auto', 'auto']}
                />
                <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    labelFormatter={(label) => new Date(label).toLocaleDateString('pt-BR')}
                    formatter={(value: number) => [`${value} kcal`, 'Calorias']}
                />
                <Line 
                    type="monotone" 
                    dataKey="calories" 
                    stroke="#ea580c" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#ea580c', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, fill: '#f97316' }}
                    animationDuration={1000}
                    connectNulls
                />
              </LineChart>
          )}
        </ResponsiveContainer>
      </div>
      
      {/* Summary Chips */}
      <div className="mt-6 flex gap-4 overflow-x-auto pb-2">
         <div className="bg-blue-50 px-4 py-3 rounded-xl border border-blue-100 flex items-center gap-3 min-w-[160px]">
            <div className="bg-white p-2 rounded-lg text-blue-900 shadow-sm"><Scale size={18} /></div>
            <div>
                <p className="text-xs text-slate-500 uppercase font-bold">Peso Inicial</p>
                <p className="text-lg font-bold text-blue-900">{entries[0]?.weight} kg</p>
            </div>
         </div>
         <div className="bg-orange-50 px-4 py-3 rounded-xl border border-orange-100 flex items-center gap-3 min-w-[160px]">
            <div className="bg-white p-2 rounded-lg text-orange-600 shadow-sm"><Flame size={18} /></div>
            <div>
                <p className="text-xs text-slate-500 uppercase font-bold">Média Kcal</p>
                <p className="text-lg font-bold text-orange-700">
                    {Math.round(entries.reduce((acc, curr) => acc + (curr.calories || 0), 0) / entries.filter(e => e.calories).length || 0)} kcal
                </p>
            </div>
         </div>
      </div>
    </div>
  );

  const renderComparison = () => {
    const entry1 = entries.find(e => e.id === date1);
    const entry2 = entries.find(e => e.id === date2);

    return (
      <div className="space-y-6 animate-fadeIn">
        {/* Controls */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="w-full md:w-1/3">
             <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Antes / Data A</label>
             <select 
                value={date1} 
                onChange={(e) => setDate1(e.target.value)}
                className="w-full mt-2 p-2.5 border border-gray-300 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-900 outline-none text-sm text-slate-700 font-medium"
             >
                {entries.map(e => (
                    <option key={e.id} value={e.id}>{new Date(e.date).toLocaleDateString('pt-BR')} ({e.weight}kg)</option>
                ))}
             </select>
          </div>
          <div className="text-slate-300 font-bold bg-slate-100 rounded-full w-10 h-10 flex items-center justify-center text-xs">VS</div>
          <div className="w-full md:w-1/3">
             <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Depois / Data B</label>
             <select 
                value={date2} 
                onChange={(e) => setDate2(e.target.value)}
                className="w-full mt-2 p-2.5 border border-gray-300 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-900 outline-none text-sm text-slate-700 font-medium"
             >
                {entries.map(e => (
                    <option key={e.id} value={e.id}>{new Date(e.date).toLocaleDateString('pt-BR')} ({e.weight}kg)</option>
                ))}
             </select>
          </div>
        </div>

        {/* Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
                { key: 'front', label: 'Frente' }, 
                { key: 'side', label: 'Lado' }, 
                { key: 'back', label: 'Costas' }
            ].map((view) => (
                <div key={view.key} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-slate-50 px-4 py-3 border-b border-gray-100 font-semibold text-slate-700 text-center text-sm uppercase tracking-wide">
                        {view.label}
                    </div>
                    <div className="grid grid-cols-2 divide-x divide-gray-100 h-80">
                        <div className="relative bg-slate-100/50">
                            {entry1?.photos[view.key as keyof typeof entry1.photos] ? (
                                <img src={entry1.photos[view.key as keyof typeof entry1.photos]!} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                                    <Camera size={24} />
                                    <span className="text-xs">Sem foto</span>
                                </div>
                            )}
                            <div className="absolute bottom-2 left-2 bg-slate-900/70 text-white text-[10px] px-2 py-1 rounded backdrop-blur-md">
                                {new Date(entry1?.date || '').toLocaleDateString('pt-BR')}
                            </div>
                        </div>
                        <div className="relative bg-slate-100/50">
                            {entry2?.photos[view.key as keyof typeof entry2.photos] ? (
                                <img src={entry2.photos[view.key as keyof typeof entry2.photos]!} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                                    <Camera size={24} />
                                    <span className="text-xs">Sem foto</span>
                                </div>
                            )}
                            <div className="absolute bottom-2 left-2 bg-slate-900/70 text-white text-[10px] px-2 py-1 rounded backdrop-blur-md">
                                {new Date(entry2?.date || '').toLocaleDateString('pt-BR')}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>
    );
  };

  const renderLog = () => (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-fadeIn">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600 border-b border-gray-200 uppercase tracking-wider text-xs font-semibold">
                    <tr>
                        <th className="px-6 py-4">Data</th>
                        <th className="px-6 py-4">Peso</th>
                        <th className="px-6 py-4">Calorias</th>
                        <th className="px-6 py-4">Notas</th>
                        <th className="px-6 py-4 text-right">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {entries.slice().reverse().map(entry => (
                        <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-medium text-slate-900">{new Date(entry.date).toLocaleDateString('pt-BR')}</td>
                            <td className="px-6 py-4 text-blue-900 font-semibold">{entry.weight} kg</td>
                            <td className="px-6 py-4 text-orange-600 font-semibold">{entry.calories ? `${entry.calories} kcal` : '-'}</td>
                            <td className="px-6 py-4 text-slate-500 max-w-xs truncate">{entry.notes || '-'}</td>
                            <td className="px-6 py-4 text-right">
                                <button onClick={() => handleDelete(entry.id)} className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-full transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
      </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-20 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-20 shadow-sm">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
             <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors">
                <ArrowLeft size={20} />
             </button>
             <div className="flex items-center gap-3">
                 {profile?.profilePicture ? (
                     <img src={profile.profilePicture} alt="Profile" className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                 ) : (
                     <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-900 flex items-center justify-center">
                         <User size={20} />
                     </div>
                 )}
                 <div>
                    <h1 className="text-sm font-bold text-slate-900 leading-tight">Olá, {profile?.name?.split(' ')[0] || 'Atleta'}</h1>
                    <p className="text-xs text-slate-500">Painel de Progresso</p>
                 </div>
             </div>
          </div>
          <div className="flex gap-2">
            <button 
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 text-slate-400 hover:bg-slate-100 hover:text-blue-900 rounded-lg transition-colors"
                title="Configurações de Perfil"
            >
                <Settings size={20} />
            </button>
            <button 
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-2 bg-blue-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-950 transition-all shadow-lg shadow-blue-900/20 transform hover:-translate-y-0.5"
            >
                <Plus size={18} /> <span className="hidden sm:inline">Novo Check-in</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 flex-1 w-full">
        
        {/* Banner if Plan Exists */}
        {hasPlan && (
            <div className="bg-gradient-to-r from-slate-900 to-blue-900 rounded-2xl p-6 text-white mb-8 flex flex-col md:flex-row justify-between items-center gap-4 shadow-xl">
                <div>
                    <h2 className="text-xl font-bold mb-1">Seu Plano de Treino e Dieta</h2>
                    <p className="text-blue-200 text-sm">Acesse sua estratégia nutricional e rotina personalizada.</p>
                </div>
                <button 
                    onClick={onViewPlan}
                    className="bg-white text-blue-900 px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-50 transition-colors shadow-lg shadow-black/20"
                >
                    <FileText size={20} />
                    Ver Meu Plano
                    <ChevronRight size={18} />
                </button>
            </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-6 mb-8 border-b border-gray-200">
            {[
                { id: 'chart', label: 'Gráficos', icon: TrendingDown },
                { id: 'photos', label: 'Galeria de Fotos', icon: Camera },
                { id: 'log', label: 'Histórico', icon: Calendar },
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 pb-4 px-1 border-b-2 transition-colors text-sm font-medium ${
                        activeTab === tab.id 
                        ? 'border-blue-900 text-blue-900' 
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                >
                    <tab.icon size={18} />
                    {tab.label}
                </button>
            ))}
        </div>

        {activeTab === 'chart' && renderChart()}
        {activeTab === 'photos' && renderComparison()}
        {activeTab === 'log' && renderLog()}

      </div>

      {/* Footer */}
      <footer className="mt-8 py-6 border-t border-slate-200 text-center text-sm text-slate-500 bg-white">
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

      {/* Settings Modal */}
      {profile && (
        <SettingsModal 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)} 
          profile={profile}
          onSave={onUpdateProfile}
        />
      )}

      {/* Add Entry Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
                    <h2 className="text-xl font-bold text-slate-900">Novo Registro</h2>
                    <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-200 rounded-full transition-colors">✕</button>
                </div>
                
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-700">Peso Atual (kg)</label>
                            <div className="relative">
                                <Scale className="absolute left-3 top-3 text-slate-400" size={20} />
                                <input 
                                    type="number" 
                                    value={newWeight}
                                    onChange={(e) => setNewWeight(e.target.value)}
                                    className={`w-full pl-10 p-3 border rounded-lg outline-none transition-shadow
                                        ${newWeight ? 'border-blue-900 bg-blue-50/20 text-blue-900 font-medium' : 'border-slate-300 focus:ring-2 focus:ring-blue-900 text-slate-700'}
                                    `}
                                    placeholder="ex: 75.5"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                             <label className="block text-sm font-medium text-slate-700">Calorias (Kcal)</label>
                             <div className="relative">
                                <Flame className="absolute left-3 top-3 text-slate-400" size={20} />
                                <input 
                                    type="number" 
                                    value={newCalories}
                                    onChange={(e) => setNewCalories(e.target.value)}
                                    className={`w-full pl-10 p-3 border rounded-lg outline-none transition-shadow
                                        ${newCalories ? 'border-blue-900 bg-blue-50/20 text-blue-900 font-medium' : 'border-slate-300 focus:ring-2 focus:ring-blue-900 text-slate-700'}
                                    `}
                                    placeholder="ex: 2200"
                                />
                             </div>
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                             <label className="block text-sm font-medium text-slate-700">Notas / Como se sente</label>
                             <div className="relative">
                                <StickyNote className="absolute left-3 top-3 text-slate-400" size={20} />
                                <input 
                                    type="text" 
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                    className={`w-full pl-10 p-3 border rounded-lg outline-none transition-shadow
                                        ${newNote ? 'border-blue-900 bg-blue-50/20 text-blue-900 font-medium' : 'border-slate-300 focus:ring-2 focus:ring-blue-900 text-slate-700'}
                                    `}
                                    placeholder="Me sentindo mais disposto..."
                                />
                             </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-3">Fotos de Progresso (Opcional)</label>
                        <div className="grid grid-cols-3 gap-4">
                            <PhotoUpload label="Frente" image={newPhotos.front} onChange={(e) => handlePhotoSelect(e, 'front')} />
                            <PhotoUpload label="Lado" image={newPhotos.side} onChange={(e) => handlePhotoSelect(e, 'side')} />
                            <PhotoUpload label="Costas" image={newPhotos.back} onChange={(e) => handlePhotoSelect(e, 'back')} />
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 bg-slate-50 flex justify-end gap-3 sticky bottom-0">
                    <button onClick={() => setIsAdding(false)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition-colors">Cancelar</button>
                    <button 
                        onClick={handleSaveEntry} 
                        disabled={!newWeight}
                        className={`px-6 py-2.5 rounded-lg font-medium text-white shadow-lg flex items-center gap-2 transition-all ${
                            !newWeight ? 'bg-gray-300 cursor-not-allowed shadow-none' : 'bg-blue-900 hover:bg-blue-950 hover:shadow-blue-900/30'
                        }`}
                    >
                        <Save size={18} /> Salvar
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default DashboardView;