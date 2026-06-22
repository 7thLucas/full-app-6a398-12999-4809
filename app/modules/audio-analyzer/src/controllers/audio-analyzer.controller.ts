import type { Request, Response } from "express";
import multer from "multer";
import { resolveAnalysisOptions } from "../constants/resolve-analysis-options";
import { audioAnalyzer, AudioAnalyzerError } from "../libs/audio-analyzer";
import {
  fetchKeyspaceAnalysisOptions,
  resolveProductIdentity,
} from "../libs/keyspace-config";
import type { TranscribeFileInput } from "../libs/types";

export const transcribeUpload = multer({
  storage: multer.memoryStorage(),
}).array("files");

function routeParam(value: string | string[] | undefined): string {
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return "";
}

function requestHeader(req: Request, name: string): string | undefined {
  const value = req.header(name);
  return typeof value === "string" ? value : undefined;
}

export async function pingAudioAnalyzer(_req: Request, res: Response) {
  const envelope = await audioAnalyzer.ping();
  return res.json({ ok: true, upstream: envelope.result });
}

export async function postTranscribe(req: Request, res: Response) {
  const files = (req.files ?? []) as Express.Multer.File[];

  if (files.length === 0) {
    return res.status(400).json({
      ok: false,
      message: "At least one file is required (form field: files)",
    });
  }

  const keyspaceOptions = await fetchKeyspaceAnalysisOptions();
  const analysisOptions = resolveAnalysisOptions(
    req.body?.analysis_options as string | undefined,
    keyspaceOptions,
  );

  const inputs: TranscribeFileInput[] = files.map((file) => ({
    filename: file.originalname,
    data: file.buffer,
    mimeType: file.mimetype,
  }));

  const { product_keyspace, product_default_user_id, dashboard_api_url } =
    resolveProductIdentity({
      product_keyspace: requestHeader(req, "x-product-keyspace"),
      product_default_user_id: requestHeader(req, "x-product-default-user-id"),
      dashboard_api_url: requestHeader(req, "x-dashboard-api-url"),
    });

  const envelope = await audioAnalyzer.transcribe(inputs, {
    analysis_options: analysisOptions,
    product_keyspace,
    product_default_user_id,
    dashboard_api_url,
  });

  return res.json(envelope);
}

export async function getTranscribeStatus(req: Request, res: Response) {
  const ticketId = routeParam(req.params.ticketId);
  const envelope = await audioAnalyzer.trackTranscribe(ticketId);
  return res.json(envelope);
}

export async function getTranscribeAsset(req: Request, res: Response) {
  const ticketId = routeParam(req.params.ticketId);
  const filename = routeParam(req.params.filename);
  const asset = await audioAnalyzer.getAsset(ticketId, filename);

  if (asset.contentType) {
    res.setHeader("Content-Type", asset.contentType);
  }
  if (asset.contentLength) {
    res.setHeader("Content-Length", asset.contentLength);
  }

  req.on("close", () => {
    if (!res.writableEnded) {
      asset.stream.destroy();
    }
  });

  asset.stream.on("error", (error) => {
    if (!res.headersSent) {
      throw error;
    }
    res.destroy();
  });

  asset.stream.pipe(res);
}

export function handleAudioAnalyzerError(
  res: Response,
  error: unknown,
  context: string,
) {
  if (error instanceof AudioAnalyzerError) {
    return res.status(error.status >= 400 ? error.status : 502).json({
      ok: false,
      message: error.message,
      detail: error.body,
    });
  }

  console.error(`${context}:`, error);
  return res.status(502).json({
    ok: false,
    message: "Audio analyzer service unavailable",
  });
}
