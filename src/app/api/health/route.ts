import { NextResponse } from 'next/server'
import { createHealthReport, getServiceName, runSocleChecks } from '@/socle/health'
import type { HealthReport } from '@/socle/health'

// When Socle+ is active, spread its checks alongside runSocleChecks():
//   const checks = [...await runSocleChecks(), ...await runSoclePlusChecks()]
export async function GET(): Promise<NextResponse<HealthReport>> {
  const checks = await runSocleChecks()
  const report = createHealthReport(getServiceName(), checks)
  return NextResponse.json(report, {
    status: report.status === 'ok' ? 200 : 503,
    headers: { 'Cache-Control': 'no-store' },
  })
}
