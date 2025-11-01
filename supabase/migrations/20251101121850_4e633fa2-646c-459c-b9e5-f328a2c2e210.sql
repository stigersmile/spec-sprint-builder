-- 創建照顧者角色枚舉
CREATE TYPE public.caregiver_role AS ENUM ('owner', 'editor', 'viewer');

-- 創建寶寶表
CREATE TABLE public.babies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female')),
  photo TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 創建照顧者關聯表
CREATE TABLE public.baby_caregivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  baby_id UUID NOT NULL REFERENCES public.babies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.caregiver_role NOT NULL DEFAULT 'viewer',
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(baby_id, user_id)
);

-- 創建邀請表
CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  baby_id UUID NOT NULL REFERENCES public.babies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role public.caregiver_role NOT NULL DEFAULT 'editor',
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 先添加 baby_id 列到記錄表（允許 NULL）
ALTER TABLE public.feeding_records ADD COLUMN baby_id UUID REFERENCES public.babies(id) ON DELETE CASCADE;
ALTER TABLE public.sleep_records ADD COLUMN baby_id UUID REFERENCES public.babies(id) ON DELETE CASCADE;
ALTER TABLE public.diaper_records ADD COLUMN baby_id UUID REFERENCES public.babies(id) ON DELETE CASCADE;
ALTER TABLE public.health_records ADD COLUMN baby_id UUID REFERENCES public.babies(id) ON DELETE CASCADE;

-- 為現有用戶創建默認寶寶並遷移數據
DO $$
DECLARE
  user_record RECORD;
  new_baby_id UUID;
BEGIN
  FOR user_record IN 
    SELECT DISTINCT user_id FROM public.feeding_records
    UNION
    SELECT DISTINCT user_id FROM public.sleep_records
    UNION
    SELECT DISTINCT user_id FROM public.diaper_records
    UNION
    SELECT DISTINCT user_id FROM public.health_records
  LOOP
    -- 創建默認寶寶
    INSERT INTO public.babies (name, birth_date, gender, created_by)
    VALUES ('我的寶寶', CURRENT_DATE, 'male', user_record.user_id)
    RETURNING id INTO new_baby_id;
    
    -- 添加所有者權限
    INSERT INTO public.baby_caregivers (baby_id, user_id, role)
    VALUES (new_baby_id, user_record.user_id, 'owner');
    
    -- 遷移記錄
    UPDATE public.feeding_records SET baby_id = new_baby_id WHERE user_id = user_record.user_id;
    UPDATE public.sleep_records SET baby_id = new_baby_id WHERE user_id = user_record.user_id;
    UPDATE public.diaper_records SET baby_id = new_baby_id WHERE user_id = user_record.user_id;
    UPDATE public.health_records SET baby_id = new_baby_id WHERE user_id = user_record.user_id;
  END LOOP;
END $$;

-- 設置 baby_id 為 NOT NULL
ALTER TABLE public.feeding_records ALTER COLUMN baby_id SET NOT NULL;
ALTER TABLE public.sleep_records ALTER COLUMN baby_id SET NOT NULL;
ALTER TABLE public.diaper_records ALTER COLUMN baby_id SET NOT NULL;
ALTER TABLE public.health_records ALTER COLUMN baby_id SET NOT NULL;

-- 刪除舊的 RLS 策略
DROP POLICY IF EXISTS "Users can view their own feeding records" ON public.feeding_records;
DROP POLICY IF EXISTS "Users can insert their own feeding records" ON public.feeding_records;
DROP POLICY IF EXISTS "Users can update their own feeding records" ON public.feeding_records;
DROP POLICY IF EXISTS "Users can delete their own feeding records" ON public.feeding_records;

DROP POLICY IF EXISTS "Users can view their own sleep records" ON public.sleep_records;
DROP POLICY IF EXISTS "Users can insert their own sleep records" ON public.sleep_records;
DROP POLICY IF EXISTS "Users can update their own sleep records" ON public.sleep_records;
DROP POLICY IF EXISTS "Users can delete their own sleep records" ON public.sleep_records;

DROP POLICY IF EXISTS "Users can view their own diaper records" ON public.diaper_records;
DROP POLICY IF EXISTS "Users can insert their own diaper records" ON public.diaper_records;
DROP POLICY IF EXISTS "Users can update their own diaper records" ON public.diaper_records;
DROP POLICY IF EXISTS "Users can delete their own diaper records" ON public.diaper_records;

DROP POLICY IF EXISTS "Users can view their own health records" ON public.health_records;
DROP POLICY IF EXISTS "Users can insert their own health records" ON public.health_records;
DROP POLICY IF EXISTS "Users can update their own health records" ON public.health_records;
DROP POLICY IF EXISTS "Users can delete their own health records" ON public.health_records;

-- 刪除 user_id 列
ALTER TABLE public.feeding_records DROP COLUMN user_id;
ALTER TABLE public.sleep_records DROP COLUMN user_id;
ALTER TABLE public.diaper_records DROP COLUMN user_id;
ALTER TABLE public.health_records DROP COLUMN user_id;

-- 啟用 RLS
ALTER TABLE public.babies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.baby_caregivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- 創建權限檢查函數
CREATE OR REPLACE FUNCTION public.get_user_baby_role(p_baby_id UUID, p_user_id UUID)
RETURNS public.caregiver_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.baby_caregivers
  WHERE baby_id = p_baby_id AND user_id = p_user_id
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.user_has_baby_access(p_baby_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.baby_caregivers
    WHERE baby_id = p_baby_id AND user_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.user_can_edit_baby(p_baby_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.baby_caregivers
    WHERE baby_id = p_baby_id 
    AND user_id = p_user_id 
    AND role IN ('owner', 'editor')
  );
$$;

-- Babies 表的 RLS 策略
CREATE POLICY "Users can view babies they have access to"
ON public.babies FOR SELECT
USING (public.user_has_baby_access(id, auth.uid()));

CREATE POLICY "Users can create their own babies"
ON public.babies FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Owners can update their babies"
ON public.babies FOR UPDATE
USING (public.get_user_baby_role(id, auth.uid()) = 'owner');

CREATE POLICY "Owners can delete their babies"
ON public.babies FOR DELETE
USING (public.get_user_baby_role(id, auth.uid()) = 'owner');

-- Baby caregivers 表的 RLS 策略
CREATE POLICY "Users can view caregivers of accessible babies"
ON public.baby_caregivers FOR SELECT
USING (public.user_has_baby_access(baby_id, auth.uid()));

CREATE POLICY "Owners can manage caregivers"
ON public.baby_caregivers FOR ALL
USING (public.get_user_baby_role(baby_id, auth.uid()) = 'owner');

-- Invitations 表的 RLS 策略
CREATE POLICY "Users can view invitations they sent"
ON public.invitations FOR SELECT
USING (invited_by = auth.uid());

CREATE POLICY "Owners can create invitations"
ON public.invitations FOR INSERT
WITH CHECK (public.get_user_baby_role(baby_id, auth.uid()) = 'owner');

CREATE POLICY "Owners can delete invitations"
ON public.invitations FOR DELETE
USING (public.get_user_baby_role(baby_id, auth.uid()) = 'owner');

-- 記錄表的新 RLS 策略
CREATE POLICY "Users can view feeding records of accessible babies"
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

CREATE POLICY "Users can view sleep records of accessible babies"
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

CREATE POLICY "Users can view diaper records of accessible babies"
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

CREATE POLICY "Users can view health records of accessible babies"
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

-- 創建觸發器
CREATE OR REPLACE FUNCTION public.handle_new_baby()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.baby_caregivers (baby_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'owner');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_baby_created
  AFTER INSERT ON public.babies
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_baby();

CREATE TRIGGER update_babies_updated_at
  BEFORE UPDATE ON public.babies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();