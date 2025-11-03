import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { Dashboard } from "@/components/Dashboard";
import { FeedingForm } from "@/components/FeedingForm";
import { SleepForm } from "@/components/SleepForm";
import { DiaperForm } from "@/components/DiaperForm";
import { HealthForm } from "@/components/HealthForm";
import { CalendarHistoryView } from "@/components/CalendarHistoryView";
import { StatsCharts } from "@/components/StatsCharts";
import type { FeedingRecord, SleepRecord, DiaperRecord, HealthRecord } from "@/types/baby";

type ViewType = 'dashboard' | 'feeding' | 'sleep' | 'diaper' | 'health' | 'history' | 'charts';

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [currentBabyId, setCurrentBabyId] = useState<string | null>(null);
  const [feedingRecords, setFeedingRecords] = useState<FeedingRecord[]>([]);
  const [sleepRecords, setSleepRecords] = useState<SleepRecord[]>([]);
  const [diaperRecords, setDiaperRecords] = useState<DiaperRecord[]>([]);
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchCurrentBaby();
    }
  }, [user]);

  useEffect(() => {
    if (currentBabyId) {
      fetchAllRecords();
    }
  }, [currentBabyId]);

  const fetchCurrentBaby = async () => {
    try {
      const { data, error } = await supabase
        .from('baby_caregivers' as any)
        .select('baby_id')
        .eq('user_id', user?.id)
        .single() as any;
      
      if (error) throw error;
      
      if (data) {
        setCurrentBabyId(data.baby_id);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch baby information",
        variant: "destructive",
      });
    }
  };

  const fetchAllRecords = async () => {
    if (!currentBabyId) return;
    
    try {
      const [feedingRes, sleepRes, diaperRes, healthRes] = await Promise.all([
        supabase.from('feeding_records' as any).select('*').eq('baby_id', currentBabyId).order('timestamp', { ascending: false }),
        supabase.from('sleep_records' as any).select('*').eq('baby_id', currentBabyId).order('start_time', { ascending: false }),
        supabase.from('diaper_records' as any).select('*').eq('baby_id', currentBabyId).order('timestamp', { ascending: false }),
        supabase.from('health_records' as any).select('*').eq('baby_id', currentBabyId).order('timestamp', { ascending: false })
      ]);

      if (feedingRes.data) {
        setFeedingRecords(feedingRes.data.map((r: any) => ({
          id: r.id,
          timestamp: r.timestamp,
          type: r.type as FeedingRecord['type'],
          amount: r.amount,
          unit: r.unit as 'ml' | 'oz',
          duration: r.duration,
          notes: r.notes
        })));
      }
      
      if (sleepRes.data) {
        setSleepRecords(sleepRes.data.map((r: any) => ({
          id: r.id,
          startTime: r.start_time,
          endTime: r.end_time,
          duration: r.duration,
          type: r.type as 'night' | 'nap',
          quality: r.quality as 'deep' | 'light' | 'restless' | undefined,
          notes: r.notes
        })));
      }
      
      if (diaperRes.data) {
        setDiaperRecords(diaperRes.data.map((r: any) => ({
          id: r.id,
          timestamp: r.timestamp,
          type: r.type as 'wet' | 'poop' | 'mixed',
          poopColor: r.poop_color as DiaperRecord['poopColor'],
          consistency: r.consistency as DiaperRecord['consistency'],
          notes: r.notes
        })));
      }
      
      if (healthRes.data) {
        setHealthRecords(healthRes.data.map((r: any) => ({
          id: r.id,
          timestamp: r.timestamp,
          type: r.type as 'temperature' | 'weight' | 'height' | 'head',
          value: r.value,
          unit: r.unit,
          location: r.location as HealthRecord['location'],
          notes: r.notes
        })));
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch records",
        variant: "destructive",
      });
    }
  };

  const handleSaveFeeding = async (data: FeedingRecord) => {
    try {
      if (data.id) {
        // Update existing record
        const { error } = await supabase
          .from('feeding_records' as any)
          .update({
            timestamp: data.timestamp,
            type: data.type,
            amount: data.amount,
            unit: data.unit,
            duration: data.duration,
            notes: data.notes
          })
          .eq('id', data.id);
        
        if (error) throw error;
        
        await fetchAllRecords();
      } else {
        // Insert new record (database will generate UUID)
        const { error } = await supabase
          .from('feeding_records' as any)
          .insert([{ 
            timestamp: data.timestamp,
            type: data.type,
            amount: data.amount,
            unit: data.unit,
            duration: data.duration,
            notes: data.notes,
            baby_id: currentBabyId 
          }] as any);
        
        if (error) throw error;
        
        await fetchAllRecords();
      }

      toast({
        title: "Success",
        description: "Feeding record saved successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save feeding record",
        variant: "destructive",
      });
    }
  };

  const handleDeleteFeeding = async (id: string) => {
    try {
      const { error } = await supabase
        .from('feeding_records' as any)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setFeedingRecords(feedingRecords.filter(r => r.id !== id));
      
      toast({
        title: "Success",
        description: "Feeding record deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete feeding record",
        variant: "destructive",
      });
    }
  };

  const handleSaveSleep = async (data: SleepRecord) => {
    try {
      const dbData = {
        start_time: data.startTime,
        end_time: data.endTime,
        duration: data.duration,
        type: data.type,
        quality: data.quality,
        notes: data.notes
      };
      
      if (data.id) {
        // Update existing record
        const { error } = await supabase
          .from('sleep_records' as any)
          .update(dbData)
          .eq('id', data.id);
        
        if (error) throw error;
        
        await fetchAllRecords();
      } else {
        // Insert new record (database will generate UUID)
        const { error } = await supabase
          .from('sleep_records' as any)
          .insert([{ ...dbData, baby_id: currentBabyId }] as any);
        
        if (error) throw error;
        
        await fetchAllRecords();
      }

      toast({
        title: "Success",
        description: "Sleep record saved successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save sleep record",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSleep = async (id: string) => {
    try {
      const { error } = await supabase
        .from('sleep_records' as any)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setSleepRecords(sleepRecords.filter(r => r.id !== id));
      
      toast({
        title: "Success",
        description: "Sleep record deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete sleep record",
        variant: "destructive",
      });
    }
  };

  const handleSaveDiaper = async (data: DiaperRecord) => {
    try {
      const dbData = {
        timestamp: data.timestamp,
        type: data.type,
        poop_color: data.poopColor,
        consistency: data.consistency,
        notes: data.notes
      };
      
      if (data.id) {
        // Update existing record
        const { error } = await supabase
          .from('diaper_records' as any)
          .update(dbData)
          .eq('id', data.id);
        
        if (error) throw error;
        
        await fetchAllRecords();
      } else {
        // Insert new record (database will generate UUID)
        const { error } = await supabase
          .from('diaper_records' as any)
          .insert([{ ...dbData, baby_id: currentBabyId }] as any);
        
        if (error) throw error;
        
        await fetchAllRecords();
      }

      toast({
        title: "Success",
        description: "Diaper record saved successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save diaper record",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDiaper = async (id: string) => {
    try {
      const { error } = await supabase
        .from('diaper_records' as any)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setDiaperRecords(diaperRecords.filter(r => r.id !== id));
      
      toast({
        title: "Success",
        description: "Diaper record deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete diaper record",
        variant: "destructive",
      });
    }
  };

  const handleSaveHealth = async (data: HealthRecord) => {
    try {
      if (data.id) {
        // Update existing record
        const { error } = await supabase
          .from('health_records' as any)
          .update({
            timestamp: data.timestamp,
            type: data.type,
            value: data.value,
            unit: data.unit,
            location: data.location,
            notes: data.notes
          })
          .eq('id', data.id);
        
        if (error) throw error;
        
        await fetchAllRecords();
      } else {
        // Insert new record (database will generate UUID)
        const { error } = await supabase
          .from('health_records' as any)
          .insert([{ 
            timestamp: data.timestamp,
            type: data.type,
            value: data.value,
            unit: data.unit,
            location: data.location,
            notes: data.notes,
            baby_id: currentBabyId 
          }] as any);
        
        if (error) throw error;
        
        await fetchAllRecords();
      }

      toast({
        title: "Success",
        description: "Health record saved successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save health record",
        variant: "destructive",
      });
    }
  };

  const handleDeleteHealth = async (id: string) => {
    try {
      const { error } = await supabase
        .from('health_records' as any)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setHealthRecords(healthRecords.filter(r => r.id !== id));
      
      toast({
        title: "Success",
        description: "Health record deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete health record",
        variant: "destructive",
      });
    }
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

  const handleEditFromHistory = (record: FeedingRecord | SleepRecord | DiaperRecord | HealthRecord, type: 'feeding' | 'sleep' | 'diaper' | 'health') => {
    setCurrentView(type);
  };

  if (loading) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {currentView === 'dashboard' && (
          <Dashboard
            onFeedingClick={() => setCurrentView('feeding')}
            onSleepClick={() => setCurrentView('sleep')}
            onDiaperClick={() => setCurrentView('diaper')}
            onHealthClick={() => setCurrentView('health')}
            onHistoryClick={() => setCurrentView('history')}
            onChartsClick={() => setCurrentView('charts')}
            onExportClick={handleExportData}
          />
        )}

        {currentView === 'charts' && (
          <StatsCharts
            onBack={() => setCurrentView('dashboard')}
            feedingRecords={feedingRecords}
            sleepRecords={sleepRecords}
            diaperRecords={diaperRecords}
            healthRecords={healthRecords}
          />
        )}

        {currentView === 'history' && (
          <CalendarHistoryView
            onBack={() => setCurrentView('dashboard')}
            feedingRecords={feedingRecords}
            sleepRecords={sleepRecords}
            diaperRecords={diaperRecords}
            healthRecords={healthRecords}
            onEditFeeding={(record) => handleEditFromHistory(record, 'feeding')}
            onEditSleep={(record) => handleEditFromHistory(record, 'sleep')}
            onEditDiaper={(record) => handleEditFromHistory(record, 'diaper')}
            onEditHealth={(record) => handleEditFromHistory(record, 'health')}
            onDeleteFeeding={handleDeleteFeeding}
            onDeleteSleep={handleDeleteSleep}
            onDeleteDiaper={handleDeleteDiaper}
            onDeleteHealth={handleDeleteHealth}
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