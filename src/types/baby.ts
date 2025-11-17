export interface Baby {
  id: string;
  name: string;
  birth_date?: string;
  photo_url?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type CollaboratorRole = 'owner' | 'editor' | 'viewer';
export type CollaboratorStatus = 'pending' | 'accepted' | 'declined';

export interface BabyCollaborator {
  id: string;
  baby_id: string;
  user_id: string;
  role: CollaboratorRole;
  invited_by?: string;
  invited_at: string;
  accepted_at?: string;
  status: CollaboratorStatus;
  created_at: string;
  // Joined data
  user_email?: string;
  user_name?: string;
  baby?: Baby;
}

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled';

export interface Invitation {
  id: string;
  baby_id: string;
  email: string;
  role: 'editor' | 'viewer';
  token: string;
  invited_by: string;
  expires_at: string;
  created_at: string;
  status: InvitationStatus;
  // Joined data
  baby?: Baby;
  inviter_email?: string;
}

export type ActivityAction = 'created' | 'updated' | 'deleted';
export type RecordType = 'feeding' | 'sleep' | 'diaper' | 'health' | 'baby' | 'collaborator';

export interface ActivityLog {
  id: string;
  baby_id: string;
  user_id?: string;
  action: ActivityAction;
  record_type: RecordType;
  record_id?: string;
  changes?: any;
  created_at: string;
  // Joined data
  user_email?: string;
}

export interface FeedingRecord {
  id: string;
  baby_id: string;
  user_id: string;
  timestamp: string;
  type: 'breast-left' | 'breast-right' | 'breast-both' | 'formula' | 'mixed';
  amount?: number;
  unit: 'ml' | 'oz';
  duration?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SleepRecord {
  id: string;
  baby_id: string;
  user_id: string;
  start_time: string;
  end_time?: string;
  duration?: number;
  type: 'night' | 'nap';
  quality?: 'deep' | 'light' | 'restless';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DiaperRecord {
  id: string;
  baby_id: string;
  user_id: string;
  timestamp: string;
  type: 'wet' | 'poop' | 'mixed';
  poop_color?: 'yellow' | 'green' | 'brown' | 'black' | 'red' | 'white';
  consistency?: 'liquid' | 'soft' | 'formed' | 'hard';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface HealthRecord {
  id: string;
  baby_id: string;
  user_id: string;
  timestamp: string;
  type: 'temperature' | 'weight' | 'height' | 'head';
  value: number;
  unit: string;
  location?: 'axillary' | 'ear' | 'forehead' | 'rectal';
  notes?: string;
  created_at: string;
  updated_at: string;
}
