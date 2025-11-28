import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plane, 
  Hotel, 
  CreditCard, 
  Search, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  CheckCircle2,
  Sparkles,
  X,
  Calculator,
  RotateCcw,
  MapPin,
  ArrowRight,
  Trash2,
  Info,
  Scale
} from 'lucide-react';

// --- Data & Types ---

type Category = 'Airline' | 'Hotel' | 'Bank';

interface Program {
  id: string;
  name: string;
  category: Category;
  value: number; // in cents (USD)
  referencePPM?: number; // Reference Points Per Mile (for airlines)
  icon: React.ReactNode;
}

const INITIAL_PROGRAMS: Program[] = [
  // Airlines - referencePPM estimates based on economy saver rates
  { id: 'ua', name: 'United MileagePlus', category: 'Airline', value: 1.3, referencePPM: 10, icon: <Plane className="w-5 h-5 text-blue-500" /> },
  { id: 'as', name: 'Alaska Mileage Plan', category: 'Airline', value: 1.4, referencePPM: 8, icon: <Plane className="w-5 h-5 text-green-600" /> },
  { id: 'dl', name: 'Delta SkyMiles', category: 'Airline', value: 1.2, referencePPM: 13, icon: <Plane className="w-5 h-5 text-red-600" /> },
  { id: 'aa', name: 'American AAdvantage', category: 'Airline', value: 1.7, referencePPM: 9, icon: <Plane className="w-5 h-5 text-blue-700" /> },
  { id: 'jl', name: 'Japan Airlines (JAL)', category: 'Airline', value: 1.5, referencePPM: 8, icon: <Plane className="w-5 h-5 text-red-500" /> },
  { id: 'ce', name: 'China Eastern', category: 'Airline', value: 1.1, referencePPM: 11, icon: <Plane className="w-5 h-5 text-red-700" /> },
  { id: 'sw', name: 'Southwest Rapid Rewards', category: 'Airline', value: 1.3, referencePPM: 16, icon: <Plane className="w-5 h-5 text-blue-400" /> },
  
  // Hotels
  { id: 'mb', name: 'Marriott Bonvoy', category: 'Hotel', value: 0.8, icon: <Hotel className="w-5 h-5 text-orange-500" /> },
  { id: 'hh', name: 'Hilton Honors', category: 'Hotel', value: 0.6, icon: <Hotel className="w-5 h-5 text-blue-600" /> },
  { id: 'hy', name: 'World of Hyatt', category: 'Hotel', value: 1.8, icon: <Hotel className="w-5 h-5 text-indigo-500" /> },
  { id: 'ihg', name: 'IHG One Rewards', category: 'Hotel', value: 0.6, icon: <Hotel className="w-5 h-5 text-orange-600" /> },

  // Banks
  { id: 'chase', name: 'Chase Ultimate Rewards', category: 'Bank', value: 2.05, icon: <CreditCard className="w-5 h-5 text-blue-800" /> },
  { id: 'bilt', name: 'Bilt Rewards', category: 'Bank', value: 2.0, icon: <CreditCard className="w-5 h-5 text-black" /> },
  { id: 'amex', name: 'Amex Membership Rewards', category: 'Bank', value: 2.0, icon: <CreditCard className="w-5 h-5 text-blue-400" /> },
  { id: 'c1', name: 'Capital One Miles', category: 'Bank', value: 1.85, icon: <CreditCard className="w-5 h-5 text-blue-900" /> },
];

const CURRENCIES = [
  { code: 'USD', symbol: '$', rate: 1.0, name: 'US Dollar' },
  { code: 'EUR', symbol: '€', rate: 1.05, name: 'Euro' },
  { code: 'GBP', symbol: '£', rate: 1.26, name: 'British Pound' },
  { code: 'JPY', symbol: '¥', rate: 0.0066, name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', rate: 0.71, name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', rate: 0.65, name: 'Australian Dollar' },
  { code: 'CNY', symbol: '¥', rate: 0.14, name: 'Chinese Yuan' },
];

const AI_KNOWLEDGE_BASE: Record<string, number> = {
  'british airways': 1.5,
  'avios': 1.5,
  'virgin atlantic': 1.4,
  'flying blue': 1.2,
  'air france': 1.2,
  'klm': 1.2,
  'singapore airlines': 1.7,
  'emirates': 1.2,
  'cathay pacific': 1.3,
  'ana': 1.4,
  'wyndham': 1.1,
  'choice hotels': 0.6,
  'best western': 0.6,
  'accor': 2.2,
};

// --- Airport Data for Distance Calculation ---
interface Coords { lat: number; lon: number; }
const AIRPORTS: Record<string, Coords> = {
  // US Major
  'JFK': { lat: 40.6413, lon: -73.7781 }, 'LAX': { lat: 33.9416, lon: -118.4085 },
  'SFO': { lat: 37.6213, lon: -122.3790 }, 'ORD': { lat: 41.9742, lon: -87.9073 },
  'ATL': { lat: 33.6407, lon: -84.4277 }, 'DFW': { lat: 32.8998, lon: -97.0403 },
  'DEN': { lat: 39.8561, lon: -104.6737 }, 'SEA': { lat: 47.4502, lon: -122.3088 },
  'MIA': { lat: 25.7959, lon: -80.2870 }, 'IAD': { lat: 38.9531, lon: -77.4565 },
  'EWR': { lat: 40.6895, lon: -74.1745 }, 'BOS': { lat: 42.3656, lon: -71.0096 },
  // Europe
  'LHR': { lat: 51.4700, lon: -0.4543 }, 'CDG': { lat: 49.0097, lon: 2.5479 },
  'FRA': { lat: 50.0379, lon: 8.5622 }, 'AMS': { lat: 52.3105, lon: 4.7683 },
  'MAD': { lat: 40.4839, lon: -3.5679 }, 'FCO': { lat: 41.8003, lon: 12.2389 },
  'ZRH': { lat: 47.4582, lon: 8.5555 }, 'IST': { lat: 41.2753, lon: 28.7519 },
  // Asia
  'HND': { lat: 35.5494, lon: 139.7798 }, 'NRT': { lat: 35.7720, lon: 140.3929 },
  'SIN': { lat: 1.3644, lon: 103.9915 }, 'HKG': { lat: 22.3080, lon: 113.9185 },
  'ICN': { lat: 37.4602, lon: 126.4407 }, 'PEK': { lat: 40.0799, lon: 116.6031 },
  'PVG': { lat: 31.1443, lon: 121.8083 }, 'BKK': { lat: 13.6900, lon: 100.7501 },
  'DXB': { lat: 25.2532, lon: 55.3657 }, 'DOH': { lat: 25.2731, lon: 51.6080 },
  // Oceania
  'SYD': { lat: -33.9399, lon: 151.1753 }, 'MEL': { lat: -37.6690, lon: 144.8410 },
  'AKL': { lat: -37.0082, lon: 174.7850 },
  // Americas (Non-US)
  'YYZ': { lat: 43.6777, lon: -79.6248 }, 'YVR': { lat: 49.1947, lon: -123.1762 },
  'MEX': { lat: 19.4361, lon: -99.0719 }, 'GRU': { lat: -23.4356, lon: -46.4731 },
};

function getDistance(code1: string, code2: string): number | null {
  const c1 = AIRPORTS[code1.toUpperCase()];
  const c2 = AIRPORTS[code2.toUpperCase()];
  if (!c1 || !c2) return null;

  const R = 3958.8; // Radius of Earth in miles
  const dLat = (c2.lat - c1.lat) * Math.PI / 180;
  const dLon = (c2.lon - c1.lon) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(c1.lat * Math.PI / 180) * Math.cos(c2.lat * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// --- Components ---

interface VisualizerProps {
  label: string;
  userVal: number;
  refVal: number;
  unit: string;
  inverse?: boolean; // If true, LOWER is better (like Points Per Mile)
}

const Visualizer = ({ label, userVal, refVal, unit, inverse = false }: VisualizerProps) => {
  const safeUserVal = isFinite(userVal) && !isNaN(userVal) ? userVal : 0;
  
  // Logic switch: If inverse, smaller is better. If normal, larger is better.
  const maxVal = Math.max(safeUserVal, refVal * 1.5, inverse ? refVal * 2 : 3.0); 
  const userPercent = Math.min(Math.max((safeUserVal / maxVal) * 100, 0), 100);
  const refPercent = Math.min(Math.max((refVal / maxVal) * 100, 0), 100);

  // Ratio calculation
  const ratio = refVal > 0 ? safeUserVal / refVal : 0;
  
  let verdict = "Average";
  let color = "bg-yellow-500";
  let textColor = "text-yellow-600";
  let Icon = CheckCircle2;

  if (inverse) {
    // LOWER is BETTER
    if (ratio <= 0.8) {
      verdict = "Excellent Efficiency"; // Spending few points per mile
      color = "bg-green-500";
      textColor = "text-green-600";
      Icon = TrendingDown; // Trending down is GOOD for cost
    } else if (ratio >= 1.2) {
      verdict = "High Cost"; // Spending many points per mile
      color = "bg-red-500";
      textColor = "text-red-600";
      Icon = TrendingUp; // Trending up is BAD for cost
    } else {
      verdict = "Standard Rate";
    }
  } else {
    // HIGHER is BETTER (Normal CPP)
    if (ratio >= 1.2) {
      verdict = "Excellent Value";
      color = "bg-green-500";
      textColor = "text-green-600";
      Icon = TrendingUp;
    } else if (ratio < 0.8) {
      verdict = "Poor Value";
      color = "bg-red-500";
      textColor = "text-red-600";
      Icon = TrendingDown;
    } else {
      verdict = "Fair Value";
    }
  }

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
      <div className="flex justify-between items-center mb-6 relative z-10">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label} Analysis</span>
        <span className={`text-xs font-bold ${textColor} flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-full shadow-sm border border-gray-100`}>
          <Icon size={14}/>
          {verdict}
        </span>
      </div>

      <div className="relative h-16 w-full mb-2 pt-4">
        {/* Reference Marker */}
        <div 
          className="absolute top-0 bottom-0 w-px bg-gray-400 z-10 flex flex-col items-center group"
          style={{ left: `${refPercent}%` }}
        >
           <div className="absolute -top-6 whitespace-nowrap text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
             Avg: {refVal.toFixed(2)}{unit}
           </div>
           <div className="w-0.5 h-full bg-gray-400"></div>
        </div>

        {/* User Bar */}
        <div 
          className={`absolute top-2 h-8 rounded-r-full ${color} transition-all duration-700 ease-out shadow-sm flex items-center justify-end pr-3 min-w-[2rem]`}
          style={{ width: `${userPercent}%` }}
        >
          <span className="text-white font-bold text-xs drop-shadow-md">{safeUserVal.toFixed(2)}{unit}</span>
        </div>
        
        {/* Background Track */}
        <div className="absolute top-2 h-8 w-full bg-gray-200 rounded-r-full -z-10 opacity-30"></div>
      </div>
      
      <div className="flex justify-between items-center text-[10px] text-gray-500 mt-1 pt-2 border-t border-gray-100">
        <p>You: <span className="font-bold text-gray-700">{safeUserVal.toFixed(2)}{unit}</span></p>
        <p>Goal: {inverse ? '< ' : '> '}<span className="font-bold text-gray-700">{refVal.toFixed(2)}{unit}</span></p>
      </div>
    </div>
  );
};

const SmartAddModal = ({ isOpen, onClose, onAdd }: { isOpen: boolean, onClose: () => void, onAdd: (p: Program) => void }) => {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'idle' | 'searching' | 'found' | 'not_found'>('idle');
  const [foundValue, setFoundValue] = useState<number | null>(null);
  const [manualValue, setManualValue] = useState('');
  const [programType, setProgramType] = useState<Category>('Airline');

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setStatus('idle');
      setFoundValue(null);
      setManualValue('');
    }
  }, [isOpen]);

  const handleSearch = () => {
    if (!query) return;
    setStatus('searching');
    setTimeout(() => {
      const normalized = query.toLowerCase().trim();
      let match = null;
      for (const [key, val] of Object.entries(AI_KNOWLEDGE_BASE)) {
        if (normalized.includes(key) || key.includes(normalized)) {
          match = val;
          break;
        }
      }
      if (match) {
        setFoundValue(match);
        setStatus('found');
      } else {
        setStatus('not_found');
      }
    }, 1500);
  };

  const handleAdd = () => {
    const finalValue = status === 'found' ? foundValue : parseFloat(manualValue);
    if (!finalValue || isNaN(finalValue)) return;
    onAdd({
      id: `custom-${Date.now()}`,
      name: query,
      category: programType,
      value: finalValue,
      icon: <Sparkles className="w-5 h-5 text-purple-500" />
    });
    onClose();
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-gradient-to-r from-purple-700 to-indigo-700 p-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-yellow-300" />
            <h3 className="font-bold text-lg">Add Program via AI</h3>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition-colors"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Program Name</label>
            <div className="flex gap-2">
              <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g., British Airways Avios" className="flex-1 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all shadow-sm" onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
              <button onClick={handleSearch} disabled={status === 'searching' || !query} className="bg-purple-600 text-white px-4 rounded-xl font-bold hover:bg-purple-700 disabled:opacity-50 transition-colors shadow-sm">{status === 'searching' ? '...' : <Search size={20} />}</button>
            </div>
          </div>
          {status === 'searching' && <div className="py-6 text-center text-gray-500 flex flex-col items-center gap-3"><div className="w-6 h-6 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div><p className="text-xs font-medium uppercase tracking-wide">Consulting Knowledge Base...</p></div>}
          {status === 'found' && <div className="bg-green-50 border border-green-200 p-4 rounded-xl animate-in slide-in-from-top-2"><div className="flex items-start gap-3"><CheckCircle2 className="text-green-600 shrink-0 mt-0.5" /><div><h4 className="font-bold text-green-800">Program Found</h4><p className="text-green-700 text-sm mt-1">Estimated value: <strong className="text-lg bg-green-100 px-1 rounded">{foundValue}¢</strong> per point.</p></div></div></div>}
          {status === 'not_found' && <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl animate-in slide-in-from-top-2"><div className="flex items-start gap-3"><AlertCircle className="text-yellow-600 shrink-0 mt-0.5" /><div><h4 className="font-bold text-yellow-800">Not in AI Database</h4><p className="text-yellow-700 text-sm mt-1 mb-3">We couldn't auto-fetch a confident rate. Please enter it manually.</p><div><label className="block text-xs font-bold uppercase text-yellow-800 mb-1">Manual Value (Cents/Point)</label><input type="number" value={manualValue} onChange={(e) => setManualValue(e.target.value)} placeholder="1.2" className="w-full p-2 border border-yellow-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-yellow-500" /></div></div></div></div>}
          {(status === 'found' || status === 'not_found') && <div className="animate-in fade-in duration-300"><label className="block text-sm font-semibold text-gray-700 mb-2">Category</label><div className="flex gap-2">{(['Airline', 'Hotel', 'Bank'] as Category[]).map(cat => (<button key={cat} onClick={() => setProgramType(cat)} className={`flex-1 py-2 text-sm rounded-lg border transition-all font-medium ${programType === cat ? 'bg-gray-800 text-white border-gray-800 shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>{cat}</button>))}</div></div>}
        </div>
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-gray-600 hover:bg-gray-200 rounded-xl transition-colors font-semibold text-sm">Cancel</button>
          <button onClick={handleAdd} disabled={status === 'idle' || status === 'searching' || (status === 'not_found' && !manualValue)} className="px-6 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 hover:shadow-purple-300 disabled:opacity-50 disabled:shadow-none font-semibold text-sm">Add Program</button>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [programs, setPrograms] = useState<Program[]>(INITIAL_PROGRAMS);
  const [selectedProgramId, setSelectedProgramId] = useState<string>(INITIAL_PROGRAMS[0].id);
  const [filter, setFilter] = useState<Category | 'All'>('All');
  
  // Calculator State
  const [points, setPoints] = useState<string>('');
  const [cash, setCash] = useState<string>('');
  const [currency, setCurrency] = useState<string>('USD');
  
  // Mileage State
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [layovers, setLayovers] = useState<string[]>([]);
  
  // UI State
  const [isModalOpen, setModalOpen] = useState(false);

  const selectedProgram = useMemo(() => 
    programs.find(p => p.id === selectedProgramId) || programs[0], 
  [programs, selectedProgramId]);

  const filteredPrograms = useMemo(() => 
    filter === 'All' ? programs : programs.filter(p => p.category === filter),
  [programs, filter]);

  const calculateValue = () => {
    const pts = parseFloat(points);
    const csh = parseFloat(cash);
    if (isNaN(pts) || isNaN(csh) || pts <= 0) return null;
    const rate = CURRENCIES.find(c => c.code === currency)?.rate || 1;
    const cashInUSD = csh * rate;
    const cpp = (cashInUSD * 100) / pts;
    return cpp;
  };

  const userValue = calculateValue();

  // Mileage Logic
  const calculateTotalMiles = () => {
    const segments = [origin, ...layovers, destination].filter(Boolean);
    if (segments.length < 2) return null;

    let total = 0;
    let isValid = true;

    for (let i = 0; i < segments.length - 1; i++) {
      const dist = getDistance(segments[i], segments[i+1]);
      if (dist === null) {
        isValid = false;
        break;
      }
      total += dist;
    }
    return isValid ? total : null;
  };

  const totalMiles = calculateTotalMiles();
  
  // Cost Per Mile Logic
  const getCPM = () => {
    if (!totalMiles || !cash) return null;
    const csh = parseFloat(cash);
    if (isNaN(csh)) return null;
    
    // Convert to USD for standard comparison
    const rate = CURRENCIES.find(c => c.code === currency)?.rate || 1;
    const cashInUSD = csh * rate;
    
    return {
      cash: cashInUSD / totalMiles, // Dollars per mile
      points: points ? (parseFloat(points) / totalMiles) : null // Points per mile
    };
  };

  const cpmMetrics = getCPM();

  const handleReset = () => {
    setPoints('');
    setCash('');
    setCurrency('USD');
    setOrigin('');
    setDestination('');
    setLayovers([]);
  };

  const addLayover = () => setLayovers([...layovers, '']);
  const updateLayover = (idx: number, val: string) => {
    const newL = [...layovers];
    newL[idx] = val;
    setLayovers(newL);
  };
  const removeLayover = (idx: number) => {
    const newL = [...layovers];
    newL.splice(idx, 1);
    setLayovers(newL);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-purple-100 selection:text-purple-900 pb-12">
      
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-2.5 rounded-xl text-white shadow-lg shadow-purple-500/20">
              <Calculator size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-gray-900 leading-none">Redeem<span className="text-purple-600">Wise</span></h1>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide mt-0.5">Points Valuator</p>
            </div>
          </div>
          
          <button onClick={() => setModalOpen(true)} className="group flex items-center gap-2 bg-gray-900 text-white pl-4 pr-5 py-2 rounded-full text-xs font-bold hover:bg-gray-800 transition-all hover:scale-105 active:scale-95 shadow-lg border border-gray-700">
            <Sparkles size={14} className="text-purple-300 group-hover:text-purple-200" />
            <span>Add Program</span>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        
        {/* Intro */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-purple-600 rounded-2xl p-6 sm:p-8 text-white shadow-xl shadow-blue-900/10 relative overflow-hidden ring-1 ring-white/10">
          <div className="relative z-10 max-w-xl">
            <h2 className="text-3xl font-bold mb-3 tracking-tight">Are your points worth it?</h2>
            <p className="text-blue-100 text-lg leading-relaxed font-light">
              Stop guessing. Compare your redemption value against real-time market valuations instantly.
            </p>
          </div>
          <div className="absolute right-0 top-0 h-full w-1/2 bg-white/5 -skew-x-12 transform translate-x-12 mix-blend-overlay"></div>
          <div className="absolute right-20 bottom-0 h-48 w-48 bg-purple-500/40 rounded-full blur-3xl"></div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Program Selection */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[600px]">
              <div className="p-4 border-b border-gray-100 bg-gray-50/80 backdrop-blur">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Filter Programs</label>
                <div className="flex p-1 bg-gray-200/60 rounded-xl">
                  {(['All', 'Airline', 'Hotel', 'Bank'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setFilter(cat)}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        filter === cat 
                          ? 'bg-white text-gray-900 shadow-sm scale-[1.02]' 
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-200">
                {filteredPrograms.map((prog) => (
                  <button
                    key={prog.id}
                    onClick={() => setSelectedProgramId(prog.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all mb-1 group ${
                      selectedProgramId === prog.id
                        ? 'bg-blue-50/80 border-blue-100 ring-1 ring-blue-500/10'
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <div className={`p-2.5 rounded-full transition-colors ${
                      selectedProgramId === prog.id ? 'bg-white shadow-sm scale-110' : 'bg-gray-100 group-hover:bg-white group-hover:shadow-sm'
                    }`}>
                      {prog.icon}
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <div className={`font-semibold truncate ${selectedProgramId === prog.id ? 'text-blue-900' : 'text-gray-700'}`}>
                        {prog.name}
                      </div>
                      <div className="text-xs text-gray-400 flex items-center gap-1.5">
                        <span className="font-medium bg-gray-100 px-1.5 rounded text-gray-500">{prog.category}</span>
                        <span>Ref: {prog.value}¢</span>
                      </div>
                    </div>
                    {selectedProgramId === prog.id && (
                      <div className="animate-in fade-in zoom-in duration-200">
                        <CheckCircle2 size={18} className="text-blue-600" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Calculator */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 relative">
              
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm">
                    {React.cloneElement(selectedProgram.icon as React.ReactElement, { className: "w-8 h-8" })}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{selectedProgram.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-gray-500">Benchmark Value:</span>
                      <span className="font-mono font-bold text-sm text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                        {selectedProgram.value}¢ / pt
                      </span>
                    </div>
                  </div>
                </div>
                
                <button onClick={handleReset} className="text-xs font-semibold text-gray-400 hover:text-gray-600 flex items-center gap-1 self-start sm:self-center px-3 py-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                  <RotateCcw size={14} />
                  Reset
                </button>
              </div>

              {/* Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8 mb-8">
                {/* Cash Input */}
                <div className="space-y-2 group">
                  <label className="text-sm font-semibold text-gray-700 flex items-center justify-between">
                    Cash Price
                    <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider bg-gray-50 px-1.5 py-0.5 rounded">Total Cost</span>
                  </label>
                  <div className="flex rounded-xl shadow-sm ring-1 ring-gray-200 transition-all group-focus-within:ring-2 group-focus-within:ring-blue-500/50 group-focus-within:shadow-md">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <span className="text-gray-400 font-bold text-lg">
                          {CURRENCIES.find(c => c.code === currency)?.symbol}
                        </span>
                      </div>
                      <input type="number" min="0" value={cash} onChange={(e) => setCash(e.target.value)} className="block w-full pl-10 pr-3 py-3.5 rounded-l-xl border-none focus:ring-0 text-gray-900 placeholder-gray-300 font-medium" placeholder="0.00" />
                    </div>
                    <div className="h-full w-px bg-gray-200 my-auto h-8 self-center"></div>
                    <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="bg-transparent border-none text-gray-600 text-sm rounded-r-xl pl-3 pr-8 py-3.5 focus:ring-0 font-bold hover:bg-gray-50 cursor-pointer outline-none">
                      {CURRENCIES.map(c => (<option key={c.code} value={c.code}>{c.code}</option>))}
                    </select>
                  </div>
                </div>

                {/* Points Input */}
                <div className="space-y-2 group">
                  <label className="text-sm font-semibold text-gray-700 flex items-center justify-between">
                    Points Needed
                    <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider bg-gray-50 px-1.5 py-0.5 rounded">Redemption</span>
                  </label>
                  <div className="relative rounded-xl shadow-sm ring-1 ring-gray-200 transition-all group-focus-within:ring-2 group-focus-within:ring-blue-500/50 group-focus-within:shadow-md">
                    <input type="number" min="1" value={points} onChange={(e) => setPoints(e.target.value)} className="block w-full pl-4 pr-12 py-3.5 rounded-xl border-none focus:ring-0 text-gray-900 placeholder-gray-300 font-medium" placeholder="e.g. 25000" />
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <span className="text-gray-400 text-xs font-bold uppercase">PTS</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Airline Stats Section */}
              {selectedProgram.category === 'Airline' && (
                <div className="bg-blue-50/50 rounded-xl border border-blue-100 p-5 mb-8 animate-in fade-in slide-in-from-top-4">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin size={18} className="text-blue-600" />
                    <h4 className="font-bold text-gray-800 text-sm uppercase tracking-wide">Flight Distance & Cost Analysis</h4>
                  </div>
                  
                  <div className="flex flex-col gap-3 mb-4">
                     <div className="flex items-center gap-3">
                       <input 
                         type="text" 
                         value={origin} 
                         onChange={(e) => setOrigin(e.target.value.toUpperCase().slice(0,3))} 
                         placeholder="Origin (e.g. JFK)" 
                         className="flex-1 p-2 text-sm border border-gray-300 rounded-lg uppercase text-center font-bold placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                         maxLength={3}
                       />
                       <ArrowRight size={16} className="text-gray-400" />
                       {layovers.map((lay, idx) => (
                         <div key={idx} className="flex items-center gap-2">
                            <input 
                              type="text" 
                              value={lay} 
                              onChange={(e) => updateLayover(idx, e.target.value.toUpperCase().slice(0,3))} 
                              placeholder="Stop" 
                              className="w-20 p-2 text-sm border border-gray-300 rounded-lg uppercase text-center font-bold placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              maxLength={3}
                            />
                            <button onClick={() => removeLayover(idx)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                            <ArrowRight size={16} className="text-gray-400" />
                         </div>
                       ))}
                       <input 
                         type="text" 
                         value={destination} 
                         onChange={(e) => setDestination(e.target.value.toUpperCase().slice(0,3))} 
                         placeholder="Dest (e.g. LHR)" 
                         className="flex-1 p-2 text-sm border border-gray-300 rounded-lg uppercase text-center font-bold placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                         maxLength={3}
                       />
                     </div>
                     <button onClick={addLayover} className="self-start text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1">+ Add Layover</button>
                  </div>

                  {totalMiles ? (
                    <div className="grid grid-cols-3 gap-4 border-t border-blue-100 pt-4">
                      <div>
                        <div className="text-xs text-gray-500 font-semibold mb-1">Total Distance</div>
                        <div className="text-lg font-bold text-gray-900">{totalMiles.toLocaleString()} <span className="text-xs font-normal text-gray-500">mi</span></div>
                      </div>
                      <div>
                         <div className="text-xs text-gray-500 font-semibold mb-1">Cash / Mile</div>
                         <div className={`text-lg font-bold ${cpmMetrics?.cash && cpmMetrics.cash < 0.05 ? 'text-green-600' : 'text-gray-900'}`}>
                           {cpmMetrics?.cash ? `$${cpmMetrics.cash.toFixed(2)}` : '-'}
                         </div>
                         {cpmMetrics?.cash && cpmMetrics.cash < 0.05 && <div className="text-[10px] text-green-600 font-medium">Great Cash Deal</div>}
                      </div>
                      <div>
                         <div className="text-xs text-gray-500 font-semibold mb-1">Points / Mile</div>
                         <div className="text-lg font-bold text-gray-900">
                           {cpmMetrics?.points ? Math.round(cpmMetrics.points) : '-'} <span className="text-xs font-normal text-gray-500">pts</span>
                         </div>
                      </div>
                    </div>
                  ) : (origin && destination && (
                    <div className="text-xs text-red-500 font-medium bg-red-50 p-2 rounded flex items-center gap-1">
                      <AlertCircle size={14} /> 
                      Routes require valid major airport codes (e.g. JFK, LHR, HND)
                    </div>
                  ))}
                </div>
              )}

              {/* Results Area */}
              {userValue !== null ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* Standard CPP Analysis (Higher is Better) */}
                  <Visualizer 
                    label="Financial Value (CPP)" 
                    userVal={userValue} 
                    refVal={selectedProgram.value} 
                    unit="¢" 
                  />
                  
                  {/* Secondary PPM Analysis (Lower is Better) - Only for Airlines if distance is calc'd */}
                  {selectedProgram.category === 'Airline' && cpmMetrics?.points && selectedProgram.referencePPM && (
                    <Visualizer 
                      label="Cost Efficiency (Pts/Mile)" 
                      userVal={cpmMetrics.points} 
                      refVal={selectedProgram.referencePPM} 
                      unit=" ppm" 
                      inverse={true} 
                    />
                  )}
                </div>
              ) : (
                <div className="mt-8 p-12 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                  <div className="text-gray-300 mb-3 flex justify-center">
                    <Calculator size={48} strokeWidth={1} />
                  </div>
                  <h4 className="text-gray-900 font-semibold">Ready to Calculate</h4>
                  <p className="text-gray-500 text-sm mt-1">Enter the cash price and points required above.</p>
                </div>
              )}

            </div>
          </div>
        </div>
      </main>

      <SmartAddModal 
        isOpen={isModalOpen} 
        onClose={() => setModalOpen(false)} 
        onAdd={(newProg) => {
          setPrograms(prev => [...prev, newProg]);
          setSelectedProgramId(newProg.id);
        }}
      />

    </div>
  );
}