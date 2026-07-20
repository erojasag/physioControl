// Shared contract between the reminder producer (API) and consumer (worker).

export const REMINDERS_QUEUE = "reminders";

export interface ReminderJob {
  reminderId: string;
}

// Default reminder lead times before an appointment (build-kit §11).
// Only reminders whose send time is still in the future get scheduled.
export const REMINDER_OFFSETS_MIN = [24 * 60, 2 * 60] as const;

export const REMINDER_CHANNEL_EMAIL = "email";
