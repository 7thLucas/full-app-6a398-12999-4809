import { Router } from "express";
import {
  getTranscribeAsset,
  getTranscribeStatus,
  handleAudioAnalyzerError,
  pingAudioAnalyzer,
  postTranscribe,
  transcribeUpload,
} from "../controllers/audio-analyzer.controller";

const router = Router();

router.get("/audio-analyzer/ping", async (req, res) => {
  try {
    return await pingAudioAnalyzer(req, res);
  } catch (error) {
    return handleAudioAnalyzerError(res, error, "Audio analyzer ping failed");
  }
});

router.post("/audio-analyzer/transcribe", transcribeUpload, async (req, res) => {
  try {
    return await postTranscribe(req, res);
  } catch (error) {
    return handleAudioAnalyzerError(res, error, "Audio analyzer transcribe failed");
  }
});

router.get("/audio-analyzer/transcribe/:ticketId", async (req, res) => {
  try {
    return await getTranscribeStatus(req, res);
  } catch (error) {
    return handleAudioAnalyzerError(res, error, "Audio analyzer track failed");
  }
});

router.get("/audio-analyzer/assets/:ticketId/:filename", async (req, res) => {
  try {
    return await getTranscribeAsset(req, res);
  } catch (error) {
    return handleAudioAnalyzerError(res, error, "Audio analyzer asset failed");
  }
});

export default router;
