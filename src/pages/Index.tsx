import { useState } from "react";
import { Dashboard } from "@/components/Dashboard";
import { FeedingForm } from "@/components/FeedingForm";
import { SleepForm } from "@/components/SleepForm";
import { DiaperForm } from "@/components/DiaperForm";
import { HealthForm } from "@/components/HealthForm";
import type { FeedingRecord, SleepRecord, DiaperRecord, HealthRecord } from "@/types/baby";

type ViewType = 'dashboard' | 'feeding' | 'sleep' | 'diaper' | 'health';

const Index = () => {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [feedingRecords, setFeedingRecords] = useState<FeedingRecord[]>([]);
  const [sleepRecords, setSleepRecords] = useState<SleepRecord[]>([]);
  const [diaperRecords, setDiaperRecords] = useState<DiaperRecord[]>([]);
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);

  const handleSaveFeeding = (data: FeedingRecord) => {
    const existingIndex = feedingRecords.findIndex(r => r.id === data.id);
    if (existingIndex >= 0) {
      const updated = [...feedingRecords];
      updated[existingIndex] = data;
      setFeedingRecords(updated);
    } else {
      setFeedingRecords([...feedingRecords, data]);
    }
  };

  const handleDeleteFeeding = (id: string) => {
    setFeedingRecords(feedingRecords.filter(r => r.id !== id));
  };

  const handleSaveSleep = (data: SleepRecord) => {
    const existingIndex = sleepRecords.findIndex(r => r.id === data.id);
    if (existingIndex >= 0) {
      const updated = [...sleepRecords];
      updated[existingIndex] = data;
      setSleepRecords(updated);
    } else {
      setSleepRecords([...sleepRecords, data]);
    }
  };

  const handleDeleteSleep = (id: string) => {
    setSleepRecords(sleepRecords.filter(r => r.id !== id));
  };

  const handleSaveDiaper = (data: DiaperRecord) => {
    const existingIndex = diaperRecords.findIndex(r => r.id === data.id);
    if (existingIndex >= 0) {
      const updated = [...diaperRecords];
      updated[existingIndex] = data;
      setDiaperRecords(updated);
    } else {
      setDiaperRecords([...diaperRecords, data]);
    }
  };

  const handleDeleteDiaper = (id: string) => {
    setDiaperRecords(diaperRecords.filter(r => r.id !== id));
  };

  const handleSaveHealth = (data: HealthRecord) => {
    const existingIndex = healthRecords.findIndex(r => r.id === data.id);
    if (existingIndex >= 0) {
      const updated = [...healthRecords];
      updated[existingIndex] = data;
      setHealthRecords(updated);
    } else {
      setHealthRecords([...healthRecords, data]);
    }
  };

  const handleDeleteHealth = (id: string) => {
    setHealthRecords(healthRecords.filter(r => r.id !== id));
  };

  const handleExportData = () => {
    const allData = {
      feeding: feedingRecords,
      sleep: sleepRecords,
      diaper: diaperRecords,
      health: healthRecords,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `baby-records-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {currentView === 'dashboard' && (
          <Dashboard
            onFeedingClick={() => setCurrentView('feeding')}
            onSleepClick={() => setCurrentView('sleep')}
            onDiaperClick={() => setCurrentView('diaper')}
            onHealthClick={() => setCurrentView('health')}
            onExportClick={handleExportData}
          />
        )}
        
        {currentView === 'feeding' && (
          <FeedingForm
            onBack={() => setCurrentView('dashboard')}
            onSave={handleSaveFeeding}
            records={feedingRecords}
            onDelete={handleDeleteFeeding}
          />
        )}
        
        {currentView === 'sleep' && (
          <SleepForm
            onBack={() => setCurrentView('dashboard')}
            onSave={handleSaveSleep}
            records={sleepRecords}
            onDelete={handleDeleteSleep}
          />
        )}
        
        {currentView === 'diaper' && (
          <DiaperForm
            onBack={() => setCurrentView('dashboard')}
            onSave={handleSaveDiaper}
            records={diaperRecords}
            onDelete={handleDeleteDiaper}
          />
        )}
        
        {currentView === 'health' && (
          <HealthForm
            onBack={() => setCurrentView('dashboard')}
            onSave={handleSaveHealth}
            records={healthRecords}
            onDelete={handleDeleteHealth}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
