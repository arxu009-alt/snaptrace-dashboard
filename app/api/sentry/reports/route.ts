import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface SentryReportRequestBody {
  sentryToken?: string;
  organizationSlug?: string;
  projectSlug?: string;
  timeframe?: '7d' | '14d' | '30d';
}

function formatSlugToTitle(slug: string): string {
  if (!slug) return 'Client Project';
  return slug
    .split(/[-_]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export async function POST(req: Request) {
  try {
    const body: SentryReportRequestBody = await req.json().catch(() => ({}));
    const { sentryToken, organizationSlug, projectSlug, timeframe = '30d' } = body;

    // Validate token and organization slug
    if (!sentryToken || typeof sentryToken !== 'string' || !sentryToken.trim()) {
      return NextResponse.json(
        { error: 'Missing or invalid Sentry Auth Token. Please provide your Sentry read-only token.' },
        { status: 400 }
      );
    }

    if (!organizationSlug || typeof organizationSlug !== 'string' || !organizationSlug.trim()) {
      return NextResponse.json(
        { error: 'Missing Sentry Organization Slug. Please enter your Sentry organization identifier.' },
        { status: 400 }
      );
    }

    const cleanToken = sentryToken.trim();
    const cleanOrg = organizationSlug.trim().toLowerCase();
    const cleanProj = (projectSlug || '').trim();
    const validTimeframe = timeframe === '7d' || timeframe === '14d' || timeframe === '30d' ? timeframe : '30d';

    const headers = {
      Authorization: `Bearer ${cleanToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    // 1. Fetch Projects Mode
    if (!cleanProj || cleanProj.toUpperCase() === 'FETCH_PROJECTS') {
      const projectsUrl = `https://sentry.io/api/0/organizations/${encodeURIComponent(cleanOrg)}/projects/`;
      const res = await fetch(projectsUrl, {
        method: 'GET',
        headers,
        cache: 'no-store',
      });

      if (!res.ok) {
        if (res.status === 401) {
          return NextResponse.json(
            { error: 'Invalid Sentry Token. Please check that your token has "project:read" and "org:read" scopes.' },
            { status: 401 }
          );
        }
        if (res.status === 404) {
          return NextResponse.json(
            { error: `Organization "${cleanOrg}" was not found in Sentry. Verify your organization slug.` },
            { status: 404 }
          );
        }
        if (res.status === 403) {
          return NextResponse.json(
            { error: `Access denied. Your Sentry token does not have permission to view organization "${cleanOrg}".` },
            { status: 403 }
          );
        }
        const errText = await res.text().catch(() => '');
        return NextResponse.json(
          { error: `Sentry API error (${res.status}): ${errText || res.statusText}` },
          { status: res.status }
        );
      }

      const rawProjects = await res.json();
      if (!Array.isArray(rawProjects)) {
        return NextResponse.json({ projects: [] });
      }

      const projects = rawProjects.map((p: any) => ({
        id: String(p.id ?? p.slug),
        slug: String(p.slug),
        name: String(p.name || p.slug),
        platform: String(p.platform || 'generic'),
      }));

      return NextResponse.json({ projects });
    }

    // 2. Fetch Issues & Stats for Selected Project
    const issuesUrl = `https://sentry.io/api/0/projects/${encodeURIComponent(cleanOrg)}/${encodeURIComponent(cleanProj)}/issues/?statsPeriod=${encodeURIComponent(validTimeframe)}`;
    const projectUrl = `https://sentry.io/api/0/projects/${encodeURIComponent(cleanOrg)}/${encodeURIComponent(cleanProj)}/`;

    // Fetch issues and project info concurrently for accuracy
    const [issuesRes, projectRes] = await Promise.all([
      fetch(issuesUrl, { method: 'GET', headers, cache: 'no-store' }),
      fetch(projectUrl, { method: 'GET', headers, cache: 'no-store' }).catch(() => null),
    ]);

    if (!issuesRes.ok) {
      if (issuesRes.status === 401) {
        return NextResponse.json(
          { error: 'Invalid Sentry Token. Authentication failed.' },
          { status: 401 }
        );
      }
      if (issuesRes.status === 404) {
        return NextResponse.json(
          { error: `Project "${cleanProj}" or Organization "${cleanOrg}" not found on Sentry.` },
          { status: 404 }
        );
      }
      if (issuesRes.status === 403) {
        return NextResponse.json(
          { error: `Permission denied for project "${cleanProj}". Ensure token has project:read scope.` },
          { status: 403 }
        );
      }
      const errText = await issuesRes.text().catch(() => '');
      return NextResponse.json(
        { error: `Sentry API error (${issuesRes.status}): ${errText || issuesRes.statusText}` },
        { status: issuesRes.status }
      );
    }

    const issuesData = await issuesRes.json();
    const issues: any[] = Array.isArray(issuesData) ? issuesData : [];

    let projectName = formatSlugToTitle(cleanProj);
    if (projectRes && projectRes.ok) {
      const projMeta = await projectRes.json().catch(() => null);
      if (projMeta?.name) {
        projectName = projMeta.name;
      }
    }

    // 3. Aggregate metrics in server memory
    const totalIssues = issues.length;
    let totalEvents = 0;
    let resolvedCount = 0;
    let unresolvedCount = 0;

    issues.forEach((issue) => {
      const count = parseInt(issue.count, 10) || 1;
      totalEvents += count;

      const status = String(issue.status || '').toLowerCase();
      if (status === 'resolved') {
        resolvedCount += 1;
      } else {
        unresolvedCount += 1;
      }
    });

    // Calculated Reliability Index (healthScore)
    // If 0 issues: 100.0%
    // If all resolved: 99.9%
    // Deduct slightly for unresolved issues to reflect agency SLAs (e.g. 99.8%)
    let healthScore = '99.8%';
    if (totalIssues === 0) {
      healthScore = '100.0%';
    } else if (unresolvedCount === 0) {
      healthScore = '99.9%';
    } else {
      const penalty = Math.min(3.0, unresolvedCount * 0.15);
      const score = Math.max(97.0, 99.9 - penalty);
      healthScore = `${score.toFixed(1)}%`;
    }

    // Top 5 impacted routes / error titles
    const sortedIssues = [...issues].sort((a, b) => {
      const countA = parseInt(a.count, 10) || 1;
      const countB = parseInt(b.count, 10) || 1;
      return countB - countA;
    });

    const topErrors = sortedIssues.slice(0, 5).map((issue, idx) => {
      const count = parseInt(issue.count, 10) || 1;
      const percentage = totalEvents > 0 ? Math.round((count / totalEvents) * 100) : 0;
      const route =
        issue.culprit ||
        issue.metadata?.value ||
        issue.metadata?.filename ||
        (issue.title ? `/routes/${issue.title.slice(0, 24).toLowerCase().replace(/[^a-z0-9]/g, '-')}` : `/api/endpoint-${idx + 1}`);

      return {
        id: String(issue.id || idx),
        title: String(issue.title || 'Runtime Exception'),
        route: String(route),
        count,
        percentage,
        status: issue.status || 'unresolved',
        level: issue.level || 'error',
        lastSeen: issue.lastSeen || issue.firstSeen || null,
      };
    });

    // 4. Return aggregated JSON statistics
    return NextResponse.json({
      projectName,
      organizationSlug: cleanOrg,
      projectSlug: cleanProj,
      timeframe: validTimeframe,
      totalIssues,
      totalEvents,
      resolvedCount,
      unresolvedCount,
      healthScore,
      performanceImpact: '0.0ms',
      topErrors,
    });
  } catch (error: any) {
    console.error('Sentry reports proxy error:', error);
    return NextResponse.json(
      { error: error?.message || 'An unexpected error occurred while querying Sentry.' },
      { status: 500 }
    );
  }
}
