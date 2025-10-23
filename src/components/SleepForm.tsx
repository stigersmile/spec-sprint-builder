import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Check, Play, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { SleepRecord } from "@/types/baby";

interface SleepFormProps {
  onBack: () => void;
  onSave: (data: SleepRecord) => void;
  records: SleepRecord[];
  onDelete: (id: string) => void;
}

export const SleepForm = ({ onBack, onSave, records, onDelete }: SleepFormProps) => {
  const [isTracking, setIsTracking] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [sleepType, setSleepType] = useState<string>("nap");

  const handleStartTracking = () => {
    setStartTime(new Date());
    setIsTracking(true);
    toast.success("開始記錄睡眠時間");
  };

  const handleStopTracking = () => {
    if (!startTime) return;

    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000 / 60);

    const data: SleepRecord = {
      id: '',
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration,
      type: sleepType as 'night' | 'nap',
    };

    onSave(data);
    toast.success("睡眠記錄已儲存！", {
      description: `睡眠時長：${Math.floor(duration / 60)}小時${duration % 60}分鐘`,
    });
    
    setIsTracking(false);
    setStartTime(null);
  };

  const handleDelete = (id: string) => {
    onDelete(id);
    toast.success("記錄已刪除");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-2xl font-bold">睡眠記錄</h2>
      </div>

      <Card className="p-6 shadow-card">
        <div className="space-y-6">
          <div className="space-y-3">
            <Label className="text-base font-semibold">睡眠類型</Label>
            <RadioGroup value={sleepType} onValueChange={setSleepType} className="space-y-2">
              <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="night" id="night" />
                <Label htmlFor="night" className="cursor-pointer flex-1">夜間睡眠</Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="nap" id="nap" />
                <Label htmlFor="nap" className="cursor-pointer flex-1">白天小睡</Label>
              </div>
            </RadioGroup>
          </div>

          {!isTracking ? (
            <Button 
              onClick={handleStartTracking}
              className="w-full bg-gradient-to-r from-secondary to-secondary/80 hover:opacity-90 h-16 text-lg"
            >
              <Play className="w-6 h-6 mr-2" />
              開始記錄睡眠
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="text-center p-6 bg-secondary/10 rounded-lg">
                <div className="text-sm text-muted-foreground mb-2">正在記錄中...</div>
                <div className="text-3xl font-bold text-secondary">
                  {startTime && new Date(startTime).toLocaleTimeString('zh-TW')}
                </div>
              </div>
              <Button 
                onClick={handleStopTracking}
                className="w-full bg-gradient-to-r from-accent to-accent/80 hover:opacity-90 h-16 text-lg"
              >
                <Check className="w-6 h-6 mr-2" />
                結束並儲存
              </Button>
            </div>
          )}
        </div>
      </Card>

      {records.length > 0 && (
        <Card className="p-6 shadow-card mt-6">
          <h3 className="text-lg font-semibold mb-4">歷史記錄</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>開始時間</TableHead>
                <TableHead>類型</TableHead>
                <TableHead>時長</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.slice().reverse().map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="text-sm">
                    {new Date(record.startTime).toLocaleString('zh-TW')}
                  </TableCell>
                  <TableCell>
                    {record.type === 'night' ? '夜間睡眠' : '白天小睡'}
                  </TableCell>
                  <TableCell>
                    {record.duration && `${Math.floor(record.duration / 60)}小時${record.duration % 60}分鐘`}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(record.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
};
