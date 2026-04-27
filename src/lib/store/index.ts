import { migrate } from "./migrations";

class LocalStorageStore {
	async get<T>(key: string): Promise<T | null> {
		const raw = localStorage.getItem(`aghub:${key}`);
		if (raw === null) return null;
		try {
			return JSON.parse(raw) as T;
		} catch {
			return null;
		}
	}

	async set(key: string, value: unknown): Promise<void> {
		localStorage.setItem(`aghub:${key}`, JSON.stringify(value));
	}

	async save(): Promise<void> {
		// localStorage is synchronous; nothing extra to do
	}
}

let store: LocalStorageStore | null = null;

export async function getStore(): Promise<LocalStorageStore> {
	if (!store) {
		store = new LocalStorageStore();
	}
	return store;
}

export async function initStore(): Promise<void> {
	const s = await getStore();
	await migrate(s);
}
