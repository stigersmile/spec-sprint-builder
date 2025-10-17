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
    setFeedingRecords([...feedingRecords, data]);
  };

  const handleSaveSleep = (data: SleepRecord) => {
    setSleepRecords([...sleepRecords, data]);
  };

  const handleSaveDiaper = (data: DiaperRecord) => {
    setDiaperRecords([...diaperRecords, data]);
  };

  const handleSaveHealth = (data: HealthRecord) => {
    setHealthRecords([...healthRecords, data]);
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
          />
        )}
        
        {currentView === 'feeding' && (
          <FeedingForm
            onBack={() => setCurrentView('dashboard')}
            onSave={handleSaveFeeding}
          />
        )}
        
        {currentView === 'sleep' && (
          <SleepForm
            onBack={() => setCurrentView('dashboard')}
            onSave={handleSaveSleep}
          />
        )}
        
        {currentView === 'diaper' && (
          <DiaperForm
            onBack={() => setCurrentView('dashboard')}
            onSave={handleSaveDiaper}
          />
        )}
        
        {currentView === 'health' && (
          <HealthForm
            onBack={() => setCurrentView('dashboard')}
            onSave={handleSaveHealth}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
