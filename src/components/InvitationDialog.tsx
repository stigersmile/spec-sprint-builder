import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Copy, Mail } from "lucide-react";

interface InvitationDialogProps {
  babyId: string;
  babyName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvitationSent: () => void;
}

export function InvitationDialog({
  babyId,
  babyName,
  open,
  onOpenChange,
  onInvitationSent,
}: InvitationDialogProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"editor" | "viewer">("editor");
  const [loading, setLoading] = useState(false);
  const [invitationToken, setInvitationToken] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSendInvitation = async () => {
    try {
      setLoading(true);

      // Validate email
      if (!email || !email.includes("@")) {
        toast({
          title: "請輸入有效的 Email",
          variant: "destructive",
        });
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("未登入");

      // Check if user is already a collaborator
      const { data: existingCollab } = await supabase
        .from("baby_collaborators")
        .select("*")
        .eq("baby_id", babyId)
        .eq("user_id", user.id)
        .maybeSingle();

      // Get user by email to check if they exist
      const { data: invitedUser } = await supabase
        .from("baby_collaborators")
        .select("user_id")
        .eq("baby_id", babyId)
        .limit(1);

      // Generate unique token
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      // Create invitation
      const { data, error } = await supabase
        .from("invitations")
        .insert({
          baby_id: babyId,
          email: email.toLowerCase(),
          role,
          token,
          invited_by: user.id,
          expires_at: expiresAt.toISOString(),
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      setInvitationToken(token);

      toast({
        title: "邀請已建立",
        description: "請將邀請連結分享給對方",
      });

      onInvitationSent();
    } catch (error: any) {
      toast({
        title: "發送邀請失敗",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (invitationToken) {
      const link = `${window.location.origin}/invite/${invitationToken}`;
      navigator.clipboard.writeText(link);
      toast({
        title: "已複製連結",
        description: "邀請連結已複製到剪貼簿",
      });
    }
  };

  const handleClose = () => {
    setEmail("");
    setRole("editor");
    setInvitationToken(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>邀請協作者</DialogTitle>
          <DialogDescription>
            邀請其他人一起管理「{babyName}」的記錄
          </DialogDescription>
        </DialogHeader>

        {!invitationToken ? (
          <>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">權限</Label>
                <Select
                  value={role}
                  onValueChange={(value: "editor" | "viewer") => setRole(value)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="editor">
                      編輯者 - 可新增、編輯、刪除記錄
                    </SelectItem>
                    <SelectItem value="viewer">
                      檢視者 - 僅能查看記錄
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                取消
              </Button>
              <Button onClick={handleSendInvitation} disabled={loading}>
                <Mail className="mr-2 h-4 w-4" />
                {loading ? "建立中..." : "建立邀請"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="grid gap-4 py-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-800 mb-2">
                  邀請連結已建立！請將以下連結分享給 {email}
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={`${window.location.origin}/invite/${invitationToken}`}
                    className="font-mono text-xs"
                  />
                  <Button size="icon" variant="outline" onClick={handleCopyLink}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                此連結將在 7 天後過期
              </p>
            </div>
            <DialogFooter>
              <Button onClick={handleClose}>完成</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
