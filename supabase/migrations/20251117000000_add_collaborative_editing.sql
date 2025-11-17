-- Migration: Add Collaborative Editing Support
-- This migration adds support for multiple users to collaborate on baby care records

-- ============================================
-- 1. Create babies table
-- ============================================
CREATE TABLE public.babies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  birth_date DATE,
  photo_url TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on babies table
ALTER TABLE public.babies ENABLE ROW LEVEL SECURITY;

-- Create index for performance
CREATE INDEX idx_babies_created_by ON public.babies(created_by);

-- Create trigger for updated_at
CREATE TRIGGER update_babies_updated_at
  BEFORE UPDATE ON public.babies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 2. Create baby_collaborators table
-- ============================================
CREATE TABLE public.baby_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  baby_id UUID NOT NULL REFERENCES public.babies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined')) DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(baby_id, user_id)
);

-- Enable RLS on baby_collaborators table
ALTER TABLE public.baby_collaborators ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_baby_collaborators_baby_id ON public.baby_collaborators(baby_id);
CREATE INDEX idx_baby_collaborators_user_id ON public.baby_collaborators(user_id);
CREATE INDEX idx_baby_collaborators_status ON public.baby_collaborators(status);

-- ============================================
-- 3. Create invitations table
-- ============================================
CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  baby_id UUID NOT NULL REFERENCES public.babies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('editor', 'viewer')),
  token TEXT UNIQUE NOT NULL,
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')) DEFAULT 'pending'
);

-- Enable RLS on invitations table
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_invitations_token ON public.invitations(token);
CREATE INDEX idx_invitations_email ON public.invitations(email);
CREATE INDEX idx_invitations_baby_id ON public.invitations(baby_id);
CREATE INDEX idx_invitations_status ON public.invitations(status);

-- ============================================
-- 4. Create activity_logs table
-- ============================================
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  baby_id UUID NOT NULL REFERENCES public.babies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted')),
  record_type TEXT NOT NULL CHECK (record_type IN ('feeding', 'sleep', 'diaper', 'health', 'baby', 'collaborator')),
  record_id UUID,
  changes JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on activity_logs table
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_activity_logs_baby_id ON public.activity_logs(baby_id);
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at);
CREATE INDEX idx_activity_logs_record_type ON public.activity_logs(record_type);

-- ============================================
-- 5. Add baby_id to existing record tables
-- ============================================

-- Add baby_id column to feeding_records
ALTER TABLE public.feeding_records
  ADD COLUMN baby_id UUID REFERENCES public.babies(id) ON DELETE CASCADE;

-- Add baby_id column to sleep_records
ALTER TABLE public.sleep_records
  ADD COLUMN baby_id UUID REFERENCES public.babies(id) ON DELETE CASCADE;

-- Add baby_id column to diaper_records
ALTER TABLE public.diaper_records
  ADD COLUMN baby_id UUID REFERENCES public.babies(id) ON DELETE CASCADE;

-- Add baby_id column to health_records
ALTER TABLE public.health_records
  ADD COLUMN baby_id UUID REFERENCES public.babies(id) ON DELETE CASCADE;

-- Create indexes for baby_id on all record tables
CREATE INDEX idx_feeding_records_baby_id ON public.feeding_records(baby_id);
CREATE INDEX idx_sleep_records_baby_id ON public.sleep_records(baby_id);
CREATE INDEX idx_diaper_records_baby_id ON public.diaper_records(baby_id);
CREATE INDEX idx_health_records_baby_id ON public.health_records(baby_id);

-- ============================================
-- 6. Drop old RLS policies
-- ============================================

-- Drop feeding_records policies
DROP POLICY IF EXISTS "Users can view their own feeding records" ON public.feeding_records;
DROP POLICY IF EXISTS "Users can insert their own feeding records" ON public.feeding_records;
DROP POLICY IF EXISTS "Users can update their own feeding records" ON public.feeding_records;
DROP POLICY IF EXISTS "Users can delete their own feeding records" ON public.feeding_records;

-- Drop sleep_records policies
DROP POLICY IF EXISTS "Users can view their own sleep records" ON public.sleep_records;
DROP POLICY IF EXISTS "Users can insert their own sleep records" ON public.sleep_records;
DROP POLICY IF EXISTS "Users can update their own sleep records" ON public.sleep_records;
DROP POLICY IF EXISTS "Users can delete their own sleep records" ON public.sleep_records;

-- Drop diaper_records policies
DROP POLICY IF EXISTS "Users can view their own diaper records" ON public.diaper_records;
DROP POLICY IF EXISTS "Users can insert their own diaper records" ON public.diaper_records;
DROP POLICY IF EXISTS "Users can update their own diaper records" ON public.diaper_records;
DROP POLICY IF EXISTS "Users can delete their own diaper records" ON public.diaper_records;

-- Drop health_records policies
DROP POLICY IF EXISTS "Users can view their own health records" ON public.health_records;
DROP POLICY IF EXISTS "Users can insert their own health records" ON public.health_records;
DROP POLICY IF EXISTS "Users can update their own health records" ON public.health_records;
DROP POLICY IF EXISTS "Users can delete their own health records" ON public.health_records;

-- ============================================
-- 7. Create new RLS policies for babies table
-- ============================================

-- Users can view babies they created or have access to
CREATE POLICY "Users can view accessible babies"
  ON public.babies FOR SELECT
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM public.baby_collaborators
      WHERE baby_id = babies.id
        AND user_id = auth.uid()
        AND status = 'accepted'
    )
  );

-- Authenticated users can create babies
CREATE POLICY "Authenticated users can create babies"
  ON public.babies FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Only creators can update their babies
CREATE POLICY "Creators can update babies"
  ON public.babies FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Only creators can delete their babies
CREATE POLICY "Creators can delete babies"
  ON public.babies FOR DELETE
  USING (auth.uid() = created_by);

-- ============================================
-- 8. Create RLS policies for baby_collaborators
-- ============================================

-- Users can view collaborators for babies they have access to
CREATE POLICY "Users can view collaborators for accessible babies"
  ON public.baby_collaborators FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.babies
      WHERE id = baby_id AND created_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.baby_collaborators bc
      WHERE bc.baby_id = baby_collaborators.baby_id
        AND bc.user_id = auth.uid()
        AND bc.status = 'accepted'
    )
  );

-- Only baby creators can add collaborators
CREATE POLICY "Baby creators can add collaborators"
  ON public.baby_collaborators FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.babies
      WHERE id = baby_id AND created_by = auth.uid()
    )
  );

-- Only baby creators can update collaborator roles
CREATE POLICY "Baby creators can update collaborators"
  ON public.baby_collaborators FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.babies
      WHERE id = baby_id AND created_by = auth.uid()
    )
  );

-- Baby creators and the collaborator themselves can delete
CREATE POLICY "Baby creators and users can remove collaborators"
  ON public.baby_collaborators FOR DELETE
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.babies
      WHERE id = baby_id AND created_by = auth.uid()
    )
  );

-- ============================================
-- 9. Create RLS policies for invitations
-- ============================================

-- Users can view invitations for their babies or sent to their email
CREATE POLICY "Users can view relevant invitations"
  ON public.invitations FOR SELECT
  USING (
    invited_by = auth.uid() OR
    email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.babies
      WHERE id = baby_id AND created_by = auth.uid()
    )
  );

-- Only baby creators can create invitations
CREATE POLICY "Baby creators can create invitations"
  ON public.invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.babies
      WHERE id = baby_id AND created_by = auth.uid()
    )
  );

-- Only invitation creators can update invitations
CREATE POLICY "Invitation creators can update invitations"
  ON public.invitations FOR UPDATE
  USING (invited_by = auth.uid());

-- Only invitation creators can delete invitations
CREATE POLICY "Invitation creators can delete invitations"
  ON public.invitations FOR DELETE
  USING (invited_by = auth.uid());

-- ============================================
-- 10. Create RLS policies for activity_logs
-- ============================================

-- Users can view activity logs for babies they have access to
CREATE POLICY "Users can view activity logs for accessible babies"
  ON public.activity_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.babies
      WHERE id = baby_id AND created_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.baby_collaborators
      WHERE baby_id = activity_logs.baby_id
        AND user_id = auth.uid()
        AND status = 'accepted'
    )
  );

-- Users with editor or owner role can create activity logs
CREATE POLICY "Editors can create activity logs"
  ON public.activity_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.baby_collaborators
      WHERE baby_id = activity_logs.baby_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'editor')
        AND status = 'accepted'
    )
  );

-- ============================================
-- 11. Create new RLS policies for record tables
-- ============================================

-- Helper function to check if user has access to baby
CREATE OR REPLACE FUNCTION public.user_has_baby_access(p_baby_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.baby_collaborators
    WHERE baby_id = p_baby_id
      AND user_id = p_user_id
      AND status = 'accepted'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user can edit baby
CREATE OR REPLACE FUNCTION public.user_can_edit_baby(p_baby_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.baby_collaborators
    WHERE baby_id = p_baby_id
      AND user_id = p_user_id
      AND role IN ('owner', 'editor')
      AND status = 'accepted'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Feeding records policies
CREATE POLICY "Users can view feeding records for accessible babies"
  ON public.feeding_records FOR SELECT
  USING (public.user_has_baby_access(baby_id, auth.uid()));

CREATE POLICY "Editors can insert feeding records"
  ON public.feeding_records FOR INSERT
  WITH CHECK (public.user_can_edit_baby(baby_id, auth.uid()));

CREATE POLICY "Editors can update feeding records"
  ON public.feeding_records FOR UPDATE
  USING (public.user_can_edit_baby(baby_id, auth.uid()));

CREATE POLICY "Editors can delete feeding records"
  ON public.feeding_records FOR DELETE
  USING (public.user_can_edit_baby(baby_id, auth.uid()));

-- Sleep records policies
CREATE POLICY "Users can view sleep records for accessible babies"
  ON public.sleep_records FOR SELECT
  USING (public.user_has_baby_access(baby_id, auth.uid()));

CREATE POLICY "Editors can insert sleep records"
  ON public.sleep_records FOR INSERT
  WITH CHECK (public.user_can_edit_baby(baby_id, auth.uid()));

CREATE POLICY "Editors can update sleep records"
  ON public.sleep_records FOR UPDATE
  USING (public.user_can_edit_baby(baby_id, auth.uid()));

CREATE POLICY "Editors can delete sleep records"
  ON public.sleep_records FOR DELETE
  USING (public.user_can_edit_baby(baby_id, auth.uid()));

-- Diaper records policies
CREATE POLICY "Users can view diaper records for accessible babies"
  ON public.diaper_records FOR SELECT
  USING (public.user_has_baby_access(baby_id, auth.uid()));

CREATE POLICY "Editors can insert diaper records"
  ON public.diaper_records FOR INSERT
  WITH CHECK (public.user_can_edit_baby(baby_id, auth.uid()));

CREATE POLICY "Editors can update diaper records"
  ON public.diaper_records FOR UPDATE
  USING (public.user_can_edit_baby(baby_id, auth.uid()));

CREATE POLICY "Editors can delete diaper records"
  ON public.diaper_records FOR DELETE
  USING (public.user_can_edit_baby(baby_id, auth.uid()));

-- Health records policies
CREATE POLICY "Users can view health records for accessible babies"
  ON public.health_records FOR SELECT
  USING (public.user_has_baby_access(baby_id, auth.uid()));

CREATE POLICY "Editors can insert health records"
  ON public.health_records FOR INSERT
  WITH CHECK (public.user_can_edit_baby(baby_id, auth.uid()));

CREATE POLICY "Editors can update health records"
  ON public.health_records FOR UPDATE
  USING (public.user_can_edit_baby(baby_id, auth.uid()));

CREATE POLICY "Editors can delete health records"
  ON public.health_records FOR DELETE
  USING (public.user_can_edit_baby(baby_id, auth.uid()));

-- ============================================
-- 12. Create function to auto-create owner collaborator
-- ============================================
CREATE OR REPLACE FUNCTION public.create_owner_collaborator()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.baby_collaborators (baby_id, user_id, role, status, accepted_at)
  VALUES (NEW.id, NEW.created_by, 'owner', 'accepted', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER auto_create_owner_collaborator
  AFTER INSERT ON public.babies
  FOR EACH ROW EXECUTE FUNCTION public.create_owner_collaborator();

-- ============================================
-- 13. Create function to log activity
-- ============================================
CREATE OR REPLACE FUNCTION public.log_record_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_action TEXT;
  v_record_type TEXT;
  v_changes JSONB;
BEGIN
  -- Determine action
  IF (TG_OP = 'INSERT') THEN
    v_action := 'created';
    v_changes := to_jsonb(NEW);
  ELSIF (TG_OP = 'UPDATE') THEN
    v_action := 'updated';
    v_changes := jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW));
  ELSIF (TG_OP = 'DELETE') THEN
    v_action := 'deleted';
    v_changes := to_jsonb(OLD);
  END IF;

  -- Determine record type from table name
  v_record_type := CASE TG_TABLE_NAME
    WHEN 'feeding_records' THEN 'feeding'
    WHEN 'sleep_records' THEN 'sleep'
    WHEN 'diaper_records' THEN 'diaper'
    WHEN 'health_records' THEN 'health'
    ELSE TG_TABLE_NAME
  END;

  -- Insert activity log
  INSERT INTO public.activity_logs (
    baby_id,
    user_id,
    action,
    record_type,
    record_id,
    changes
  ) VALUES (
    COALESCE(NEW.baby_id, OLD.baby_id),
    auth.uid(),
    v_action,
    v_record_type,
    COALESCE(NEW.id, OLD.id),
    v_changes
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for activity logging on all record tables
CREATE TRIGGER log_feeding_activity
  AFTER INSERT OR UPDATE OR DELETE ON public.feeding_records
  FOR EACH ROW EXECUTE FUNCTION public.log_record_activity();

CREATE TRIGGER log_sleep_activity
  AFTER INSERT OR UPDATE OR DELETE ON public.sleep_records
  FOR EACH ROW EXECUTE FUNCTION public.log_record_activity();

CREATE TRIGGER log_diaper_activity
  AFTER INSERT OR UPDATE OR DELETE ON public.diaper_records
  FOR EACH ROW EXECUTE FUNCTION public.log_record_activity();

CREATE TRIGGER log_health_activity
  AFTER INSERT OR UPDATE OR DELETE ON public.health_records
  FOR EACH ROW EXECUTE FUNCTION public.log_record_activity();

-- ============================================
-- 14. Data migration: Create default baby for existing users
-- ============================================

-- Create a default baby for each user who has records
DO $$
DECLARE
  v_user RECORD;
  v_baby_id UUID;
BEGIN
  FOR v_user IN (
    SELECT DISTINCT user_id
    FROM (
      SELECT user_id FROM public.feeding_records
      UNION
      SELECT user_id FROM public.sleep_records
      UNION
      SELECT user_id FROM public.diaper_records
      UNION
      SELECT user_id FROM public.health_records
    ) AS all_users
  ) LOOP
    -- Create a default baby for this user
    INSERT INTO public.babies (name, created_by, created_at)
    VALUES ('我的寶寶', v_user.user_id, now())
    RETURNING id INTO v_baby_id;

    -- Update all records to point to this baby
    UPDATE public.feeding_records
    SET baby_id = v_baby_id
    WHERE user_id = v_user.user_id AND baby_id IS NULL;

    UPDATE public.sleep_records
    SET baby_id = v_baby_id
    WHERE user_id = v_user.user_id AND baby_id IS NULL;

    UPDATE public.diaper_records
    SET baby_id = v_baby_id
    WHERE user_id = v_user.user_id AND baby_id IS NULL;

    UPDATE public.health_records
    SET baby_id = v_baby_id
    WHERE user_id = v_user.user_id AND baby_id IS NULL;
  END LOOP;
END $$;

-- ============================================
-- 15. Make baby_id NOT NULL after migration
-- ============================================

-- Now that all existing records have baby_id, make it required
ALTER TABLE public.feeding_records ALTER COLUMN baby_id SET NOT NULL;
ALTER TABLE public.sleep_records ALTER COLUMN baby_id SET NOT NULL;
ALTER TABLE public.diaper_records ALTER COLUMN baby_id SET NOT NULL;
ALTER TABLE public.health_records ALTER COLUMN baby_id SET NOT NULL;

-- Add comment to document the schema
COMMENT ON TABLE public.babies IS 'Baby profiles that can be shared among multiple users';
COMMENT ON TABLE public.baby_collaborators IS 'User access permissions for babies';
COMMENT ON TABLE public.invitations IS 'Pending invitations to collaborate on babies';
COMMENT ON TABLE public.activity_logs IS 'Audit trail of all changes to baby records';
