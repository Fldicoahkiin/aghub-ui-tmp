import {
	ArrowTopRightOnSquareIcon,
	ChevronRightIcon,
	CodeBracketIcon,
	DocumentIcon,
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
import { cn } from "../../lib/utils";
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

function FileIcon({ name }: { name: string }) {
	if (name.endsWith(".json")) {
		return <CodeBracketIcon className="size-4 shrink-0 text-yellow-500/70" />;
	}
	if (name.endsWith(".md")) {
		return <DocumentIcon className="size-4 shrink-0 text-blue-400/70" />;
	}
	return <DocumentIcon className="size-4 shrink-0 text-muted" />;
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

	const rootPath = files[0]?.path.split("/").slice(0, -1).join("/") ?? "";

	return (
		<div className="flex h-full">
			{/* Left: Agent list + file tree */}
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

				{/* File tree */}
				<div className="flex min-h-0 flex-1 flex-col border-t border-border">
					{/* Root path header */}
					<div className="flex items-center gap-1.5 px-3 py-2 text-xs">
						<ChevronRightIcon className="size-3 rotate-90 text-muted" />
						<span className="font-mono font-medium text-accent">{rootPath}</span>
					</div>

					{/* File entries */}
					<div className="flex-1 overflow-y-auto">
						{files.map((file) => {
							const isSelected = file.path === selectedFilePath;
							return (
								<button
									key={file.path}
									onClick={() => setSelectedFilePath(file.path)}
									className={cn(
										"flex w-full items-center gap-2 border-l-2 py-1.5 pl-6 pr-3 text-left text-[13px] transition-colors",
										isSelected
											? "border-l-accent bg-surface text-foreground"
											: "border-l-transparent text-muted hover:bg-surface-secondary/60 hover:text-foreground",
									)}
								>
									<FileIcon name={file.name} />
									<span className="truncate">{file.name}</span>
								</button>
							);
						})}
					</div>
				</div>
			</div>

			{/* Right: Editor */}
			<div className="flex flex-1 flex-col overflow-hidden">
				{selectedFile && fileContent !== null ? (
					<div className="flex h-full flex-col p-4">
						<Card className="flex h-full flex-col">
							<Card.Header className="flex flex-row items-center justify-between">
								<div className="flex min-w-0 items-center gap-2">
									<FileIcon name={selectedFile.name} />
									<Card.Title className="truncate text-sm font-medium">
										{selectedFile.name}
									</Card.Title>
									<span className="shrink-0 text-xs text-muted">{selectedFile.path}</span>
								</div>
								<div className="flex shrink-0 gap-2">
									<Button variant="tertiary" size="sm">{t("cancel")}</Button>
									<Button size="sm">{t("save")}</Button>
								</div>
							</Card.Header>

							<Card.Content className="flex min-h-0 flex-1 flex-col">
								{/* Provider config hint */}
								{showProviderBanner && (
									<div className="mb-3 flex items-center justify-between rounded-md border border-border bg-surface-secondary/50 px-3 py-2 text-xs text-muted">
										<span>{t("providerConfigBanner")}</span>
										<Button variant="ghost" size="sm" onPress={() => setLocation("/inference-providers")}>
											<ArrowTopRightOnSquareIcon className="size-3.5" />
											{t("goToInferenceProviders")}
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
