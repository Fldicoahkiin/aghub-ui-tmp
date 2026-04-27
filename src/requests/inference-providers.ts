import { queryOptions } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import type { ApiClient } from "./client";
import { queryKeys } from "./keys";

interface InferenceProviderQueryParams {
	api: ApiClient;
}

export function inferenceProviderListQueryOptions({ api }: InferenceProviderQueryParams) {
	return queryOptions({
		queryKey: queryKeys.providers.list(),
		queryFn: () => api.inferenceProviders.list(),
	});
}

interface MutationParams {
	api: ApiClient;
	queryClient: QueryClient;
	onSuccess?: () => Promise<void> | void;
}

export function createInferenceProviderMutationOptions({ api, queryClient }: MutationParams) {
	return {
		mutationFn: (data: Parameters<typeof api.inferenceProviders.create>[0]) =>
			api.inferenceProviders.create(data),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: queryKeys.providers.all() });
		},
	};
}

export function updateInferenceProviderMutationOptions({ api, queryClient }: MutationParams) {
	return {
		mutationFn: (data: Parameters<typeof api.inferenceProviders.update>[0]) =>
			api.inferenceProviders.update(data),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: queryKeys.providers.all() });
		},
	};
}

export function deleteInferenceProviderMutationOptions({ api, queryClient, onSuccess }: MutationParams) {
	return {
		mutationFn: (name: string) => api.inferenceProviders.delete(name),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: queryKeys.providers.all() });
			await onSuccess?.();
		},
	};
}
