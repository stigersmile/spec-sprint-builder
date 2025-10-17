import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";

interface DiaperFormProps {
  onBack: () => void;
  onSave: (data: any) => void;
}

const poopColors = [
  { value: 'yellow', label: '黃色', color: 'bg-yellow-400', info: '正常' },
  { value: 'green', label: '綠色', color: 'bg-green-500', info: '正常' },
  { value: 'brown', label: '棕色', color: 'bg-amber-700', info: '正常' },
  { value: 'black', label: '黑色', color: 'bg-gray-900', info: '注意' },
  { value: 'red', label: '紅色', color: 'bg-red-500', info: '就醫' },
  { value: 'white', label: '白色', color: 'bg-gray-100 border-2 border-gray-300', info: '就醫' },
];

export const DiaperForm = ({ onBack, onSave }: DiaperFormProps) => {
  const [diaperType, setDiaperType] = useState<string>("wet");
  const [poopColor, setPoopColor] = useState<string>("yellow");
  const [consistency, setConsistency] = useState<string>("soft");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      type: diaperType,
      poopColor: diaperType !== 'wet' ? poopColor : undefined,
      consistency: diaperType !== 'wet' ? consistency : undefined,
    };

    onSave(data);
    toast.success("尿布記錄已儲存！", {
      description: `記錄時間：${new Date().toLocaleTimeString('zh-TW')}`,
    });
    onBack();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-2xl font-bold">尿布記錄</h2>
      </div>

      <Card className="p-6 shadow-card">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label className="text-base font-semibold">尿布類型</Label>
            <RadioGroup value={diaperType} onValueChange={setDiaperType} className="space-y-2">
              <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="wet" id="wet" />
                <Label htmlFor="wet" className="cursor-pointer flex-1">尿濕</Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="poop" id="poop" />
                <Label htmlFor="poop" className="cursor-pointer flex-1">大便</Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="mixed" id="mixed" />
                <Label htmlFor="mixed" className="cursor-pointer flex-1">混合</Label>
              </div>
            </RadioGroup>
          </div>

          {diaperType !== "wet" && (
            <>
              <div className="space-y-3">
                <Label className="text-base font-semibold">便便顏色</Label>
                <div className="grid grid-cols-3 gap-3">
                  {poopColors.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setPoopColor(color.value)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        poopColor === color.value 
                          ? 'border-primary ring-2 ring-primary/20' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className={`w-full h-8 rounded mb-2 ${color.color}`} />
                      <div className="text-sm font-medium">{color.label}</div>
                      <div className="text-xs text-muted-foreground">{color.info}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold">便便性狀</Label>
                <RadioGroup value={consistency} onValueChange={setConsistency} className="space-y-2">
                  <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="liquid" id="liquid" />
                    <Label htmlFor="liquid" className="cursor-pointer flex-1">稀</Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="soft" id="soft" />
                    <Label htmlFor="soft" className="cursor-pointer flex-1">軟</Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="formed" id="formed" />
                    <Label htmlFor="formed" className="cursor-pointer flex-1">成形</Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="hard" id="hard" />
                    <Label htmlFor="hard" className="cursor-pointer flex-1">硬</Label>
                  </div>
                </RadioGroup>
              </div>
            </>
          )}

          <Button type="submit" className="w-full bg-gradient-to-r from-accent to-accent/80 hover:opacity-90">
            <Check className="w-4 h-4 mr-2" />
            儲存記錄
          </Button>
        </form>
      </Card>
    </div>
  );
};
