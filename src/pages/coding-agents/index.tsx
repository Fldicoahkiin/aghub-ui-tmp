import {
	ArrowTopRightOnSquareIcon,
	ChevronRightIcon,
	FolderIcon,
	FolderOpenIcon,
} from "@heroicons/react/24/solid";
import { Button, Card, Label, ListBox } from "@heroui/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { Tree } from "react-arborist";
import type { NodeRendererProps } from "react-arborist";
import { getIconForFile } from "vscode-icons-ts";
import { JsonEditor } from "../../components/json-editor";
import { MarkdownEditor } from "../../components/markdown-editor";
import { TomlEditor } from "../../components/toml-editor";
import { useAgentAvailability } from "../../hooks/use-agent-availability";
import { useApi } from "../../hooks/use-api";
import type { AgentConfigFile } from "../../lib/api";
import { AgentIcon } from "../../lib/agent-icons";
import { cn } from "../../lib/utils";
import {
	workspaceAgentFilesQueryOptions,
	workspaceFileContentQueryOptions,
} from "../../requests/workspace";

/* ------------------------------------------------------------------ */
/*  VSCode file icons                                                  */
/* ------------------------------------------------------------------ */

const ICON_BASE = "https://cdn.jsdelivr.net/npm/vscode-icons-ts@0.1.2/build/icons/";

function VscFileIcon({ name }: { name: string }) {
	const icon = getIconForFile(name);
	if (!icon) return <span className="inline-block size-4 shrink-0" />;
	return <img src={`${ICON_BASE}${icon}`} alt="" className="size-4 shrink-0 opacity-70" />;
}

/* ------------------------------------------------------------------ */
/*  Link target mapping                                                */
/* ------------------------------------------------------------------ */

const LINK_LABELS: Record<string, string> = {
	"/skills": "skills",
	"/plugins": "plugins",
	"/mcp": "mcpServers",
	"/sub-agents": "subAgents",
	"/inference-providers": "inferenceProviders",
};

/* ------------------------------------------------------------------ */
/*  Tree data                                                          */
/* ------------------------------------------------------------------ */

interface TreeNodeData {
	id: string;
	name: string;
	fileType: AgentConfigFile["type"];
	filePath: string;
	linkTo?: string;
	children?: TreeNodeData[];
}

function filesToTreeData(files: AgentConfigFile[], rootPath: string): TreeNodeData[] {
	// Separate directories and files
	const dirFiles = files.filter((f) => f.type === "directory");
	const nonDirFiles = files.filter((f) => f.type !== "directory");

	// Build directory nodes with children from JSON content
	const dirNodes: TreeNodeData[] = dirFiles.map((dir) => {
		let childEntries: string[] = [];
		try { childEntries = JSON.parse(dir.content); } catch { /* empty */ }

		// For each child entry, check if there are actual files under it
		const children: TreeNodeData[] = childEntries.map((entry) => {
			const childPath = `${dir.path}${entry}`;
			const isSubDir = entry.endsWith("/");

			if (isSubDir) {
				// Find files that live under this subdirectory
				const subFiles = nonDirFiles
					.filter((f) => f.path.startsWith(childPath))
					.map((f) => ({
						id: f.path,
						name: f.name,
						fileType: f.type as TreeNodeData["fileType"],
						filePath: f.path,
					}));

				return {
					id: childPath,
					name: entry,
					fileType: "directory" as const,
					filePath: childPath,
					children: subFiles.length > 0 ? subFiles : undefined,
				};
			}

			return {
				id: childPath,
				name: entry,
				fileType: "json" as const,
				filePath: childPath,
			};
		});

		return {
			id: dir.path,
			name: dir.name,
			fileType: "directory" as const,
			filePath: dir.path,
			linkTo: dir.linkTo,
			children,
		};
	});

	// Top-level files (not under any directory)
	const topLevelFiles: TreeNodeData[] = nonDirFiles
		.filter((f) => !dirFiles.some((d) => f.path.startsWith(d.path)))
		.map((f) => ({
			id: f.path,
			name: f.name,
			fileType: f.type as TreeNodeData["fileType"],
			filePath: f.path,
		}));

	return [{
		id: "__root__",
		name: rootPath,
		fileType: "directory" as const,
		filePath: rootPath,
		children: [...dirNodes, ...topLevelFiles],
	}];
}

/* ------------------------------------------------------------------ */
/*  Tree node renderer                                                 */
/* ------------------------------------------------------------------ */

function FileTreeNode({ node, style }: NodeRendererProps<TreeNodeData>) {
	const { t } = useTranslation();
	const [, setLocation] = useLocation();
	const isDir = node.data.fileType === "directory";
	const isRoot = node.data.id === "__root__";
	const isSelected = node.isSelected && !isDir;
	const hasLink = !!node.data.linkTo;

	return (
		<div style={{ ...style, cursor: "default" }} className="px-1">
			<div
				className={cn(
					"group flex items-center gap-1 rounded-md px-1.5 text-[13px] leading-7 transition-colors",
					isRoot
						? "font-mono text-xs font-medium text-accent"
						: isSelected
							? "bg-surface text-foreground"
							: "text-muted hover:bg-surface-secondary/50 hover:text-foreground",
				)}
			>
				{/* Chevron for directories */}
				{isDir && !isRoot ? (
					<button
						type="button"
						onClick={(e) => { e.stopPropagation(); node.toggle(); }}
						className="flex size-4 shrink-0 items-center justify-center"
					>
						<ChevronRightIcon className={cn("size-3 text-muted transition-transform", node.isOpen && "rotate-90")} />
					</button>
				) : !isDir ? (
					<span className="size-4 shrink-0" />
				) : null}

				{/* Name (+ file icon for non-dirs) — click to toggle dir or select file */}
				<div
					className="flex min-w-0 flex-1 items-center gap-1.5"
					onClick={() => {
						if (isRoot) return;
						if (isDir) node.toggle();
						else { node.select(); node.activate(); }
					}}
				>
					{!isDir && <VscFileIcon name={node.data.name} />}
					<span className="truncate">{isDir ? node.data.name.replace(/\/$/, "") : node.data.name}</span>
				</div>

				{/* Jump link for linked directories */}
				{hasLink && !isRoot && (
					<button
						type="button"
						onClick={(e) => { e.stopPropagation(); setLocation(node.data.linkTo!); }}
						className="hidden shrink-0 items-center gap-0.5 rounded px-1 py-0.5 text-[11px] text-accent/60 transition-colors hover:bg-accent/10 hover:text-accent group-hover:inline-flex"
						title={t(LINK_LABELS[node.data.linkTo!] ?? "inferenceProviders")}
					>
						<ArrowTopRightOnSquareIcon className="size-3" />
					</button>
				)}
			</div>
		</div>
	);
}

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

	const prevFile = useRef(selectedFilePath);
	useEffect(() => {
		if (prevFile.current !== selectedFilePath) {
			setIsDirty(false);
			prevFile.current = selectedFilePath;
		}
	}, [selectedFilePath]);

	const selectedFile = files.find((f) => f.path === selectedFilePath) ?? null;
	const rootPath = files[0]?.path.split("/").slice(0, -1).join("/") ?? "";

	const treeData = useMemo(
		() => filesToTreeData(files, rootPath),
		[files, rootPath],
	);

	const selectedDirEntry = selectedFile?.type === "directory" ? selectedFile : null;

	return (
		<div className="flex h-full">
			{/* Left: Agent list + file tree */}
			<div className="flex w-72 shrink-0 flex-col border-r border-border">
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
				<div className="flex min-h-0 flex-1 flex-col border-t border-border overflow-hidden">
					<Tree
						data={treeData}
						openByDefault
						width="100%"
						rowHeight={28}
						indent={16}
						padding={8}
						disableDrag
						disableDrop
						disableEdit
						onActivate={(node) => {
							if (node.data.fileType !== "directory") {
								setSelectedFilePath(node.data.filePath);
							}
						}}
					>
						{FileTreeNode}
					</Tree>
				</div>
			</div>

			{/* Right: Editor or directory preview */}
			<div className="flex flex-1 flex-col overflow-hidden">
				{selectedDirEntry ? (
					<div className="flex h-full flex-col p-4">
						<Card className="flex h-full flex-col">
							<Card.Header className="flex flex-row items-center justify-between">
								<div className="flex min-w-0 items-center gap-2">
									<FolderOpenIcon className="size-4 shrink-0 text-muted" />
									<Card.Title className="truncate text-sm font-medium">{selectedDirEntry.name}</Card.Title>
									<span className="shrink-0 text-xs text-muted">{rootPath}</span>
								</div>
								{selectedDirEntry.linkTo && (
									<Button variant="ghost" size="sm" onPress={() => setLocation(selectedDirEntry.linkTo!)}>
										<ArrowTopRightOnSquareIcon className="size-3.5" />
										{t(LINK_LABELS[selectedDirEntry.linkTo] ?? "inferenceProviders")}
									</Button>
								)}
							</Card.Header>
							<Card.Content className="flex-1 overflow-y-auto">
								{(() => {
									let children: string[] = [];
									try { children = JSON.parse(selectedDirEntry.content); } catch { /* empty */ }
									return children.length > 0 ? (
										<div className="space-y-px">
											{children.map((child) => (
												<div key={child} className="flex items-center gap-2 rounded-sm px-3 py-1.5 text-[13px] text-muted">
													{child.endsWith("/") ? <FolderIcon className="size-4 shrink-0 text-muted" /> : <VscFileIcon name={child} />}
													<span className="truncate">{child}</span>
												</div>
											))}
										</div>
									) : (
										<div className="flex h-full items-center justify-center">
											<p className="text-sm text-muted">Empty directory</p>
										</div>
									);
								})()}
							</Card.Content>
						</Card>
					</div>
				) : selectedFile && fileContent !== null ? (
					<div className="flex h-full flex-col p-4">
						<Card className="flex h-full flex-col">
							<Card.Header className="flex flex-row items-center justify-between">
								<div className="flex min-w-0 items-center gap-2">
									<VscFileIcon name={selectedFile.name} />
									<Card.Title className="truncate text-sm font-medium">{selectedFile.name}</Card.Title>
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
