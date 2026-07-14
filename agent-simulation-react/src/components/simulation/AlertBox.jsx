import { useEffect, useId, useRef, useState } from 'react';
import { AlertTriangle, Info, X } from 'lucide-react';

export default function AlertBox({
  title,
  primMessage,
  secMessage,
  type = 'default',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  permanentDismiss = false,
  dismissStorageKey,
  onCancel,
  onConfirm,
}) {
  const titleId = useId();
  const descriptionId = useId();
  const confirmButtonRef = useRef(null);
  const isDanger = type === 'danger' || type === 'warning';
  const canPermanentlyDismiss = permanentDismiss && !isDanger && Boolean(dismissStorageKey);
  const [doNotShowAgain, setDoNotShowAgain] = useState(false);
  const [isPermanentlyDismissed] = useState(() => {
    if (!canPermanentlyDismiss) return false;

    try {
      return localStorage.getItem(dismissStorageKey) === 'true';
    } catch {
      return false;
    }
  });
  const Icon = isDanger ? AlertTriangle : Info;

  function saveDismissPreference() {
    if (!canPermanentlyDismiss || !doNotShowAgain) return;

    try {
      localStorage.setItem(dismissStorageKey, 'true');
    } catch {
      // The alert can still close if browser storage is unavailable.
    }
  }

  function handleCancel() {
    saveDismissPreference();
    onCancel?.();
  }

  function handleConfirm() {
    saveDismissPreference();
    onConfirm?.();
  }

  useEffect(() => {
    if (isPermanentlyDismissed) return undefined;

    const previouslyFocusedElement = document.activeElement;
    confirmButtonRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        if (canPermanentlyDismiss && doNotShowAgain) {
          try {
            localStorage.setItem(dismissStorageKey, 'true');
          } catch {
            // The alert can still close if browser storage is unavailable.
          }
        }
        onCancel?.();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocusedElement?.focus?.();
    };
  }, [canPermanentlyDismiss, dismissStorageKey, doNotShowAgain, isPermanentlyDismissed, onCancel]);

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) handleCancel();
  }

  if (isPermanentlyDismissed) return null;

  return (
    <div className="alert-box-backdrop" onMouseDown={handleBackdropClick}>
      <div
        className={`alert-box alert-box-${type}`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <button
          className="alert-box-close"
          type="button"
          aria-label="Close alert"
          onClick={handleCancel}
        >
          <X size={20} aria-hidden="true" />
        </button>

        <div className="alert-box-icon" aria-hidden="true">
          <Icon size={24} />
        </div>

        <div className="alert-box-content">
          <h2 className="alert-box-title" id={titleId}>{title}</h2>
          <div id={descriptionId}>
            <p className="alert-box-primary-message">{primMessage}</p>
            {secMessage && <p className="alert-box-secondary-message">{secMessage}</p>}
          </div>
        </div>

        {canPermanentlyDismiss && (
          <label className="alert-box-dismiss-option">
            <input
              type="checkbox"
              checked={doNotShowAgain}
              onChange={(event) => setDoNotShowAgain(event.target.checked)}
            />
            <span>Do not show again</span>
          </label>
        )}

        <div className="alert-box-actions">
          <button className="btn-secondary" type="button" onClick={handleCancel}>
            {cancelLabel}
          </button>
          <button
            ref={confirmButtonRef}
            className={isDanger ? 'btn-danger' : 'btn-primary'}
            type="button"
            onClick={handleConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
