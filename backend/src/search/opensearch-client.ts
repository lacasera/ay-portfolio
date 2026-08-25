import { Client } from "@opensearch-project/opensearch";

interface RequestParams {
  method: string;
  path: string;
  body?: unknown;
}

interface MlTask {
  state?: string;
  model_id?: string;
  error?: string;
}

const TASK_POLL_INTERVAL_MS = 3000;
const TASK_MAX_ATTEMPTS = 120;

export class OpenSearchClient {
  readonly client: Client;

  constructor() {
    const node = process.env.OPENSEARCH_NODE;
    if (!node) {
      throw new Error("OPENSEARCH_NODE is not set");
    }
    this.client = new Client({
      node,
      auth: {
        username: process.env.OPENSEARCH_USERNAME ?? "admin",
        password: process.env.OPENSEARCH_PASSWORD ?? "",
      },
      ssl: { rejectUnauthorized: false },
      requestTimeout: 120000,
    });
  }

  async request<T = unknown>(params: RequestParams): Promise<T> {
    const response = await this.client.transport.request({
      method: params.method,
      path: params.path,
      body: params.body as Record<string, unknown> | undefined,
    });
    return response.body as T;
  }

  async waitForTask(taskId: string): Promise<MlTask> {
    for (let attempt = 0; attempt < TASK_MAX_ATTEMPTS; attempt++) {
      const task = await this.request<MlTask>({
        method: "GET",
        path: `/_plugins/_ml/tasks/${taskId}`,
      });
      if (task.state === "COMPLETED") return task;
      if (task.state === "FAILED") {
        throw new Error(`ML task ${taskId} failed: ${task.error ?? "unknown"}`);
      }
      await this.sleep(TASK_POLL_INTERVAL_MS);
    }
    throw new Error(`ML task ${taskId} did not complete in time`);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
