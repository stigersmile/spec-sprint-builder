import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Save, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { DiaperRecord } from "@/types/baby";

interface DiaperFormProps {
  onBack: () => void;
  onSave: (data: DiaperRecord) => void;
  records: DiaperRecord[];
  onDelete: (id: string) => void;
}

const poopColors = [
  { value: 'yellow', label: '黃色', color: 'bg-yellow-400' },
  { value: 'green', label: '綠色', color: 'bg-green-500' },
  { value: 'brown', label: '棕色', color: 'bg-amber-700' },
  { value: 'black', label: '黑色', color: 'bg-gray-900' },
  { value: 'red', label: '紅色', color: 'bg-red-500' },
  { value: 'white', label: '白色', color: 'bg-gray-100 border-2 border-gray-300' },
];

export const DiaperForm = ({ onBack, onSave, records, onDelete }: DiaperFormProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [diaperType, setDiaperType] = useState<string>("wet");
  const [poopColor, setPoopColor] = useState<string>("yellow");
  const [consistency, setConsistency] = useState<string>("soft");
  const [notes, setNotes] = useState<string>("");

  const handleEdit = (record: DiaperRecord) => {
    setEditingId(record.id);
    setDiaperType(record.type);
    setPoopColor(record.poopColor || "yellow");
    setConsistency(record.consistency || "soft");
    setNotes(record.notes || "");
  };

  const handleDelete = (id: string) => {
    onDelete(id);
    toast.success("記錄已刪除");
  };

  const resetForm = () => {
    setEditingId(null);
    setDiaperType("wet");
    setPoopColor("yellow");
    setConsistency("soft");
    setNotes("");
  };

  const handleSubmit = () => {
    const data: DiaperRecord = {
      id: editingId || Date.now().toString(),
      timestamp: new Date().toISOString(),
      type: diaperType as 'wet' | 'poop' | 'mixed',
      poopColor: diaperType !== "wet" ? (poopColor as any) : undefined,
      consistency: diaperType !== "wet" ? (consistency as any) : undefined,
      notes: notes || undefined,
    };

    onSave(data);
    toast.success(editingId ? "記錄已更新！" : "尿布記錄已儲存！");
    resetForm();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-2xl font-bold">{editingId ? "編輯" : ""}尿布記錄</h2>
      </div>
      {editingId && (
        <Button variant="ghost" size="sm" onClick={resetForm} className="mb-4">
          取消編輯
        </Button>
      )}

      <Card className="p-6 shadow-card">
        <div className="space-y-6">
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
                    {record.type === 'wet' && '尿濕'}
                    {record.type === 'poop' && '大便'}
                    {record.type === 'mixed' && '混合'}
                  </TableCell>
                  <TableCell className="text-sm">
                    {record.poopColor && `顏色: ${record.poopColor}`}
                    {record.consistency && ` · ${record.consistency}`}
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