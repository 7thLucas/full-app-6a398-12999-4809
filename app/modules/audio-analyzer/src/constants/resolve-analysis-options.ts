import type { TranscriptionAnalysisOptions } from "../libs/types";
import { defaultAnalysisOptions } from "./default-analysis-options";

/**
 * Builds analysis options for a transcribe request.
 *
 * @param override - Optional JSON string or object sent by the client (e.g. `analysis_options` form field).
 * @param base     - Base options to merge into. Defaults to {@link defaultAnalysisOptions}.
 *                   Pass the result of `fetchKeyspaceAnalysisOptions()` to use the remote keyspace config.
 */
export function resolveAnalysisOptions(
  override?: string | TranscriptionAnalysisOptions,
  base: TranscriptionAnalysisOptions = defaultAnalysisOptions,
): TranscriptionAnalysisOptions {
  if (!override) {
    return base;
  }

  try {
    const parsed =
      typeof override === "string"
        ? (JSON.parse(override) as TranscriptionAnalysisOptions)
        : override;

    return {
      ...base,
      ...parsed,
      role_display: {
        ...base.role_display,
        ...parsed.role_display,
      },
      chunking: {
        ...base.chunking,
        ...parsed.chunking,
      },
      pass_settings: {
        ...base.pass_settings,
        ...parsed.pass_settings,
      },
    };
  } catch {
    return base;
  }
}
