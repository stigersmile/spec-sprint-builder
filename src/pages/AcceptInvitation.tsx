import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Invitation } from "@/types/baby";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Baby, Calendar, Mail } from "lucide-react";

export default function AcceptInvitation() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (token) {
      fetchInvitation();
    }
  }, [token]);

  const fetchInvitation = async () => {
    try {
      setLoading(true);

      // Fetch invitation with baby details
      const { data, error } = await supabase
        .from("invitations")
        .select(`
          *,
          baby:babies(*)
        `)
        .eq("token", token)
        .eq("status", "pending")
        .single();

      if (error) throw error;

      if (!data) {
        setError("邀請不存在或已被使用");
        return;
      }

      // Check if expired
      if (new Date(data.expires_at) < new Date()) {
        setError("此邀請已過期");
        return;
      }

      setInvitation(data as any);
    } catch (error: any) {
      setError("無法載入邀請資訊");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!invitation) return;

    try {
      setProcessing(true);

      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Redirect to auth page with return URL
        navigate(`/auth?redirect=/invite/${token}`);
        return;
      }

      // Check if user email matches invitation email
      if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
        toast({
          title: "Email 不符",
          description: `此邀請是發送給 ${invitation.email}，請使用正確的帳號登入`,
          variant: "destructive",
        });
        return;
      }

      // Check if already a collaborator
      const { data: existingCollab } = await supabase
        .from("baby_collaborators")
        .select("*")
        .eq("baby_id", invitation.baby_id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingCollab) {
        toast({
          title: "已經是協作者",
          description: "您已經有此寶寶的訪問權限",
        });
        navigate("/");
        return;
      }

      // Create collaborator record
      const { error: collabError } = await supabase
        .from("baby_collaborators")
        .insert({
          baby_id: invitation.baby_id,
          user_id: user.id,
          role: invitation.role,
          invited_by: invitation.invited_by,
          accepted_at: new Date().toISOString(),
          status: "accepted",
        });

      if (collabError) throw collabError;

      // Update invitation status
      const { error: inviteError } = await supabase
        .from("invitations")
        .update({ status: "accepted" })
        .eq("id", invitation.id);

      if (inviteError) throw inviteError;

      setAccepted(true);

      toast({
        title: "邀請已接受",
        description: `您現在可以訪問「${invitation.baby?.name}」的記錄`,
      });

      // Redirect to home after 2 seconds
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error: any) {
      toast({
        title: "接受邀請失敗",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!invitation) return;

    if (!confirm("確定要拒絕此邀請嗎？")) return;

    try {
      const { error } = await supabase
        .from("invitations")
        .update({ status: "cancelled" })
        .eq("id", invitation.id);

      if (error) throw error;

      toast({
        title: "已拒絕邀請",
      });

      navigate("/");
    } catch (error: any) {
      toast({
        title: "操作失敗",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p>載入中...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <XCircle className="h-16 w-16 text-red-500" />
            </div>
            <CardTitle className="text-center">無效的邀請</CardTitle>
            <CardDescription className="text-center">
              {error || "此邀請連結無效"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")} className="w-full">
              返回首頁
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-center">邀請已接受！</CardTitle>
            <CardDescription className="text-center">
              正在跳轉至首頁...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>協作邀請</CardTitle>
          <CardDescription>
            您收到了一個協作邀請
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div className="flex items-center gap-3">
                <Baby className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-500">寶寶名稱</p>
                  <p className="font-medium">{invitation.baby?.name || "未知"}</p>
                </div>
              </div>

              {invitation.baby?.birth_date && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm text-gray-500">生日</p>
                    <p className="font-medium">
                      {new Date(invitation.baby.birth_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-500">邀請發送給</p>
                  <p className="font-medium">{invitation.email}</p>
                </div>
              </div>

              <div className="pt-2 border-t">
                <p className="text-sm text-gray-500">您的權限</p>
                <p className="font-medium">
                  {invitation.role === "editor" ? "編輯者 - 可新增、編輯、刪除記錄" : "檢視者 - 僅能查看記錄"}
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-500">
              此邀請將於 {new Date(invitation.expires_at).toLocaleDateString()} 過期
            </p>

            <div className="flex gap-3">
              <Button
                onClick={handleDecline}
                variant="outline"
                className="flex-1"
                disabled={processing}
              >
                拒絕
              </Button>
              <Button
                onClick={handleAccept}
                className="flex-1"
                disabled={processing}
              >
                {processing ? "處理中..." : "接受邀請"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
