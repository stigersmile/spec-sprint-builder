import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Save, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { FeedingRecord } from "@/types/baby";

interface FeedingFormProps {
  onBack: () => void;
  onSave: (data: FeedingRecord) => void;
  records: FeedingRecord[];
  onDelete: (id: string) => void;
}

export const FeedingForm = ({ onBack, onSave, records, onDelete }: FeedingFormProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [feedingType, setFeedingType] = useState<string>("breast-left");
  const [amount, setAmount] = useState<string>("");
  const [unit, setUnit] = useState<string>("ml");
  const [duration, setDuration] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // Helper function to convert ISO string to datetime-local format
  const toDatetimeLocal = (isoString: string) => {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [timestamp, setTimestamp] = useState<string>(toDatetimeLocal(new Date().toISOString()));

  const handleEdit = (record: FeedingRecord) => {
    setEditingId(record.id);
    setFeedingType(record.type);
    setAmount(record.amount?.toString() || "");
    setUnit(record.unit);
    setDuration(record.duration?.toString() || "");
    setNotes(record.notes || "");
    setTimestamp(toDatetimeLocal(record.timestamp));
  };

  const handleDelete = (id: string) => {
    onDelete(id);
    toast.success("記錄已刪除");
  };

  const resetForm = () => {
    setEditingId(null);
    setFeedingType("breast-left");
    setAmount("");
    setUnit("ml");
    setDuration("");
    setNotes("");
    setTimestamp(toDatetimeLocal(new Date().toISOString()));
  };

  const handleSubmit = () => {
    const data: FeedingRecord = {
      id: editingId || '',
      timestamp: new Date(timestamp).toISOString(),
      type: feedingType as any,
      amount: amount ? parseFloat(amount) : undefined,
      unit: unit as 'ml' | 'oz',
      duration: duration ? parseInt(duration) : undefined,
      notes: notes || undefined,
    };

    onSave(data);
    toast.success(editingId ? "記錄已更新！" : "餵食記錄已儲存！");
    resetForm();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-2xl font-bold">{editingId ? "編輯" : ""}餵食記錄</h2>
      </div>
      {editingId && (
        <Button variant="ghost" size="sm" onClick={resetForm} className="mb-4">
          取消編輯
        </Button>
      )}

      <Card className="p-6 shadow-card">
        <div className="space-y-6">
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
          </div>

          <div className="space-y-3">
            <Label className="text-base font-semibold">開始時間</Label>
            <Input
              type="datetime-local"
              value={timestamp}
              onChange={(e) => setTimestamp(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <Label className="text-base font-semibold">時長（分鐘）</Label>
            <Input
              type="number"
              placeholder="輸入時長"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <Label className="text-base font-semibold">備註</Label>
            <Textarea
              placeholder="添加備註..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <Button 
            onClick={handleSubmit}
            className="w-full bg-gradient-to-r from-primary to-primary/80 hover:opacity-90"
          >
            <Save className="w-5 h-5 mr-2" />
            {editingId ? "更新記錄" : "儲存記錄"}
          </Button>
        </div>
      </Card>

      {records.length > 0 && (
        <Card className="p-6 shadow-card mt-6">
          <h3 className="text-lg font-semibold mb-4">歷史記錄</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>時間</TableHead>
                <TableHead>類型</TableHead>
                <TableHead>詳情</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.slice().reverse().map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="text-sm">
                    {new Date(record.timestamp).toLocaleString('zh-TW')}
                  </TableCell>
                  <TableCell>
                    {record.type === 'breast-left' && '左乳'}
                    {record.type === 'breast-right' && '右乳'}
                    {record.type === 'breast-both' && '雙乳'}
                    {record.type === 'formula' && '配方奶'}
                    {record.type === 'mixed' && '混合'}
                  </TableCell>
                  <TableCell className="text-sm">
                    {record.amount && `${record.amount}${record.unit}`}
                    {record.duration && ` · ${record.duration}分鐘`}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(record)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(record.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
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