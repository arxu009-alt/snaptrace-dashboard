export type PlanTier =
  | 'free'
  | 'beta_founder'
  | 'agency_studio'
  | 'agency_scale'
  | 'pro'
  | 'agency'
  | 'team'
  | 'starter_pro'
  | 'team_scale';

export interface PlanConfig {
  name: string;
  monthlyEventCap: number;
  projectLimit: number;
  retentionDays: number;
  webhooks: boolean;
  aiCopilot: boolean;
  clientReports: boolean;
  unlimitedSeats: boolean;
  priceMonthly: number;
}

export const PLANS: Record<string, PlanConfig> = {
  free: {
    name: 'Developer Free',
    monthlyEventCap: 2000,
    projectLimit: 1,
    retentionDays: 7,
    webhooks: false,
    aiCopilot: false,
    clientReports: false,
    unlimitedSeats: false,
    priceMonthly: 0,
  },
  beta_founder: {
    name: 'Beta Founder Pass',
    monthlyEventCap: 10000,
    projectLimit: 2,
    retentionDays: 14,
    webhooks: true,
    aiCopilot: true,
    clientReports: false,
    unlimitedSeats: false,
    priceMonthly: 0,
  },
  agency_studio: {
    name: 'Agency Studio',
    monthlyEventCap: 100000,
    projectLimit: 15,
    retentionDays: 30,
    webhooks: true,
    aiCopilot: true,
    clientReports: true,
    unlimitedSeats: true,
    priceMonthly: 49,
  },
  agency_scale: {
    name: 'Agency Scale',
    monthlyEventCap: 500000,
    projectLimit: 999999, // Unlimited
    retentionDays: 90,
    webhooks: true,
    aiCopilot: true,
    clientReports: true,
    unlimitedSeats: true,
    priceMonthly: 99,
  },
  // Maintain backward-compatibility alias for legacy 'pro' and 'agency'
  pro: {
    name: 'Agency Studio',
    monthlyEventCap: 100000,
    projectLimit: 15,
    retentionDays: 30,
    webhooks: true,
    aiCopilot: true,
    clientReports: true,
    unlimitedSeats: true,
    priceMonthly: 49,
  },
  agency: {
    name: 'Agency Scale',
    monthlyEventCap: 500000,
    projectLimit: 999999,
    retentionDays: 90,
    webhooks: true,
    aiCopilot: true,
    clientReports: true,
    unlimitedSeats: true,
    priceMonthly: 99,
  },
  // Additional backward-compatibility aliases
  team: {
    name: 'Agency Scale',
    monthlyEventCap: 500000,
    projectLimit: 999999,
    retentionDays: 90,
    webhooks: true,
    aiCopilot: true,
    clientReports: true,
    unlimitedSeats: true,
    priceMonthly: 99,
  },
  starter_pro: {
    name: 'Agency Studio',
    monthlyEventCap: 100000,
    projectLimit: 15,
    retentionDays: 30,
    webhooks: true,
    aiCopilot: true,
    clientReports: true,
    unlimitedSeats: true,
    priceMonthly: 49,
  },
  team_scale: {
    name: 'Agency Scale',
    monthlyEventCap: 500000,
    projectLimit: 999999,
    retentionDays: 90,
    webhooks: true,
    aiCopilot: true,
    clientReports: true,
    unlimitedSeats: true,
    priceMonthly: 99,
  },
};

// Helper to get the start of the current calendar month in UTC
export function getStartOfCurrentMonth(): string {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
  return start.toISOString();
}