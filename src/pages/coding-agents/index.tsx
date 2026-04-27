import {
	ArrowTopRightOnSquareIcon,
	ChevronRightIcon,
} from "@heroicons/react/24/solid";
import { Button, Card, Label, ListBox } from "@heroui/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { getIconForFile, getIconForFolder } from "vscode-icons-ts";
import { JsonEditor } from "../../components/json-editor";
import { MarkdownEditor } from "../../components/markdown-editor";
import { TomlEditor } from "../../components/toml-editor";
import { useAgentAvailability } from "../../hooks/use-agent-availability";
import { useApi } from "../../hooks/use-api";
import { AgentIcon } from "../../lib/agent-icons";
import { cn } from "../../lib/utils";
import {
	workspaceAgentFilesQueryOptions,
	workspaceFileContentQueryOptions,
} from "../../requests/workspace";

/* ------------------------------------------------------------------ */
/*  VSCode file icon component                                         */
/* ------------------------------------------------------------------ */

const ICON_BASE = "https://cdn.jsdelivr.net/npm/vscode-icons-ts@0.1.2/build/icons/";

function VscFileIcon({ name }: { name: string }) {
	const icon = getIconForFile(name);
	if (!icon) return <span className="inline-block size-4 shrink-0" />;
	return <img src={`${ICON_BASE}${icon}`} alt="" className="size-4 shrink-0" />;
}

function VscFolderIcon({ name }: { name: string }) {
	const icon = getIconForFolder(name.replace(/\/$/, ""));
	return <img src={`${ICON_BASE}${icon}`} alt="" className="size-4 shrink-0" />;
}

/* ------------------------------------------------------------------ */
/*  Provider fields detection                                          */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

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
	const [treeOpen, setTreeOpen] = useState(true);
	const [isDirty, setIsDirty] = useState(false);

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

	// Reset dirty state on file change
	const prevFile = useRef(selectedFilePath);
	useEffect(() => {
		if (prevFile.current !== selectedFilePath) {
			setIsDirty(false);
			prevFile.current = selectedFilePath;
		}
	}, [selectedFilePath]);

	const selectedFile = files.find((f) => f.path === selectedFilePath) ?? null;
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
						setTreeOpen(true);
					}}
					className="p-2"
				>
					{usableAgents.map((agent) => (
						<ListBox.Item key={agent.id} id={agent.id} textValue={agent.display_name} className="data-selected:bg-surface">
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
					{/* Root — clickable to collapse/expand */}
					<button
						type="button"
						onClick={() => setTreeOpen(!treeOpen)}
						className="flex items-center gap-1.5 px-3 py-2 text-xs hover:bg-surface-secondary/50"
					>
						<ChevronRightIcon className={cn("size-3 text-muted transition-transform", treeOpen && "rotate-90")} />
						<span className="font-mono font-medium text-accent">{rootPath}</span>
					</button>

					{/* File entries */}
					{treeOpen && (
						<div className="flex-1 overflow-y-auto">
							{/* Regular files first */}
							{files.filter((f) => f.type !== "directory").map((file) => {
								const isSelected = file.path === selectedFilePath;
								return (
									<button
										key={file.path}
										onClick={() => setSelectedFilePath(file.path)}
										className={cn(
											"flex w-full items-center gap-2 border-l-2 py-1 pl-7 pr-3 text-left text-[13px] transition-colors",
											isSelected
												? "border-l-accent bg-surface text-foreground"
												: "border-l-transparent text-muted hover:bg-surface-secondary/50 hover:text-foreground",
										)}
									>
										<VscFileIcon name={file.name} />
										<span className="truncate">{file.name}</span>
									</button>
								);
							})}
							{/* Directories */}
							{files.filter((f) => f.type === "directory").map((dir) => (
								<button
									key={dir.path}
									onClick={() => dir.linkTo ? setLocation(dir.linkTo) : undefined}
									className={cn(
										"flex w-full items-center gap-2 border-l-2 border-l-transparent py-1 pl-7 pr-3 text-left text-[13px] transition-colors",
										dir.linkTo
											? "text-muted hover:bg-surface-secondary/50 hover:text-foreground"
											: "text-muted/60",
									)}
								>
									<VscFolderIcon name={dir.name} />
									<span className="truncate">{dir.name}</span>
									{dir.linkTo && <ArrowTopRightOnSquareIcon className="ml-auto size-3 opacity-40" />}
								</button>
							))}
						</div>
					)}
				</div>
			</div>

			{/* Right: Editor */}
			<div className="flex flex-1 flex-col overflow-hidden">
				{selectedFile && fileContent !== null ? (
					<div className="flex h-full flex-col p-4">
						<Card className="flex h-full flex-col">
							<Card.Header className="flex flex-row items-center justify-between">
								<div className="flex min-w-0 items-center gap-2">
									<VscFileIcon name={selectedFile.name} />
									<Card.Title className="truncate text-sm font-medium">
										{selectedFile.name}
									</Card.Title>
									<span className="shrink-0 text-xs text-muted">{rootPath}</span>
								</div>
								{isDirty && (
									<div className="flex shrink-0 gap-2">
										<Button variant="tertiary" size="sm" onPress={() => setIsDirty(false)}>{t("cancel")}</Button>
										<Button size="sm" onPress={() => setIsDirty(false)}>{t("save")}</Button>
									</div>
								)}
							</Card.Header>

							<Card.Content className="flex min-h-0 flex-1 flex-col">
								<div className="min-h-0 flex-1">
									{selectedFile.type === "json" ? (
										<JsonEditor content={fileContent} onNavigateToProvider={() => setLocation("/inference-providers")} />
									) : selectedFile.type === "toml" ? (
										<TomlEditor content={fileContent} />
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
