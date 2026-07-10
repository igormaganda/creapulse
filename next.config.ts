import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // "standalone" for Docker/self-hosted, "serverless" (or omit) for Vercel
  // Vercel automatically ignores this field, but being explicit avoids confusion
  ...(process.env.DEPLOY_TARGET === 'docker' ? { output: 'standalone' as const } : {}),
  poweredByHeader: false,
  typescript: {
    // TODO: Fix 241 TypeScript errors across the codebase (bunx tsc --noEmit).
    // Major categories to fix:
    //   1. Framer Motion Variants type (~30 errors) — ease: "easeOut" not assignable to Variants (add type annotation)
    //   2. Record<string, unknown> → InputJsonValue (~15 errors) — Prisma JSON fields need proper typing
    //   3. withAuth() return type narrowing (~6 errors) — financier/mentorat/vision access .payload on union
    //   4. string | null → string | undefined (~8 errors) — export routes, creascope-stats
    //   5. Buffer → BodyInit (~5 errors) — PDF export routes need Buffer → Uint8Array/ReadableStream
    //   6. Test file _body → body (~16 errors) — api-response.test.ts uses internal NextResponse._body
    //   7. Prisma schema drift (~10 errors) — completedAt, activityType, actif, requestedAt, createdAt fields
    //   8. Zod z.enum() errorMap option (~4 errors) — conseiller entretiens/livrables/planning routes
    //   9. Misc component errors — bilan-ia loading state, bmc filledCount, juridique associes typo
    ignoreBuildErrors: true,
  },
  reactStrictMode: true,
  allowedDevOrigins: [
    "https://*.space-z.ai",
    "http://*.space-z.ai",
  ],
  // Security headers are set in src/middleware.ts (single source of truth)
  // to avoid duplication between next.config headers() and middleware.
};

export default nextConfig;
