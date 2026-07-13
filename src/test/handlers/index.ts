import { authHandlers } from './auth'
import { dashboardHandlers } from './dashboard'
import { dietQualityHandlers } from './dietQuality'
import { hydrationHandlers } from './hydration'
import { nutrientsHandlers } from './nutrients'

export const handlers = [...authHandlers, ...dashboardHandlers, ...dietQualityHandlers, ...nutrientsHandlers, ...hydrationHandlers]
