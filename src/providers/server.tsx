import type { ServerProviderProps } from "../contexts/server";
import { ServerContext } from "../contexts/server";

export function ServerProvider({ children }: ServerProviderProps) {
	return (
		<ServerContext value={{ port: 3000, baseUrl: "http://localhost:3000/api/v1" }}>
			{children}
		</ServerContext>
	);
}
