// PDF route — proxies to standalone pdf-service (port 3099)
import { NextRequest } from 'next/server'
import { proxyToPdfService } from '@/lib/pdf-proxy'

export async function GET(request: NextRequest) {
  return proxyToPdfService(request, '/pdf/creascope')
}
