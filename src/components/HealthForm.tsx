import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Save, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { HealthRecord } from "@/types/baby";

interface HealthFormProps {
  onBack: () => void;
  onSave: (data: HealthRecord) => void;
  records: HealthRecord[];
  onDelete: (id: string) => void;
}

export const HealthForm = ({ onBack, onSave, records, onDelete }: HealthFormProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [healthType, setHealthType] = useState<string>("temperature");
  const [value, setValue] = useState<string>("");
  const [location, setLocation] = useState<string>("axillary");
  const [notes, setNotes] = useState<string>("");

  const handleEdit = (record: HealthRecord) => {
    setEditingId(record.id);
    setHealthType(record.type);
    setValue(record.value.toString());
    setLocation(record.location || "axillary");
    setNotes(record.notes || "");
  };

  const handleDelete = (id: string) => {
    onDelete(id);
    toast.success("記錄已刪除");
  };

  const resetForm = () => {
    setEditingId(null);
    setHealthType("temperature");
    setValue("");
    setLocation("axillary");
    setNotes("");
  };

  const getUnit = () => {
    switch (healthType) {
      case 'temperature': return '°C';
      case 'weight': return 'kg';
      case 'height': return 'cm';
      case 'head': return 'cm';
      default: return '';
    }
  };

  const handleSubmit = () => {
    if (!value) {
      toast.error("請輸入數值");
      return;
    }

    const data: HealthRecord = {
      id: editingId || '',
      timestamp: new Date().toISOString(),
      type: healthType as any,
      value: parseFloat(value),
      unit: getUnit(),
      location: healthType === "temperature" ? (location as any) : undefined,
      notes: notes || undefined,
    };

    onSave(data);
    toast.success(editingId ? "記錄已更新！" : "健康記錄已儲存！");
    resetForm();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-2xl font-bold">{editingId ? "編輯" : ""}健康指標</h2>
      </div>
      {editingId && (
        <Button variant="ghost" size="sm" onClick={resetForm} className="mb-4">
          取消編輯
        </Button>
      )}

      <Card className="p-6 shadow-card">
        <div className="space-y-6">
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
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="axillary">腋下</SelectItem>
                  <SelectItem value="ear">耳溫</SelectItem>
                  <SelectItem value="forehead">額溫</SelectItem>
                  <SelectItem value="rectal">肛溫</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-3">
            <Label className="text-base font-semibold">數值</Label>
            <div className="flex gap-2 items-center">
              <Input
                type="number"
                step="0.1"
                placeholder="輸入數值"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="flex-1"
              />
              <span className="text-lg font-medium text-muted-foreground">{getUnit()}</span>
            </div>
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
                <TableHead>數值</TableHead>
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
                    {record.type === 'temperature' && '體溫'}
                    {record.type === 'weight' && '體重'}
                    {record.type === 'height' && '身高'}
                    {record.type === 'head' && '頭圍'}
                  </TableCell>
                  <TableCell>
                    {record.value}{record.unit}
                    {record.location && ` (${record.location})`}
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