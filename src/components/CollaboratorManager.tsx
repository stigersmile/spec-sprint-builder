import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BabyCollaborator, Invitation, CollaboratorRole } from "@/types/baby";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Trash2, Mail, X, RefreshCw } from "lucide-react";
import { InvitationDialog } from "./InvitationDialog";

interface CollaboratorManagerProps {
  babyId: string;
  babyName: string;
}

interface CollaboratorWithEmail extends BabyCollaborator {
  email?: string;
}

export function CollaboratorManager({ babyId, babyName }: CollaboratorManagerProps) {
  const [collaborators, setCollaborators] = useState<CollaboratorWithEmail[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [invitationDialogOpen, setInvitationDialogOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCurrentUser();
    fetchCollaborators();
    fetchInvitations();
  }, [babyId]);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const fetchCollaborators = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("baby_collaborators")
        .select("*")
        .eq("baby_id", babyId)
        .eq("status", "accepted")
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Fetch user emails for each collaborator
      const collaboratorsWithEmail: CollaboratorWithEmail[] = [];
      for (const collab of data || []) {
        const { data: userData } = await supabase.auth.admin.getUserById(collab.user_id);
        collaboratorsWithEmail.push({
          ...collab,
          email: userData?.user?.email,
        });
      }

      setCollaborators(collaboratorsWithEmail);
    } catch (error: any) {
      // If admin API fails, try to get emails from auth.users view if available
      // For now, just show without emails
      const { data } = await supabase
        .from("baby_collaborators")
        .select("*")
        .eq("baby_id", babyId)
        .eq("status", "accepted");

      setCollaborators(data || []);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvitations = async () => {
    try {
      const { data, error } = await supabase
        .from("invitations")
        .select("*")
        .eq("baby_id", babyId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setInvitations(data || []);
    } catch (error: any) {
      console.error("Failed to fetch invitations:", error);
    }
  };

  const handleUpdateRole = async (collaboratorId: string, newRole: CollaboratorRole) => {
    try {
      const { error } = await supabase
        .from("baby_collaborators")
        .update({ role: newRole })
        .eq("id", collaboratorId);

      if (error) throw error;

      toast({
        title: "權限已更新",
        description: "協作者權限已成功更新",
      });

      fetchCollaborators();
    } catch (error: any) {
      toast({
        title: "更新失敗",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRemoveCollaborator = async (collaboratorId: string, email?: string) => {
    if (!confirm(`確定要移除 ${email || "此協作者"} 嗎？`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("baby_collaborators")
        .delete()
        .eq("id", collaboratorId);

      if (error) throw error;

      toast({
        title: "移除成功",
        description: "協作者已被移除",
      });

      fetchCollaborators();
    } catch (error: any) {
      toast({
        title: "移除失敗",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from("invitations")
        .update({ status: "cancelled" })
        .eq("id", invitationId);

      if (error) throw error;

      toast({
        title: "已取消邀請",
      });

      fetchInvitations();
    } catch (error: any) {
      toast({
        title: "操作失敗",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleResendInvitation = async (invitation: Invitation) => {
    try {
      // Update expiry date
      const newExpiresAt = new Date();
      newExpiresAt.setDate(newExpiresAt.getDate() + 7);

      const { error } = await supabase
        .from("invitations")
        .update({ expires_at: newExpiresAt.toISOString() })
        .eq("id", invitation.id);

      if (error) throw error;

      // Copy link to clipboard
      const link = `${window.location.origin}/invite/${invitation.token}`;
      navigator.clipboard.writeText(link);

      toast({
        title: "邀請已更新",
        description: "新的邀請連結已複製到剪貼簿",
      });

      fetchInvitations();
    } catch (error: any) {
      toast({
        title: "操作失敗",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const isOwner = collaborators.some(
    c => c.user_id === currentUserId && c.role === "owner"
  );

  if (loading) {
    return <div>載入中...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>協作者管理</CardTitle>
              <CardDescription>管理「{babyName}」的協作者</CardDescription>
            </div>
            {isOwner && (
              <Button onClick={() => setInvitationDialogOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                邀請協作者
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {collaborators.map((collaborator) => {
              const isCurrentUser = collaborator.user_id === currentUserId;
              const canEdit = isOwner && collaborator.role !== "owner" && !isCurrentUser;

              return (
                <div
                  key={collaborator.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {collaborator.email || "使用者"}
                      </span>
                      {isCurrentUser && (
                        <Badge variant="outline">您</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {new Date(collaborator.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {canEdit ? (
                      <Select
                        value={collaborator.role}
                        onValueChange={(value: CollaboratorRole) =>
                          handleUpdateRole(collaborator.id, value)
                        }
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="editor">編輯者</SelectItem>
                          <SelectItem value="viewer">檢視者</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant={collaborator.role === "owner" ? "default" : "secondary"}>
                        {collaborator.role === "owner"
                          ? "擁有者"
                          : collaborator.role === "editor"
                          ? "編輯者"
                          : "檢視者"}
                      </Badge>
                    )}
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          handleRemoveCollaborator(collaborator.id, collaborator.email)
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>待處理邀請</CardTitle>
            <CardDescription>尚未接受的邀請</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {invitations.map((invitation) => {
                const isExpired = new Date(invitation.expires_at) < new Date();

                return (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{invitation.email}</span>
                        {isExpired && (
                          <Badge variant="destructive">已過期</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        權限: {invitation.role === "editor" ? "編輯者" : "檢視者"} •
                        過期時間: {new Date(invitation.expires_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isExpired && isOwner && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResendInvitation(invitation)}
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          重新發送
                        </Button>
                      )}
                      {isOwner && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCancelInvitation(invitation.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <InvitationDialog
        babyId={babyId}
        babyName={babyName}
        open={invitationDialogOpen}
        onOpenChange={setInvitationDialogOpen}
        onInvitationSent={() => {
          fetchInvitations();
        }}
      />
    </div>
  );
}
