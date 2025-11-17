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
import { BabySelector } from "@/components/BabySelector";
import { ActivityFeed } from "@/components/ActivityFeed";
import { useBabyCollaboration, useRealtimeRecords } from "@/hooks/useBabyCollaboration";
import type { FeedingRecord, SleepRecord, DiaperRecord, HealthRecord } from "@/types/baby";
import { Badge } from "@/components/ui/badge";

type ViewType = 'dashboard' | 'feeding' | 'sleep' | 'diaper' | 'health' | 'history' | 'charts' | 'activity';

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [feedingRecords, setFeedingRecords] = useState<FeedingRecord[]>([]);
  const [sleepRecords, setSleepRecords] = useState<SleepRecord[]>([]);
  const [diaperRecords, setDiaperRecords] = useState<DiaperRecord[]>([]);
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);

  // Use baby collaboration hook
  const { selectedBabyId, handleBabyChange, canEdit, currentRole } = useBabyCollaboration();

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
    if (user && selectedBabyId) {
      fetchAllRecords();
    }
  }, [user, selectedBabyId]);

  // Set up realtime subscriptions for all record types
  useRealtimeRecords(selectedBabyId, "feeding_records", fetchAllRecords);
  useRealtimeRecords(selectedBabyId, "sleep_records", fetchAllRecords);
  useRealtimeRecords(selectedBabyId, "diaper_records", fetchAllRecords);
  useRealtimeRecords(selectedBabyId, "health_records", fetchAllRecords);

  const fetchAllRecords = async () => {
    if (!selectedBabyId) return;

    try {
      const [feedingRes, sleepRes, diaperRes, healthRes] = await Promise.all([
        supabase
          .from('feeding_records')
          .select('*')
          .eq('baby_id', selectedBabyId)
          .order('timestamp', { ascending: false }),
        supabase
          .from('sleep_records')
          .select('*')
          .eq('baby_id', selectedBabyId)
          .order('start_time', { ascending: false }),
        supabase
          .from('diaper_records')
          .select('*')
          .eq('baby_id', selectedBabyId)
          .order('timestamp', { ascending: false }),
        supabase
          .from('health_records')
          .select('*')
          .eq('baby_id', selectedBabyId)
          .order('timestamp', { ascending: false })
      ]);

      if (feedingRes.data) {
        setFeedingRecords(feedingRes.data.map((r: any) => ({
          id: r.id,
          baby_id: r.baby_id,
          user_id: r.user_id,
          timestamp: r.timestamp,
          type: r.type as FeedingRecord['type'],
          amount: r.amount,
          unit: r.unit as 'ml' | 'oz',
          duration: r.duration,
          notes: r.notes,
          created_at: r.created_at,
          updated_at: r.updated_at
        })));
      }

      if (sleepRes.data) {
        setSleepRecords(sleepRes.data.map((r: any) => ({
          id: r.id,
          baby_id: r.baby_id,
          user_id: r.user_id,
          start_time: r.start_time,
          end_time: r.end_time,
          duration: r.duration,
          type: r.type as 'night' | 'nap',
          quality: r.quality as 'deep' | 'light' | 'restless' | undefined,
          notes: r.notes,
          created_at: r.created_at,
          updated_at: r.updated_at
        })));
      }

      if (diaperRes.data) {
        setDiaperRecords(diaperRes.data.map((r: any) => ({
          id: r.id,
          baby_id: r.baby_id,
          user_id: r.user_id,
          timestamp: r.timestamp,
          type: r.type as 'wet' | 'poop' | 'mixed',
          poop_color: r.poop_color as DiaperRecord['poopColor'],
          consistency: r.consistency as DiaperRecord['consistency'],
          notes: r.notes,
          created_at: r.created_at,
          updated_at: r.updated_at
        })));
      }

      if (healthRes.data) {
        setHealthRecords(healthRes.data.map((r: any) => ({
          id: r.id,
          baby_id: r.baby_id,
          user_id: r.user_id,
          timestamp: r.timestamp,
          type: r.type as 'temperature' | 'weight' | 'height' | 'head',
          value: r.value,
          unit: r.unit,
          location: r.location as HealthRecord['location'],
          notes: r.notes,
          created_at: r.created_at,
          updated_at: r.updated_at
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

  const handleSaveFeeding = async (data: Partial<FeedingRecord>) => {
    if (!canEdit) {
      toast({
        title: "無權限",
        description: "您沒有編輯權限",
        variant: "destructive",
      });
      return;
    }

    if (!selectedBabyId) {
      toast({
        title: "請先選擇寶寶",
        variant: "destructive",
      });
      return;
    }

    try {
      if (data.id) {
        // Update existing record
        const { error } = await supabase
          .from('feeding_records')
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
        // Insert new record
        const { error } = await supabase
          .from('feeding_records')
          .insert([{
            baby_id: selectedBabyId,
            timestamp: data.timestamp,
            type: data.type,
            amount: data.amount,
            unit: data.unit,
            duration: data.duration,
            notes: data.notes,
            user_id: user?.id
          }]);

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
    if (!canEdit) {
      toast({
        title: "無權限",
        description: "您沒有編輯權限",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('feeding_records')
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

  const handleSaveSleep = async (data: Partial<SleepRecord>) => {
    if (!canEdit) {
      toast({
        title: "無權限",
        description: "您沒有編輯權限",
        variant: "destructive",
      });
      return;
    }

    if (!selectedBabyId) {
      toast({
        title: "請先選擇寶寶",
        variant: "destructive",
      });
      return;
    }

    try {
      const dbData = {
        start_time: data.start_time,
        end_time: data.end_time,
        duration: data.duration,
        type: data.type,
        quality: data.quality,
        notes: data.notes
      };

      if (data.id) {
        // Update existing record
        const { error } = await supabase
          .from('sleep_records')
          .update(dbData)
          .eq('id', data.id);

        if (error) throw error;

        await fetchAllRecords();
      } else {
        // Insert new record
        const { error } = await supabase
          .from('sleep_records')
          .insert([{ ...dbData, baby_id: selectedBabyId, user_id: user?.id }]);

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
    if (!canEdit) {
      toast({
        title: "無權限",
        description: "您沒有編輯權限",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('sleep_records')
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

  const handleSaveDiaper = async (data: Partial<DiaperRecord>) => {
    if (!canEdit) {
      toast({
        title: "無權限",
        description: "您沒有編輯權限",
        variant: "destructive",
      });
      return;
    }

    if (!selectedBabyId) {
      toast({
        title: "請先選擇寶寶",
        variant: "destructive",
      });
      return;
    }

    try {
      const dbData = {
        timestamp: data.timestamp,
        type: data.type,
        poop_color: data.poop_color,
        consistency: data.consistency,
        notes: data.notes
      };

      if (data.id) {
        // Update existing record
        const { error } = await supabase
          .from('diaper_records')
          .update(dbData)
          .eq('id', data.id);

        if (error) throw error;

        await fetchAllRecords();
      } else {
        // Insert new record
        const { error } = await supabase
          .from('diaper_records')
          .insert([{ ...dbData, baby_id: selectedBabyId, user_id: user?.id }]);

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
    if (!canEdit) {
      toast({
        title: "無權限",
        description: "您沒有編輯權限",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('diaper_records')
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

  const handleSaveHealth = async (data: Partial<HealthRecord>) => {
    if (!canEdit) {
      toast({
        title: "無權限",
        description: "您沒有編輯權限",
        variant: "destructive",
      });
      return;
    }

    if (!selectedBabyId) {
      toast({
        title: "請先選擇寶寶",
        variant: "destructive",
      });
      return;
    }

    try {
      if (data.id) {
        // Update existing record
        const { error } = await supabase
          .from('health_records')
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
        // Insert new record
        const { error } = await supabase
          .from('health_records')
          .insert([{
            baby_id: selectedBabyId,
            timestamp: data.timestamp,
            type: data.type,
            value: data.value,
            unit: data.unit,
            location: data.location,
            notes: data.notes,
            user_id: user?.id
          }]);

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
    if (!canEdit) {
      toast({
        title: "無權限",
        description: "您沒有編輯權限",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('health_records')
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

  const handleEditFromHistory = (record: any, type: 'feeding' | 'sleep' | 'diaper' | 'health') => {
    setCurrentView(type);
  };

  if (loading) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header with Baby Selector */}
        <div className="mb-6 flex items-center justify-between">
          <BabySelector
            selectedBabyId={selectedBabyId}
            onBabyChange={handleBabyChange}
            onManageBabies={() => navigate("/babies")}
          />
          {currentRole && (
            <Badge variant={currentRole === "owner" ? "default" : "secondary"}>
              {currentRole === "owner" ? "擁有者" : currentRole === "editor" ? "編輯者" : "檢視者"}
            </Badge>
          )}
        </div>

        {!selectedBabyId ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">請先選擇或建立一個寶寶檔案</p>
          </div>
        ) : (
          <>
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
                feedingRecords={feedingRecords.map(r => ({
                  id: r.id,
                  timestamp: r.timestamp,
                  type: r.type,
                  amount: r.amount,
                  unit: r.unit,
                  duration: r.duration,
                  notes: r.notes
                }))}
                sleepRecords={sleepRecords.map(r => ({
                  id: r.id,
                  startTime: r.start_time,
                  endTime: r.end_time,
                  duration: r.duration,
                  type: r.type,
                  quality: r.quality,
                  notes: r.notes
                }))}
                diaperRecords={diaperRecords.map(r => ({
                  id: r.id,
                  timestamp: r.timestamp,
                  type: r.type,
                  poopColor: r.poop_color,
                  consistency: r.consistency,
                  notes: r.notes
                }))}
                healthRecords={healthRecords.map(r => ({
                  id: r.id,
                  timestamp: r.timestamp,
                  type: r.type,
                  value: r.value,
                  unit: r.unit,
                  location: r.location,
                  notes: r.notes
                }))}
              />
            )}

            {currentView === 'history' && (
              <CalendarHistoryView
                onBack={() => setCurrentView('dashboard')}
                feedingRecords={feedingRecords.map(r => ({
                  id: r.id,
                  timestamp: r.timestamp,
                  type: r.type,
                  amount: r.amount,
                  unit: r.unit,
                  duration: r.duration,
                  notes: r.notes
                }))}
                sleepRecords={sleepRecords.map(r => ({
                  id: r.id,
                  startTime: r.start_time,
                  endTime: r.end_time,
                  duration: r.duration,
                  type: r.type,
                  quality: r.quality,
                  notes: r.notes
                }))}
                diaperRecords={diaperRecords.map(r => ({
                  id: r.id,
                  timestamp: r.timestamp,
                  type: r.type,
                  poopColor: r.poop_color,
                  consistency: r.consistency,
                  notes: r.notes
                }))}
                healthRecords={healthRecords.map(r => ({
                  id: r.id,
                  timestamp: r.timestamp,
                  type: r.type,
                  value: r.value,
                  unit: r.unit,
                  location: r.location,
                  notes: r.notes
                }))}
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

            {currentView === 'activity' && selectedBabyId && (
              <div className="space-y-4">
                <ActivityFeed babyId={selectedBabyId} limit={50} />
              </div>
            )}

            {currentView === 'feeding' && (
              <FeedingForm
                onBack={() => setCurrentView('dashboard')}
                onSave={handleSaveFeeding}
                records={feedingRecords.map(r => ({
                  id: r.id,
                  timestamp: r.timestamp,
                  type: r.type,
                  amount: r.amount,
                  unit: r.unit,
                  duration: r.duration,
                  notes: r.notes
                }))}
                onDelete={handleDeleteFeeding}
              />
            )}

            {currentView === 'sleep' && (
              <SleepForm
                onBack={() => setCurrentView('dashboard')}
                onSave={handleSaveSleep}
                records={sleepRecords.map(r => ({
                  id: r.id,
                  startTime: r.start_time,
                  endTime: r.end_time,
                  duration: r.duration,
                  type: r.type,
                  quality: r.quality,
                  notes: r.notes
                }))}
                onDelete={handleDeleteSleep}
              />
            )}

            {currentView === 'diaper' && (
              <DiaperForm
                onBack={() => setCurrentView('dashboard')}
                onSave={handleSaveDiaper}
                records={diaperRecords.map(r => ({
                  id: r.id,
                  timestamp: r.timestamp,
                  type: r.type,
                  poopColor: r.poop_color,
                  consistency: r.consistency,
                  notes: r.notes
                }))}
                onDelete={handleDeleteDiaper}
              />
            )}

            {currentView === 'health' && (
              <HealthForm
                onBack={() => setCurrentView('dashboard')}
                onSave={handleSaveHealth}
                records={healthRecords.map(r => ({
                  id: r.id,
                  timestamp: r.timestamp,
                  type: r.type,
                  value: r.value,
                  unit: r.unit,
                  location: r.location,
                  notes: r.notes
                }))}
                onDelete={handleDeleteHealth}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Index;
