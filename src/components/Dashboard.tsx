import { Baby, Calendar, Heart, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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
}

export const Dashboard = ({ onFeedingClick, onSleepClick, onDiaperClick, onHealthClick }: DashboardProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          智慧寶寶照護助手
        </h1>
        <p className="text-muted-foreground">快速記錄寶寶的日常照護</p>
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
