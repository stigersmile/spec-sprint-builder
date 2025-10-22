import { Baby, Calendar, Heart, Moon, Download, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color: string;
}

const QuickAction = ({ icon, label, onClick, color }: QuickActionProps) => (
  <Button
    onClick={onClick}
    className={`flex flex-col items-center justify-center h-24 gap-2 ${color} hover:scale-105 transition-all duration-300 shadow-soft`}
  >
    <div className="w-8 h-8">{icon}</div>
    <span className="text-sm font-medium">{label}</span>
  </Button>
);

interface DashboardProps {
  onFeedingClick: () => void;
  onSleepClick: () => void;
  onDiaperClick: () => void;
  onHealthClick: () => void;
  onHistoryClick: () => void;
  onExportClick: () => void;
}

export const Dashboard = ({ onFeedingClick, onSleepClick, onDiaperClick, onHealthClick, onHistoryClick, onExportClick }: DashboardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Logged out",
        description: "You've been successfully logged out",
      });
      navigate("/auth");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          onClick={handleLogout}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <LogOut className="w-4 h-4" />
          登出
        </Button>
      </div>
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          智慧寶寶照護助手
        </h1>
        <p className="text-muted-foreground">快速記錄寶寶的日常照護</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Button
          onClick={onHistoryClick}
          variant="outline"
          className="w-full"
        >
          <Calendar className="w-4 h-4 mr-2" />
          歷史月曆
        </Button>
        <Button
          onClick={onExportClick}
          variant="outline"
          className="w-full"
        >
          <Download className="w-4 h-4 mr-2" />
          導出記錄
        </Button>
      </div>

      <Card className="p-6 bg-gradient-to-br from-card to-muted/30 shadow-card">
        <div className="grid grid-cols-2 gap-4">
          <QuickAction
            icon={<Baby className="w-full h-full" />}
            label="餵食記錄"
            onClick={onFeedingClick}
            color="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground"
          />
          <QuickAction
            icon={<Moon className="w-full h-full" />}
            label="睡眠記錄"
            onClick={onSleepClick}
            color="bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground"
          />
          <QuickAction
            icon={<Calendar className="w-full h-full" />}
            label="尿布記錄"
            onClick={onDiaperClick}
            color="bg-gradient-to-br from-accent to-accent/80 text-accent-foreground"
          />
          <QuickAction
            icon={<Heart className="w-full h-full" />}
            label="健康指標"
            onClick={onHealthClick}
            color="bg-gradient-to-br from-chart-4 to-chart-4/80 text-white"
          />
        </div>
      </Card>

      <Card className="p-6 shadow-card">
        <h2 className="text-xl font-semibold mb-4">今日概況</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-primary/10 rounded-lg">
            <div className="text-2xl font-bold text-primary">8</div>
            <div className="text-sm text-muted-foreground">次餵食</div>
          </div>
          <div className="text-center p-4 bg-secondary/10 rounded-lg">
            <div className="text-2xl font-bold text-secondary">12h</div>
            <div className="text-sm text-muted-foreground">總睡眠</div>
          </div>
          <div className="text-center p-4 bg-accent/10 rounded-lg">
            <div className="text-2xl font-bold text-accent">6</div>
            <div className="text-sm text-muted-foreground">換尿布</div>
          </div>
          <div className="text-center p-4 bg-chart-4/10 rounded-lg">
            <div className="text-2xl font-bold" style={{ color: 'hsl(var(--chart-4))' }}>37.2°C</div>
            <div className="text-sm text-muted-foreground">體溫</div>
          </div>
        </div>
      </Card>
    </div>
  );
};