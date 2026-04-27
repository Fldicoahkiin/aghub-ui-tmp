interface Store { get: <T>(key: string) => Promise<T | null>; set: (key: string, value: unknown) => Promise<void>; save: () => Promise<void>; }

export async function migrateV1ToV2(store: Store): Promise<void> {
	await store.set("disabledAgents", []);
}
