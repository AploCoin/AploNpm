/**
 * HTTP Provider for JSON-RPC communication
 */

import type { Provider, ProviderConfig, JsonRpcRequest, JsonRpcResponse } from './types.js';
import { ProviderError, TimeoutError } from './errors.js';

/**
 * HTTP Provider implementation using fetch API
 */
export class HttpProvider implements Provider {
  private url: string;
  private timeout: number;
  private headers: Record<string, string>;
  private requestId: number = 0;

  constructor(config: ProviderConfig) {
    this.url = config.url;
    this.timeout = config.timeout ?? 30000;
    this.headers = {
      'Content-Type': 'application/json',
      ...config.headers,
    };
  }

  async request<T = unknown>(method: string, params?: unknown[]): Promise<T> {
    this.requestId++;

    const body: JsonRpcRequest = {
      jsonrpc: '2.0',
      id: this.requestId,
      method,
      params,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(this.url, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new ProviderError(
          `HTTP error: ${response.status} ${response.statusText}`,
          response.status
        );
      }

      const data = await response.json() as JsonRpcResponse<T>;

      if (data.error) {
        throw new ProviderError(
          data.error.message,
          data.error.code,
          data.error.data
        );
      }

      return data.result as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof ProviderError) {
        throw error;
      }

      if ((error as Error).name === 'AbortError') {
        throw new TimeoutError(this.timeout);
      }

      throw new ProviderError(
        `Request failed: ${(error as Error).message}`
      );
    }
  }
}
