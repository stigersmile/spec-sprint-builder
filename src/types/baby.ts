export interface Baby {
  id: string;
  name: string;
  birthDate: string;
  gender: 'male' | 'female';
  photo?: string;
}

export interface FeedingRecord {
  id: string;
  timestamp: string;
  type: 'breast-left' | 'breast-right' | 'breast-both' | 'formula' | 'mixed';
  amount?: number;
  unit: 'ml' | 'oz';
  duration?: number;
  notes?: string;
}

export interface SleepRecord {
  id: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  type: 'night' | 'nap';
  quality?: 'deep' | 'light' | 'restless';
  notes?: string;
}

export interface DiaperRecord {
  id: string;
  timestamp: string;
  type: 'wet' | 'poop' | 'mixed';
  poopColor?: 'yellow' | 'green' | 'brown' | 'black' | 'red' | 'white';
  consistency?: 'liquid' | 'soft' | 'formed' | 'hard';
  notes?: string;
}

export interface HealthRecord {
  id: string;
  timestamp: string;
  type: 'temperature' | 'weight' | 'height' | 'head';
  value: number;
  unit: string;
  location?: 'axillary' | 'ear' | 'forehead' | 'rectal';
  notes?: string;
}
