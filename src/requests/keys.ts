export const queryKeys = {
	plugins: {
		all: () => ["plugins"] as const,
		list: () => ["plugins", "list"] as const,
		detail: (pluginId: string) => ["plugins", "detail", pluginId] as const,
		detailDisabled: () => ["plugins", "detail", "__no_plugin__"] as const,
		updateStatus: (pluginId: string, scope?: string | null) =>
			["plugins", "update-status", pluginId, scope ?? null] as const,
		updateStatusDisabled: () =>
			["plugins", "update-status", "__no_plugin__", null] as const,
		market: () => ["plugins", "market"] as const,
	},
	agents: {
		all: () => ["agents"] as const,
		list: () => ["agents", "list"] as const,
		availability: () => ["agents", "availability"] as const,
	},
	skills: {
		all: () => ["skills"] as const,
		lists: () => ["skills", "list"] as const,
		list: (
			scope: "global" | "project" | "all" = "global",
			projectRoot?: string,
		) => ["skills", "list", scope, projectRoot ?? null] as const,
		content: (path: string) => ["skills", "content", path] as const,
		tree: (path: string) => ["skills", "tree", path] as const,
		lock: {
			all: () => ["skills", "lock"] as const,
			global: () => ["skills", "lock", "global"] as const,
			project: (projectPath?: string) =>
				["skills", "lock", "project", projectPath ?? null] as const,
		},
	},
	mcps: {
		all: () => ["mcps"] as const,
		lists: () => ["mcps", "list"] as const,
		list: (
			scope: "global" | "project" | "all" = "global",
			projectRoot?: string,
		) => ["mcps", "list", scope, projectRoot ?? null] as const,
		detail: (
			name: string,
			agent: string,
			scope: "global" | "project" | "all",
		) => ["mcps", "detail", name, agent, scope] as const,
	},
	subAgents: {
		all: () => ["sub-agents"] as const,
		list: (
			scope: "global" | "project" | "all" = "global",
			projectRoot?: string,
		) => ["sub-agents", "list", scope, projectRoot ?? null] as const,
		detail: (
			name: string,
			agent: string,
			scope: "global" | "project" | "all",
		) => ["sub-agents", "detail", name, agent, scope] as const,
	},
	credentials: {
		all: () => ["credentials"] as const,
		list: () => ["credentials", "list"] as const,
	},
	integrations: {
		all: () => ["integrations"] as const,
		codeEditors: () => ["integrations", "code-editors"] as const,
	},
	providers: {
		all: () => ["providers"] as const,
		list: () => ["providers", "list"] as const,
		detail: (id: string) => ["providers", "detail", id] as const,
	},
	agentProviders: {
		all: () => ["agent-providers"] as const,
		list: (agentId: string) => ["agent-providers", "list", agentId] as const,
	},
	workspace: {
		all: () => ["workspace"] as const,
		agentFiles: (agentId: string) => ["workspace", "files", agentId] as const,
		fileContent: (agentId: string, path: string) => ["workspace", "content", agentId, path] as const,
	},
	market: {
		all: () => ["market"] as const,
		search: (query: string) => ["market", "search", query] as const,
	},
};
