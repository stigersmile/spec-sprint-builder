import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";

interface HealthFormProps {
  onBack: () => void;
  onSave: (data: any) => void;
}

export const HealthForm = ({ onBack, onSave }: HealthFormProps) => {
  const [healthType, setHealthType] = useState<string>("temperature");
  const [value, setValue] = useState<string>("");
  const [location, setLocation] = useState<string>("axillary");

  const getUnit = () => {
    switch (healthType) {
      case 'temperature': return '°C';
      case 'weight': return 'kg';
      case 'height': return 'cm';
      case 'head': return 'cm';
      default: return '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!value) {
      toast.error("請輸入數值");
      return;
    }

    const data = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      type: healthType,
      value: parseFloat(value),
      unit: getUnit(),
      location: healthType === 'temperature' ? location : undefined,
    };

    onSave(data);
    toast.success("健康記錄已儲存！", {
      description: `${value}${getUnit()} - ${new Date().toLocaleTimeString('zh-TW')}`,
    });
    onBack();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-2xl font-bold">健康指標</h2>
      </div>

      <Card className="p-6 shadow-card">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label className="text-base font-semibold">測量項目</Label>
            <RadioGroup value={healthType} onValueChange={setHealthType} className="space-y-2">
              <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="temperature" id="temperature" />
                <Label htmlFor="temperature" className="cursor-pointer flex-1">體溫</Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="weight" id="weight" />
                <Label htmlFor="weight" className="cursor-pointer flex-1">體重</Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="height" id="height" />
                <Label htmlFor="height" className="cursor-pointer flex-1">身高/身長</Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="head" id="head" />
                <Label htmlFor="head" className="cursor-pointer flex-1">頭圍</Label>
              </div>
            </RadioGroup>
          </div>

          {healthType === "temperature" && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">測量部位</Label>
              <RadioGroup value={location} onValueChange={setLocation} className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="axillary" id="axillary" />
                  <Label htmlFor="axillary" className="cursor-pointer flex-1">腋下</Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="ear" id="ear" />
                  <Label htmlFor="ear" className="cursor-pointer flex-1">耳溫</Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="forehead" id="forehead" />
                  <Label htmlFor="forehead" className="cursor-pointer flex-1">額溫</Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="rectal" id="rectal" />
                  <Label htmlFor="rectal" className="cursor-pointer flex-1">肛溫</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          <div className="space-y-3">
            <Label className="text-base font-semibold">數值</Label>
            <div className="flex gap-2 items-center">
              <Input
                type="number"
                step="0.1"
                placeholder={`輸入${healthType === 'temperature' ? '體溫' : healthType === 'weight' ? '體重' : healthType === 'height' ? '身高' : '頭圍'}`}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="flex-1 text-lg"
              />
              <span className="text-lg font-medium text-muted-foreground">{getUnit()}</span>
            </div>
          </div>

          <Button type="submit" className="w-full bg-gradient-to-r from-chart-4 to-chart-4/80 hover:opacity-90">
            <Check className="w-4 h-4 mr-2" />
            儲存記錄
          </Button>
        </form>
      </Card>
    </div>
  );
};
