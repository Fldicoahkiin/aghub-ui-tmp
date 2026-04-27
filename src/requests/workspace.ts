import { queryOptions } from "@tanstack/react-query";
import type { ApiClient } from "./client";
import { queryKeys } from "./keys";

interface WorkspaceQueryParams {
	api: ApiClient;
}

export function workspaceAgentFilesQueryOptions({
	api,
	agentId,
}: WorkspaceQueryParams & { agentId: string }) {
	return queryOptions({
		queryKey: queryKeys.workspace.agentFiles(agentId),
		queryFn: () => api.workspace.getAgentFiles(agentId),
	});
}

export function workspaceFileContentQueryOptions({
	api,
	agentId,
	path,
}: WorkspaceQueryParams & { agentId: string; path: string }) {
	return queryOptions({
		queryKey: queryKeys.workspace.fileContent(agentId, path),
		queryFn: () => api.workspace.getFileContent(agentId, path),
	});
}
