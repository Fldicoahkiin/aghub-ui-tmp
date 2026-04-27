import { Spinner, Toast } from "@heroui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/react";
import { Suspense, useEffect, useState } from "react";
import { useKeyBindings } from "rooks";
import { Route, Router, Switch, useLocation } from "wouter";

import { Redirect } from "./components/redirect";
import { ErrorBoundary } from "./components/ui/error-boundary";
import { useSidebarNavigation } from "./hooks/use-sidebar-navigation";
import { MainLayout } from "./layouts/main-layout";
import { initStore } from "./lib/store";
import CodingAgentsPage from "./pages/coding-agents";
import InferenceProvidersPage from "./pages/inference-providers";
import PluginsPage from "./pages/plugins";
import ProjectDetailPage from "./pages/project/detail";
import SettingsPage from "./pages/settings";
import CustomAgentsPage from "./pages/settings/custom-agents";
import MCPServersPage from "./pages/settings/mcp-servers";
import SkillsPage from "./pages/settings/skills";
import SubAgentsPage from "./pages/settings/sub-agents";
import SkillsShPage from "./pages/skills-sh";
import SkillsSearchPage from "./pages/skills-sh/search";
import { AgentAvailabilityProvider } from "./providers/agent-availability";
import { ServerProvider } from "./providers/server";
import { ThemeProvider } from "./providers/theme";
import "./lib/i18n";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: 1,
			refetchOnWindowFocus: false,
		},
	},
});

function SkillsPageSkeleton() {
	return (
		<div className="flex h-full">
			<div className="flex w-80 shrink-0 items-center justify-center border-r border-border">
				<Spinner />
			</div>
			<div className="flex-1" />
		</div>
	);
}

function DefaultSidebarRoute() {
	const { defaultHref, isLoading } = useSidebarNavigation();
	if (isLoading) return null;
	return <Redirect to={defaultHref} />;
}

function RouteWithLayout({ children }: { children: React.ReactNode }) {
	return (
		<MainLayout>
			<ErrorBoundary>
				<Suspense fallback={<SkillsPageSkeleton />}>
					{children}
				</Suspense>
			</ErrorBoundary>
		</MainLayout>
	);
}

function App() {
	const [isStoreReady, setIsStoreReady] = useState(false);
	const [, setLocation] = useLocation();

	useEffect(() => {
		initStore()
			.then(() => setIsStoreReady(true))
			.catch((err) => {
				console.error("Failed to initialize store:", err);
				setIsStoreReady(true);
			});
	}, []);

	useKeyBindings({
		",": (event) => {
			if (event.metaKey && !event.ctrlKey && !event.altKey) {
				event.preventDefault();
				setLocation("/settings");
			}
		},
	});

	if (!isStoreReady) {
		return (
			<div className="flex h-screen items-center justify-center">
				<Spinner size="lg" />
			</div>
		);
	}

	return (
		<QueryClientProvider client={queryClient}>
			<Toast.Provider placement="bottom end" />
			<ThemeProvider>
				<ServerProvider>
					<AgentAvailabilityProvider>
						<NuqsAdapter>
							<Router>
								<Switch>
									<Route path="/">
										<DefaultSidebarRoute />
									</Route>
									<Route path="/inference-providers">
										<RouteWithLayout>
											<InferenceProvidersPage />
										</RouteWithLayout>
									</Route>
									<Route path="/coding-agents">
										<RouteWithLayout>
											<CodingAgentsPage />
										</RouteWithLayout>
									</Route>
									<Route path="/mcp">
										<RouteWithLayout>
											<MCPServersPage />
										</RouteWithLayout>
									</Route>
									<Route path="/skills">
										<RouteWithLayout>
											<SkillsPage />
										</RouteWithLayout>
									</Route>
									<Route path="/skills-sh/search">
										<RouteWithLayout>
											<SkillsSearchPage />
										</RouteWithLayout>
									</Route>
									<Route path="/skills-sh">
										<RouteWithLayout>
											<SkillsShPage />
										</RouteWithLayout>
									</Route>
									<Route path="/plugins">
										<RouteWithLayout>
											<PluginsPage />
										</RouteWithLayout>
									</Route>
									<Route path="/sub-agents">
										<RouteWithLayout>
											<SubAgentsPage />
										</RouteWithLayout>
									</Route>
									<Route path="/settings">
										<MainLayout>
											<SettingsPage />
										</MainLayout>
									</Route>
									<Route path="/settings/custom-agents">
										<MainLayout>
											<CustomAgentsPage />
										</MainLayout>
									</Route>
									<Route path="/projects/:id">
										<MainLayout>
											<ProjectDetailPage />
										</MainLayout>
									</Route>
									<Route>
										<DefaultSidebarRoute />
									</Route>
								</Switch>
							</Router>
						</NuqsAdapter>
					</AgentAvailabilityProvider>
				</ServerProvider>
			</ThemeProvider>
		</QueryClientProvider>
	);
}

export default App;
