'use client'

import { useEffect } from 'react'
import { snaptrace } from '@/lib/sdk'

export default function SnapTraceProvider({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    snaptrace.init('sk_live_76l597z2mnqu1kpn2ui3')
  }, [])

  return <>{children}</>
}