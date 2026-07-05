import { getOnboarding } from '@/api/generated/onboarding/onboarding'
import { getProfile as getProfileEndpoints } from '@/api/generated/profile/profile'
import type { OnboardingStoreConsentsBody, UserProfileInput } from '@/api/generated/model'

/**
 * The backend does not accept a `consents` array — it validates three
 * top-level booleans and looks up document versions itself server-side
 * (config('nutrition.consent_versions')).
 */
export type ConsentsPayload = OnboardingStoreConsentsBody

export type ProfilePayload = UserProfileInput

export const onboardingApi = {
  async acceptConsents(payload: ConsentsPayload) {
    return getOnboarding().onboardingStoreConsents(payload)
  },

  async saveProfile(payload: ProfilePayload) {
    return getOnboarding().onboardingStoreProfile(payload)
  },
}

export const profileApi = {
  async get() {
    return getProfileEndpoints().getProfile()
  },

  async update(payload: ProfilePayload) {
    return getProfileEndpoints().updateProfile(payload)
  },

  async targets(page = 1) {
    return getProfileEndpoints().getTargetHistory({ page })
  },
}
