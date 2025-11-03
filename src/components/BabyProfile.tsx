import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Baby } from '@/types/baby';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, ArrowLeft } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BabyProfileProps {
  babyId: string;
  onBack: () => void;
}

export const BabyProfile = ({ babyId, onBack }: BabyProfileProps) => {
  const [baby, setBaby] = useState<Baby | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchBaby();
  }, [babyId]);

  const fetchBaby = async () => {
    try {
      const { data, error } = await supabase
        .from('babies')
        .select('*')
        .eq('id', babyId)
        .single();

      if (error) throw error;
      
      // Map database fields to Baby interface
      setBaby({
        id: data.id,
        name: data.name,
        birthDate: data.birth_date,
        gender: data.gender as 'male' | 'female',
        photo: data.photo || undefined,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image under 5MB',
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile || !baby) return;

    setUploading(true);
    try {
      // Delete old photo if exists
      if (baby.photo) {
        const oldPath = baby.photo.split('/').slice(-2).join('/');
        await supabase.storage.from('baby-photos').remove([oldPath]);
      }

      // Upload new photo
      const timestamp = Date.now();
      const fileName = `${babyId}/${timestamp}-${selectedFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('baby-photos')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('baby-photos')
        .getPublicUrl(fileName);

      // Update database
      const { error: updateError } = await supabase
        .from('babies')
        .update({ photo: publicUrl })
        .eq('id', babyId);

      if (updateError) throw updateError;

      setBaby({ ...baby, photo: publicUrl });
      setSelectedFile(null);
      setPreviewUrl(null);

      toast({
        title: 'Success',
        description: 'Photo uploaded successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveDetails = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!baby) return;

    setSaving(true);
    try {
      const formData = new FormData(e.currentTarget);
      const { error } = await supabase
        .from('babies')
        .update({
          name: formData.get('name') as string,
          birth_date: formData.get('birthDate') as string,
          gender: formData.get('gender') as string,
        })
        .eq('id', babyId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Baby details updated',
      });

      fetchBaby();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!baby) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardHeader>
            <CardTitle>Baby not found</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Baby Photo</CardTitle>
          <CardDescription>Upload or change your baby's photo</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <Avatar className="h-32 w-32">
            <AvatarImage src={previewUrl || baby.photo || ''} />
            <AvatarFallback className="text-4xl">
              {baby.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-col gap-2 w-full max-w-xs">
            <Input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={uploading}
            />
            {selectedFile && (
              <Button onClick={handleUpload} disabled={uploading}>
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Photo
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Baby Details</CardTitle>
          <CardDescription>Update your baby's information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveDetails} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={baby.name}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthDate">Birth Date</Label>
              <Input
                id="birthDate"
                name="birthDate"
                type="date"
                defaultValue={baby.birthDate}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select name="gender" defaultValue={baby.gender}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
