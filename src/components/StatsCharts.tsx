import { useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts";
import type { FeedingRecord, SleepRecord, DiaperRecord, HealthRecord } from "@/types/baby";
import { format, subDays, startOfDay, addDays, subMonths, isToday, isSameDay } from "date-fns";

interface StatsChartsProps {
  onBack: () => void;
  feedingRecords: FeedingRecord[];
  sleepRecords: SleepRecord[];
  diaperRecords: DiaperRecord[];
  healthRecords: HealthRecord[];
}

export const StatsCharts = ({
  onBack,
  feedingRecords,
  sleepRecords,
  diaperRecords,
  healthRecords,
}: StatsChartsProps) => {
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Feeding type colors and labels
  const feedingTypeColors: Record<string, string> = {
    'breast-left': 'hsl(var(--chart-1))',
    'breast-right': 'hsl(var(--chart-2))',
    'breast-both': 'hsl(var(--chart-3))',
    'formula': 'hsl(var(--chart-4))',
    'mixed': 'hsl(var(--chart-5))'
  };

  const feedingTypeLabels: Record<string, string> = {
    'breast-left': '左側母乳',
    'breast-right': '右側母乳',
    'breast-both': '雙側母乳',
    'formula': '配方奶',
    'mixed': '混合'
  };

  // Process feeding data based on time range
  const feedingChartData = (() => {
    if (timeRange === 'daily') {
      // Show individual feeding times for selected date
      const dayStart = startOfDay(selectedDate);
      return feedingRecords
        .filter(r => isSameDay(new Date(r.timestamp), selectedDate))
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .map(r => ({
          time: format(new Date(r.timestamp), 'HH:mm'),
          amount: r.amount || 0,
          type: r.type,
          color: feedingTypeColors[r.type] || 'hsl(var(--chart-1))',
          label: feedingTypeLabels[r.type] || r.type,
          notes: r.notes
        }));
    } else if (timeRange === 'weekly') {
      // Show 7 days summary
      return Array.from({ length: 7 }, (_, i) => {
        const date = startOfDay(subDays(new Date(), 6 - i));
        const dateStr = format(date, 'MM/dd');
        const dayRecords = feedingRecords.filter(r => 
          startOfDay(new Date(r.timestamp)).getTime() === date.getTime()
        );
        
        return {
          date: dateStr,
          count: dayRecords.length,
          amount: dayRecords.reduce((sum, r) => sum + (r.amount || 0), 0)
        };
      });
    } else {
      // Monthly: Show 30 days summary
      return Array.from({ length: 30 }, (_, i) => {
        const date = startOfDay(subDays(new Date(), 29 - i));
        const dateStr = format(date, 'MM/dd');
        const dayRecords = feedingRecords.filter(r => 
          startOfDay(new Date(r.timestamp)).getTime() === date.getTime()
        );
        
        return {
          date: dateStr,
          count: dayRecords.length,
          amount: dayRecords.reduce((sum, r) => sum + (r.amount || 0), 0)
        };
      });
    }
  })();

  // Process sleep data based on time range
  const sleepChartData = (() => {
    if (timeRange === 'daily') {
      // Show individual sleep sessions for selected date
      return sleepRecords
        .filter(r => isSameDay(new Date(r.startTime), selectedDate))
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
        .map(r => ({
          time: format(new Date(r.startTime), 'HH:mm'),
          duration: (r.duration || 0) / 60, // Convert to hours
          type: r.type
        }));
    } else if (timeRange === 'weekly') {
      return Array.from({ length: 7 }, (_, i) => {
        const date = startOfDay(subDays(new Date(), 6 - i));
        const dateStr = format(date, 'MM/dd');
        const dayRecords = sleepRecords.filter(r => 
          startOfDay(new Date(r.startTime)).getTime() === date.getTime()
        );
        
        return {
          date: dateStr,
          duration: dayRecords.reduce((sum, r) => sum + (r.duration || 0), 0) / 60
        };
      });
    } else {
      // Monthly
      return Array.from({ length: 30 }, (_, i) => {
        const date = startOfDay(subDays(new Date(), 29 - i));
        const dateStr = format(date, 'MM/dd');
        const dayRecords = sleepRecords.filter(r => 
          startOfDay(new Date(r.startTime)).getTime() === date.getTime()
        );
        
        return {
          date: dateStr,
          duration: dayRecords.reduce((sum, r) => sum + (r.duration || 0), 0) / 60
        };
      });
    }
  })();

  // Process diaper data for distribution
  const diaperTypeData = (() => {
    const records = timeRange === 'daily' 
      ? diaperRecords.filter(r => isSameDay(new Date(r.timestamp), selectedDate))
      : timeRange === 'weekly'
      ? diaperRecords.filter(r => new Date(r.timestamp) >= subDays(new Date(), 7))
      : diaperRecords.filter(r => new Date(r.timestamp) >= subMonths(new Date(), 1));
    
    return [
      { name: '尿濕', value: records.filter(r => r.type === 'wet').length, fill: 'hsl(var(--chart-1))' },
      { name: '大便', value: records.filter(r => r.type === 'poop').length, fill: 'hsl(var(--chart-2))' },
      { name: '混合', value: records.filter(r => r.type === 'mixed').length, fill: 'hsl(var(--chart-3))' }
    ].filter(item => item.value > 0);
  })();

  // Process health data - group by type
  const weightData = healthRecords
    .filter(r => r.type === 'weight')
    .slice(0, 10)
    .reverse()
    .map(r => ({
      date: format(new Date(r.timestamp), 'MM/dd'),
      value: r.value
    }));

  const temperatureData = healthRecords
    .filter(r => r.type === 'temperature')
    .slice(0, 10)
    .reverse()
    .map(r => ({
      date: format(new Date(r.timestamp), 'MM/dd'),
      value: r.value
    }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="rounded-full"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">數據統計</h1>
      </div>

      {/* Time Range Selector */}
      <div className="flex flex-col gap-4">
        <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="daily">每日</TabsTrigger>
            <TabsTrigger value="weekly">每週</TabsTrigger>
            <TabsTrigger value="monthly">每月</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Date selector for daily view */}
        {timeRange === 'daily' && (
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSelectedDate(subDays(selectedDate, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-lg font-medium min-w-[120px] text-center">
              {isToday(selectedDate) ? '今天' : format(selectedDate, 'yyyy/MM/dd')}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSelectedDate(addDays(selectedDate, 1))}
              disabled={isToday(selectedDate)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Feeding Charts */}
      <Card>
        <CardHeader>
          <CardTitle>
            {timeRange === 'daily' ? '餵食時間軸' : timeRange === 'weekly' ? '餵食統計（近7天）' : '餵食統計（近30天）'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {timeRange === 'daily' ? (
            // Daily: Timeline bar chart with different colors for each feeding
            feedingChartData.length > 0 ? (
              <>
                <ChartContainer
                  config={Object.fromEntries(
                    Object.entries(feedingTypeLabels).map(([key, label]) => [
                      key,
                      { label, color: feedingTypeColors[key] }
                    ])
                  )}
                  className="h-[250px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={feedingChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="time" 
                        stroke="hsl(var(--muted-foreground))"
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        label={{ value: 'ml', angle: -90, position: 'insideLeft' }}
                      />
                      <ChartTooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="rounded-lg border bg-background p-2 shadow-sm">
                                <div className="grid gap-2">
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="h-3 w-3 rounded-full" 
                                      style={{ backgroundColor: data.color }}
                                    />
                                    <span className="font-medium">{data.label}</span>
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    時間: {data.time}
                                  </div>
                                  <div className="text-sm">
                                    餵食量: {data.amount} ml
                                  </div>
                                  {data.notes && (
                                    <div className="text-sm text-muted-foreground">
                                      備註: {data.notes}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="amount">
                        {feedingChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
                <div className="mt-4 flex flex-wrap gap-3 justify-center">
                  {Object.entries(feedingTypeLabels).map(([key, label]) => (
                    <div key={key} className="flex items-center gap-2">
                      <div 
                        className="h-3 w-3 rounded-full" 
                        style={{ backgroundColor: feedingTypeColors[key] }}
                      />
                      <span className="text-sm text-muted-foreground">{label}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                今日尚無餵食記錄
              </div>
            )
          ) : (
            // Weekly/Monthly: Summary bar chart
            <ChartContainer
              config={{
                count: {
                  label: "次數",
                  color: "hsl(var(--chart-1))",
                },
                amount: {
                  label: "總量(ml)",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-[200px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={feedingChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar dataKey="count" fill="hsl(var(--chart-1))" name="次數" />
                  <Bar dataKey="amount" fill="hsl(var(--chart-2))" name="總量(ml)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Sleep Chart */}
      <Card>
        <CardHeader>
          <CardTitle>
            {timeRange === 'daily' ? '睡眠記錄' : timeRange === 'weekly' ? '睡眠時長（近7天）' : '睡眠時長（近30天）'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {timeRange === 'daily' && sleepChartData.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              今日尚無睡眠記錄
            </div>
          ) : (
            <ChartContainer
              config={{
                duration: {
                  label: "小時",
                  color: "hsl(var(--chart-3))",
                },
              }}
              className="h-[200px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sleepChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey={timeRange === 'daily' ? 'time' : 'date'} 
                    stroke="hsl(var(--muted-foreground))" 
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="duration" 
                    stroke="hsl(var(--chart-3))" 
                    strokeWidth={2}
                    name="小時"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Diaper Chart */}
      {diaperTypeData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>尿布類型分布</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                wet: {
                  label: "尿濕",
                  color: "hsl(var(--chart-1))",
                },
                poop: {
                  label: "大便",
                  color: "hsl(var(--chart-2))",
                },
                mixed: {
                  label: "混合",
                  color: "hsl(var(--chart-3))",
                },
              }}
              className="h-[200px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={diaperTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {diaperTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Weight Chart */}
      {weightData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>體重變化</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                value: {
                  label: "體重(kg)",
                  color: "hsl(var(--chart-4))",
                },
              }}
              className="h-[200px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="hsl(var(--chart-4))" 
                    strokeWidth={2}
                    name="體重(kg)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Temperature Chart */}
      {temperatureData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>體溫記錄</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                value: {
                  label: "體溫(°C)",
                  color: "hsl(var(--chart-5))",
                },
              }}
              className="h-[200px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={temperatureData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" domain={[36, 39]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="hsl(var(--chart-5))" 
                    strokeWidth={2}
                    name="體溫(°C)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
