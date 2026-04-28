import { NextResponse } from 'next/server'
import { createHealthReport, getServiceName, runSocleChecks } from '@/socle/health'
import { runSoclePlusChecks } from '@/socle-plus/database'
import type { HealthReport } from '@/socle/health'

export async function GET(): Promise<NextResponse<HealthReport>> {
  const checks = [
    ...await runSocleChecks(),
    ...await runSoclePlusChecks(),
  ]
  const report = createHealthReport(getServiceName(), checks)
  return NextResponse.json(report, {
    status: report.status === 'ok' ? 200 : 503,
    headers: { 'Cache-Control': 'no-store' },
  })
}
