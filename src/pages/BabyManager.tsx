import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Baby, BabyCollaborator } from "@/types/baby";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Edit, Trash2, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CollaboratorManager } from "@/components/CollaboratorManager";

export default function BabyManager() {
  const [babies, setBabies] = useState<Baby[]>([]);
  const [collaborators, setCollaborators] = useState<Record<string, BabyCollaborator[]>>({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBaby, setEditingBaby] = useState<Baby | null>(null);
  const [babyName, setBabyName] = useState("");
  const [babyBirthDate, setBabyBirthDate] = useState("");
  const [managingCollaborators, setManagingCollaborators] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchBabies();
  }, []);

  const fetchBabies = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("babies")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setBabies(data || []);

      // Fetch collaborators for each baby
      if (data) {
        const collabData: Record<string, BabyCollaborator[]> = {};
        for (const baby of data) {
          const { data: collabs } = await supabase
            .from("baby_collaborators")
            .select("*")
            .eq("baby_id", baby.id)
            .eq("status", "accepted");

          collabData[baby.id] = collabs || [];
        }
        setCollaborators(collabData);
      }
    } catch (error: any) {
      toast({
        title: "載入失敗",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddBaby = () => {
    setEditingBaby(null);
    setBabyName("");
    setBabyBirthDate("");
    setDialogOpen(true);
  };

  const handleEditBaby = (baby: Baby) => {
    setEditingBaby(baby);
    setBabyName(baby.name);
    setBabyBirthDate(baby.birth_date || "");
    setDialogOpen(true);
  };

  const handleSaveBaby = async () => {
    try {
      if (!babyName.trim()) {
        toast({
          title: "請輸入寶寶名稱",
          variant: "destructive",
        });
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("未登入");

      if (editingBaby) {
        // Update existing baby
        const { error } = await supabase
          .from("babies")
          .update({
            name: babyName,
            birth_date: babyBirthDate || null,
          })
          .eq("id", editingBaby.id);

        if (error) throw error;

        toast({
          title: "更新成功",
          description: "寶寶資料已更新",
        });
      } else {
        // Create new baby
        const { error } = await supabase
          .from("babies")
          .insert({
            name: babyName,
            birth_date: babyBirthDate || null,
            created_by: user.id,
          });

        if (error) throw error;

        toast({
          title: "新增成功",
          description: "新寶寶已建立",
        });
      }

      setDialogOpen(false);
      fetchBabies();
    } catch (error: any) {
      toast({
        title: "操作失敗",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteBaby = async (baby: Baby) => {
    if (!confirm(`確定要刪除「${baby.name}」嗎？這將刪除所有相關記錄。`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("babies")
        .delete()
        .eq("id", baby.id);

      if (error) throw error;

      toast({
        title: "刪除成功",
        description: "寶寶及相關記錄已刪除",
      });

      fetchBabies();
    } catch (error: any) {
      toast({
        title: "刪除失敗",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getUserRole = (babyId: string): string => {
    const { data: { user } } = supabase.auth.getUser() as any;
    const baby = babies.find(b => b.id === babyId);
    if (baby?.created_by === user?.id) return "owner";

    const collab = collaborators[babyId]?.find(c => c.user_id === user?.id);
    return collab?.role || "viewer";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">載入中...</div>
        </div>
      </div>
    );
  }

  if (managingCollaborators) {
    const baby = babies.find(b => b.id === managingCollaborators);
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => setManagingCollaborators(null)}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Button>
          {baby && <CollaboratorManager babyId={baby.id} babyName={baby.name} />}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="mb-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回主頁
            </Button>
            <h1 className="text-3xl font-bold text-gray-800">寶寶管理</h1>
            <p className="text-gray-600">管理您的寶寶檔案與協作者</p>
          </div>
          <Button onClick={handleAddBaby}>
            <Plus className="mr-2 h-4 w-4" />
            新增寶寶
          </Button>
        </div>

        <div className="grid gap-4">
          {babies.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-gray-500 mb-4">還沒有寶寶檔案</p>
                <Button onClick={handleAddBaby}>
                  <Plus className="mr-2 h-4 w-4" />
                  新增第一個寶寶
                </Button>
              </CardContent>
            </Card>
          ) : (
            babies.map((baby) => {
              const role = getUserRole(baby.id);
              const collabCount = collaborators[baby.id]?.length || 0;

              return (
                <Card key={baby.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{baby.name}</CardTitle>
                        <CardDescription>
                          {baby.birth_date && `生日: ${new Date(baby.birth_date).toLocaleDateString()}`}
                          <span className="ml-3 text-xs bg-gray-100 px-2 py-1 rounded">
                            {role === "owner" ? "擁有者" : role === "editor" ? "編輯者" : "檢視者"}
                          </span>
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setManagingCollaborators(baby.id)}
                        >
                          <Users className="mr-2 h-4 w-4" />
                          協作者 ({collabCount})
                        </Button>
                        {role === "owner" && (
                          <>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleEditBaby(baby)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleDeleteBaby(baby)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              );
            })
          )}
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingBaby ? "編輯寶寶" : "新增寶寶"}
              </DialogTitle>
              <DialogDescription>
                填寫寶寶的基本資料
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">名稱</Label>
                <Input
                  id="name"
                  value={babyName}
                  onChange={(e) => setBabyName(e.target.value)}
                  placeholder="寶寶的名字"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="birthDate">生日（選填）</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={babyBirthDate}
                  onChange={(e) => setBabyBirthDate(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleSaveBaby}>
                {editingBaby ? "更新" : "新增"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
