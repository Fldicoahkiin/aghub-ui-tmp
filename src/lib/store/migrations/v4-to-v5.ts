interface Store { get: <T>(key: string) => Promise<T | null>; set: (key: string, value: unknown) => Promise<void>; save: () => Promise<void>; }

export async function migrateV4ToV5(_store: Store): Promise<void> {
	// Onboarding progress initialization removed — feature was deleted.
}
