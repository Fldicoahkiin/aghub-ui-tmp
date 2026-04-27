import { queryOptions } from "@tanstack/react-query";
import type { ApiClient } from "./client";
import { queryKeys } from "./keys";

interface AgentProvidersQueryParams {
	api: ApiClient;
	agentId: string;
}

export function agentProvidersListQueryOptions({
	api,
	agentId,
}: AgentProvidersQueryParams) {
	return queryOptions({
		queryKey: queryKeys.agentProviders.list(agentId),
		queryFn: () => api.agentProviders.list(agentId),
		enabled: !!agentId,
	});
}
