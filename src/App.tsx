/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Timer, 
  Settings, 
  Home, 
  AlertCircle, 
  Wind, 
  CheckCircle2, 
  ArrowRight, 
  X, 
  Smartphone, 
  Box, 
  RefreshCw,
  ChevronRight,
  ShieldCheck,
  Clock,
  Zap,
  Coffee,
  Globe
} from 'lucide-react';
import { translations, Language } from './translations';

// --- Types & Constants ---

type Screen = 
  | 'ONBOARDING_PERMISSIONS' 
  | 'ONBOARDING_THRESHOLDS' 
  | 'ONBOARDING_APPS' 
  | 'DASHBOARD' 
  | 'SESSION' 
  | 'INTERRUPT' 
  | 'RESET_SELECTION' 
  | 'PHYSICAL_RESET' 
  | 'DIGITAL_RESET_STOP' 
  | 'DIGITAL_RESET_BREATHING' 
  | 'DIGITAL_RESET_REFOCUS' 
  | 'DIGITAL_RESET_RETURN' 
  | 'BREAK_TIME' 
  | 'SETTINGS';

interface AppState {
  resetsToday: number;
  distractionsDetected: number;
  totalFocusTime: number; // in seconds
  currentStreak: number;
  scrollingLimit: number; // minutes
  appSwitchLimit: number; // times
  selectedApps: string[];
  ignoreCount: number;
  language: Language;
}

const DISTRACTING_APPS = [
  { id: 'tiktok', name: 'TikTok', icon: '📱' },
  { id: 'instagram', name: 'Instagram', icon: '📸' },
  { id: 'facebook', name: 'Facebook', icon: '👥' },
  { id: 'twitter', name: 'Twitter', icon: '🐦' },
  { id: 'youtube', name: 'YouTube', icon: '📺' },
];

// --- Components ---

export default function App() {
  const [screen, setScreen] = useState<Screen>('ONBOARDING_PERMISSIONS');
  
  // Detect language
  const getInitialLanguage = (): Language => {
    const browserLang = navigator.language.split('-')[0];
    return browserLang === 'vi' ? 'vi' : 'en';
  };

  const [appState, setAppState] = useState<AppState>({
    resetsToday: 0,
    distractionsDetected: 0,
    totalFocusTime: 0,
    currentStreak: 2,
    scrollingLimit: 3,
    appSwitchLimit: 5,
    selectedApps: ['tiktok', 'instagram'],
    ignoreCount: 0,
    language: getInitialLanguage(),
  });

  const t = (key: string) => {
    const translation = (translations as any)[key];
    return translation?.[appState.language] || translation?.['en'] || key;
  };

  const [sessionTime, setSessionTime] = useState(0);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [distractionTimer, setDistractionTimer] = useState<NodeJS.Timeout | null>(null);

  // Stats tracking
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSessionActive && screen === 'SESSION') {
      interval = setInterval(() => {
        setSessionTime(prev => prev + 1);
        setAppState(prev => ({ ...prev, totalFocusTime: prev.totalFocusTime + 1 }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSessionActive, screen]);

  // Simulate distraction detection
  useEffect(() => {
    if (isSessionActive && screen === 'SESSION') {
      // Randomly trigger distraction every 30-60 seconds for demo purposes
      const timeout = setTimeout(() => {
        setAppState(prev => ({ ...prev, distractionsDetected: prev.distractionsDetected + 1 }));
        setScreen('INTERRUPT');
      }, 45000);
      return () => clearTimeout(timeout);
    }
  }, [isSessionActive, screen]);

  const startSession = () => {
    setSessionTime(0);
    setIsSessionActive(true);
    setScreen('SESSION');
  };

  const endSession = () => {
    setIsSessionActive(false);
    setScreen('BREAK_TIME');
  };

  const handleManualDistraction = () => {
    setAppState(prev => ({ ...prev, distractionsDetected: prev.distractionsDetected + 1 }));
    setScreen('INTERRUPT');
  };

  const handleIgnore = () => {
    if (appState.ignoreCount < 2) {
      setAppState(prev => ({ ...prev, ignoreCount: prev.ignoreCount + 1 }));
      setScreen('SESSION');
      // Re-trigger after some time (simulated)
      setTimeout(() => {
        if (screen === 'SESSION') setScreen('INTERRUPT');
      }, 5000);
    } else {
      // Force reset
      setScreen('RESET_SELECTION');
    }
  };

  const completeReset = () => {
    setAppState(prev => ({ 
      ...prev, 
      resetsToday: prev.resetsToday + 1,
      ignoreCount: 0 
    }));
    setScreen('SESSION');
  };

  // --- Render Helpers ---

  const renderScreen = () => {
    switch (screen) {
      case 'ONBOARDING_PERMISSIONS': return <OnboardingPermissions t={t} onNext={() => setScreen('ONBOARDING_THRESHOLDS')} />;
      case 'ONBOARDING_THRESHOLDS': return <OnboardingThresholds t={t} state={appState} setState={setAppState} onNext={() => setScreen('ONBOARDING_APPS')} />;
      case 'ONBOARDING_APPS': return <OnboardingApps t={t} state={appState} setState={setAppState} onNext={() => setScreen('DASHBOARD')} />;
      case 'DASHBOARD': return <Dashboard t={t} state={appState} onStart={startSession} onDistracted={handleManualDistraction} onSettings={() => setScreen('SETTINGS')} />;
      case 'SESSION': return <Session t={t} time={sessionTime} onEnd={endSession} onDistracted={handleManualDistraction} />;
      case 'INTERRUPT': return <Interrupt t={t} onReset={() => setScreen('RESET_SELECTION')} onIgnore={handleIgnore} ignoreCount={appState.ignoreCount} />;
      case 'RESET_SELECTION': return <ResetSelection t={t} onPhysical={() => setScreen('PHYSICAL_RESET')} onDigital={() => setScreen('DIGITAL_RESET_STOP')} onCancel={() => setScreen('SESSION')} />;
      case 'PHYSICAL_RESET': return <PhysicalReset t={t} onComplete={completeReset} />;
      case 'DIGITAL_RESET_STOP': return <DigitalResetStop t={t} onNext={() => setScreen('DIGITAL_RESET_BREATHING')} />;
      case 'DIGITAL_RESET_BREATHING': return <DigitalResetBreathing t={t} onNext={() => setScreen('DIGITAL_RESET_REFOCUS')} />;
      case 'DIGITAL_RESET_REFOCUS': return <DigitalResetRefocus t={t} onNext={() => setScreen('DIGITAL_RESET_RETURN')} />;
      case 'DIGITAL_RESET_RETURN': return <DigitalResetReturn t={t} onComplete={completeReset} />;
      case 'BREAK_TIME': return <BreakTime t={t} onDone={() => setScreen('DASHBOARD')} />;
      case 'SETTINGS': return <SettingsScreen t={t} state={appState} setState={setAppState} onBack={() => setScreen('DASHBOARD')} />;
      default: return <Dashboard t={t} state={appState} onStart={startSession} onDistracted={handleManualDistraction} onSettings={() => setScreen('SETTINGS')} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] font-sans flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl overflow-hidden relative aspect-[9/19] flex flex-col border-8 border-[#1E293B]">
        {/* Status Bar Mockup */}
        <div className="h-8 bg-white flex items-center justify-between px-8 pt-2">
          <span className="text-xs font-bold">9:41</span>
          <div className="flex gap-1">
            <div className="w-4 h-2 bg-black rounded-full"></div>
            <div className="w-2 h-2 bg-black rounded-full"></div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={screen}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col overflow-y-auto"
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// --- Sub-Screens ---

function OnboardingPermissions({ t, onNext }: { t: any, onNext: () => void }) {
  return (
    <div className="p-8 flex flex-col h-full items-center text-center">
      <div className="mt-12 mb-8 p-6 bg-blue-50 rounded-full">
        <ShieldCheck className="w-16 h-16 text-blue-500" />
      </div>
      <h1 className="text-2xl font-bold mb-4">{t('focus_reset')}</h1>
      <p className="text-slate-500 mb-8">
        {t('onboarding_desc')}
      </p>
      <div className="space-y-4 w-full mb-auto">
        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl text-left">
          <Smartphone className="text-blue-500" />
          <div>
            <p className="font-semibold text-sm">{t('screen_time')}</p>
            <p className="text-xs text-slate-400">{t('screen_time_desc')}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl text-left">
          <RefreshCw className="text-blue-500" />
          <div>
            <p className="font-semibold text-sm">{t('app_switching')}</p>
            <p className="text-xs text-slate-400">{t('app_switching_desc')}</p>
          </div>
        </div>
      </div>
      <button 
        onClick={onNext}
        className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
      >
        {t('allow_access')} <ArrowRight size={20} />
      </button>
    </div>
  );
}

function OnboardingThresholds({ t, state, setState, onNext }: { t: any, state: AppState, setState: any, onNext: () => void }) {
  return (
    <div className="p-8 flex flex-col h-full">
      <h1 className="text-2xl font-bold mb-2">{t('set_thresholds')}</h1>
      <p className="text-slate-500 mb-8 text-sm">{t('interrupt_prompt')}</p>
      
      <div className="space-y-8 mb-auto">
        <div>
          <div className="flex justify-between mb-2">
            <label className="font-semibold">{t('scrolling_limit')}</label>
            <span className="text-blue-600 font-bold">{state.scrollingLimit} {t('min')}</span>
          </div>
          <input 
            type="range" min="1" max="10" step="1"
            value={state.scrollingLimit}
            onChange={(e) => setState({ ...state, scrollingLimit: parseInt(e.target.value) })}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <p className="text-xs text-slate-400 mt-2">{t('scrolling_limit_desc')}</p>
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <label className="font-semibold">{t('app_switch_limit')}</label>
            <span className="text-blue-600 font-bold">{state.appSwitchLimit} {t('times')}</span>
          </div>
          <input 
            type="range" min="2" max="15" step="1"
            value={state.appSwitchLimit}
            onChange={(e) => setState({ ...state, appSwitchLimit: parseInt(e.target.value) })}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <p className="text-xs text-slate-400 mt-2">{t('app_switch_limit_desc')}</p>
        </div>
      </div>

      <button 
        onClick={onNext}
        className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold mt-8"
      >
        {t('next_step')}
      </button>
    </div>
  );
}

function OnboardingApps({ t, state, setState, onNext }: { t: any, state: AppState, setState: any, onNext: () => void }) {
  const toggleApp = (id: string) => {
    const newApps = state.selectedApps.includes(id)
      ? state.selectedApps.filter(a => a !== id)
      : [...state.selectedApps, id];
    setState({ ...state, selectedApps: newApps });
  };

  return (
    <div className="p-8 flex flex-col h-full">
      <h1 className="text-2xl font-bold mb-2">{t('select_apps')}</h1>
      <p className="text-slate-500 mb-8 text-sm">{t('select_apps_desc')}</p>
      
      <div className="grid grid-cols-1 gap-3 mb-auto">
        {DISTRACTING_APPS.map(app => (
          <button
            key={app.id}
            onClick={() => toggleApp(app.id)}
            className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
              state.selectedApps.includes(app.id) 
                ? 'border-blue-600 bg-blue-50' 
                : 'border-slate-100 bg-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{app.icon}</span>
              <span className="font-semibold">{t(app.id)}</span>
            </div>
            {state.selectedApps.includes(app.id) && <CheckCircle2 className="text-blue-600" size={20} />}
          </button>
        ))}
      </div>

      <button 
        onClick={onNext}
        className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold mt-8"
      >
        {t('get_started')}
      </button>
    </div>
  );
}

function Dashboard({ t, state, onStart, onDistracted, onSettings }: { t: any, state: AppState, onStart: () => void, onDistracted: () => void, onSettings: () => void }) {
  return (
    <div className="p-6 flex flex-col h-full bg-slate-50">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('welcome_back')}</h2>
          <h1 className="text-2xl font-bold">{t('focus_reset')}</h1>
        </div>
        <button onClick={onSettings} className="p-2 bg-white rounded-xl shadow-sm">
          <Settings size={20} className="text-slate-600" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
          <RefreshCw className="text-blue-500 mb-2" size={20} />
          <p className="text-2xl font-bold">{state.resetsToday}</p>
          <p className="text-xs text-slate-400">{t('resets_today')}</p>
        </div>
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
          <AlertCircle className="text-orange-500 mb-2" size={20} />
          <p className="text-2xl font-bold">{state.distractionsDetected}</p>
          <p className="text-xs text-slate-400">{t('distractions_detected')}</p>
        </div>
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
          <Clock className="text-green-500 mb-2" size={20} />
          <p className="text-2xl font-bold">{Math.floor(state.totalFocusTime / 60)} {t('min')}</p>
          <p className="text-xs text-slate-400">{t('total_focus_time')}</p>
        </div>
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
          <Zap className="text-yellow-500 mb-2" size={20} />
          <p className="text-2xl font-bold">{state.currentStreak}</p>
          <p className="text-xs text-slate-400">{t('current_streak')}</p>
        </div>
      </div>

      <div className="mt-auto space-y-4">
        <button 
          onClick={onStart}
          className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-bold text-lg shadow-lg shadow-blue-200 flex items-center justify-center gap-3"
        >
          <Timer size={24} /> {t('start_session')}
        </button>
        <button 
          onClick={onDistracted}
          className="w-full py-4 bg-white text-slate-600 rounded-[2rem] font-semibold border border-slate-200 flex items-center justify-center gap-2"
        >
          <AlertCircle size={18} /> {t('im_distracted')}
        </button>
      </div>
    </div>
  );
}

function Session({ t, time, onEnd, onDistracted }: { t: any, time: number, onEnd: () => void, onDistracted: () => void }) {
  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-8 flex flex-col h-full items-center justify-center text-center bg-blue-600 text-white">
      <div className="mb-12">
        <motion.div 
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="w-64 h-64 rounded-full border-4 border-blue-400 flex items-center justify-center relative"
        >
          <div className="absolute inset-0 rounded-full border-4 border-white opacity-20 animate-ping"></div>
          <span className="text-6xl font-mono font-bold">{formatTime(time)}</span>
        </motion.div>
      </div>
      
      <h2 className="text-2xl font-bold mb-2">{t('focusing')}</h2>
      <p className="text-blue-100 mb-12">{t('focusing_desc')}</p>

      <div className="w-full space-y-4">
        <button 
          onClick={onDistracted}
          className="w-full py-4 bg-blue-500 text-white rounded-2xl font-bold border border-blue-400"
        >
          {t('im_distracted')}
        </button>
        <button 
          onClick={onEnd}
          className="w-full py-4 bg-white text-blue-600 rounded-2xl font-bold"
        >
          {t('end_session')}
        </button>
      </div>
    </div>
  );
}

function Interrupt({ t, onReset, onIgnore, ignoreCount }: { t: any, onReset: () => void, onIgnore: () => void, ignoreCount: number }) {
  return (
    <div className="p-8 flex flex-col h-full items-center justify-center text-center bg-orange-500 text-white">
      <AlertCircle size={80} className="mb-8 animate-bounce" />
      <h1 className="text-3xl font-bold mb-4">{t('distraction_detected')}</h1>
      <p className="text-orange-100 mb-12 text-lg">
        {t('distraction_desc')}
      </p>

      <div className="w-full space-y-4">
        <button 
          onClick={onReset}
          className="w-full py-5 bg-white text-orange-600 rounded-3xl font-bold text-xl shadow-xl"
        >
          {t('reset_focus')}
        </button>
        {ignoreCount < 2 && (
          <button 
            onClick={onIgnore}
            className="w-full py-4 bg-orange-600 text-white rounded-3xl font-semibold border border-orange-400"
          >
            {t('ignore')} ({2 - ignoreCount} {t('left')})
          </button>
        )}
      </div>
    </div>
  );
}

function ResetSelection({ t, onPhysical, onDigital, onCancel }: { t: any, onPhysical: () => void, onDigital: () => void, onCancel: () => void }) {
  return (
    <div className="p-8 flex flex-col h-full bg-slate-50">
      <div className="flex justify-between items-center mb-8">
         <h1 className="text-2xl font-bold">{t('choose_reset')}</h1>
        <button onClick={onCancel} className="p-2"><X /></button>
      </div>
      
      <div className="space-y-6">
        <button 
          onClick={onPhysical}
          className="w-full p-6 bg-white rounded-[2.5rem] border-2 border-transparent hover:border-blue-600 text-left shadow-sm group transition-all"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-4 bg-blue-50 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Box size={32} />
            </div>
            <div>
              <h3 className="font-bold text-lg">{t('physical_reset')}</h3>
              <p className="text-xs text-slate-400">{t('physical_reset_desc')}</p>
            </div>
          </div>
          <p className="text-sm text-slate-500">{t('physical_reset_long')}</p>
        </button>

        <button 
          onClick={onDigital}
          className="w-full p-6 bg-white rounded-[2.5rem] border-2 border-transparent hover:border-green-600 text-left shadow-sm group transition-all"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-4 bg-green-50 rounded-2xl text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
              <Wind size={32} />
            </div>
            <div>
              <h3 className="font-bold text-lg">{t('digital_reset')}</h3>
              <p className="text-xs text-slate-400">{t('digital_reset_desc')}</p>
            </div>
          </div>
          <p className="text-sm text-slate-500">{t('digital_reset_long')}</p>
        </button>
      </div>
    </div>
  );
}

function PhysicalReset({ t, onComplete }: { t: any, onComplete: () => void }) {
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-8 flex flex-col h-full items-center justify-center text-center bg-slate-900 text-white">
      <Box size={64} className="text-blue-400 mb-8" />
      <h1 className="text-2xl font-bold mb-4">{t('physical_reset')}</h1>
      <p className="text-slate-400 mb-12">
        {t('physical_reset_prompt')}
      </p>

      <div className="text-7xl font-mono font-bold mb-12 text-blue-400">
        {formatTime(timeLeft)}
      </div>

      <button 
        disabled={timeLeft > 0}
        onClick={onComplete}
        className={`w-full py-5 rounded-3xl font-bold text-xl transition-all ${
          timeLeft > 0 ? 'bg-slate-800 text-slate-600' : 'bg-blue-600 text-white shadow-lg shadow-blue-900'
        }`}
      >
        {timeLeft > 0 ? t('focusing') : t('im_done')}
      </button>
    </div>
  );
}

function DigitalResetStop({ t, onNext }: { t: any, onNext: () => void }) {
  return (
    <div className="p-8 flex flex-col h-full items-center justify-center text-center bg-white">
      <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-8">
        <X size={48} className="text-red-500" />
      </div>
      <h1 className="text-4xl font-black mb-4">{t('stop')}</h1>
      <p className="text-xl text-slate-500 mb-12">{t('lets_focus')}</p>
      <button 
        onClick={onNext}
        className="w-full py-5 bg-slate-900 text-white rounded-3xl font-bold text-xl flex items-center justify-center gap-2"
      >
        {t('next')} <ArrowRight />
      </button>
    </div>
  );
}

function DigitalResetBreathing({ t, onNext }: { t: any, onNext: () => void }) {
  const [phase, setPhase] = useState<'inhale' | 'exhale' | 'completed'>('inhale');
  const [timer, setTimer] = useState(2);
  const [cycle, setCycle] = useState(1);

  useEffect(() => {
    if (phase === 'completed') return;

    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev > 0) return prev - 1;
        return 0; // Stay at 0 for the transition
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, cycle]);

  // Handle phase transitions when timer reaches 0
  useEffect(() => {
    if (timer === 0 && phase !== 'completed') {
      const timeout = setTimeout(() => {
        if (phase === 'inhale') {
          setPhase('exhale');
          setTimer(3);
        } else if (phase === 'exhale') {
          if (cycle < 3) {
            setCycle(c => c + 1);
            setPhase('inhale');
            setTimer(2);
          } else {
            setPhase('completed');
          }
        }
      }, 500); // Brief pause at 0
      return () => clearTimeout(timeout);
    }
  }, [timer, phase, cycle]);

  return (
    <div className="p-8 flex flex-col h-full items-center justify-center text-center bg-green-50">
      <div className="mb-4 text-green-600 font-bold uppercase tracking-widest">
        {t('cycle')} {cycle}/3
      </div>
      
      <div className="relative w-72 h-72 flex items-center justify-center mb-12">
        <motion.div
          animate={{
            scale: phase === 'inhale' ? 1.5 : 1,
            backgroundColor: phase === 'inhale' ? '#BBF7D0' : '#DCFCE7'
          }}
          transition={{ 
            duration: phase === 'inhale' ? 2 : 3, 
            ease: "easeInOut" 
          }}
          className="absolute inset-0 rounded-full"
        />
        <div className="relative z-10 flex flex-col items-center">
          <h2 className="text-4xl font-bold text-green-800 mb-2">
            {phase === 'completed' ? t('done') : phase === 'inhale' ? t('inhale') : t('exhale')}
          </h2>
          {phase !== 'completed' && (
            <span className="text-6xl font-mono font-bold text-green-900">{timer}</span>
          )}
        </div>
      </div>

      {phase === 'completed' ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-green-700 mb-8 font-medium">{t('breathing_done')}</p>
          <button 
            onClick={onNext}
            className="w-full py-5 bg-green-600 text-white rounded-3xl font-bold text-xl"
          >
            {t('next')}
          </button>
        </motion.div>
      ) : (
        <p className="text-green-600 font-medium italic">{t('follow_circle')}</p>
      )}
    </div>
  );
}

function DigitalResetRefocus({ t, onNext }: { t: any, onNext: () => void }) {
  const [q1, setQ1] = useState('');
  const [q2, setQ2] = useState('');

  return (
    <div className="p-8 flex flex-col h-full bg-white">
      <h1 className="text-2xl font-bold mb-8">{t('refocus')}</h1>
      
      <div className="space-y-8 mb-auto">
        <div>
          <label className="block text-sm font-bold text-slate-400 uppercase mb-3">{t('refocus_q1')}</label>
          <textarea 
            value={q1}
            onChange={(e) => setQ1(e.target.value)}
            placeholder={t('refocus_q1_placeholder')}
            className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 focus:border-blue-500 outline-none h-24 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-400 uppercase mb-3">{t('refocus_q2')}</label>
          <div className="grid grid-cols-1 gap-2 mb-3">
            {[t('refocus_opt1'), t('refocus_opt2'), t('refocus_opt3')].map(opt => (
              <button 
                key={opt}
                onClick={() => setQ2(opt)}
                className={`text-left p-3 rounded-xl text-sm border ${q2 === opt ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-100'}`}
              >
                {opt}
              </button>
            ))}
          </div>
          <input 
            value={q2}
            onChange={(e) => setQ2(e.target.value)}
            placeholder={t('refocus_q2_placeholder')}
            className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      <button 
        disabled={!q1 || !q2}
        onClick={onNext}
        className="w-full py-5 bg-blue-600 text-white rounded-3xl font-bold text-xl mt-8 disabled:opacity-50"
      >
        {t('next')}
      </button>
    </div>
  );
}

function DigitalResetReturn({ t, onComplete }: { t: any, onComplete: () => void }) {
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-8 flex flex-col h-full items-center justify-center text-center bg-blue-50">
      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-8">
        <ArrowRight size={40} className="text-blue-600" />
      </div>
      <h1 className="text-2xl font-bold mb-4">{t('two_minutes_title')}</h1>
      <p className="text-slate-500 mb-12">
        {t('two_minutes_desc')}
      </p>

      <div className="text-7xl font-mono font-bold mb-12 text-blue-600">
        {formatTime(timeLeft)}
      </div>

      <button 
        onClick={onComplete}
        className="w-full py-5 bg-blue-600 text-white rounded-3xl font-bold text-xl shadow-lg shadow-blue-200"
      >
        {t('continue_session')}
      </button>
    </div>
  );
}

function BreakTime({ t, onDone }: { t: any, onDone: () => void }) {
  return (
    <div className="p-8 flex flex-col h-full bg-green-50">
      <h1 className="text-3xl font-bold mb-2">{t('session_ended')}</h1>
      <p className="text-green-700 mb-8">{t('break_desc')}</p>
      
      <div className="space-y-4 mb-auto">
        <div className="bg-white p-4 rounded-3xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-blue-50 rounded-2xl text-blue-500"><Coffee size={24} /></div>
          <div>
            <p className="font-bold">{t('break_opt1')}</p>
            <p className="text-xs text-slate-400">{t('break_opt1_desc')}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-3xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-green-50 rounded-2xl text-green-500"><Wind size={24} /></div>
          <div>
            <p className="font-bold">{t('break_opt2')}</p>
            <p className="text-xs text-slate-400">{t('break_opt2_desc')}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-3xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-purple-50 rounded-2xl text-purple-500"><Smartphone size={24} /></div>
          <div>
            <p className="font-bold">{t('break_opt3')}</p>
            <p className="text-xs text-slate-400">{t('break_opt3_desc')}</p>
          </div>
        </div>
      </div>

      <button 
        onClick={onDone}
        className="w-full py-5 bg-green-600 text-white rounded-3xl font-bold text-xl mt-8"
      >
        {t('back_to_dashboard')}
      </button>
    </div>
  );
}

function SettingsScreen({ t, state, setState, onBack }: { t: any, state: AppState, setState: any, onBack: () => void }) {
  return (
    <div className="p-8 flex flex-col h-full bg-white">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 bg-slate-50 rounded-xl"><X size={20} /></button>
        <h1 className="text-2xl font-bold">{t('settings')}</h1>
      </div>

      <div className="space-y-8 overflow-y-auto pb-8">
        <section>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{t('language')}</h3>
          <div className="flex gap-2">
            <button 
              onClick={() => setState({ ...state, language: 'en' })}
              className={`flex-1 py-3 rounded-xl border-2 transition-all font-semibold ${state.language === 'en' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-100 text-slate-500'}`}
            >
              {t('en_lang')}
            </button>
            <button 
              onClick={() => setState({ ...state, language: 'vi' })}
              className={`flex-1 py-3 rounded-xl border-2 transition-all font-semibold ${state.language === 'vi' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-100 text-slate-500'}`}
            >
              {t('vi_lang')}
            </button>
          </div>
        </section>

        <section>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{t('thresholds')}</h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <label className="font-semibold text-sm">{t('scrolling_limit')}</label>
                <span className="text-blue-600 font-bold text-sm">{state.scrollingLimit} {t('min')}</span>
              </div>
              <input 
                type="range" min="1" max="10" step="1"
                value={state.scrollingLimit}
                onChange={(e) => setState({ ...state, scrollingLimit: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <label className="font-semibold text-sm">{t('app_switch_limit')}</label>
                <span className="text-blue-600 font-bold text-sm">{state.appSwitchLimit} {t('times')}</span>
              </div>
              <input 
                type="range" min="2" max="15" step="1"
                value={state.appSwitchLimit}
                onChange={(e) => setState({ ...state, appSwitchLimit: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{t('blocked_apps')}</h3>
          <div className="space-y-2">
            {DISTRACTING_APPS.map(app => (
              <div key={app.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <span>{app.icon}</span>
                  <span className="text-sm font-medium">{t(app.id)}</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={state.selectedApps.includes(app.id)}
                  onChange={() => {
                    const newApps = state.selectedApps.includes(app.id)
                      ? state.selectedApps.filter(a => a !== app.id)
                      : [...state.selectedApps, app.id];
                    setState({ ...state, selectedApps: newApps });
                  }}
                  className="w-5 h-5 accent-blue-600"
                />
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{t('notifications')}</h3>
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
            <span className="text-sm font-medium">{t('focus_reminders')}</span>
            <div className="w-10 h-6 bg-blue-600 rounded-full relative">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
