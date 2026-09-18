export type PlanTier = 'free' | 'pro' | 'agency' | 'team';

export interface PlanConfig {
  id: PlanTier;
  name: string;
  monthlyEventCap: number;
  projectLimit: number;
  retentionDays: number;
  aiCopilot: boolean;
  webhooks: boolean;
  cascadingCollapse: boolean;
  priorityIngestion: boolean;
  rawExport: boolean;
}

export const PLANS: Record<string, PlanConfig> = {
  free: {
    id: 'free',
    name: 'Developer Free',
    monthlyEventCap: 2000,
    projectLimit: 1,
    retentionDays: 7,
    aiCopilot: false,
    webhooks: false,
    cascadingCollapse: false,
    priorityIngestion: false,
    rawExport: false,
  },
  pro: {
    id: 'pro',
    name: 'Pro Builder',
    monthlyEventCap: 75000,
    projectLimit: 5,
    retentionDays: 30,
    aiCopilot: true,
    webhooks: true,
    cascadingCollapse: false,
    priorityIngestion: false,
    rawExport: false,
  },
  agency: {
    id: 'agency',
    name: 'Agency Studio',
    monthlyEventCap: 500000,
    projectLimit: Infinity,
    retentionDays: 90,
    aiCopilot: true,
    webhooks: true,
    cascadingCollapse: true,
    priorityIngestion: true,
    rawExport: true,
  },
  // Backward compatibility alias for existing 'team' references
  team: {
    id: 'agency',
    name: 'Agency Studio',
    monthlyEventCap: 500000,
    projectLimit: Infinity,
    retentionDays: 90,
    aiCopilot: true,
    webhooks: true,
    cascadingCollapse: true,
    priorityIngestion: true,
    rawExport: true,
  },
};

// Helper to get the start of the current calendar month in UTC
export function getStartOfCurrentMonth(): string {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
  return start.toISOString();
}