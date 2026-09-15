import {
	Client,
	type ClientConfig,
	type HttpAdapter,
} from "@agent-message-sdk/core";

export const nodeAdapter: HttpAdapter = {
	url: "https://api.anthropic.com/v1/messages",
	headers: [
		["X-Api-Key", process.env?.ANTHROPIC_API_KEY ?? ""],
		["anthropic-version", "2023-06-01"],
		["Content-Type", "application/json"],
	],
};

type NodeClientConfig = Omit<ClientConfig, "httpAdapter">;

export const createNodeClient = (clientConfig: NodeClientConfig) => {
	return new Client({ httpAdapter: nodeAdapter, ...clientConfig });
};
