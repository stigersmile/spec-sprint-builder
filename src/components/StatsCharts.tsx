import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts";
import type { FeedingRecord, SleepRecord, DiaperRecord, HealthRecord } from "@/types/baby";
import { format, subDays, startOfDay } from "date-fns";

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
  // Process feeding data for last 7 days
  const feedingChartData = Array.from({ length: 7 }, (_, i) => {
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

  // Process sleep data for last 7 days
  const sleepChartData = Array.from({ length: 7 }, (_, i) => {
    const date = startOfDay(subDays(new Date(), 6 - i));
    const dateStr = format(date, 'MM/dd');
    const dayRecords = sleepRecords.filter(r => 
      startOfDay(new Date(r.startTime)).getTime() === date.getTime()
    );
    
    return {
      date: dateStr,
      duration: dayRecords.reduce((sum, r) => sum + (r.duration || 0), 0) / 60 // Convert to hours
    };
  });

  // Process diaper data for distribution
  const diaperTypeData = [
    { name: '尿濕', value: diaperRecords.filter(r => r.type === 'wet').length, fill: 'hsl(var(--chart-1))' },
    { name: '大便', value: diaperRecords.filter(r => r.type === 'poop').length, fill: 'hsl(var(--chart-2))' },
    { name: '混合', value: diaperRecords.filter(r => r.type === 'mixed').length, fill: 'hsl(var(--chart-3))' }
  ].filter(item => item.value > 0);

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

      {/* Feeding Charts */}
      <Card>
        <CardHeader>
          <CardTitle>餵食統計（近7天）</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* Sleep Chart */}
      <Card>
        <CardHeader>
          <CardTitle>睡眠時長（近7天）</CardTitle>
        </CardHeader>
        <CardContent>
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
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
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
