-- Create feeding_records table
CREATE TABLE public.feeding_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('breast-left', 'breast-right', 'breast-both', 'formula', 'mixed')),
  amount NUMERIC,
  unit TEXT NOT NULL CHECK (unit IN ('ml', 'oz')),
  duration INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create sleep_records table
CREATE TABLE public.sleep_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration INTEGER,
  type TEXT NOT NULL CHECK (type IN ('night', 'nap')),
  quality TEXT CHECK (quality IN ('deep', 'light', 'restless')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create diaper_records table
CREATE TABLE public.diaper_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('wet', 'poop', 'mixed')),
  poop_color TEXT CHECK (poop_color IN ('yellow', 'green', 'brown', 'black', 'red', 'white')),
  consistency TEXT CHECK (consistency IN ('liquid', 'soft', 'formed', 'hard')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create health_records table
CREATE TABLE public.health_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('temperature', 'weight', 'height', 'head')),
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  location TEXT CHECK (location IN ('axillary', 'ear', 'forehead', 'rectal')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feeding_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sleep_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diaper_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for feeding_records
CREATE POLICY "Users can view their own feeding records"
  ON public.feeding_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feeding records"
  ON public.feeding_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feeding records"
  ON public.feeding_records FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own feeding records"
  ON public.feeding_records FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for sleep_records
CREATE POLICY "Users can view their own sleep records"
  ON public.sleep_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sleep records"
  ON public.sleep_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sleep records"
  ON public.sleep_records FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sleep records"
  ON public.sleep_records FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for diaper_records
CREATE POLICY "Users can view their own diaper records"
  ON public.diaper_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own diaper records"
  ON public.diaper_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own diaper records"
  ON public.diaper_records FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own diaper records"
  ON public.diaper_records FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for health_records
CREATE POLICY "Users can view their own health records"
  ON public.health_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own health records"
  ON public.health_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own health records"
  ON public.health_records FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own health records"
  ON public.health_records FOR DELETE
  USING (auth.uid() = user_id);

-- Create update triggers for all tables
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_feeding_records_updated_at
  BEFORE UPDATE ON public.feeding_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sleep_records_updated_at
  BEFORE UPDATE ON public.sleep_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_diaper_records_updated_at
  BEFORE UPDATE ON public.diaper_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_health_records_updated_at
  BEFORE UPDATE ON public.health_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX idx_feeding_records_user_id ON public.feeding_records(user_id);
CREATE INDEX idx_feeding_records_timestamp ON public.feeding_records(timestamp);
CREATE INDEX idx_sleep_records_user_id ON public.sleep_records(user_id);
CREATE INDEX idx_sleep_records_start_time ON public.sleep_records(start_time);
CREATE INDEX idx_diaper_records_user_id ON public.diaper_records(user_id);
CREATE INDEX idx_diaper_records_timestamp ON public.diaper_records(timestamp);
CREATE INDEX idx_health_records_user_id ON public.health_records(user_id);
CREATE INDEX idx_health_records_timestamp ON public.health_records(timestamp);