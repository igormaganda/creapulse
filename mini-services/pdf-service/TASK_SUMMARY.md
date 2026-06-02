# Task: PDF Service — Standalone Mini Service

## Summary
Created a standalone PDF generation microservice at `/home/z/my-project/mini-services/pdf-service/` that runs independently from the Next.js Turbopack server, solving the `__dirname` resolution issue with pdfkit.

## Files Created

### `/home/z/my-project/mini-services/pdf-service/package.json`
- Dependencies: `pdfkit@^0.18.0`, `jose@^6.2.3`
- Uses parent project's `@prisma/client`, `@prisma/adapter-pg`, and `pg` (resolved via node_modules hoisting)
- Dev script: `bun --verbose --hot index.ts` (verbose flag prevents bun segfaults with rapid requests)

### `/home/z/my-project/mini-services/pdf-service/index.ts` (~1660 lines)
Standalone HTTP server on port 3099 with 7 endpoints:

| Endpoint | Description |
|---|---|
| `GET /health` | Health check (no auth) |
| `GET /pdf/bilan?token=&beneficiaryId=` | 9-page comprehensive diagnostic PDF |
| `GET /pdf/kiviat?token=&beneficiaryId=` | Kiviat radar chart PDF (radius 150) |
| `GET /pdf/tremplin?token=&beneficiaryId=` | GO/NO GO decision PDF |
| `GET /pdf/creascope?token=&sessionId=` | Session report PDF |
| `GET /pdf/creasim?token=&beneficiaryId=` | Simulation PDF |
| `GET /pdf/financial?token=&beneficiaryId=` | Financial forecast PDF |

## Key Technical Decisions

1. **Database Connection**: Lazy singleton pattern (`getDb()`) — connection created on first request to avoid startup crashes
2. **JSON Field Handling**: Added `parseJson<T>()` helper because `PrismaPg` adapter returns JSON columns as strings, not parsed objects
3. **Error Logging**: Only log `err.message` (not full error object) to avoid bun segfaults when serializing Prisma error objects
4. **Fonts**: Uses Helvetica (built-in pdfkit) — no font file loading needed
5. **Brand Color**: `#00838F` (GIDEF teal)

## PDF Content Details

### Bilan PDF (9 pages)
1. Cover: project title, beneficiary name, date, confidentiality
2. Scores overview: module results table with progress bars
3. Kiviat radar: 8-dimension radar chart + interpretation
4. RIASEC profile: dominant types, scores table
5. Tremplin: decision badge, score, recommendations
6. Financial summary: 3-year projections table
7. Motivation assessment: scores and summary
8. CreaScope: session notes, syntheses
9. Action plan: next steps

### Kiviat PDF
Large radar chart (radius 150), score table, interpretation levels:
- 8-10: Force majeure
- 6-7.9: Compétence acquise
- 4-5.9: Point d'amélioration
- 0-3.9: Besoin d'accompagnement

### Tremplin PDF
Decision badge, score, 6-step breakdown, AI synthesis, recommendations

### CreaScope PDF
Session timeline, per-phase notes, Kiviat scores, action plan table

### CreaSim PDF
Inputs section, results cards, 3-year projections, AI analysis

### Financial PDF
Key metrics, revenue vs expenses table, profitability bars, AI synthesis

## Testing Results
- ✅ Health endpoint returns `{ status: "ok", service: "pdf-service" }`
- ✅ Bilan PDF: 32,865 bytes, HTTP 200
- ✅ Kiviat PDF: 13,587 bytes, HTTP 200
- ✅ Tremplin PDF: HTTP 200
- ✅ Financial PDF: HTTP 200
- ✅ No token → 401
- ✅ Invalid token → 401
- ✅ Non-existent beneficiary → "Beneficiary not found"
- ✅ Non-existent session → "Session not found"
