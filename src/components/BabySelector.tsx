import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Baby } from "@/types/baby";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BabySelectorProps {
  selectedBabyId: string | null;
  onBabyChange: (babyId: string) => void;
  onManageBabies: () => void;
}

export function BabySelector({
  selectedBabyId,
  onBabyChange,
  onManageBabies,
}: BabySelectorProps) {
  const [babies, setBabies] = useState<Baby[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchBabies();
  }, []);

  const fetchBabies = async () => {
    try {
      const { data, error } = await supabase
        .from("babies")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setBabies(data || []);

      // If no baby is selected and we have babies, select the first one
      if (!selectedBabyId && data && data.length > 0) {
        onBabyChange(data[0].id);
      }
    } catch (error: any) {
      toast({
        title: "載入失敗",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">載入中...</div>;
  }

  if (babies.length === 0) {
    return (
      <Button onClick={onManageBabies} variant="outline" size="sm">
        <Plus className="mr-2 h-4 w-4" />
        新增寶寶
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={selectedBabyId || undefined} onValueChange={onBabyChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="選擇寶寶" />
        </SelectTrigger>
        <SelectContent>
          {babies.map((baby) => (
            <SelectItem key={baby.id} value={baby.id}>
              {baby.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button onClick={onManageBabies} variant="ghost" size="icon">
        <Settings className="h-4 w-4" />
      </Button>
    </div>
  );
}
