import {
	ArrowPathIcon,
	PencilIcon,
	PlusIcon,
	ServerIcon,
	TrashIcon,
} from "@heroicons/react/24/solid";
import {
	AlertDialog,
	Button,
	Card,
	FieldError,
	Input,
	Label,
	ListBox,
	Modal,
	Select,
	Spinner,
	TextField,
	Tooltip,
	toast,
} from "@heroui/react";
import {
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useApi } from "../../hooks/use-api";
import type {
	AgentProviderResponse,
	CodingAgentId,
} from "../../lib/api";
import { AgentIcon } from "../../lib/agent-icons";
import { cn } from "../../lib/utils";
import { agentProvidersListQueryOptions } from "../../requests/agent-providers";
import { inferenceProviderListQueryOptions } from "../../requests/inference-providers";
import { queryKeys } from "../../requests/keys";

const CODING_AGENTS: { id: CodingAgentId; label: string }[] = [
	{ id: "opencode", label: "OpenCode" },
	{ id: "codex", label: "Codex" },
	{ id: "openclaw", label: "OpenClaw" },
	{ id: "claude", label: "Claude Code" },
];

/* ------------------------------------------------------------------ */
/*  Default export: full panel with left agent list                    */
/* ------------------------------------------------------------------ */

export default function AgentsPanel({
	onNavigateToProvider,
}: {
	onNavigateToProvider: (providerId?: string) => void;
}) {
	const { t } = useTranslation();
	const [selectedAgentId, setSelectedAgentId] = useState<CodingAgentId>("opencode");

	return (
		<div className="flex h-full">
			<div className="flex w-56 shrink-0 flex-col border-r border-border">
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
						const id = [...keys][0] as CodingAgentId | undefined;
						if (id) setSelectedAgentId(id);
					}}
					className="flex-1 overflow-y-auto p-2"
				>
					{CODING_AGENTS.map((agent) => (
						<ListBox.Item key={agent.id} id={agent.id} textValue={agent.label} className="data-selected:bg-surface">
							<div className="flex min-w-0 items-center gap-2">
								<AgentIcon id={agent.id} name={agent.label} size="xs" variant="ghost" />
								<div className="min-w-0 flex-1">
									<Label className="block truncate">{agent.label}</Label>
								</div>
							</div>
						</ListBox.Item>
					))}
				</ListBox>
			</div>

			<div className="flex-1 overflow-hidden">
				<AgentProviderPanel agentId={selectedAgentId} onNavigateToProvider={onNavigateToProvider} />
			</div>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  AgentProviderPanel (also exported for direct use)                   */
/* ------------------------------------------------------------------ */

export function AgentProviderPanel({
	agentId,
	onNavigateToProvider,
}: {
	agentId: CodingAgentId;
	onNavigateToProvider: (providerId?: string) => void;
}) {
	const { t } = useTranslation();
	const api = useApi();
	const queryClient = useQueryClient();
	const agentLabel = CODING_AGENTS.find((a) => a.id === agentId)?.label ?? agentId;

	const [dialogMode, setDialogMode] = useState<{ type: "create" } | { type: "edit"; provider: AgentProviderResponse } | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<AgentProviderResponse | null>(null);

	const { data: agentProviders = [], isLoading, isFetching, refetch } = useQuery(
		agentProvidersListQueryOptions({ api, agentId }),
	);

	const { data: inventoryProviders = [], isLoading: isInventoryLoading } = useQuery(
		inferenceProviderListQueryOptions({ api }),
	);

	const deleteMutation = useMutation({
		mutationFn: (providerId: string) => api.agentProviders.delete(agentId, providerId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.agentProviders.list(agentId) });
			setDeleteTarget(null);
			toast.success(t("providerDeleted"));
		},
	});

	const syncMutation = useMutation({
		mutationFn: (providerId: string) => api.agentProviders.sync(agentId, providerId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.agentProviders.list(agentId) });
			toast.success(t("providerUpdated"));
		},
	});

	const handleEditProvider = (provider: AgentProviderResponse) => {
		if (provider.sourceProviderName) {
			onNavigateToProvider(provider.sourceProviderName);
			return;
		}
		setDialogMode({ type: "edit", provider });
	};

	return (
		<>
			<div className="h-full overflow-y-auto">
				<div className="w-full p-4 sm:p-6">
					<Card>
						<Card.Header className="flex flex-row items-start justify-between gap-3">
							<div className="flex min-w-0 items-center gap-3">
								<AgentIcon id={agentId} name={agentLabel} size="xs" variant="ghost" />
								<div className="min-w-0">
									<h2 className="truncate text-xl font-semibold text-foreground">{agentLabel}</h2>
								</div>
							</div>
							<div className="flex shrink-0 items-center gap-2">
								<Tooltip delay={0}>
									<Tooltip.Trigger>
										<Button isIconOnly variant="ghost" size="sm" aria-label={t("refresh")} onPress={() => refetch()}>
											<ArrowPathIcon className={cn("size-4", isFetching && "animate-spin")} />
										</Button>
									</Tooltip.Trigger>
									<Tooltip.Content>{t("refresh")}</Tooltip.Content>
								</Tooltip>
								<Button size="sm" onPress={() => setDialogMode({ type: "create" })}>
									<PlusIcon className="size-4" />
									{t("add")}
								</Button>
							</div>
						</Card.Header>

						<Card.Content className="grid gap-4">
							{isLoading ? (
								<div className="flex justify-center py-8"><Spinner /></div>
							) : agentProviders.length === 0 ? (
								<div className="grid justify-items-center gap-3 py-8 text-center">
									<p className="text-sm text-muted">{t("noProviders")}</p>
									<Button size="sm" onPress={() => setDialogMode({ type: "create" })}>
										<PlusIcon className="size-4" />
										{t("add")}
									</Button>
								</div>
							) : (
								<div>
									{agentProviders.map((provider) => (
										<ProviderRow
											key={provider.id}
											provider={provider}
											isSyncing={syncMutation.isPending && syncMutation.variables === provider.id}
											onEdit={() => handleEditProvider(provider)}
											onSync={() => syncMutation.mutate(provider.id)}
											onDelete={() => setDeleteTarget(provider)}
										/>
									))}
								</div>
							)}
						</Card.Content>
					</Card>
				</div>
			</div>

			{/* Create dialog */}
			<CreateDialog
				isOpen={dialogMode?.type === "create"}
				agentId={agentId}
				inventoryProviders={inventoryProviders}
				isInventoryLoading={isInventoryLoading}
				onClose={() => setDialogMode(null)}
			/>

			{/* Edit dialog */}
			{dialogMode?.type === "edit" && (
				<EditDialog
					isOpen
					agentId={agentId}
					provider={dialogMode.provider}
					onClose={() => setDialogMode(null)}
				/>
			)}

			{/* Delete confirm */}
			<AlertDialog.Backdrop isOpen={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
				<AlertDialog.Container>
					<AlertDialog.Dialog className="sm:max-w-[420px]">
						<AlertDialog.CloseTrigger />
						<AlertDialog.Header>
							<AlertDialog.Icon status="danger" />
							<AlertDialog.Heading>{t("deleteProvider")}</AlertDialog.Heading>
						</AlertDialog.Header>
						<AlertDialog.Body>
							{t("deleteProviderConfirm", { name: deleteTarget?.name })}
						</AlertDialog.Body>
						<AlertDialog.Footer>
							<Button variant="tertiary" onPress={() => setDeleteTarget(null)}>{t("cancel")}</Button>
							<Button variant="danger" isPending={deleteMutation.isPending} onPress={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget.id); }}>{t("delete")}</Button>
						</AlertDialog.Footer>
					</AlertDialog.Dialog>
				</AlertDialog.Container>
			</AlertDialog.Backdrop>
		</>
	);
}

/* ------------------------------------------------------------------ */
/*  ProviderRow                                                        */
/* ------------------------------------------------------------------ */

function ProviderRow({
	provider, isSyncing, onEdit, onSync, onDelete,
}: {
	provider: AgentProviderResponse;
	isSyncing: boolean;
	onEdit: () => void;
	onSync: () => void;
	onDelete: () => void;
}) {
	const { t } = useTranslation();

	return (
		<div className="grid gap-3 border-t border-border py-3 first:border-t-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
			<div className="grid min-w-0 gap-1">
				<div className="flex min-w-0 items-center gap-2">
					<ServerIcon className="size-4 shrink-0 text-muted" />
					<Label className="truncate">{provider.name}</Label>
					<span className="rounded-md bg-surface-secondary px-2 py-0.5 text-xs text-muted">
						{provider.format}
					</span>
				</div>
				<div className="flex min-w-0 flex-wrap gap-2 text-xs text-muted">
					{provider.apiBaseUrl && (
						<span className="truncate font-mono">{provider.apiBaseUrl}</span>
					)}
					{provider.models.length > 0 && (
						<span>{provider.models.length} {t("models")}</span>
					)}
				</div>
			</div>

			<div className="flex items-center gap-2 sm:justify-end">
				{provider.sourceProviderName && (
					<Tooltip delay={0}>
						<Tooltip.Trigger>
							<Button isIconOnly variant="ghost" size="sm" aria-label="Sync" isPending={isSyncing} onPress={onSync}>
								<ArrowPathIcon className="size-4" />
							</Button>
						</Tooltip.Trigger>
						<Tooltip.Content>Sync</Tooltip.Content>
					</Tooltip>
				)}
				<Tooltip delay={0}>
					<Tooltip.Trigger>
						<Button isIconOnly variant="ghost" size="sm" aria-label={t("edit")} onPress={onEdit}>
							<PencilIcon className="size-4" />
						</Button>
					</Tooltip.Trigger>
					<Tooltip.Content>{t("edit")}</Tooltip.Content>
				</Tooltip>
				<Tooltip delay={0}>
					<Tooltip.Trigger>
						<Button isIconOnly variant="ghost" size="sm" className="text-muted hover:text-danger" aria-label={t("delete")} onPress={onDelete}>
							<TrashIcon className="size-4" />
						</Button>
					</Tooltip.Trigger>
					<Tooltip.Content>{t("delete")}</Tooltip.Content>
				</Tooltip>
			</div>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Create Dialog                                                      */
/* ------------------------------------------------------------------ */

function CreateDialog({
	isOpen, agentId, inventoryProviders, isInventoryLoading, onClose,
}: {
	isOpen: boolean;
	agentId: CodingAgentId;
	inventoryProviders: { name: string; display_name: string; api_base_url: string }[];
	isInventoryLoading: boolean;
	onClose: () => void;
}) {
	const { t } = useTranslation();
	const api = useApi();
	const queryClient = useQueryClient();
	const [selectedId, setSelectedId] = useState("");

	const defaultId = inventoryProviders[0]?.name ?? "";
	useEffect(() => {
		if (!isOpen) return;
		setSelectedId((c) => c || defaultId);
	}, [defaultId, isOpen]);

	const createMutation = useMutation({
		mutationFn: () => api.agentProviders.create(agentId, { sourceProviderId: selectedId }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.agentProviders.list(agentId) });
			toast.success(t("providerCreated"));
			onClose();
		},
	});

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (selectedId) createMutation.mutate();
	};

	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
			<Modal.Container>
				<Modal.Dialog className="sm:max-w-[440px]">
					<Modal.CloseTrigger />
					<Modal.Header><Modal.Heading>{t("addProvider")}</Modal.Heading></Modal.Header>
					<form onSubmit={handleSubmit}>
						<Modal.Body className="grid gap-4 p-4">
							{createMutation.error && (
								<div className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
									{createMutation.error instanceof Error ? createMutation.error.message : String(createMutation.error)}
								</div>
							)}
							{isInventoryLoading ? (
								<div className="flex justify-center py-6"><Spinner /></div>
							) : inventoryProviders.length === 0 ? (
								<p className="text-sm text-muted">{t("noProviders")}</p>
							) : (
								<Select className="w-full" selectedKey={selectedId || undefined} onSelectionChange={(key) => { if (key) setSelectedId(String(key)); }} isDisabled={createMutation.isPending} variant="secondary">
									<Label>{t("selectProvider")}</Label>
									<Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
									<Select.Popover>
										<ListBox>
											{inventoryProviders.map((item) => (
												<ListBox.Item key={item.name} id={item.name} textValue={`${item.display_name} ${item.name}`}>
													<div className="grid min-w-0 gap-0.5">
														<Label className="truncate">{item.display_name}</Label>
														<span className="truncate text-xs text-muted">{item.api_base_url}</span>
													</div>
												</ListBox.Item>
											))}
										</ListBox>
									</Select.Popover>
								</Select>
							)}
						</Modal.Body>
						<Modal.Footer>
							<Button type="button" variant="tertiary" onPress={onClose} isDisabled={createMutation.isPending}>{t("cancel")}</Button>
							<Button type="submit" isPending={createMutation.isPending} isDisabled={isInventoryLoading || !inventoryProviders.length || !selectedId}>{t("add")}</Button>
						</Modal.Footer>
					</form>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}

/* ------------------------------------------------------------------ */
/*  Edit Dialog                                                        */
/* ------------------------------------------------------------------ */

function EditDialog({
	isOpen, agentId, provider, onClose,
}: {
	isOpen: boolean;
	agentId: CodingAgentId;
	provider: AgentProviderResponse;
	onClose: () => void;
}) {
	const { t } = useTranslation();
	const api = useApi();
	const queryClient = useQueryClient();
	const [name, setName] = useState(provider.name);
	const [apiKey, setApiKey] = useState("");
	const [nameError, setNameError] = useState<string | null>(null);

	useEffect(() => {
		if (!isOpen) return;
		setName(provider.name);
		setApiKey("");
		setNameError(null);
	}, [isOpen, provider.id, provider.name]);

	const updateMutation = useMutation({
		mutationFn: () => api.agentProviders.update(agentId, provider.id, {
			name: name.trim() === provider.name ? undefined : name.trim(),
			apiKey: apiKey.trim() || undefined,
		}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.agentProviders.list(agentId) });
			toast.success(t("providerUpdated"));
			onClose();
		},
	});

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!name.trim()) { setNameError(t("validationNameRequired")); return; }
		updateMutation.mutate();
	};

	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
			<Modal.Container>
				<Modal.Dialog className="sm:max-w-[440px]">
					<Modal.CloseTrigger />
					<Modal.Header><Modal.Heading>{t("editProvider")}</Modal.Heading></Modal.Header>
					<form onSubmit={handleSubmit}>
						<Modal.Body className="grid gap-4 p-4">
							{updateMutation.error && (
								<div className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
									{updateMutation.error instanceof Error ? updateMutation.error.message : String(updateMutation.error)}
								</div>
							)}
							<TextField className="w-full" isRequired validationBehavior="aria" isInvalid={!!nameError}>
								<Label>{t("providerName")}</Label>
								<Input value={name} onChange={(e) => { setName(e.target.value); if (nameError) setNameError(null); }} placeholder={t("providerNamePlaceholder")} variant="secondary" />
								{nameError && <FieldError>{nameError}</FieldError>}
							</TextField>
							<TextField className="w-full">
								<Label>{t("providerApiKey")}</Label>
								<Input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder={t("providerApiKeyPlaceholder")} variant="secondary" />
							</TextField>
						</Modal.Body>
						<Modal.Footer>
							<Button type="button" variant="tertiary" onPress={onClose} isDisabled={updateMutation.isPending}>{t("cancel")}</Button>
							<Button type="submit" isPending={updateMutation.isPending}>{t("save")}</Button>
						</Modal.Footer>
					</form>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}
