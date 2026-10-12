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
    name: 'Developer Starter',
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
    monthlyEventCap: 50000,
    projectLimit: 5,
    retentionDays: 30,
    webhooks: true,
    aiCopilot: true,
    clientReports: true,
    unlimitedSeats: true,
    priceMonthly: 0,
  },
  agency_studio: {
    name: 'Agency Studio (Sentry)',
    monthlyEventCap: 100000,
    projectLimit: 10,
    retentionDays: 30,
    webhooks: true,
    aiCopilot: true,
    clientReports: true,
    unlimitedSeats: true,
    priceMonthly: 29,
  },
  agency_scale: {
    name: 'Agency Scale (Sentry)',
    monthlyEventCap: 500000,
    projectLimit: 999999, // Unlimited
    retentionDays: 90,
    webhooks: true,
    aiCopilot: true,
    clientReports: true,
    unlimitedSeats: true,
    priceMonthly: 49,
  },
  // Backward compatibility aliases
  pro: {
    name: 'Agency Studio (Sentry)',
    monthlyEventCap: 100000,
    projectLimit: 10,
    retentionDays: 30,
    webhooks: true,
    aiCopilot: true,
    clientReports: true,
    unlimitedSeats: true,
    priceMonthly: 29,
  },
  agency: {
    name: 'Agency Scale (Sentry)',
    monthlyEventCap: 500000,
    projectLimit: 999999,
    retentionDays: 90,
    webhooks: true,
    aiCopilot: true,
    clientReports: true,
    unlimitedSeats: true,
    priceMonthly: 49,
  },
  team: {
    name: 'Agency Scale (Sentry)',
    monthlyEventCap: 500000,
    projectLimit: 999999,
    retentionDays: 90,
    webhooks: true,
    aiCopilot: true,
    clientReports: true,
    unlimitedSeats: true,
    priceMonthly: 49,
  },
  starter_pro: {
    name: 'Agency Studio (Sentry)',
    monthlyEventCap: 100000,
    projectLimit: 10,
    retentionDays: 30,
    webhooks: true,
    aiCopilot: true,
    clientReports: true,
    unlimitedSeats: true,
    priceMonthly: 29,
  },
  team_scale: {
    name: 'Agency Scale (Sentry)',
    monthlyEventCap: 500000,
    projectLimit: 999999,
    retentionDays: 90,
    webhooks: true,
    aiCopilot: true,
    clientReports: true,
    unlimitedSeats: true,
    priceMonthly: 49,
  },
};

// Helper to get the start of the current calendar month in UTC
export function getStartOfCurrentMonth(): string {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
  return start.toISOString();
}