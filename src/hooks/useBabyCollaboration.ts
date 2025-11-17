import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Baby, BabyCollaborator, CollaboratorRole } from "@/types/baby";
import { useToast } from "@/hooks/use-toast";
import type { RealtimeChannel } from "@supabase/supabase-js";

export function useBabyCollaboration() {
  const [selectedBabyId, setSelectedBabyId] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<CollaboratorRole | null>(null);
  const [realtimeChannel, setRealtimeChannel] = useState<RealtimeChannel | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Load selected baby from localStorage
    const savedBabyId = localStorage.getItem("selectedBabyId");
    if (savedBabyId) {
      setSelectedBabyId(savedBabyId);
    } else {
      // Fetch first available baby
      fetchFirstBaby();
    }
  }, []);

  useEffect(() => {
    if (selectedBabyId) {
      localStorage.setItem("selectedBabyId", selectedBabyId);
      fetchUserRole();
    }
  }, [selectedBabyId]);

  const fetchFirstBaby = async () => {
    try {
      const { data, error } = await supabase
        .from("babies")
        .select("id")
        .limit(1)
        .single();

      if (!error && data) {
        setSelectedBabyId(data.id);
      }
    } catch (error) {
      console.error("Error fetching first baby:", error);
    }
  };

  const fetchUserRole = async () => {
    if (!selectedBabyId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("baby_collaborators")
        .select("role")
        .eq("baby_id", selectedBabyId)
        .eq("user_id", user.id)
        .eq("status", "accepted")
        .single();

      if (!error && data) {
        setCurrentRole(data.role);
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
    }
  };

  const handleBabyChange = (babyId: string) => {
    setSelectedBabyId(babyId);
  };

  const canEdit = () => {
    return currentRole === "owner" || currentRole === "editor";
  };

  const isOwner = () => {
    return currentRole === "owner";
  };

  return {
    selectedBabyId,
    currentRole,
    handleBabyChange,
    canEdit: canEdit(),
    isOwner: isOwner(),
  };
}

export function useRealtimeRecords(
  babyId: string | null,
  tableName: string,
  onUpdate: () => void
) {
  const { toast } = useToast();

  useEffect(() => {
    if (!babyId) return;

    const channel = supabase
      .channel(`${tableName}:${babyId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: tableName,
          filter: `baby_id=eq.${babyId}`,
        },
        (payload) => {
          console.log(`${tableName} change:`, payload);

          // Show notification for changes from other users
          if (payload.eventType === "INSERT") {
            toast({
              title: "新記錄",
              description: "其他協作者新增了一筆記錄",
              duration: 3000,
            });
          } else if (payload.eventType === "UPDATE") {
            toast({
              title: "記錄已更新",
              description: "其他協作者更新了一筆記錄",
              duration: 3000,
            });
          } else if (payload.eventType === "DELETE") {
            toast({
              title: "記錄已刪除",
              description: "其他協作者刪除了一筆記錄",
              duration: 3000,
            });
          }

          // Refresh the data
          onUpdate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [babyId, tableName, onUpdate]);
}
