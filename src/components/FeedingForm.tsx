import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";

interface FeedingFormProps {
  onBack: () => void;
  onSave: (data: any) => void;
}

export const FeedingForm = ({ onBack, onSave }: FeedingFormProps) => {
  const [feedingType, setFeedingType] = useState<string>("breast-both");
  const [amount, setAmount] = useState<string>("");
  const [unit, setUnit] = useState<string>("ml");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      type: feedingType,
      amount: amount ? parseFloat(amount) : undefined,
      unit,
    };

    onSave(data);
    toast.success("餵食記錄已儲存！", {
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
        <h2 className="text-2xl font-bold">餵食記錄</h2>
      </div>

      <Card className="p-6 shadow-card">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label className="text-base font-semibold">餵食方式</Label>
            <RadioGroup value={feedingType} onValueChange={setFeedingType} className="space-y-2">
              <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="breast-left" id="breast-left" />
                <Label htmlFor="breast-left" className="cursor-pointer flex-1">母乳（左側）</Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="breast-right" id="breast-right" />
                <Label htmlFor="breast-right" className="cursor-pointer flex-1">母乳（右側）</Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="breast-both" id="breast-both" />
                <Label htmlFor="breast-both" className="cursor-pointer flex-1">母乳（兩側）</Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="formula" id="formula" />
                <Label htmlFor="formula" className="cursor-pointer flex-1">配方奶</Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="mixed" id="mixed" />
                <Label htmlFor="mixed" className="cursor-pointer flex-1">混合餵養</Label>
              </div>
            </RadioGroup>
          </div>

          {(feedingType === "formula" || feedingType === "mixed") && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">奶量</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="輸入奶量"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="flex-1"
                />
                <RadioGroup value={unit} onValueChange={setUnit} className="flex gap-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ml" id="ml" />
                    <Label htmlFor="ml" className="cursor-pointer">ml</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="oz" id="oz" />
                    <Label htmlFor="oz" className="cursor-pointer">oz</Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="flex gap-2 flex-wrap">
                {[30, 60, 90, 120, 150].map((qty) => (
                  <Button
                    key={qty}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(qty.toString())}
                    className="hover:bg-primary/10"
                  >
                    {qty} ml
                  </Button>
                ))}
              </div>
            </div>
          )}

          <Button type="submit" className="w-full bg-gradient-to-r from-primary to-primary/80 hover:opacity-90">
            <Check className="w-4 h-4 mr-2" />
            儲存記錄
          </Button>
        </form>
      </Card>
    </div>
  );
};
