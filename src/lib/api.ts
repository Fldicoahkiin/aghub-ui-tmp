import type {
	AgentAvailabilityDto,
	AgentInfo,
	CCPluginCheckUpdateRequest,
	CCPluginCheckUpdateResponse,
	CCPluginInstallRequest,
	CCPluginInstallResponse,
	CCPluginReinstallRequest,
	CCPluginReinstallResponse,
	CCPluginUninstallRequest,
	CCPluginUninstallResponse,
	CCPluginUpdateConfigRequest,
	CCPluginUpdateRequest,
	CCPluginUpdateResponse,
	CodeEditorType,
	CreateCredentialRequest,
	CreateMcpRequest,
	CreateSkillRequest,
	CreateSubAgentRequest,
	CredentialResponse,
	DeleteSkillByPathRequest,
	DeleteSkillByPathResponse,
	GitInstallRequest,
	GitInstallResponse,
	GitScanRequest,
	GitScanResponse,
	GitSyncRequest,
	GitSyncResponse,
	GlobalSkillLockResponse,
	ImportSkillRequest,
	InstallSkillRequest,
	InstallSkillResponse,
	CCPluginMarketResponse,
	MarketSkill,
	McpResponse,
	OperationBatchResponse,
	CCPluginConfigResponse,
	CCPluginDetailResponse,
	CCPluginListResponse,
	CCPluginResponse,
	ProjectSkillLockResponse,
	ReconcileRequest,
	SkillResponse,
	SkillTreeNodeResponse,
	SubAgentResponse,
	ToolInfoDto,
	TransferRequest,
	UpdateMcpRequest,
	UpdateSubAgentRequest,
} from "../generated/dto";

/* ------------------------------------------------------------------ */
/*  Provider types (to be moved to generated/dto later)                */
/* ------------------------------------------------------------------ */

export type InferenceProviderFormatDto =
	| "anthropic"
	| "openai_completions"
	| "openai_responses";

export interface InferenceProviderResponse {
	name: string;
	display_name: string;
	format: InferenceProviderFormatDto;
	api_base_url: string;
	masked_api_key: string | null;
	models: string[];
}

export interface CreateInferenceProviderRequest {
	name: string;
	display_name: string;
	format: InferenceProviderFormatDto;
	api_base_url: string;
	api_key: string;
	models: string[];
}

export interface UpdateInferenceProviderRequest {
	name: string;
	body: {
		name: string | null;
		display_name: string;
		format: InferenceProviderFormatDto;
		api_base_url: string;
		api_key: string | null;
		models: string[];
	};
}

/* ------------------------------------------------------------------ */
/*  Agent Provider types (per-agent provider bindings)                  */
/* ------------------------------------------------------------------ */

export type CodingAgentId = "opencode" | "codex" | "openclaw";

export interface AgentProviderResponse {
	id: string;
	name: string;
	sourceProviderName: string | null;
	format: InferenceProviderFormatDto;
	apiBaseUrl: string | null;
	hasApiKey: boolean;
	models: string[];
	isBuiltIn: boolean;
}

export interface CreateAgentProviderRequest {
	sourceProviderId: string;
}

export interface UpdateAgentProviderRequest {
	name?: string;
	apiKey?: string;
}

/* ------------------------------------------------------------------ */
/*  Workspace types                                                    */
/* ------------------------------------------------------------------ */

export interface AgentConfigFile {
	path: string;
	name: string;
	type: "json" | "markdown";
	content: string;
}

export interface AgentWorkspace {
	agentId: string;
	rootPath: string;
	files: AgentConfigFile[];
}

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const MOCK_AGENTS: AgentInfo[] = [
	{
		id: "claude",
		display_name: "Claude",
		capabilities: {
			skills: { scopes: { global: true, project: true }, universal: false, mutable_global: true, mutable_project: true },
			mcp: { scopes: { global: true, project: true }, stdio: true, remote: true, enable_disable: false },
			sub_agents: { scopes: { global: false, project: false } },
		},
		skills_paths: { global_read: ["~/.claude/skills/"], global_write: "~/.claude/skills/", project_read: [], project_write: null },
	},
	{
		id: "opencode",
		display_name: "OpenCode",
		capabilities: {
			skills: { scopes: { global: true, project: false }, universal: true, mutable_global: true, mutable_project: false },
			mcp: { scopes: { global: true, project: true }, stdio: true, remote: true, enable_disable: true },
			sub_agents: { scopes: { global: false, project: false } },
		},
		skills_paths: { global_read: [], global_write: null, project_read: [], project_write: null },
	},
	{
		id: "cursor",
		display_name: "Cursor",
		capabilities: {
			skills: { scopes: { global: false, project: false }, universal: false, mutable_global: false, mutable_project: false },
			mcp: { scopes: { global: true, project: true }, stdio: true, remote: true, enable_disable: false },
			sub_agents: { scopes: { global: false, project: false } },
		},
		skills_paths: { global_read: [], global_write: null, project_read: [], project_write: null },
	},
	{
		id: "openclaw",
		display_name: "OpenClaw",
		capabilities: {
			skills: { scopes: { global: true, project: true }, universal: false, mutable_global: true, mutable_project: true },
			mcp: { scopes: { global: true, project: false }, stdio: true, remote: false, enable_disable: true },
			sub_agents: { scopes: { global: false, project: false } },
		},
		skills_paths: { global_read: ["~/.openclaw/skills/"], global_write: "~/.openclaw/skills/", project_read: [], project_write: null },
	},
];

const MOCK_AGENT_AVAILABILITY: AgentAvailabilityDto[] = [
	{ id: "claude", has_global_directory: true, has_cli: true, is_available: true },
	{ id: "opencode", has_global_directory: false, has_cli: true, is_available: true },
	{ id: "cursor", has_global_directory: false, has_cli: false, is_available: false },
	{ id: "openclaw", has_global_directory: true, has_cli: true, is_available: true },
];

const MOCK_SKILLS: SkillResponse[] = [
	{
		name: "code-review",
		enabled: true,
		source_path: "~/.claude/skills/code-review/SKILL.md",
		canonical_path: "~/.claude/skills/code-review",
		description: "Automated code review with best practices",
		author: "aghub-team",
		version: "1.0.0",
		tools: ["git", "github"],
		source: "global",
		agent: "claude",
		plugin_id: null,
		plugin_name: null,
	},
	{
		name: "documentation",
		enabled: true,
		source_path: "~/.claude/skills/documentation/SKILL.md",
		canonical_path: "~/.claude/skills/documentation",
		description: "Generate and maintain project documentation",
		author: "aghub-team",
		version: "1.2.0",
		tools: ["markdown", "mermaid"],
		source: "global",
		agent: "claude",
		plugin_id: null,
		plugin_name: null,
	},
	{
		name: "test-generator",
		enabled: false,
		source_path: null,
		canonical_path: null,
		description: "Generate unit tests from source code",
		author: null,
		version: null,
		tools: [],
		source: null,
		agent: "opencode",
		plugin_id: null,
		plugin_name: null,
	},
];

const MOCK_MCPS: McpResponse[] = [
	{
		name: "filesystem",
		enabled: true,
		transport: { type: "stdio", command: "npx", args: ["-y", "@modelcontextprotocol/server-filesystem"], env: null, timeout: 30 },
		timeout: 30,
		source: "global",
		agent: "claude",
	},
	{
		name: "github",
		enabled: true,
		transport: { type: "sse", url: "https://mcp.github.com/sse", headers: { Authorization: "Bearer token" }, timeout: 60 },
		timeout: 60,
		source: "global",
		agent: "claude",
	},
];

const MOCK_SUB_AGENTS: SubAgentResponse[] = [
	{ name: "refactor-agent", description: "Specialized in code refactoring", instruction: "Refactor code to improve readability", source_path: null, source: "global", agent: "claude" },
];

const MOCK_PLUGIN_ITEM: CCPluginResponse = {
	id: "aghub-plugin-example",
	name: "Example Plugin",
	version: "0.1.0",
	description: "A sample plugin for demonstration",
	enabled: true,
	source: "market",
	has_skills: true,
	has_hooks: false,
	has_mcp: true,
	author: { name: "aghub", email: undefined, url: undefined },
	repository: "https://github.com/aghub/plugin-example",
	license: "MIT",
	keywords: ["example", "demo"],
	source_info: { label: "market", is_github: false, can_reinstall: false, can_check_updates: true },
	scopes: [{ scope: "global", folder_path: "/mock/global/aghub-plugin-example", version: "0.1.0", installed_at: "2026-04-20T00:00:00Z", updated_at: "2026-04-20T00:00:00Z" }],
};

const MOCK_PLUGINS: CCPluginListResponse = {
	plugins: [MOCK_PLUGIN_ITEM],
};

const MOCK_MARKET_PLUGINS: CCPluginMarketResponse[] = [
	{
		id: "aghub-plugin-demo",
		name: "Demo Plugin",
		version: "1.0.0",
		description: "Demo marketplace plugin",
		author: "aghub",
		github_url: "https://github.com/aghub/demo",
		installs: 42,
		installed: false,
		installed_scopes: [],
		has_mcp: true,
		has_skills: true,
		has_hooks: false,
	},
];

const MOCK_CREDENTIALS: CredentialResponse[] = [
	{ id: "cred-1", name: "GitHub Token" },
];

const MOCK_PROVIDERS: InferenceProviderResponse[] = [
	{
		name: "openrouter",
		display_name: "OpenRouter",
		format: "openai_completions",
		api_base_url: "https://openrouter.ai/api/v1",
		masked_api_key: "sk-or-••••••••••••••••••••••••••••••••YxK4",
		models: ["openai/gpt-4.1", "anthropic/claude-sonnet-4-5", "google/gemini-2.5-pro", "deepseek/deepseek-r1"],
	},
	{
		name: "siliconflow",
		display_name: "SiliconFlow",
		format: "openai_completions",
		api_base_url: "https://api.siliconflow.cn/v1",
		masked_api_key: "sf-••••••••••••••••••••••••••••••••••a3Bf",
		models: ["deepseek-ai/DeepSeek-V3", "Qwen/Qwen3-235B-A22B", "Pro/deepseek-ai/DeepSeek-R1"],
	},
	{
		name: "groq",
		display_name: "Groq",
		format: "openai_completions",
		api_base_url: "https://api.groq.com/openai/v1",
		masked_api_key: "gsk_••••••••••••••••••••••••••••••••••pQ7m",
		models: ["llama-3.3-70b-versatile", "gemma2-9b-it", "mixtral-8x7b-32768"],
	},
	{
		name: "together-ai",
		display_name: "Together AI",
		format: "openai_completions",
		api_base_url: "https://api.together.xyz/v1",
		masked_api_key: "tog-••••••••••••••••••••••••••••••••••mN2x",
		models: ["meta-llama/Llama-3.3-70B-Instruct-Turbo", "Qwen/Qwen2.5-Coder-32B-Instruct"],
	},
];


const MOCK_AGENT_PROVIDER_LIST: Record<string, AgentProviderResponse[]> = {
	opencode: [
		{
			id: "opencode-openrouter",
			name: "OpenRouter",
			sourceProviderName: "openrouter",
			format: "openai_completions",
			apiBaseUrl: "https://openrouter.ai/api/v1",
			hasApiKey: true,
			models: ["openai/gpt-4.1", "anthropic/claude-sonnet-4-5", "google/gemini-2.5-pro"],
			isBuiltIn: false,
		},
		{
			id: "opencode-siliconflow",
			name: "SiliconFlow",
			sourceProviderName: "siliconflow",
			format: "openai_completions",
			apiBaseUrl: "https://api.siliconflow.cn/v1",
			hasApiKey: true,
			models: ["deepseek-ai/DeepSeek-V3", "Qwen/Qwen3-235B-A22B"],
			isBuiltIn: false,
		},
		{
			id: "opencode-groq",
			name: "Groq",
			sourceProviderName: "groq",
			format: "openai_completions",
			apiBaseUrl: "https://api.groq.com/openai/v1",
			hasApiKey: true,
			models: ["llama-3.3-70b-versatile", "gemma2-9b-it"],
			isBuiltIn: false,
		},
	],
	codex: [
		{
			id: "codex-groq",
			name: "Groq",
			sourceProviderName: "groq",
			format: "openai_completions",
			apiBaseUrl: "https://api.groq.com/openai/v1",
			hasApiKey: true,
			models: ["llama-3.3-70b-versatile"],
			isBuiltIn: false,
		},
		{
			id: "codex-together",
			name: "Together AI",
			sourceProviderName: "together-ai",
			format: "openai_completions",
			apiBaseUrl: "https://api.together.xyz/v1",
			hasApiKey: true,
			models: ["meta-llama/Llama-3.3-70B-Instruct-Turbo", "Qwen/Qwen2.5-Coder-32B-Instruct"],
			isBuiltIn: false,
		},
	],
	openclaw: [
		{
			id: "openclaw-openrouter",
			name: "OpenRouter",
			sourceProviderName: "openrouter",
			format: "openai_completions",
			apiBaseUrl: "https://openrouter.ai/api/v1",
			hasApiKey: true,
			models: ["anthropic/claude-sonnet-4-5", "deepseek/deepseek-r1"],
			isBuiltIn: false,
		},
		{
			id: "openclaw-siliconflow",
			name: "SiliconFlow",
			sourceProviderName: "siliconflow",
			format: "openai_completions",
			apiBaseUrl: "https://api.siliconflow.cn/v1",
			hasApiKey: true,
			models: ["Pro/deepseek-ai/DeepSeek-R1"],
			isBuiltIn: false,
		},
	],
};

const MOCK_AGENT_WORKSPACES: Record<string, AgentWorkspace> = {
	claude: {
		agentId: "claude",
		rootPath: "~/.claude",
		files: [
			{
				path: "~/.claude/settings.json",
				name: "settings.json",
				type: "json",
				content: JSON.stringify(
					{
						model: "opus[1m]",
						language: "中文",
						autoUpdatesChannel: "stable",
						permissions: {
							allow: ["Bash(gh pr:*)", "Bash(git add:*)"],
							defaultMode: "plan",
						},
						hooks: {
							PreToolUse: [{ matcher: "*", hooks: [{ type: "command", command: "notify-bridge" }] }],
						},
						enabledPlugins: {
							"context7@claude-plugins-official": true,
							"pr-review-toolkit@claude-plugins-official": true,
							"typescript-lsp@claude-plugins-official": true,
						},
					},
					null,
					2,
				),
			},
			{
				path: "~/.claude/settings.local.json",
				name: "settings.local.json",
				type: "json",
				content: JSON.stringify(
					{
						permissions: {
							allow: [
								"Bash(zsh -c 'which node; node --version')",
								"Bash(ls:*)",
								"WebFetch(domain:github.com)",
							],
						},
					},
					null,
					2,
				),
			},
			{
				path: "~/.claude/config.json",
				name: "config.json",
				type: "json",
				content: JSON.stringify(
					{
						primaryApiKey: "any",
					},
					null,
					2,
				),
			},
			{
				path: "~/.claude/CLAUDE.md",
				name: "CLAUDE.md",
				type: "markdown",
				content:
					"# Global Rules\n\n## Language\n\n- Respond in Chinese throughout.\n- Keep proper nouns in English: API, CLI, JSON, shell, prompt, tool, etc.\n\n## Safety\n\n- Never use `rm` in any form.\n- Never read credential dirs: `~/.ssh/`, `~/.aws/`, `~/.gnupg/`.\n\n## Code Consistency\n\n- No simplification of features without explicit approval.\n- Modify in-place. Never create renamed \"new version\" files.\n- Domain-first naming. Preserve the project's established vocabulary.\n",
			},
		],
	},
	opencode: {
		agentId: "opencode",
		rootPath: "~/.config/opencode",
		files: [
			{
				path: "~/.config/opencode/settings.json",
				name: "settings.json",
				type: "json",
				content: JSON.stringify(
					{
						apiKey: "sk-•••••••••••••••••••••••••••••••••••••••••••",
						baseUrl: "https://api.openai.com/v1",
						model: "gpt-4.1",
						maxTokens: 4096,
						permissions: {
							allow: ["Read", "Write"],
							deny: ["Bash"],
						},
					},
					null,
					2,
				),
			},
			{
				path: "~/.config/opencode/USER.md",
				name: "USER.md",
				type: "markdown",
				content:
					"# USER.md\n\nGlobal user preferences for OpenCode.\n\n- Language: Chinese\n- Code style: Airbnb\n",
			},
		],
	},
	cursor: {
		agentId: "cursor",
		rootPath: "~/.cursor",
		files: [
			{
				path: "~/.cursor/settings.json",
				name: "settings.json",
				type: "json",
				content: JSON.stringify(
					{
						apiKey: "sk-•••••••••••••••••••••••••••••••••••••••••••",
						baseUrl: "https://api.openai.com/v1",
						model: "gpt-4o",
						maxTokens: 4096,
						permissions: {
							allow: ["Read", "Write", "Edit"],
							deny: [],
						},
					},
					null,
					2,
				),
			},
		],
	},
	openclaw: {
		agentId: "openclaw",
		rootPath: "~/.openclaw",
		files: [
			{
				path: "~/.openclaw/settings.json",
				name: "settings.json",
				type: "json",
				content: JSON.stringify(
					{
						apiKey: "sk-oc-••••••••••••••••••••••••••••••••••••",
						baseUrl: "https://openrouter.ai/api/v1",
						model: "anthropic/claude-sonnet-4-5",
						maxTokens: 4096,
						streaming: true,
						permissions: {
							allow: ["Read", "Write", "Edit", "Bash"],
							deny: [],
						},
					},
					null,
					2,
				),
			},
			{
				path: "~/.openclaw/AGENTS.md",
				name: "AGENTS.md",
				type: "markdown",
				content:
					"# AGENTS.md\n\nOpenClaw agent configuration.\n\n## Setup\n\n1. Set your API key in `settings.json`\n2. Choose a model from your inference provider\n3. Configure max tokens and streaming\n\n## Permissions\n\n- `Read` — read files in the workspace\n- `Write` — create new files\n- `Edit` — modify existing files\n- `Bash` — execute shell commands\n",
			},
		],
	},
};

const MOCK_CODE_EDITORS: ToolInfoDto[] = [
	{ id: "vscode", name: "Visual Studio Code", installed: true, path: "/usr/bin/code" },
	{ id: "cursor", name: "Cursor", installed: false, path: null },
];

const MOCK_MARKET_SKILLS: MarketSkill[] = [
	{ name: "Code Review Pro", slug: "code-review-pro", source: "skills-sh", installs: 1200, author: "skills-sh" },
	{ name: "DocGen", slug: "docgen", source: "skills-sh", installs: 800, author: "community" },
];

/* ------------------------------------------------------------------ */
/*  API factory                                                        */
/* ------------------------------------------------------------------ */

export function createApi(_baseUrl: string) {
	return {
		agents: {
			list(): Promise<AgentInfo[]> {
				return Promise.resolve(MOCK_AGENTS);
			},
			availability(): Promise<AgentAvailabilityDto[]> {
				return Promise.resolve(MOCK_AGENT_AVAILABILITY);
			},
		},
		skills: {
			listAll(
				_scope: "global" | "project" | "all" = "global",
				_projectRoot?: string,
				_includeManaged = false,
			): Promise<SkillResponse[]> {
				return Promise.resolve(MOCK_SKILLS);
			},
			create(
				_agent: string,
				data: CreateSkillRequest,
				_projectRoot?: string,
			): Promise<SkillResponse> {
				return Promise.resolve({
					name: data.name,
					enabled: true,
					source_path: null,
					canonical_path: null,
					description: data.description ?? null,
					author: data.author ?? null,
					version: data.version ?? null,
					tools: data.tools ?? [],
					source: "global",
					agent: _agent,
					plugin_id: null,
					plugin_name: null,
				});
			},
			import(
				_agent: string,
				_data: ImportSkillRequest,
				_projectRoot?: string,
			): Promise<SkillResponse> {
				return Promise.resolve(MOCK_SKILLS[0]);
			},
			install(_data: InstallSkillRequest): Promise<InstallSkillResponse> {
				return Promise.resolve({ success: true });
			},
			delete(
				_agent: string,
				_name: string,
				_scope: "global" | "project" = "global",
				_projectRoot?: string,
			): Promise<void> {
				return Promise.resolve();
			},
			openFolder(_skillPath: string): Promise<void> {
				return Promise.resolve();
			},
			editFolder(_skillPath: string): Promise<void> {
				return Promise.resolve();
			},
			getContent(skillPath: string): Promise<string> {
				return Promise.resolve(`# ${skillPath}\n\nMock skill content.`);
			},
			getTree(_skillPath: string): Promise<SkillTreeNodeResponse> {
				return Promise.resolve({ name: "root", path: "", kind: "directory", children: [] });
			},
			getGlobalLock(): Promise<GlobalSkillLockResponse> {
				return Promise.resolve({ version: 1, skills: [], lastSelectedAgents: null });
			},
			getProjectLock(_projectPath?: string): Promise<ProjectSkillLockResponse> {
				return Promise.resolve({ version: 1, skills: [] });
			},
			transfer(_body: TransferRequest): Promise<OperationBatchResponse> {
				return Promise.resolve({ success_count: 0, failed_count: 0, results: [] });
			},
			reconcile(_body: ReconcileRequest): Promise<OperationBatchResponse> {
				return Promise.resolve({ success_count: 0, failed_count: 0, results: [] });
			},
			deleteByPath(_body: DeleteSkillByPathRequest): Promise<DeleteSkillByPathResponse> {
				return Promise.resolve({ success: true, deleted_path: null, error: null, validation_errors: null });
			},
			gitScan(_data: GitScanRequest): Promise<GitScanResponse> {
				return Promise.resolve({ session_id: "", skills: [], branches: [], current_branch: "" });
			},
			gitInstall(_data: GitInstallRequest): Promise<GitInstallResponse> {
				return Promise.resolve({ results: [] });
			},
			gitSync(_data: GitSyncRequest): Promise<GitSyncResponse> {
				return Promise.resolve({ success: true, name: null, error: null });
			},
		},
		mcps: {
			listAll(
				_scope: "global" | "project" | "all" = "global",
				_projectRoot?: string,
			): Promise<McpResponse[]> {
				return Promise.resolve(MOCK_MCPS);
			},
			get(
				_name: string,
				_agent: string,
				_scope: "global" | "project" | "all",
			): Promise<McpResponse> {
				return Promise.resolve(MOCK_MCPS[0]);
			},
			create(
				_agent: string,
				_scope: "global" | "project",
				_body: CreateMcpRequest,
				_projectRoot?: string,
			): Promise<McpResponse> {
				return Promise.resolve(MOCK_MCPS[0]);
			},
			update(
				_name: string,
				_agent: string,
				_scope: "global" | "project",
				_body: UpdateMcpRequest,
				_projectRoot?: string,
			): Promise<McpResponse> {
				return Promise.resolve(MOCK_MCPS[0]);
			},
			delete(
				_name: string,
				_agent: string,
				_scope: "global" | "project",
				_projectRoot?: string,
			): Promise<void> {
				return Promise.resolve();
			},
			transfer(_body: TransferRequest): Promise<OperationBatchResponse> {
				return Promise.resolve({ success_count: 0, failed_count: 0, results: [] });
			},
			reconcile(_body: ReconcileRequest): Promise<OperationBatchResponse> {
				return Promise.resolve({ success_count: 0, failed_count: 0, results: [] });
			},
		},
		subAgents: {
			listAll(
				_scope: "global" | "project" | "all" = "global",
				_projectRoot?: string,
			): Promise<SubAgentResponse[]> {
				return Promise.resolve(MOCK_SUB_AGENTS);
			},
			list(
				_agent: string,
				_scope: "global" | "project" | "all" = "global",
				_projectRoot?: string,
			): Promise<SubAgentResponse[]> {
				return Promise.resolve(MOCK_SUB_AGENTS);
			},
			get(
				_name: string,
				_agent: string,
				_scope: "global" | "project" | "all",
				_projectRoot?: string,
			): Promise<SubAgentResponse> {
				return Promise.resolve(MOCK_SUB_AGENTS[0]);
			},
			create(
				_agent: string,
				_scope: "global" | "project",
				_body: CreateSubAgentRequest,
				_projectRoot?: string,
			): Promise<SubAgentResponse> {
				return Promise.resolve(MOCK_SUB_AGENTS[0]);
			},
			update(
				_name: string,
				_agent: string,
				_scope: "global" | "project",
				_body: UpdateSubAgentRequest,
				_projectRoot?: string,
			): Promise<SubAgentResponse> {
				return Promise.resolve(MOCK_SUB_AGENTS[0]);
			},
			delete(
				_name: string,
				_agent: string,
				_scope: "global" | "project",
				_projectRoot?: string,
			): Promise<void> {
				return Promise.resolve();
			},
			transfer(_body: TransferRequest): Promise<OperationBatchResponse> {
				return Promise.resolve({ success_count: 0, failed_count: 0, results: [] });
			},
			reconcile(_body: ReconcileRequest): Promise<OperationBatchResponse> {
				return Promise.resolve({ success_count: 0, failed_count: 0, results: [] });
			},
		},
		market: {
			search(q: string, limit?: number): Promise<MarketSkill[]> {
				return Promise.resolve(
					MOCK_MARKET_SKILLS.filter((s) =>
						s.name.toLowerCase().includes(q.toLowerCase()),
					).slice(0, limit ?? MOCK_MARKET_SKILLS.length),
				);
			},
		},
		integrations: {
			listCodeEditors(): Promise<ToolInfoDto[]> {
				return Promise.resolve(MOCK_CODE_EDITORS);
			},
			openWithEditor(_path: string, _editor: CodeEditorType): Promise<void> {
				return Promise.resolve();
			},
		},
		credentials: {
			list(): Promise<CredentialResponse[]> {
				return Promise.resolve(MOCK_CREDENTIALS);
			},
			create(body: CreateCredentialRequest): Promise<CredentialResponse> {
				return Promise.resolve({ id: crypto.randomUUID(), name: body.name });
			},
			delete(_id: string): Promise<void> {
				return Promise.resolve();
			},
		},
		plugins: {
			list(): Promise<CCPluginListResponse> {
				return Promise.resolve(MOCK_PLUGINS);
			},
			detail(pluginId: string): Promise<CCPluginDetailResponse> {
				return Promise.resolve({
					...MOCK_PLUGIN_ITEM,
					id: pluginId,
					manifest: {
						name: "Example Plugin",
						version: "0.1.0",
						description: "A sample plugin for demonstration",
						author: { name: "aghub", email: undefined, url: undefined },
						repository: "https://github.com/aghub/plugin-example",
						license: "MIT",
						keywords: ["example", "demo"],
					},
					provided_skills: [],
					mcp_config: { servers: [] },
					hooks: { hooks: [] },
				});
			},
			enable(pluginId: string): Promise<CCPluginResponse> {
				return Promise.resolve({ ...MOCK_PLUGIN_ITEM, id: pluginId, enabled: true });
			},
			disable(pluginId: string): Promise<CCPluginResponse> {
				return Promise.resolve({ ...MOCK_PLUGIN_ITEM, id: pluginId, enabled: false });
			},
			install(_body: CCPluginInstallRequest): Promise<CCPluginInstallResponse> {
				return Promise.resolve({ success: true, message: "Installed" });
			},
			uninstall(_body: CCPluginUninstallRequest): Promise<CCPluginUninstallResponse> {
				return Promise.resolve({ success: true, message: "Uninstalled" });
			},
			update(_body: CCPluginUpdateRequest): Promise<CCPluginUpdateResponse> {
				return Promise.resolve({ success: true, message: "Updated" });
			},
			checkUpdate(_body: CCPluginCheckUpdateRequest): Promise<CCPluginCheckUpdateResponse> {
				return Promise.resolve({ plugin_id: "", update_available: false, current_version: "" });
			},
			openFolder(_pluginId: string, _scope?: string): Promise<void> {
				return Promise.resolve();
			},
			openSkillInEditor(_body: { plugin_id: string; scope: string; skill_name: string; editor: CodeEditorType }): Promise<void> {
				return Promise.resolve();
			},
			reinstall(_body: CCPluginReinstallRequest): Promise<CCPluginReinstallResponse> {
				return Promise.resolve({ success: true, message: "Reinstalled" });
			},
			getConfig(_pluginId: string): Promise<CCPluginConfigResponse> {
				return Promise.resolve({ plugin_id: _pluginId, config: undefined });
			},
			updateConfig(_body: CCPluginUpdateConfigRequest): Promise<CCPluginConfigResponse> {
				return Promise.resolve({ plugin_id: "", config: undefined });
			},
			deleteConfig(_pluginId: string): Promise<CCPluginConfigResponse> {
				return Promise.resolve({ plugin_id: _pluginId, config: undefined });
			},
			listMarket(): Promise<CCPluginMarketResponse[]> {
				return Promise.resolve(MOCK_MARKET_PLUGINS);
			},
			updateMarketplace(): Promise<{ success: boolean; updated_count: number }> {
				return Promise.resolve({ success: true, updated_count: 0 });
			},
		},
		inferenceProviders: {
			list(): Promise<InferenceProviderResponse[]> {
				return Promise.resolve(MOCK_PROVIDERS);
			},
			get(name: string): Promise<InferenceProviderResponse | null> {
				return Promise.resolve(MOCK_PROVIDERS.find((p) => p.name === name) ?? null);
			},
			create(data: CreateInferenceProviderRequest): Promise<InferenceProviderResponse> {
				const provider: InferenceProviderResponse = {
					name: data.name.toLowerCase().replace(/\s+/g, "-"),
					display_name: data.display_name,
					format: data.format,
					api_base_url: data.api_base_url,
					masked_api_key: data.api_key ? `${data.api_key.slice(0, 5)}${"•".repeat(30)}${data.api_key.slice(-4)}` : null,
					models: data.models,
				};
				MOCK_PROVIDERS.push(provider);
				return Promise.resolve(provider);
			},
			update(data: UpdateInferenceProviderRequest): Promise<InferenceProviderResponse | null> {
				const idx = MOCK_PROVIDERS.findIndex((p) => p.name === data.name);
				if (idx === -1) return Promise.resolve(null);
				MOCK_PROVIDERS[idx].display_name = data.body.display_name;
				MOCK_PROVIDERS[idx].format = data.body.format;
				MOCK_PROVIDERS[idx].api_base_url = data.body.api_base_url;
				MOCK_PROVIDERS[idx].models = data.body.models;
				if (data.body.api_key) MOCK_PROVIDERS[idx].masked_api_key = `${data.body.api_key.slice(0, 5)}${"•".repeat(30)}${data.body.api_key.slice(-4)}`;
				return Promise.resolve(MOCK_PROVIDERS[idx]);
			},
			delete(name: string): Promise<void> {
				const idx = MOCK_PROVIDERS.findIndex((p) => p.name === name);
				if (idx !== -1) MOCK_PROVIDERS.splice(idx, 1);
				return Promise.resolve();
			},
			getPassword(_name: string): Promise<{ api_key: string }> {
				return Promise.resolve({ api_key: "sk-mock-revealed-key-1234567890abcdef" });
			},
		},
		agentProviders: {
			list(agentId: string): Promise<AgentProviderResponse[]> {
				return Promise.resolve(MOCK_AGENT_PROVIDER_LIST[agentId] ?? []);
			},
			create(agentId: string, data: CreateAgentProviderRequest): Promise<AgentProviderResponse> {
				const source = MOCK_PROVIDERS.find((p) => p.name === data.sourceProviderId);
				const ap: AgentProviderResponse = {
					id: crypto.randomUUID(),
					name: source?.display_name ?? "Unknown",
					sourceProviderName: data.sourceProviderId,
					format: source?.format ?? "openai_responses",
					apiBaseUrl: source?.api_base_url ?? null,
					hasApiKey: !!source?.masked_api_key,
					models: source?.models ?? [],
					isBuiltIn: false,
				};
				const list = MOCK_AGENT_PROVIDER_LIST[agentId] ?? [];
				list.push(ap);
				MOCK_AGENT_PROVIDER_LIST[agentId] = list;
				return Promise.resolve(ap);
			},
			update(agentId: string, providerId: string, data: UpdateAgentProviderRequest): Promise<AgentProviderResponse | null> {
				const list = MOCK_AGENT_PROVIDER_LIST[agentId] ?? [];
				const idx = list.findIndex((p) => p.id === providerId);
				if (idx === -1) return Promise.resolve(null);
				if (data.name) list[idx].name = data.name;
				return Promise.resolve(list[idx]);
			},
			delete(agentId: string, providerId: string): Promise<void> {
				const list = MOCK_AGENT_PROVIDER_LIST[agentId] ?? [];
				const idx = list.findIndex((p) => p.id === providerId);
				if (idx !== -1) list.splice(idx, 1);
				return Promise.resolve();
			},
			sync(agentId: string, providerId: string): Promise<AgentProviderResponse | null> {
				const list = MOCK_AGENT_PROVIDER_LIST[agentId] ?? [];
				const ap = list.find((p) => p.id === providerId);
				if (!ap || !ap.sourceProviderName) return Promise.resolve(null);
				const source = MOCK_PROVIDERS.find((p) => p.name === ap.sourceProviderName);
				if (!source) return Promise.resolve(null);
				ap.apiBaseUrl = source.api_base_url;
				ap.hasApiKey = !!source.masked_api_key;
				ap.models = source.models;
				return Promise.resolve(ap);
			},
		},
		workspace: {
			getAgentFiles(agentId: string): Promise<AgentConfigFile[]> {
				const ws = MOCK_AGENT_WORKSPACES[agentId];
				return Promise.resolve(ws?.files ?? []);
			},
			getFileContent(agentId: string, path: string): Promise<string | null> {
				const ws = MOCK_AGENT_WORKSPACES[agentId];
				const file = ws?.files.find((f) => f.path === path) ?? null;
				return Promise.resolve(file?.content ?? null);
			},
			saveFile(agentId: string, path: string, content: string): Promise<void> {
				const ws = MOCK_AGENT_WORKSPACES[agentId];
				const file = ws?.files.find((f) => f.path === path);
				if (file) file.content = content;
				return Promise.resolve();
			},
			syncInferenceFields(fromAgentId: string, toAgentId: string): Promise<boolean> {
				const fromWs = MOCK_AGENT_WORKSPACES[fromAgentId];
				const toWs = MOCK_AGENT_WORKSPACES[toAgentId];
				if (!fromWs || !toWs) return Promise.resolve(false);

				const fromFile = fromWs.files.find((f) => f.type === "json");
				const toFile = toWs.files.find((f) => f.type === "json");
				if (!fromFile || !toFile) return Promise.resolve(false);

				let fromConfig: Record<string, unknown>;
				let toConfig: Record<string, unknown>;
				try {
					fromConfig = JSON.parse(fromFile.content);
					toConfig = JSON.parse(toFile.content);
				} catch {
					return Promise.resolve(false);
				}

				const inferenceFields = ["apiKey", "baseUrl", "model", "maxTokens"];
				for (const key of inferenceFields) {
					if (key in fromConfig) {
						toConfig[key] = fromConfig[key];
					}
				}

				toFile.content = JSON.stringify(toConfig, null, 2);
				return Promise.resolve(true);
			},
		},
	};
}
