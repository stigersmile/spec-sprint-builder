import { useState, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Pencil, Trash2, Baby, Moon, Calendar as CalendarIcon, Heart } from "lucide-react";
import { FeedingRecord, SleepRecord, DiaperRecord, HealthRecord } from "@/types/baby";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface CalendarHistoryViewProps {
  onBack: () => void;
  feedingRecords: FeedingRecord[];
  sleepRecords: SleepRecord[];
  diaperRecords: DiaperRecord[];
  healthRecords: HealthRecord[];
  onEditFeeding: (record: FeedingRecord) => void;
  onEditSleep: (record: SleepRecord) => void;
  onEditDiaper: (record: DiaperRecord) => void;
  onEditHealth: (record: HealthRecord) => void;
  onDeleteFeeding: (id: string) => void;
  onDeleteSleep: (id: string) => void;
  onDeleteDiaper: (id: string) => void;
  onDeleteHealth: (id: string) => void;
}

export const CalendarHistoryView = ({
  onBack,
  feedingRecords,
  sleepRecords,
  diaperRecords,
  healthRecords,
  onEditFeeding,
  onEditSleep,
  onEditDiaper,
  onEditHealth,
  onDeleteFeeding,
  onDeleteSleep,
  onDeleteDiaper,
  onDeleteHealth,
}: CalendarHistoryViewProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // 計算每個日期的記錄數量
  const recordsByDate = useMemo(() => {
    const dateMap = new Map<string, {
      feeding: FeedingRecord[];
      sleep: SleepRecord[];
      diaper: DiaperRecord[];
      health: HealthRecord[];
      total: number;
    }>();

    const addToDateMap = (date: string, type: 'feeding' | 'sleep' | 'diaper' | 'health', record: any) => {
      const dateKey = new Date(date).toDateString();
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, { feeding: [], sleep: [], diaper: [], health: [], total: 0 });
      }
      const entry = dateMap.get(dateKey)!;
      entry[type].push(record);
      entry.total++;
    };

    feedingRecords.forEach(r => addToDateMap(r.timestamp, 'feeding', r));
    sleepRecords.forEach(r => addToDateMap(r.startTime, 'sleep', r));
    diaperRecords.forEach(r => addToDateMap(r.timestamp, 'diaper', r));
    healthRecords.forEach(r => addToDateMap(r.timestamp, 'health', r));

    return dateMap;
  }, [feedingRecords, sleepRecords, diaperRecords, healthRecords]);

  // 獲取選中日期的記錄
  const selectedDateRecords = useMemo(() => {
    if (!selectedDate) return null;
    const dateKey = selectedDate.toDateString();
    return recordsByDate.get(dateKey) || { feeding: [], sleep: [], diaper: [], health: [], total: 0 };
  }, [selectedDate, recordsByDate]);

  // 獲取有記錄的日期
  const datesWithRecords = useMemo(() => {
    return Array.from(recordsByDate.keys()).map(dateStr => new Date(dateStr));
  }, [recordsByDate]);

  // 喂養類型顯示
  const getFeedingTypeText = (type: string) => {
    const types: Record<string, string> = {
      'breast-left': '母乳（左）',
      'breast-right': '母乳（右）',
      'breast-both': '母乳（雙側）',
      'formula': '配方奶',
      'mixed': '混合'
    };
    return types[type] || type;
  };

  // 睡眠類型顯示
  const getSleepTypeText = (type: string) => {
    return type === 'night' ? '夜間睡眠' : '小睡';
  };

  // 尿布類型顯示
  const getDiaperTypeText = (type: string) => {
    const types: Record<string, string> = {
      'wet': '尿濕',
      'poop': '便便',
      'mixed': '混合'
    };
    return types[type] || type;
  };

  // 健康記錄類型顯示
  const getHealthTypeText = (type: string) => {
    const types: Record<string, string> = {
      'temperature': '體溫',
      'weight': '體重',
      'height': '身高',
      'head': '頭圍'
    };
    return types[type] || type;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-blue-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="rounded-full hover:bg-white/50"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
              歷史記錄月曆
            </h1>
            <p className="text-gray-600 mt-1">點擊日期查看當天的所有記錄</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calendar Section */}
          <Card className="p-6 shadow-card">
            <div className="flex flex-col items-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
                modifiers={{
                  hasRecords: datesWithRecords,
                }}
                modifiersStyles={{
                  hasRecords: {
                    fontWeight: 'bold',
                    textDecoration: 'underline',
                    color: '#8b5cf6',
                  },
                }}
              />
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span>有記錄的日期</span>
              </div>
            </div>
          </Card>

          {/* Daily Summary */}
          {selectedDate && (
            <Card className="p-6 shadow-card">
              <h3 className="text-xl font-semibold mb-4">
                {selectedDate.toLocaleDateString('zh-TW', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long'
                })}
              </h3>
              {selectedDateRecords && selectedDateRecords.total > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-pink-50 rounded-lg">
                    <Baby className="h-8 w-8 text-pink-500" />
                    <div>
                      <p className="text-sm text-gray-600">餵養記錄</p>
                      <p className="text-2xl font-bold text-pink-600">{selectedDateRecords.feeding.length}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                    <Moon className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-600">睡眠記錄</p>
                      <p className="text-2xl font-bold text-blue-600">{selectedDateRecords.sleep.length}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                    <CalendarIcon className="h-8 w-8 text-green-500" />
                    <div>
                      <p className="text-sm text-gray-600">尿布記錄</p>
                      <p className="text-2xl font-bold text-green-600">{selectedDateRecords.diaper.length}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                    <Heart className="h-8 w-8 text-purple-500" />
                    <div>
                      <p className="text-sm text-gray-600">健康記錄</p>
                      <p className="text-2xl font-bold text-purple-600">{selectedDateRecords.health.length}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CalendarIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p>這一天沒有記錄</p>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Detailed Records */}
        {selectedDate && selectedDateRecords && selectedDateRecords.total > 0 && (
          <div className="space-y-6">
            {/* Feeding Records */}
            {selectedDateRecords.feeding.length > 0 && (
              <Card className="p-6 shadow-card">
                <div className="flex items-center gap-2 mb-4">
                  <Baby className="h-5 w-5 text-pink-500" />
                  <h3 className="text-lg font-semibold">餵養記錄</h3>
                  <Badge variant="secondary">{selectedDateRecords.feeding.length}</Badge>
                </div>
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
                    {selectedDateRecords.feeding.slice().reverse().map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{new Date(record.timestamp).toLocaleTimeString('zh-TW')}</TableCell>
                        <TableCell>{getFeedingTypeText(record.type)}</TableCell>
                        <TableCell>
                          {record.amount && `${record.amount}${record.unit}`}
                          {record.duration && ` • ${record.duration}分鐘`}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              onEditFeeding(record);
                              onBack();
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              onDeleteFeeding(record.id);
                              toast.success("記錄已刪除");
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}

            {/* Sleep Records */}
            {selectedDateRecords.sleep.length > 0 && (
              <Card className="p-6 shadow-card">
                <div className="flex items-center gap-2 mb-4">
                  <Moon className="h-5 w-5 text-blue-500" />
                  <h3 className="text-lg font-semibold">睡眠記錄</h3>
                  <Badge variant="secondary">{selectedDateRecords.sleep.length}</Badge>
                </div>
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
                    {selectedDateRecords.sleep.slice().reverse().map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{new Date(record.startTime).toLocaleTimeString('zh-TW')}</TableCell>
                        <TableCell>{getSleepTypeText(record.type)}</TableCell>
                        <TableCell>{record.duration ? `${record.duration}分鐘` : '進行中'}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              onEditSleep(record);
                              onBack();
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              onDeleteSleep(record.id);
                              toast.success("記錄已刪除");
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}

            {/* Diaper Records */}
            {selectedDateRecords.diaper.length > 0 && (
              <Card className="p-6 shadow-card">
                <div className="flex items-center gap-2 mb-4">
                  <CalendarIcon className="h-5 w-5 text-green-500" />
                  <h3 className="text-lg font-semibold">尿布記錄</h3>
                  <Badge variant="secondary">{selectedDateRecords.diaper.length}</Badge>
                </div>
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
                    {selectedDateRecords.diaper.slice().reverse().map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{new Date(record.timestamp).toLocaleTimeString('zh-TW')}</TableCell>
                        <TableCell>{getDiaperTypeText(record.type)}</TableCell>
                        <TableCell>
                          {record.poopColor && `顏色: ${record.poopColor}`}
                          {record.consistency && ` • ${record.consistency}`}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              onEditDiaper(record);
                              onBack();
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              onDeleteDiaper(record.id);
                              toast.success("記錄已刪除");
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}

            {/* Health Records */}
            {selectedDateRecords.health.length > 0 && (
              <Card className="p-6 shadow-card">
                <div className="flex items-center gap-2 mb-4">
                  <Heart className="h-5 w-5 text-purple-500" />
                  <h3 className="text-lg font-semibold">健康記錄</h3>
                  <Badge variant="secondary">{selectedDateRecords.health.length}</Badge>
                </div>
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
                    {selectedDateRecords.health.slice().reverse().map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{new Date(record.timestamp).toLocaleTimeString('zh-TW')}</TableCell>
                        <TableCell>{getHealthTypeText(record.type)}</TableCell>
                        <TableCell>{record.value}{record.unit}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              onEditHealth(record);
                              onBack();
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              onDeleteHealth(record.id);
                              toast.success("記錄已刪除");
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
