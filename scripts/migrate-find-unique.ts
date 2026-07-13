#!/usr/bin/env bun
// Batch migration: findUnique → findFirst for enrollment-scoped tables (multi-line aware)

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join, relative } from 'path'

const API_DIR = 'src/app/api'

const TABLES = [
  'marketAnalysis',
  'financialForecast', 
  'juridiqueAnalysis',
  'businessModelCanvas',
  'tremplin',
  'zeroDraft',
  'creasimSimulation',
  'creatorJourney',
]

function getAllTsFiles(dir: string): string[] {
  const files: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      files.push(...getAllTsFiles(full))
    } else if (entry.endsWith('.ts')) {
      files.push(full)
    }
  }
  return files
}

let totalChanges = 0

for (const filePath of getAllTsFiles(API_DIR)) {
  let content = readFileSync(filePath, 'utf-8')
  const original = content
  
  for (const table of TABLES) {
    // Multi-line: db.table.findUnique({\n      where: { userId: varName },\n      select: { ... }\n    })
    // Also: db.table.findUnique({\n      where: { userId: varName }\n    })
    // Also: db.table.findUnique({\n      where: { userId }\n    })
    
    const regex = new RegExp(
      `db\\.${table}\\.findUnique\\(\\{[\\s\\S]*?where:\\s*\\{\\s*userId(?::\\s*(\\w+))?\\s*\\}(?:,\\s*select:\\s*(\\{[\\s\\S]*?\\}))?\\s*\\}`,
      'g'
    )
    
    content = content.replace(regex, (match, varName, select) => {
      if (select) {
        return `db.${table}.findFirst({ where: { userId: ${varName || 'userId'}, enrollmentId: null }, select: ${select} }`
      }
      return `db.${table}.findFirst({ where: { userId: ${varName || 'userId'}, enrollmentId: null } }`
    })
  }

  if (content !== original) {
    writeFileSync(filePath, content, 'utf-8')
    totalChanges++
    console.log(`  Updated: ${relative(process.cwd(), filePath)}`)
  }
}

// Update user.creatorJourney → user.creatorJourneys[0] in admin routes
const benefFile = 'src/app/api/admin-centre/beneficiaires/route.ts'
try {
  let bc = readFileSync(benefFile, 'utf-8')
  if (bc.includes('user.creatorJourney')) {
    bc = bc.replace(/user\.creatorJourney\?/g, 'user.creatorJourneys[0]')
    writeFileSync(benefFile, bc, 'utf-8')
    console.log(`  Updated: ${benefFile}`)
  }
} catch {}

console.log(`\nTotal: ${totalChanges} files updated`)