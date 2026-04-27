import {
	ArrowTopRightOnSquareIcon,
	DocumentTextIcon,
} from "@heroicons/react/24/solid";
import { Button, Card, Label, ListBox } from "@heroui/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { JsonEditor } from "../../components/json-editor";
import { MarkdownEditor } from "../../components/markdown-editor";
import { useAgentAvailability } from "../../hooks/use-agent-availability";
import { useApi } from "../../hooks/use-api";
import { AgentIcon } from "../../lib/agent-icons";
import {
	workspaceAgentFilesQueryOptions,
	workspaceFileContentQueryOptions,
} from "../../requests/workspace";

function hasProviderFields(content: string): boolean {
	try {
		const parsed = JSON.parse(content);
		return ["apiKey", "baseUrl", "model", "primaryApiKey"].some((key) => key in parsed);
	} catch {
		return false;
	}
}

function getPathHint(filePath: string): { label: string; href: string } | null {
	if (filePath.includes("/skills/")) return { label: "在 Skills 中管理", href: "/skills" };
	if (filePath.includes("/plugins/")) return { label: "在 Plugins 中管理", href: "/plugins" };
	if (filePath.includes("/mcp") || filePath.includes("mcpServers")) return { label: "在 MCP Server 中管理", href: "/mcp" };
	return null;
}

export default function CodingAgentsPage() {
	const { t } = useTranslation();
	const api = useApi();
	const [, setLocation] = useLocation();
	const { availableAgents } = useAgentAvailability();
	const usableAgents = availableAgents.filter((a) => a.isUsable);

	const [selectedAgentId, setSelectedAgentId] = useState<string>(
		usableAgents[0]?.id ?? "",
	);
	const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);

	const { data: files = [] } = useSuspenseQuery(
		workspaceAgentFilesQueryOptions({ api, agentId: selectedAgentId }),
	);

	const { data: fileContent } = useSuspenseQuery({
		...workspaceFileContentQueryOptions({
			api,
			agentId: selectedAgentId,
			path: selectedFilePath ?? "",
		}),
	});

	const selectedFile = files.find((f) => f.path === selectedFilePath) ?? null;
	const showProviderBanner =
		selectedFile?.type === "json" &&
		fileContent !== null &&
		hasProviderFields(fileContent);
	const pathHint = selectedFile ? getPathHint(selectedFile.path) : null;

	return (
		<div className="flex h-full">
			{/* Left: Agent list + config files */}
			<div className="flex w-72 shrink-0 flex-col border-r border-border">
				{/* Agent list */}
				<div className="border-b border-border px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted">
					{t("codingAgents")}
				</div>
				<ListBox
					aria-label={t("codingAgents")}
					selectionMode="single"
					selectionBehavior="replace"
					selectedKeys={new Set([selectedAgentId])}
					onSelectionChange={(keys) => {
						if (keys === "all") return;
						const id = [...keys][0] as string | undefined;
						if (!id) return;
						setSelectedAgentId(id);
						setSelectedFilePath(null);
					}}
					className="p-2"
				>
					{usableAgents.map((agent) => (
						<ListBox.Item
							key={agent.id}
							id={agent.id}
							textValue={agent.display_name}
							className="data-selected:bg-surface"
						>
							<div className="flex min-w-0 items-center gap-2">
								<AgentIcon id={agent.id} name={agent.display_name} size="xs" variant="ghost" />
								<div className="min-w-0 flex-1">
									<Label className="block truncate">{agent.display_name}</Label>
								</div>
							</div>
						</ListBox.Item>
					))}
				</ListBox>

				{/* Config files */}
				<div className="flex min-h-0 flex-1 flex-col border-t border-border">
					<div className="bg-surface-secondary/50 px-3 py-2 text-xs font-medium text-muted">
						{files[0]?.path.split("/").slice(0, -1).join("/") ?? ""}
					</div>
					<ListBox
						aria-label={t("configFiles")}
						selectionMode="single"
						selectionBehavior="replace"
						selectedKeys={selectedFilePath ? new Set([selectedFilePath]) : new Set<string>()}
						onSelectionChange={(keys) => {
							if (keys === "all") return;
							const path = [...keys][0] as string | undefined;
							if (path) setSelectedFilePath(path);
						}}
						className="flex-1 overflow-y-auto p-2"
					>
						{files.map((file) => (
							<ListBox.Item
								key={file.path}
								id={file.path}
								textValue={file.name}
								className="data-selected:bg-surface"
							>
								<div className="flex min-w-0 items-center gap-2">
									<DocumentTextIcon className="size-4 shrink-0 text-muted" />
									<Label className="block truncate">{file.name}</Label>
								</div>
							</ListBox.Item>
						))}
					</ListBox>
				</div>
			</div>

			{/* Right: Editor */}
			<div className="flex flex-1 flex-col overflow-hidden">
				{selectedFile && fileContent !== null ? (
					<div className="flex h-full flex-col p-4">
						<Card className="flex h-full flex-col">
							<Card.Header className="flex flex-row items-center justify-between">
								<Card.Title className="truncate text-sm font-medium">
									{selectedFile.path}
								</Card.Title>
								<div className="flex shrink-0 gap-2">
									<Button variant="tertiary" size="sm">{t("cancel")}</Button>
									<Button size="sm">{t("save")}</Button>
								</div>
							</Card.Header>

							<Card.Content className="flex min-h-0 flex-1 flex-col">
								{/* Provider config hint */}
								{showProviderBanner && (
									<div className="mb-3 flex items-center justify-between rounded-md bg-surface-secondary px-3 py-2 text-xs text-muted">
										<span>{t("providerConfigBanner")}</span>
										<Button variant="ghost" size="sm" onPress={() => setLocation("/inference-providers")}>
											<ArrowTopRightOnSquareIcon className="size-3.5" />
											{t("goToInferenceProviders")}
										</Button>
									</div>
								)}

								{/* Path-aware hint (skills/plugins/mcp) */}
								{pathHint && !showProviderBanner && (
									<div className="mb-3 flex items-center justify-between rounded-md bg-surface-secondary px-3 py-2 text-xs text-muted">
										<span>{pathHint.label}</span>
										<Button variant="ghost" size="sm" onPress={() => setLocation(pathHint.href)}>
											<ArrowTopRightOnSquareIcon className="size-3.5" />
										</Button>
									</div>
								)}

								{/* Editor */}
								<div className="min-h-0 flex-1">
									{selectedFile.type === "json" ? (
										<JsonEditor content={fileContent} />
									) : (
										<MarkdownEditor content={fileContent} />
									)}
								</div>
							</Card.Content>
						</Card>
					</div>
				) : (
					<div className="flex h-full items-center justify-center text-sm text-muted">
						{selectedAgentId ? t("selectFile") : t("selectAgent")}
					</div>
				)}
			</div>
		</div>
	);
}
