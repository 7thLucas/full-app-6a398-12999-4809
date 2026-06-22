import { defaultAnalysisOptions } from "../constants/default-analysis-options";
import type { TranscriptionAnalysisOptions } from "./types";

const CONFIGS_BASE_URL =
  "https://micro-audio-analyzer.quantumbyte.ai/api/configs";

interface KeyspaceConfigResponse {
  configuration: TranscriptionAnalysisOptions;
}

export type ProductIdentity = {
  product_keyspace?: string;
  product_default_user_id?: string;
  dashboard_api_url?: string;
};

function firstNonEmpty(...values: Array<string | undefined>): string | undefined {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) {
      return trimmed;
    }
  }
  return undefined;
}

/**
 * Resolves product identity for upstream cost tracking.
 * Request/header overrides win over host process env (`_KEYSPACE`, `_USER_ID`,
 * `_DASHBOARD_API_URL`, legacy `_MANAGEMENT_API_URL`).
 */
export function resolveProductIdentity(overrides?: Partial<ProductIdentity>): ProductIdentity {
  return {
    product_keyspace: firstNonEmpty(
      overrides?.product_keyspace,
      process.env._KEYSPACE,
    ),
    product_default_user_id: firstNonEmpty(
      overrides?.product_default_user_id,
      process.env._USER_ID,
    ),
    dashboard_api_url: firstNonEmpty(
      overrides?.dashboard_api_url,
      process.env.DASHBOARD_API_URL,
      process.env.MANAGEMENT_API_URL,
    ),
  };
}

/**
 * Fetches analysis options from the remote keyspace config API.
 * Falls back to {@link defaultAnalysisOptions} when the keyspace is not
 * configured, the record is not found (404), or the request fails.
 */

export async function fetchKeyspaceAnalysisOptions(): Promise<TranscriptionAnalysisOptions> {
  const keyspace = process.env._KEYSPACE;

  if (!keyspace) {
    return defaultAnalysisOptions;
  }

  try {
    const res = await fetch(`${CONFIGS_BASE_URL}/${encodeURIComponent(keyspace)}`);

    if (res.status === 404) {
      return defaultAnalysisOptions;
    }

    if (!res.ok) {
      console.warn(
        `[keyspace-config] Fetch failed (HTTP ${res.status}) — falling back to defaults`,
      );
      return defaultAnalysisOptions;
    }

    const data = (await res.json()) as KeyspaceConfigResponse;
    return data.configuration ?? defaultAnalysisOptions;
  } catch (err) {
    console.warn(
      "[keyspace-config] Request error — falling back to defaults:",
      err,
    );
    return defaultAnalysisOptions;
  }
}
