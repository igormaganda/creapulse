// ============================================
// CreaPulse V2 — Structured Logger
// JSON-structured logging for monitoring & debugging
// ============================================

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: string
  userId?: string
  [key: string]: unknown
}

class Logger {
  private context: string

  constructor(context: string) {
    this.context = context
  }

  private log(level: LogLevel, message: string, data?: Record<string, unknown>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.context,
      ...data,
    }
    // Output structured JSON log
    console.log(JSON.stringify(entry))
  }

  info(message: string, data?: Record<string, unknown>) {
    this.log('info', message, data)
  }

  warn(message: string, data?: Record<string, unknown>) {
    this.log('warn', message, data)
  }

  error(message: string, data?: Record<string, unknown>) {
    this.log('error', message, data)
  }

  debug(message: string, data?: Record<string, unknown>) {
    this.log('debug', message, data)
  }
}

export function createLogger(context: string) {
  return new Logger(context)
}

export const logger = new Logger('CreaPulse')
