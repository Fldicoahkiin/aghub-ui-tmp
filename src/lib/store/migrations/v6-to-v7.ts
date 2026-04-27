interface StoreLike {
	get: <T>(key: string) => Promise<T | null>;
	set: (key: string, value: unknown) => Promise<void>;
	save: () => Promise<void>;
}

export async function migrateV6ToV7(_store: StoreLike): Promise<void> {
	// No data migration needed for v7.
	// The new "providers" sidebar item is automatically appended
	// by normalizeSidebarItems when reading sidebar preferences.
}
