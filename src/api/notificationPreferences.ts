import { delay, readStore, writeStore } from './mock/localStore'

// TODO(backend): no notification-preferences endpoint exists yet.
// Replace with real calls once available, e.g.:
//   GET /api/account/notification-preferences
//   PUT /api/account/notification-preferences
// AccountPage only calls get()/update() below.

export interface NotificationPreferences {
  mealReminders: boolean
  reminderTime: string // HH:mm
  weeklySummaryEmail: boolean
}

const STORE_KEY = 'notification-preferences'

const DEFAULTS: NotificationPreferences = {
  mealReminders: true,
  reminderTime: '20:00',
  weeklySummaryEmail: true,
}

export const notificationPreferencesApi = {
  async get(): Promise<NotificationPreferences> {
    await delay(200)
    return readStore<NotificationPreferences>(STORE_KEY, DEFAULTS)
  },

  async update(prefs: NotificationPreferences): Promise<NotificationPreferences> {
    await delay(250)
    writeStore(STORE_KEY, prefs)
    return prefs
  },
}
