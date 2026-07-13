#!/usr/bin/env bun
// Batch migration: upsert where clause for enrollment-scoped tables

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
    // Multi-line: db.table.upsert({\n      where: { userId: varName },\n
    const regex = new RegExp(
      `db\\.${table}\\.upsert\\(\\{\\s*where:\\s*\\{\\s*userId:\\s*(\\w+)\\s*\\},`,
      'g'
    )
    
    content = content.replace(regex, (match, varName) => {
      return `db.${table}.upsert({ where: { userId_enrollmentId: { userId: ${varName}, enrollmentId: null } },`
    })
  }

  if (content !== original) {
    writeFileSync(filePath, content, 'utf-8')
    totalChanges++
    console.log(`  Updated: ${relative(process.cwd(), filePath)}`)
  }
}

console.log(`\nTotal: ${totalChanges} files updated (upsert)`)