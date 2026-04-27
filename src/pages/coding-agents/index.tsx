import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/solid";
import { Button, Card, Label, ListBox } from "@heroui/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { Tree } from "react-arborist";
import type { NodeRendererProps } from "react-arborist";
import { getIconForFile, getIconForFolder } from "vscode-icons-ts";
import { JsonEditor } from "../../components/json-editor";
import { MarkdownEditor } from "../../components/markdown-editor";
import { TomlEditor } from "../../components/toml-editor";
import { useAgentAvailability } from "../../hooks/use-agent-availability";
import { useApi } from "../../hooks/use-api";
import type { AgentConfigFile } from "../../lib/api";
import { AgentIcon } from "../../lib/agent-icons";
import {
	workspaceAgentFilesQueryOptions,
	workspaceFileContentQueryOptions,
} from "../../requests/workspace";

/* ------------------------------------------------------------------ */
/*  VSCode icons                                                       */
/* ------------------------------------------------------------------ */

const ICON_BASE = "https://cdn.jsdelivr.net/npm/vscode-icons-ts@0.1.2/build/icons/";

function VscFileIcon({ name }: { name: string }) {
	const icon = getIconForFile(name);
	if (!icon) return <span className="inline-block size-4 shrink-0" />;
	return <img src={`${ICON_BASE}${icon}`} alt="" className="size-4 shrink-0" />;
}

function VscFolderIcon({ name, isOpen }: { name: string; isOpen?: boolean }) {
	const base = name.replace(/\/$/, "");
	const icon = isOpen
		? getIconForFolder(base).replace("default_folder", "default_folder_opened")
		: getIconForFolder(base);
	return <img src={`${ICON_BASE}${icon}`} alt="" className="size-4 shrink-0" />;
}

/* ------------------------------------------------------------------ */
/*  Tree data conversion                                               */
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
	const dirs: TreeNodeData[] = [];
	const leaves: TreeNodeData[] = [];

	for (const file of files) {
		if (file.type === "directory") {
			let children: TreeNodeData[] = [];
			try {
				const entries: string[] = JSON.parse(file.content);
				children = entries.map((entry) => ({
					id: `${file.path}${entry}`,
					name: entry,
					fileType: entry.endsWith("/") ? "directory" as const : "json" as const,
					filePath: `${file.path}${entry}`,
				}));
			} catch { /* empty */ }

			dirs.push({
				id: file.path,
				name: file.name,
				fileType: "directory",
				filePath: file.path,
				linkTo: file.linkTo,
				children,
			});
		} else {
			leaves.push({
				id: file.path,
				name: file.name,
				fileType: file.type,
				filePath: file.path,
			});
		}
	}

	return [
		{
			id: rootPath,
			name: rootPath,
			fileType: "directory",
			filePath: rootPath,
			children: [...dirs, ...leaves],
		},
	];
}

/* ------------------------------------------------------------------ */
/*  Tree node renderer                                                 */
/* ------------------------------------------------------------------ */

function FileTreeNode({ node, style }: NodeRendererProps<TreeNodeData>) {
	const isDir = node.data.fileType === "directory";
	const isSelected = node.isSelected && !isDir;

	return (
		<div
			style={style}
			className={`flex cursor-pointer items-center gap-1.5 border-l-2 pr-3 text-[13px] leading-7 transition-colors ${
				isSelected
					? "border-l-accent bg-surface text-foreground"
					: "border-l-transparent text-muted hover:bg-surface-secondary/50 hover:text-foreground"
			}`}
			onClick={() => {
				if (isDir) {
					node.toggle();
				} else {
					node.select();
					node.activate();
				}
			}}
		>
			{isDir ? (
				<VscFolderIcon name={node.data.name} isOpen={node.isOpen} />
			) : (
				<VscFileIcon name={node.data.name} />
			)}
			<span className="truncate">{node.data.name}</span>
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

	// Find the selected directory entry for its linkTo
	const selectedDirEntry = selectedFile?.type === "directory" ? selectedFile : null;

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

				{/* File tree (react-arborist) */}
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
									<VscFolderIcon name={selectedDirEntry.name} isOpen />
									<Card.Title className="truncate text-sm font-medium">{selectedDirEntry.name}</Card.Title>
									<span className="shrink-0 text-xs text-muted">{rootPath}</span>
								</div>
								{selectedDirEntry.linkTo && (
									<Button variant="ghost" size="sm" onPress={() => setLocation(selectedDirEntry.linkTo!)}>
										<ArrowTopRightOnSquareIcon className="size-3.5" />
										{selectedDirEntry.linkTo === "/skills" ? t("skills")
											: selectedDirEntry.linkTo === "/plugins" ? t("plugins")
											: selectedDirEntry.linkTo === "/mcp" ? t("mcpServers")
											: selectedDirEntry.linkTo === "/sub-agents" ? t("subAgents")
											: t("inferenceProviders")}
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
													{child.endsWith("/") ? <VscFolderIcon name={child} /> : <VscFileIcon name={child} />}
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
