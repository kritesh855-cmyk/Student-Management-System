import React, { useRef, useState } from 'react';
import {
  CheckCircle2,
  Loader2,
  Mic,
  MicOff,
  Play,
  ShieldAlert,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { WorkflowPlanRecord } from '../../types/autopilot';

interface CommandConsoleProps {
  activePlan: WorkflowPlanRecord | null;
  onPlanCreated: (plan: WorkflowPlanRecord) => void;
  onPlanUpdated: (plan: WorkflowPlanRecord) => void;
  onRefreshData: () => void;
}

const SAMPLE_COMMANDS = [
  'Find my important emails, summarize them, prepare replies, and show me a schedule for tomorrow.',
  'Research the top enterprise AI agent frameworks in 2026 with source citations and reliability check.',
  'कल के मेरे मीटिंग्स की लिस्ट दिखाएं और जरूरी ईमेल का सारांश तैयार करें।',
];

export const CommandConsole: React.FC<CommandConsoleProps> = ({
  activePlan,
  onPlanCreated,
  onPlanUpdated,
  onRefreshData,
}) => {
  const [prompt, setPrompt] = useState('');
  const [planning, setPlanning] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const handlePlan = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || planning) return;
    setError('');
    setPlanning(true);
    try {
      const data = await apiFetch<{ plan: WorkflowPlanRecord }>('/api/assistant/plan', {
        method: 'POST',
        body: JSON.stringify({ prompt: prompt.trim() }),
      });
      onPlanCreated(data.plan);
      onRefreshData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate execution plan.');
    } finally {
      setPlanning(false);
    }
  };

  const handleExecute = async () => {
    if (!activePlan || executing) return;
    setError('');
    setExecuting(true);
    try {
      const data = await apiFetch<{ plan: WorkflowPlanRecord }>(
        `/api/assistant/execute/${activePlan.id}`,
        { method: 'POST' }
      );
      onPlanUpdated(data.plan);
      onRefreshData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Workflow execution failed.');
    } finally {
      setExecuting(false);
    }
  };

  const toggleVoiceRecording = async () => {
    if (recording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      return;
    }

    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        setTranscribing(true);
        try {
          const reader = new FileReader();
          const base64 = await new Promise<string>((resolve, reject) => {
            reader.onloadend = () => {
              const res = String(reader.result || '');
              resolve(res.split(',')[1] || '');
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          const data = await apiFetch<{ transcript: string }>('/api/ai/transcribe', {
            method: 'POST',
            body: JSON.stringify({
              audioBase64: base64,
              mimeType: blob.type || 'audio/webm',
            }),
          });
          if (data.transcript) {
            setPrompt((prev) => (prev ? `${prev} ${data.transcript}` : data.transcript));
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Voice transcription failed.');
        } finally {
          setTranscribing(false);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setError('Microphone permission denied or unavailable in this browser.');
    }
  };

  const handleSpeakSummary = async () => {
    if (!activePlan || speaking) return;
    setSpeaking(true);
    setError('');
    try {
      const textToRead =
        activePlan.verificationSummary ||
        activePlan.summary ||
        'Execution plan is ready for review.';
      const data = await apiFetch<{ audioBase64: string | null }>('/api/ai/speak', {
        method: 'POST',
        body: JSON.stringify({ text: textToRead }),
      });
      if (data.audioBase64) {
        const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
        audio.onended = () => setSpeaking(false);
        await audio.play();
      } else {
        setSpeaking(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speech playback failed.');
      setSpeaking(false);
    }
  };

  return (
    <div className="space-y-5">
      <form
        onSubmit={handlePlan}
        className="glass-panel-elevated rounded-xl p-5 space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-white">
              Orchestrator Command Console
            </h2>
            <p className="text-xs text-slate-400">
              English & Hindi supported · Generates a verified multi-agent plan before execution
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleVoiceRecording}
              disabled={transcribing}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                recording
                  ? 'bg-red-500/20 border-red-400/50 text-red-200'
                  : 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10'
              }`}
            >
              {recording ? (
                <>
                  <MicOff className="w-3.5 h-3.5" /> Stop Mic
                </>
              ) : transcribing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Transcribing...
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5 text-indigo-400" /> Voice Input
                </>
              )}
            </button>
          </div>
        </div>

        <textarea
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder='Try: "Find my important emails, summarize them, prepare replies, and show me a schedule for tomorrow."'
          className="w-full rounded-lg bg-slate-950/70 border border-white/10 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-400 transition-colors"
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {SAMPLE_COMMANDS.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setPrompt(sample)}
                className="text-left px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-slate-300 transition-colors cursor-pointer max-w-[260px] truncate"
                title={sample}
              >
                {sample}
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={planning || !prompt.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-semibold disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
          >
            {planning ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Planning Workflow...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" /> Plan Workflow
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/15 border border-red-400/30 px-3.5 py-2.5 text-xs text-red-200">
            {error}
          </div>
        )}
      </form>

      {activePlan && (
        <div className="glass-panel rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-4">
            <div className="space-y-1">
              <div className="text-xs text-indigo-300 font-medium">
                Execution Plan #{activePlan.id} · {activePlan.language.toUpperCase()} · Status:{' '}
                <span className="text-white font-semibold capitalize">
                  {activePlan.status.replace('_', ' ')}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-white">{activePlan.summary}</h3>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleSpeakSummary}
                disabled={speaking}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-200 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Volume2 className="w-3.5 h-3.5 text-blue-400" />
                {speaking ? 'Speaking...' : 'Speak Brief'}
              </button>

              {activePlan.status === 'planned' && (
                <button
                  type="button"
                  onClick={handleExecute}
                  disabled={executing}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
                >
                  {executing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Executing Agents...
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" /> Execute Plan
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {activePlan.steps.map((step) => (
              <div
                key={step.id}
                className="rounded-lg bg-slate-950/60 border border-white/10 p-4 space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono-code text-indigo-300 tabular-nums">
                      0{step.stepNumber}.
                    </span>
                    <span className="font-semibold text-white">{step.agent}</span>
                    <span className="text-slate-500" aria-hidden="true">·</span>
                    <span className="text-slate-300">{step.action}</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    {step.requiresApproval && (
                      <span className="inline-flex items-center gap-1 text-amber-300 font-medium">
                        <ShieldAlert className="w-3.5 h-3.5" /> Approval Gate
                      </span>
                    )}
                    {step.verified && (
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                      </span>
                    )}
                    <span className="text-slate-400 capitalize">
                      {step.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-400">{step.description}</p>

                {step.output && (
                  <div className="mt-2 rounded-md bg-slate-900/80 border border-white/5 p-3 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {step.output}
                  </div>
                )}
              </div>
            ))}
          </div>

          {activePlan.verificationSummary && (
            <div className="rounded-lg bg-indigo-500/10 border border-indigo-400/20 px-4 py-3 text-xs text-indigo-200">
              <strong className="font-semibold text-white">Verification Report: </strong>
              {activePlan.verificationSummary}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
