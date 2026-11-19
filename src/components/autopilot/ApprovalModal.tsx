import React, { useState } from 'react';
import { Check, ShieldAlert, X } from 'lucide-react';
import { ApprovalRecord } from '../../types/autopilot';

interface ApprovalModalProps {
  approval: ApprovalRecord;
  onClose: () => void;
  onResolve: (
    approvalId: number,
    decision: 'approve' | 'reject',
    editedPayload?: Record<string, unknown>
  ) => Promise<void>;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({
  approval,
  onClose,
  onResolve,
}) => {
  const [payload, setPayload] = useState<Record<string, unknown>>(
    approval.payload || {}
  );
  const [submitting, setSubmitting] = useState(false);

  const handleDecision = async (decision: 'approve' | 'reject') => {
    setSubmitting(true);
    try {
      await onResolve(approval.id, decision, payload);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-panel-elevated rounded-xl max-w-xl w-full p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs text-amber-300 font-semibold">
                Human Approval Required · {approval.agent}
              </div>
              <h3 className="text-base font-bold text-white mt-0.5">{approval.title}</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">{approval.summary}</p>

        {approval.actionType === 'send_email' && (
          <div className="space-y-3 pt-2 border-t border-white/10">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Recipient Email
              </label>
              <input
                type="email"
                value={String(payload.to || '')}
                onChange={(e) => setPayload({ ...payload, to: e.target.value })}
                className="w-full rounded-lg bg-slate-950 border border-white/15 px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Subject
              </label>
              <input
                type="text"
                value={String(payload.subject || '')}
                onChange={(e) => setPayload({ ...payload, subject: e.target.value })}
                className="w-full rounded-lg bg-slate-950 border border-white/15 px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Email Body
              </label>
              <textarea
                rows={5}
                value={String(payload.body || '')}
                onChange={(e) => setPayload({ ...payload, body: e.target.value })}
                className="w-full rounded-lg bg-slate-950 border border-white/15 px-3 py-2 text-xs text-white"
              />
            </div>
          </div>
        )}

        {approval.actionType === 'create_calendar_event' && (
          <div className="space-y-3 pt-2 border-t border-white/10">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Event Summary
              </label>
              <input
                type="text"
                value={String(payload.summary || '')}
                onChange={(e) => setPayload({ ...payload, summary: e.target.value })}
                className="w-full rounded-lg bg-slate-950 border border-white/15 px-3 py-2 text-xs text-white"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Start ISO Time
                </label>
                <input
                  type="text"
                  value={String(payload.startIso || '')}
                  onChange={(e) => setPayload({ ...payload, startIso: e.target.value })}
                  className="w-full rounded-lg bg-slate-950 border border-white/15 px-3 py-2 text-xs text-white font-mono-code"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  End ISO Time
                </label>
                <input
                  type="text"
                  value={String(payload.endIso || '')}
                  onChange={(e) => setPayload({ ...payload, endIso: e.target.value })}
                  className="w-full rounded-lg bg-slate-950 border border-white/15 px-3 py-2 text-xs text-white font-mono-code"
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleDecision('reject')}
            className="px-4 py-2 rounded-lg border border-white/15 bg-white/5 hover:bg-red-500/20 text-xs font-medium text-slate-200 cursor-pointer whitespace-nowrap shrink-0"
          >
            Reject Action
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleDecision('approve')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white cursor-pointer whitespace-nowrap shrink-0"
          >
            <Check className="w-3.5 h-3.5" />
            {submitting ? 'Executing...' : 'Confirm & Execute'}
          </button>
        </div>
      </div>
    </div>
  );
};
