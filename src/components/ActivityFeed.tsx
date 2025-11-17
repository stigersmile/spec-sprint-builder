import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ActivityLog } from "@/types/baby";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Baby,
  Milk,
  Moon,
  Activity,
  Thermometer,
  Clock,
  Edit,
  Trash2,
  Plus,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { zhTW } from "date-fns/locale";

interface ActivityFeedProps {
  babyId: string;
  limit?: number;
}

const getActivityIcon = (recordType: string) => {
  switch (recordType) {
    case "feeding":
      return <Milk className="h-4 w-4" />;
    case "sleep":
      return <Moon className="h-4 w-4" />;
    case "diaper":
      return <Activity className="h-4 w-4" />;
    case "health":
      return <Thermometer className="h-4 w-4" />;
    case "baby":
      return <Baby className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

const getActionIcon = (action: string) => {
  switch (action) {
    case "created":
      return <Plus className="h-3 w-3" />;
    case "updated":
      return <Edit className="h-3 w-3" />;
    case "deleted":
      return <Trash2 className="h-3 w-3" />;
    default:
      return null;
  }
};

const getActionText = (action: string) => {
  switch (action) {
    case "created":
      return "新增了";
    case "updated":
      return "更新了";
    case "deleted":
      return "刪除了";
    default:
      return action;
  }
};

const getRecordTypeText = (recordType: string) => {
  switch (recordType) {
    case "feeding":
      return "餵食記錄";
    case "sleep":
      return "睡眠記錄";
    case "diaper":
      return "尿布記錄";
    case "health":
      return "健康記錄";
    case "baby":
      return "寶寶資料";
    case "collaborator":
      return "協作者";
    default:
      return recordType;
  }
};

const getActionColor = (action: string) => {
  switch (action) {
    case "created":
      return "bg-green-100 text-green-700";
    case "updated":
      return "bg-blue-100 text-blue-700";
    case "deleted":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

export function ActivityFeed({ babyId, limit = 50 }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (babyId) {
      fetchActivities();
    }
  }, [babyId]);

  const fetchActivities = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from("activity_logs")
        .select("*")
        .eq("baby_id", babyId)
        .order("created_at", { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      setActivities(data || []);
    } catch (error) {
      console.error("Failed to fetch activities:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-sm text-gray-500">載入中...</p>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">活動紀錄</CardTitle>
          <CardDescription>查看所有變更歷史</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 text-center">尚無活動記錄</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">活動紀錄</CardTitle>
        <CardDescription>最近的變更歷史</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex gap-3 pb-4 border-b last:border-b-0">
                <div className={`mt-1 p-2 rounded-full ${getActionColor(activity.action)}`}>
                  {getActivityIcon(activity.record_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">
                          {activity.user_email || "使用者"}
                        </span>
                        <span className="text-sm text-gray-600">
                          {getActionText(activity.action)}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {getRecordTypeText(activity.record_type)}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDistanceToNow(new Date(activity.created_at), {
                          addSuffix: true,
                          locale: zhTW,
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {getActionIcon(activity.action)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
