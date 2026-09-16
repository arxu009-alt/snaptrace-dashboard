export type PlanTier = 'free' | 'pro' | 'team' | 'scale';

export interface PlanConfig {
  id: PlanTier;
  name: string;
  monthlyEventCap: number;
  projectLimit: number;
  retentionDays: number;
  aiCopilot: boolean;
  cascadingCollapse: boolean;
  priorityIngestion: boolean;
}

export const PLANS: Record<PlanTier, PlanConfig> = {
  free: {
    id: 'free',
    name: 'Developer Free',
    monthlyEventCap: 5000,
    projectLimit: 1,
    retentionDays: 7,
    aiCopilot: false,
    cascadingCollapse: false,
    priorityIngestion: false,
  },
  pro: {
    id: 'pro',
    name: 'Indie Pro',
    monthlyEventCap: 100000,
    projectLimit: 5,
    retentionDays: 30,
    aiCopilot: true,
    cascadingCollapse: false,
    priorityIngestion: false,
  },
  team: {
    id: 'team',
    name: 'Team & Studio',
    monthlyEventCap: 500000,
    projectLimit: Infinity,
    retentionDays: 90,
    aiCopilot: true,
    cascadingCollapse: true,
    priorityIngestion: true,
  },
  scale: {
    id: 'scale',
    name: 'Business Scale',
    monthlyEventCap: 2000000,
    projectLimit: Infinity,
    retentionDays: 180,
    aiCopilot: true,
    cascadingCollapse: true,
    priorityIngestion: true,
  },
};

// Helper to get start of current calendar month in UTC
export function getStartOfCurrentMonth(): string {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
  return start.toISOString();
}