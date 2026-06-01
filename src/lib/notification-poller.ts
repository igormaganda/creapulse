// ============================================
// CreaPulse V2 — Smart Notification Poller
// Exponential backoff, visibility-aware, singleton
// ============================================

type NotificationCallback = (notifications: any[]) => void

interface PollerConfig {
  /** Initial interval in ms (default: 30s) */
  baseInterval: number
  /** Maximum interval in ms (default: 5min) */
  maxInterval: number
  /** Multiplier for exponential backoff (default: 2) */
  backoffMultiplier: number
}

const DEFAULT_CONFIG: PollerConfig = {
  baseInterval: 30_000,
  maxInterval: 300_000,
  backoffMultiplier: 2,
}

class NotificationPoller {
  private interval: number
  private maxInterval: number
  private backoffMultiplier: number
  private timer: ReturnType<typeof setTimeout> | null = null
  private isVisible: boolean
  private callback: NotificationCallback | null
  private userId: string | null
  private lastCount = 0
  private config: PollerConfig

  constructor(config?: Partial<PollerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.interval = this.config.baseInterval
    this.maxInterval = this.config.maxInterval
    this.backoffMultiplier = this.config.backoffMultiplier
    this.timer = null
    this.isVisible = typeof document !== 'undefined' ? !document.hidden : true
    this.callback = null
    this.userId = null
  }

  start(userId: string, callback: NotificationCallback) {
    this.userId = userId
    this.callback = callback
    this.resetInterval()
    this.schedule()

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.onVisibilityChange)
    }
  }

  stop() {
    if (this.timer) clearTimeout(this.timer)
    this.timer = null
    this.callback = null
    this.userId = null
    this.lastCount = 0

    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.onVisibilityChange)
    }
  }

  private schedule = () => {
    if (this.timer) clearTimeout(this.timer)

    const effectiveInterval = this.isVisible ? this.interval : this.maxInterval

    this.timer = setTimeout(async () => {
      if (!this.isVisible || !this.userId || !this.callback) {
        // Reschedule without fetching when hidden or not ready
        this.schedule()
        return
      }

      try {
        const res = await fetch('/api/notifications')
        if (res.ok) {
          const data = await res.json()
          const notifications = data?.data?.notifications ?? data?.data ?? []

          this.callback(notifications)

          // If we got new notifications (count increased), reset to fast polling
          if (notifications.length > this.lastCount && this.lastCount > 0) {
            this.resetInterval()
          } else {
            // No new notifications — backoff
            this.increaseInterval()
          }

          this.lastCount = notifications.length
        }
      } catch {
        // Silent — network error, keep current interval
      }

      this.schedule()
    }, effectiveInterval)
  }

  private resetInterval() {
    this.interval = this.config.baseInterval
  }

  private increaseInterval() {
    const next = Math.floor(this.interval * this.backoffMultiplier)
    this.interval = Math.min(next, this.maxInterval)
  }

  private onVisibilityChange = () => {
    const wasHidden = !this.isVisible
    this.isVisible = !document.hidden

    if (wasHidden && this.isVisible) {
      // Tab became visible again — fast poll immediately
      this.resetInterval()
      if (this.timer) clearTimeout(this.timer)
      this.schedule()
    }
  }

  /**
   * Public method to trigger fast polling (e.g. after user action like sending a message).
   */
  triggerFastPoll() {
    this.resetInterval()
    if (this.timer) clearTimeout(this.timer)
    this.schedule()
  }

  /**
   * Returns the current poll interval (useful for debugging / UI display).
   */
  getCurrentInterval(): number {
    return this.interval
  }
}

// Singleton — one poller per user session
export const notificationPoller = new NotificationPoller()
