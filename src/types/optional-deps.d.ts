// Type declarations for optional runtime dependencies
declare module 'resend' {
  export class Resend {
    constructor(apiKey: string)
    emails: {
      send(params: { from: string; to: string; subject: string; html: string }): Promise<{ id: string }>
    }
  }
}