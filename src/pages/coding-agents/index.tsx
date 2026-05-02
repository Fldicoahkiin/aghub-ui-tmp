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
/*  Flatten tree data                                                  */
/* ------------------------------------------------------------------ */

interface FlatNode {
	id: string;
	name: string;
	depth: number;
	isDir: boolean;
	filePath: string;
	linkTo?: string;
	hasChildren: boolean;
}

function flattenFiles(
	files: AgentConfigFile[],
	expandedDirs: Set<string>,
): FlatNode[] {
	const dirFiles = files.filter((f) => f.type === "directory");
	const nonDirFiles = files.filter((f) => f.type !== "directory");
	const result: FlatNode[] = [];

	// Directories first
	for (const dir of dirFiles) {
		let children: string[] = [];
		try { children = JSON.parse(dir.content); } catch { /* empty */ }

		// Find actual files under this directory
		const subFiles = nonDirFiles.filter((f) => f.path.startsWith(dir.path));

		const hasChildren = children.length > 0 || subFiles.length > 0;
		result.push({
			id: dir.path,
			name: dir.name.replace(/\/$/, ""),
			depth: 0,
			isDir: true,
			filePath: dir.path,
			linkTo: dir.linkTo,
			hasChildren,
		});

		if (expandedDirs.has(dir.path)) {
			for (const child of children) {
				const childPath = `${dir.path}${child}`;
				const isSubDir = child.endsWith("/");

				// Check for real files under this subdirectory
				const childSubFiles = subFiles.filter((f) => f.path.startsWith(childPath));

				result.push({
					id: childPath,
					name: child.replace(/\/$/, ""),
					depth: 1,
					isDir: isSubDir,
					filePath: childPath,
					hasChildren: childSubFiles.length > 0,
				});

				// If this subdirectory is expanded, show its real files
				if (isSubDir && expandedDirs.has(childPath)) {
					for (const sf of childSubFiles) {
						result.push({
							id: sf.path,
							name: sf.name,
							depth: 2,
							isDir: false,
							filePath: sf.path,
							hasChildren: false,
						});
					}
				}
			}
		}
	}

	// Top-level files (not under any directory)
	for (const file of nonDirFiles) {
		if (!dirFiles.some((d) => file.path.startsWith(d.path))) {
			result.push({
				id: file.path,
				name: file.name,
				depth: 0,
				isDir: false,
				filePath: file.path,
				hasChildren: false,
			});
		}
	}

	return result;
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
	const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
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

	const flatNodes = useMemo(
		() => flattenFiles(files, expandedDirs),
		[files, expandedDirs],
	);

	const toggleDir = (id: string) => {
		setExpandedDirs((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	// Find selected directory entry for right panel
	const selectedDirFile = selectedFile?.type === "directory" ? selectedFile : null;

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
						setExpandedDirs(new Set());
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

				{/* File tree — hand-written flat list, aligned with aghub patterns */}
				<div className="flex min-h-0 flex-1 flex-col border-t border-border overflow-y-auto">
					{/* Root path header */}
					<div className="flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-medium text-accent">
						{rootPath}
					</div>

					{/* Tree nodes */}
					{flatNodes.map((node) => {
						const isSelected = !node.isDir && node.filePath === selectedFilePath;
						const isExpanded = expandedDirs.has(node.id);

						return (
							<button
								key={node.id}
								type="button"
								onClick={() => {
									if (node.isDir) {
										if (node.hasChildren) toggleDir(node.id);
										setSelectedFilePath(node.filePath);
									} else {
										setSelectedFilePath(node.filePath);
									}
								}}
								className={cn(
									"flex w-full items-center gap-1 py-1 pr-3 text-left text-[13px] transition-colors",
									isSelected
										? "bg-surface text-foreground"
										: "text-muted hover:bg-surface-secondary/50 hover:text-foreground",
								)}
								style={{ paddingLeft: `${node.depth * 16 + 12}px` }}
							>
								{/* Chevron or spacer */}
								{node.isDir && node.hasChildren ? (
									<ChevronRightIcon className={cn("size-3 shrink-0 transition-transform", isExpanded && "rotate-90")} />
								) : (
									<span className="size-3 shrink-0" />
								)}

								{/* File icon (only for non-dirs) */}
								{!node.isDir && <VscFileIcon name={node.name} />}

								<span className="truncate">{node.name}</span>
							</button>
						);
					})}
				</div>
			</div>

			{/* Right: Editor or directory preview */}
			<div className="flex flex-1 flex-col overflow-hidden">
				{selectedDirFile ? (
					<div className="flex h-full flex-col p-4">
						<Card className="flex h-full flex-col">
							<Card.Header className="flex flex-row items-center justify-between">
								<div className="flex min-w-0 items-center gap-2">
									<FolderOpenIcon className="size-4 shrink-0 text-muted" />
									<Card.Title className="truncate text-sm font-medium">{selectedDirFile.name.replace(/\/$/, "")}</Card.Title>
									<span className="shrink-0 text-xs text-muted">{rootPath}</span>
								</div>
								{selectedDirFile.linkTo && (
									<Button variant="ghost" size="sm" onPress={() => setLocation(selectedDirFile.linkTo!)}>
										<ArrowTopRightOnSquareIcon className="size-3.5" />
										{t(LINK_LABELS[selectedDirFile.linkTo] ?? "inferenceProviders")}
									</Button>
								)}
							</Card.Header>
							<Card.Content className="flex-1 overflow-y-auto">
								{(() => {
									let children: string[] = [];
									try { children = JSON.parse(selectedDirFile.content); } catch { /* empty */ }
									return children.length > 0 ? (
										<div className="space-y-px">
											{children.map((child) => (
												<div key={child} className="flex items-center gap-2 rounded-sm px-3 py-1.5 text-[13px] text-muted">
													{child.endsWith("/") ? <FolderIcon className="size-4 shrink-0 text-muted" /> : <VscFileIcon name={child} />}
													<span className="truncate">{child.replace(/\/$/, "")}</span>
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
								{selectedFile.type === "json" ? (
									<JsonEditor content={fileContent} onNavigateToProvider={() => setLocation("/inference-providers")} />
								) : selectedFile.type === "toml" ? (
									<TomlEditor content={fileContent} />
								) : (
									<MarkdownEditor content={fileContent} onDirtyChange={setIsDirty} />
								)}
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
