import React, { useState, useEffect, useRef, useCallback } from "react";
import { aiAssistantAPI } from "../../services/api";
import Tesseract from "tesseract.js";

// --- Types ---
interface TranscriptionRecord {
  _id: string;
  type: "audio" | "image";
  title: string;
  transcriptionText: string;
  extractedText: string;
  aiSummary: string;
  audioDuration: number;
  imageUrl: string;
  originalFileName: string;
  patientName: string;
  wordCount: number;
  status: string;
  createdAt: string;
}

interface Stats {
  audioTranscriptions: number;
  imageScans: number;
  thisWeekCount: number;
  totalWordsProcessed: number;
}

// ============================================================
// COMPONENT
// ============================================================
const AiAssistantView: React.FC = () => {
  // --- Stats ---
  const [stats, setStats] = useState<Stats>({
    audioTranscriptions: 0,
    imageScans: 0,
    thisWeekCount: 0,
    totalWordsProcessed: 0,
  });

  // --- Audio Transcription State ---
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioTitle, setAudioTitle] = useState("");
  const [audioPatient, setAudioPatient] = useState("");
  const [savingAudio, setSavingAudio] = useState(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);

  // --- Image OCR State ---
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [ocrText, setOcrText] = useState("");
  const [ocrProgress, setOcrProgress] = useState(0);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [savingImage, setSavingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // --- PDF State ---
  const [selectedPDF, setSelectedPDF] = useState<File | null>(null);
  const [isProcessingPDF, setIsProcessingPDF] = useState(false);
  const [savingPDF, setSavingPDF] = useState(false);

  // --- History ---
  const [audioHistory, setAudioHistory] = useState<TranscriptionRecord[]>([]);
  const [imageHistory, setImageHistory] = useState<TranscriptionRecord[]>([]);
  const [audioPage, setAudioPage] = useState(1);
  const [audioTotalPages, setAudioTotalPages] = useState(1);
  const [imagePage, setImagePage] = useState(1);
  const [imageTotalPages, setImageTotalPages] = useState(1);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [loadingImages, setLoadingImages] = useState(false);

  // --- Expanded transcript ---
  const [expandedTranscript, setExpandedTranscript] = useState<string | null>(
    null,
  );
  // --- Expanded summary ---
  const [expandedSummary, setExpandedSummary] = useState<string | null>(null);
  // --- Regenerating summary ---
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  // --- Refs ---
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ============================================================
  // LOAD DATA
  // ============================================================
  const loadStats = useCallback(async () => {
    try {
      const data = await aiAssistantAPI.getStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to load AI stats:", err);
    }
  }, []);

  const loadAudioHistory = useCallback(async (page = 1) => {
    setLoadingAudio(true);
    try {
      const data = await aiAssistantAPI.getTranscriptions(page, 5, "audio");
      setAudioHistory(data.records);
      setAudioPage(data.currentPage);
      setAudioTotalPages(data.totalPages);
    } catch (err) {
      console.error("Failed to load audio history:", err);
    } finally {
      setLoadingAudio(false);
    }
  }, []);

  const loadImageHistory = useCallback(async (page = 1) => {
    setLoadingImages(true);
    try {
      const data = await aiAssistantAPI.getTranscriptions(page, 5, "image");
      setImageHistory(data.records);
      setImagePage(data.currentPage);
      setImageTotalPages(data.totalPages);
    } catch (err) {
      console.error("Failed to load image history:", err);
    } finally {
      setLoadingImages(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
    loadAudioHistory(1);
    loadImageHistory(1);
  }, [loadStats, loadAudioHistory, loadImageHistory]);

  // ============================================================
  // AUDIO — MediaRecorder + Groq Whisper (server-side)
  // ============================================================
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // collect chunks every second
      setIsRecording(true);
      setIsPaused(false);
      setAudioBlob(null);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Failed to start recording:", err);
      alert(
        "Could not access microphone. Please allow microphone access and try again.",
      );
    }
  };

  const pauseRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const resumeRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "paused"
    ) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
    setIsPaused(false);
  };

  const resetRecording = () => {
    stopRecording();
    setAudioBlob(null);
    setRecordingTime(0);
    setAudioTitle("");
    setAudioPatient("");
  };

  const saveAudioTranscription = async () => {
    if (!audioBlob) return;
    setSavingAudio(true);
    setIsProcessingAudio(true);
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "consultation.webm");
      formData.append("title", audioTitle || "Audio Consultation");
      formData.append("patientName", audioPatient);
      formData.append("audioDuration", String(recordingTime));

      await aiAssistantAPI.uploadAudioConsultation(formData);
      resetRecording();
      loadStats();
      loadAudioHistory(1);
    } catch (err) {
      console.error("Failed to process consultation:", err);
      alert("Failed to process audio consultation. Please try again.");
    } finally {
      setSavingAudio(false);
      setIsProcessingAudio(false);
    }
  };

  // ============================================================
  // IMAGE — Tesseract.js OCR
  // ============================================================
  const handleImageSelect = (file: File) => {
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
    setOcrText("");
    setOcrProgress(0);
    // Clear any PDF state
    setSelectedPDF(null);
  };

  const handlePDFSelect = (file: File) => {
    setSelectedPDF(file);
    // Clear any image state
    setSelectedImage(null);
    setImagePreview("");
    setOcrText("");
    setOcrProgress(0);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === "application/pdf") {
        handlePDFSelect(file);
      } else {
        handleImageSelect(file);
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf") {
        handlePDFSelect(file);
      } else if (file.type.startsWith("image/")) {
        handleImageSelect(file);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const processOCR = async () => {
    if (!selectedImage) return;
    setIsProcessingOCR(true);
    setOcrProgress(0);

    try {
      const result = await Tesseract.recognize(selectedImage, "eng", {
        logger: (m: any) => {
          if (m.status === "recognizing text") {
            setOcrProgress(Math.round(m.progress * 100));
          }
        },
      });
      setOcrText(result.data.text);
    } catch (err) {
      console.error("OCR failed:", err);
      alert("OCR processing failed. Please try again.");
    } finally {
      setIsProcessingOCR(false);
    }
  };

  const saveImageOCR = async () => {
    if (!ocrText.trim() || !selectedImage) return;
    setSavingImage(true);
    try {
      const formData = new FormData();
      formData.append("image", selectedImage);
      formData.append("extractedText", ocrText.trim());
      formData.append("title", selectedImage.name);
      formData.append(
        "wordCount",
        String(ocrText.trim().split(/\s+/).filter(Boolean).length),
      );
      await aiAssistantAPI.uploadImageOCR(formData);
      setSelectedImage(null);
      setImagePreview("");
      setOcrText("");
      setOcrProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
      loadStats();
      loadImageHistory(1);
    } catch (err) {
      console.error("Failed to save OCR:", err);
      alert("Failed to save OCR result");
    } finally {
      setSavingImage(false);
    }
  };

  const resetImage = () => {
    setSelectedImage(null);
    setImagePreview("");
    setOcrText("");
    setOcrProgress(0);
    setSelectedPDF(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ============================================================
  // PDF — Server-side text extraction
  // ============================================================
  const savePDF = async () => {
    if (!selectedPDF) return;
    setSavingPDF(true);
    setIsProcessingPDF(true);
    try {
      const formData = new FormData();
      formData.append("pdf", selectedPDF);
      formData.append("title", selectedPDF.name);
      await aiAssistantAPI.uploadPDF(formData);
      // Reset after success
      setTimeout(() => {
        setSelectedPDF(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        loadStats();
        loadImageHistory(1);
      }, 500);
    } catch (err: any) {
      console.error("Failed to process PDF:", err);
      alert(err?.response?.data?.message || "Failed to process PDF");
    } finally {
      setSavingPDF(false);
      setIsProcessingPDF(false);
    }
  };

  // ============================================================
  // ACTIONS
  // ============================================================
  const handleDelete = async (id: string, type: "audio" | "image") => {
    if (!window.confirm("Delete this record?")) return;
    try {
      await aiAssistantAPI.deleteTranscription(id);
      loadStats();
      if (type === "audio") loadAudioHistory(audioPage);
      else loadImageHistory(imagePage);
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  const handleRegenerateSummary = async (id: string) => {
    setRegeneratingId(id);
    try {
      const updated = await aiAssistantAPI.regenerateSummary(id);
      // Update in local state
      setAudioHistory((prev) =>
        prev.map((r) =>
          r._id === id ? { ...r, aiSummary: updated.aiSummary } : r,
        ),
      );
      setImageHistory((prev) =>
        prev.map((r) =>
          r._id === id ? { ...r, aiSummary: updated.aiSummary } : r,
        ),
      );
    } catch (err) {
      console.error("Failed to regenerate summary:", err);
      alert("Failed to regenerate summary");
    } finally {
      setRegeneratingId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const exportAsText = (record: TranscriptionRecord) => {
    const content =
      record.type === "audio"
        ? `Title: ${record.title}\nPatient: ${record.patientName || "N/A"}\nDate: ${formatDate(record.createdAt)}\nDuration: ${formatTime(record.audioDuration)}\n\n--- AI Summary ---\n${record.aiSummary || "N/A"}\n\n--- Full Transcript ---\n${record.transcriptionText}`
        : `Title: ${record.title}\nFile: ${record.originalFileName}\nDate: ${formatDate(record.createdAt)}\n\n--- AI Summary ---\n${record.aiSummary || "N/A"}\n\n--- Extracted Text ---\n${record.extractedText}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${record.title || record._id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ============================================================
  // HELPERS
  // ============================================================
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="ai-assistant-view">
      {/* ── STATS ── */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3">
          <div className="ai-stat-card-v2 border-start-green">
            <p className="ai-stat-label-v2 mb-1">Total Transcriptions</p>
            <p className="ai-stat-value-v2 mb-0">{stats.audioTranscriptions}</p>
            <p className="ai-stat-sub text-success mb-0">All time</p>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="ai-stat-card-v2 border-start-blue">
            <p className="ai-stat-label-v2 mb-1">This Week</p>
            <p className="ai-stat-value-v2 mb-0">{stats.thisWeekCount}</p>
            <p className="ai-stat-sub text-primary mb-0">Audio + Image</p>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="ai-stat-card-v2 border-start-purple">
            <p className="ai-stat-label-v2 mb-1">Images Processed</p>
            <p className="ai-stat-value-v2 mb-0">{stats.imageScans}</p>
            <p className="ai-stat-sub text-purple mb-0">Text extracted</p>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="ai-stat-card-v2 border-start-emerald">
            <p className="ai-stat-label-v2 mb-1">Words Processed</p>
            <p className="ai-stat-value-v2 mb-0">
              {stats.totalWordsProcessed.toLocaleString()}
            </p>
            <p className="ai-stat-sub text-success mb-0">Fast &amp; accurate</p>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT: 2/3 audio + 1/3 image ── */}
      <div className="row g-4">
        {/* ──────────────────────────────────────────── */}
        {/* LEFT COLUMN — AUDIO (col-lg-8)              */}
        {/* ──────────────────────────────────────────── */}
        <div className="col-lg-8">
          <div className="ai-card mb-4">
            {/* Recorder header */}
            <div className="ai-card-header">
              <i className="bi bi-mic-fill text-success me-2"></i>
              Audio Consultation Recorder
            </div>

            {/* Recorder body */}
            <div className="ai-card-body">
              <div className="ai-recorder-zone text-center">
                {/* Recording indicator */}
                {isRecording && (
                  <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
                    <span className="ai-pulse-dot"></span>
                    <span className="small fw-medium text-danger">
                      Recording in progress...
                    </span>
                  </div>
                )}

                {/* Timer */}
                <div className="ai-big-timer">{formatTime(recordingTime)}</div>

                {/* Buttons */}
                <div className="d-flex justify-content-center gap-3 mb-3 mt-3">
                  {!isRecording ? (
                    <button
                      className="btn btn-success btn-lg rounded-pill px-4"
                      onClick={startRecording}
                      disabled={savingAudio}
                    >
                      <i className="bi bi-mic-fill me-2"></i>
                      Start Recording
                    </button>
                  ) : (
                    <>
                      {isPaused ? (
                        <button
                          className="btn btn-warning rounded-pill px-3"
                          onClick={resumeRecording}
                        >
                          <i className="bi bi-play-fill me-1"></i> Resume
                        </button>
                      ) : (
                        <button
                          className="btn btn-warning rounded-pill px-3"
                          onClick={pauseRecording}
                        >
                          <i className="bi bi-pause-fill me-1"></i> Pause
                        </button>
                      )}
                      <button
                        className="btn btn-danger rounded-pill px-3"
                        onClick={stopRecording}
                      >
                        <i className="bi bi-stop-fill me-1"></i> Stop
                      </button>
                    </>
                  )}
                </div>

                {/* Saving spinner */}
                {isProcessingAudio && (
                  <div className="d-flex align-items-center justify-content-center gap-2 text-muted small mb-2">
                    <span className="spinner-border spinner-border-sm"></span>
                    Groq AI is transcribing and summarizing your consultation...
                  </div>
                )}

                <p className="text-muted small mb-0">
                  Click to start recording your consultation. Once stopped, the
                  audio will be sent to Groq Whisper for transcription and Llama
                  3.3 for summarization.
                </p>
              </div>

              {/* Audio recorded — ready to upload */}
              {audioBlob && !isRecording && (
                <div className="mt-3">
                  <div className="d-flex gap-2 mb-2">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Title (optional)"
                      value={audioTitle}
                      onChange={(e) => setAudioTitle(e.target.value)}
                    />
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Patient name (optional)"
                      value={audioPatient}
                      onChange={(e) => setAudioPatient(e.target.value)}
                    />
                  </div>

                  <div className="ai-live-transcript">
                    <div className="d-flex align-items-center gap-2">
                      <i className="bi bi-check-circle-fill text-success"></i>
                      <span className="fw-medium">
                        Audio recorded ({formatTime(recordingTime)})
                      </span>
                      <span className="text-muted small">
                        — {(audioBlob.size / 1024).toFixed(0)} KB
                      </span>
                    </div>
                    <p className="text-muted small mt-1 mb-0">
                      Click "Transcribe & Summarize" to send to Groq AI for
                      processing.
                    </p>
                  </div>

                  <div className="d-flex gap-2 mt-2">
                    <button
                      className="btn btn-success btn-sm flex-grow-1"
                      disabled={savingAudio}
                      onClick={saveAudioTranscription}
                    >
                      {savingAudio ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-1"></span>
                          Transcribing & Summarizing...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-stars me-1"></i> Transcribe &
                          Summarize
                        </>
                      )}
                    </button>
                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={resetRecording}
                      disabled={savingAudio}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Recent Transcriptions ── */}
          <div className="ai-card">
            <div className="ai-card-header">
              <i className="bi bi-file-earmark-text me-2"></i>
              Recent Transcriptions
            </div>
            <div className="ai-card-body p-0">
              {loadingAudio ? (
                <div className="text-center py-4">
                  <span className="spinner-border spinner-border-sm text-success me-2"></span>
                  Loading...
                </div>
              ) : audioHistory.length === 0 ? (
                <div className="text-center text-muted py-5">
                  <i
                    className="bi bi-mic d-block mb-2"
                    style={{ fontSize: "2rem" }}
                  ></i>
                  No transcriptions yet. Start recording!
                </div>
              ) : (
                <div>
                  {audioHistory.map((item) => (
                    <div key={item._id} className="ai-consult-item">
                      {/* Header row */}
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <i className="bi bi-file-earmark-text text-success"></i>
                            <span className="fw-semibold small">
                              {item.title}
                            </span>
                            <span className="badge bg-light text-muted border">
                              <i className="bi bi-clock me-1"></i>
                              {formatTime(item.audioDuration)}
                            </span>
                          </div>
                          <p className="text-muted small mb-0">
                            {formatDate(item.createdAt)}
                          </p>
                        </div>
                        <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25">
                          <i className="bi bi-check-circle me-1"></i>
                          {item.status}
                        </span>
                      </div>

                      {/* Patient info */}
                      {item.patientName && (
                        <div className="small mb-2">
                          <span className="text-muted">Patient:</span>{" "}
                          {item.patientName}
                        </div>
                      )}

                      {/* AI Summary — Sticky Note */}
                      {item.aiSummary && (
                        <div className="ai-sticky-note mb-3">
                          <div className="ai-sticky-note-pin"></div>
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="ai-sticky-note-label">
                              <i className="bi bi-stars me-1"></i>AI Summary
                            </span>
                            <div className="d-flex gap-2 align-items-center">
                              <button
                                className="btn btn-link btn-sm p-0 text-primary"
                                onClick={() =>
                                  setExpandedSummary(
                                    expandedSummary === item._id
                                      ? null
                                      : item._id,
                                  )
                                }
                                title={
                                  expandedSummary === item._id
                                    ? "Collapse"
                                    : "View full summary"
                                }
                              >
                                <i
                                  className={`bi ${expandedSummary === item._id ? "bi-chevron-up" : "bi-eye"}`}
                                ></i>
                              </button>
                              <button
                                className="btn btn-link btn-sm p-0 text-success"
                                onClick={() =>
                                  handleRegenerateSummary(item._id)
                                }
                                disabled={regeneratingId === item._id}
                                title="Regenerate summary"
                              >
                                {regeneratingId === item._id ? (
                                  <span className="spinner-border spinner-border-sm"></span>
                                ) : (
                                  <i className="bi bi-arrow-clockwise"></i>
                                )}
                              </button>
                            </div>
                          </div>
                          <p
                            className="mb-0 small"
                            style={{ whiteSpace: "pre-wrap" }}
                          >
                            {expandedSummary === item._id
                              ? item.aiSummary
                              : item.aiSummary.length > 150
                                ? item.aiSummary.slice(0, 150) + "..."
                                : item.aiSummary}
                          </p>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="d-flex flex-wrap gap-2">
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() =>
                            setExpandedTranscript(
                              expandedTranscript === item._id ? null : item._id,
                            )
                          }
                        >
                          <i className="bi bi-file-earmark-text me-1"></i>
                          {expandedTranscript === item._id
                            ? "Hide Transcript"
                            : "Full Transcript"}
                        </button>
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() =>
                            copyToClipboard(
                              item.aiSummary || item.transcriptionText,
                            )
                          }
                        >
                          <i className="bi bi-clipboard me-1"></i> Copy
                        </button>
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => exportAsText(item)}
                        >
                          <i className="bi bi-download me-1"></i> Export
                        </button>
                        <button
                          className="btn btn-outline-danger btn-sm ms-auto"
                          onClick={() => handleDelete(item._id, "audio")}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>

                      {/* Expanded full transcript */}
                      {expandedTranscript === item._id && (
                        <div className="ai-full-transcript mt-3">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="fw-semibold small">
                              Full Transcript
                            </span>
                            <span className="badge bg-light text-muted">
                              {item.wordCount} words
                            </span>
                          </div>
                          <p
                            className="mb-0 small"
                            style={{ whiteSpace: "pre-wrap" }}
                          >
                            {item.transcriptionText}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Pagination */}
                  {audioTotalPages > 1 && (
                    <div className="d-flex justify-content-center gap-2 p-3 border-top">
                      <button
                        className="btn btn-sm btn-outline-success"
                        disabled={audioPage <= 1}
                        onClick={() => loadAudioHistory(audioPage - 1)}
                      >
                        <i className="bi bi-chevron-left"></i> Prev
                      </button>
                      <span className="align-self-center small text-muted">
                        {audioPage} / {audioTotalPages}
                      </span>
                      <button
                        className="btn btn-sm btn-outline-success"
                        disabled={audioPage >= audioTotalPages}
                        onClick={() => loadAudioHistory(audioPage + 1)}
                      >
                        Next <i className="bi bi-chevron-right"></i>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ──────────────────────────────────────────── */}
        {/* RIGHT COLUMN — IMAGE (col-lg-4)             */}
        {/* ──────────────────────────────────────────── */}
        <div className="col-lg-4">
          {/* Upload card */}
          <div className="ai-card mb-4">
            <div className="ai-card-header">
              <i className="bi bi-file-earmark-text text-primary me-2"></i>
              Document to Text
            </div>
            <div className="ai-card-body">
              {!imagePreview && !selectedPDF ? (
                <div
                  className={`ai-drop-zone-v2 ${isDragging ? "dragging" : ""}`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <i
                    className="bi bi-file-earmark-arrow-up d-block mb-2"
                    style={{ fontSize: "3rem", color: "#3b82f6" }}
                  ></i>
                  <p className="fw-medium mb-1">Upload Document</p>
                  <p className="text-muted small mb-3">
                    Images, lab results, prescriptions, PDF memos
                  </p>
                  <button className="btn btn-primary btn-sm rounded-pill px-3">
                    <i className="bi bi-upload me-1"></i> Upload File
                  </button>
                  <p className="text-muted small mt-2 mb-0">
                    Supports: JPG, PNG, WEBP, <strong>PDF</strong>
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf,application/pdf"
                    onChange={handleFileChange}
                    className="d-none"
                  />
                </div>
              ) : selectedPDF ? (
                /* ── PDF Selected ── */
                <div>
                  <div
                    className="text-center mb-3 p-3 rounded"
                    style={{ background: "#fef3c7" }}
                  >
                    <i
                      className="bi bi-file-earmark-pdf d-block mb-2"
                      style={{ fontSize: "3rem", color: "#dc2626" }}
                    ></i>
                    <p className="fw-medium mb-0 text-truncate">
                      {selectedPDF.name}
                    </p>
                    <p className="small text-muted mb-0">
                      {(selectedPDF.size / 1024).toFixed(1)} KB
                    </p>
                  </div>

                  {isProcessingPDF && (
                    <div className="d-flex align-items-center gap-2 mb-3 justify-content-center">
                      <span className="spinner-border spinner-border-sm text-primary"></span>
                      <span className="small text-muted">
                        Extracting text & summarizing...
                      </span>
                    </div>
                  )}

                  <div className="d-flex flex-column gap-2">
                    <button
                      className="btn btn-success w-100"
                      onClick={savePDF}
                      disabled={savingPDF}
                    >
                      {savingPDF ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Processing PDF...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-file-earmark-check me-2"></i>{" "}
                          Extract & Summarize
                        </>
                      )}
                    </button>
                    <button
                      className="btn btn-outline-danger btn-sm w-100"
                      onClick={resetImage}
                    >
                      <i className="bi bi-x-lg me-1"></i> Remove
                    </button>
                  </div>
                </div>
              ) : (
                /* ── Image Selected ── */
                <div>
                  <div className="text-center mb-3">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="img-fluid rounded"
                      style={{ maxHeight: "200px", objectFit: "contain" }}
                    />
                  </div>

                  {/* Progress */}
                  {isProcessingOCR && (
                    <div className="mb-3">
                      <div className="d-flex justify-content-between small mb-1">
                        <span>Processing OCR...</span>
                        <span>{ocrProgress}%</span>
                      </div>
                      <div className="progress" style={{ height: "6px" }}>
                        <div
                          className="progress-bar bg-primary"
                          style={{ width: `${ocrProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* OCR Result */}
                  {ocrText && (
                    <div className="ai-ocr-result mb-3">
                      <textarea
                        className="form-control form-control-sm"
                        value={ocrText}
                        onChange={(e) => setOcrText(e.target.value)}
                        rows={6}
                        style={{ fontSize: "0.85rem" }}
                      />
                    </div>
                  )}

                  <div className="d-flex flex-column gap-2">
                    {!ocrText ? (
                      <button
                        className="btn btn-primary w-100"
                        onClick={processOCR}
                        disabled={isProcessingOCR}
                      >
                        {isProcessingOCR ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Processing...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-cpu me-2"></i> Extract Text
                            (OCR)
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        className="btn btn-success w-100"
                        onClick={saveImageOCR}
                        disabled={savingImage}
                      >
                        {savingImage ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Saving & Summarizing...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-save me-2"></i> Save & Summarize
                          </>
                        )}
                      </button>
                    )}
                    <button
                      className="btn btn-outline-danger btn-sm w-100"
                      onClick={resetImage}
                    >
                      <i className="bi bi-x-lg me-1"></i> Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recent image conversions */}
          <div className="ai-card">
            <div className="ai-card-header">
              <i className="bi bi-clock-history me-2"></i>
              Recent Conversions
            </div>
            <div className="ai-card-body p-0">
              {loadingImages ? (
                <div className="text-center py-4">
                  <span className="spinner-border spinner-border-sm text-primary me-2"></span>
                  Loading...
                </div>
              ) : imageHistory.length === 0 ? (
                <div className="text-center text-muted py-4">
                  <i
                    className="bi bi-image d-block mb-2"
                    style={{ fontSize: "1.5rem" }}
                  ></i>
                  No conversions yet
                </div>
              ) : (
                <div>
                  {imageHistory.map((img) => (
                    <div key={img._id} className="ai-img-item">
                      <div className="d-flex align-items-start justify-content-between mb-2">
                        <div className="d-flex align-items-center gap-2">
                          <i className="bi bi-file-earmark-image text-primary"></i>
                          <div>
                            <p
                              className="small fw-medium mb-0 text-truncate"
                              style={{ maxWidth: "160px" }}
                            >
                              {img.originalFileName || img.title}
                            </p>
                            <p className="small text-muted mb-0">
                              {formatDate(img.createdAt)}
                            </p>
                          </div>
                        </div>
                        <span className="badge bg-light text-muted border small">
                          <i className="bi bi-check-circle me-1"></i> Done
                        </span>
                      </div>

                      {/* AI Summary — Sticky Note (small) */}
                      {img.aiSummary && (
                        <div className="ai-sticky-note ai-sticky-note-sm mb-2">
                          <div className="ai-sticky-note-pin"></div>
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="ai-sticky-note-label small">
                              <i className="bi bi-stars me-1"></i>Summary
                            </span>
                            {img.aiSummary.length > 120 && (
                              <button
                                className="btn btn-link btn-sm p-0 text-primary"
                                style={{ fontSize: "0.75rem" }}
                                onClick={() =>
                                  setExpandedSummary(
                                    expandedSummary === img._id
                                      ? null
                                      : img._id,
                                  )
                                }
                                title={
                                  expandedSummary === img._id
                                    ? "Collapse"
                                    : "View full summary"
                                }
                              >
                                <i
                                  className={`bi ${expandedSummary === img._id ? "bi-chevron-up" : "bi-eye"}`}
                                ></i>
                              </button>
                            )}
                          </div>
                          <p
                            className="mb-0 small"
                            style={{ whiteSpace: "pre-wrap" }}
                          >
                            {expandedSummary === img._id
                              ? img.aiSummary
                              : img.aiSummary.length > 120
                                ? img.aiSummary.slice(0, 120) + "..."
                                : img.aiSummary}
                          </p>
                        </div>
                      )}

                      {/* Extracted text preview */}
                      <div className="ai-ocr-preview mb-2">
                        <p
                          className="mb-0 small text-muted"
                          style={{ whiteSpace: "pre-line" }}
                        >
                          {img.extractedText.substring(0, 100)}...
                        </p>
                      </div>

                      <div className="d-flex gap-1">
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          style={{ fontSize: "0.75rem", padding: "2px 8px" }}
                          onClick={() => copyToClipboard(img.extractedText)}
                        >
                          <i className="bi bi-clipboard me-1"></i> Copy
                        </button>
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          style={{ fontSize: "0.75rem", padding: "2px 8px" }}
                          onClick={() => exportAsText(img)}
                        >
                          <i className="bi bi-download me-1"></i> Export
                        </button>
                        <button
                          className="btn btn-outline-danger btn-sm ms-auto"
                          style={{ fontSize: "0.75rem", padding: "2px 8px" }}
                          onClick={() => handleDelete(img._id, "image")}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))}

                  {imageTotalPages > 1 && (
                    <div className="d-flex justify-content-center gap-2 p-2 border-top">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        disabled={imagePage <= 1}
                        onClick={() => loadImageHistory(imagePage - 1)}
                      >
                        <i className="bi bi-chevron-left"></i>
                      </button>
                      <span className="align-self-center small text-muted">
                        {imagePage}/{imageTotalPages}
                      </span>
                      <button
                        className="btn btn-sm btn-outline-primary"
                        disabled={imagePage >= imageTotalPages}
                        onClick={() => loadImageHistory(imagePage + 1)}
                      >
                        <i className="bi bi-chevron-right"></i>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiAssistantView;
