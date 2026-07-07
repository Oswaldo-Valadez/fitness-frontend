import { authHandlers } from './auth'
import { dashboardHandlers } from './dashboard'
import { dietQualityHandlers } from './dietQuality'

export const handlers = [...authHandlers, ...dashboardHandlers, ...dietQualityHandlers]
