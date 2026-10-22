import { useEffect, useState } from 'react';
import { CheckIcon, CopyIcon } from '../ui/icons';

type CopyState = 'idle' | 'copied' | 'failed';

const RESET_MS = 2400;

async function copyText(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  // Fallback for insecure contexts (e.g. a LAN preview over plain http).
  const field = document.createElement('textarea');
  field.value = text;
  field.setAttribute('readonly', '');
  field.style.position = 'fixed';
  field.style.opacity = '0';
  document.body.appendChild(field);
  field.select();
  const copied = document.execCommand('copy');
  field.remove();
  if (!copied) throw new Error('Copy command was rejected.');
}

/** Copies the address and confirms visibly and to screen readers. */
export function CopyEmailButton({ email }: { email: string }) {
  const [state, setState] = useState<CopyState>('idle');

  useEffect(() => {
    if (state === 'idle') return;
    const timer = window.setTimeout(() => setState('idle'), RESET_MS);
    return () => window.clearTimeout(timer);
  }, [state]);

  const copy = () => {
    copyText(email).then(
      () => setState('copied'),
      () => setState('failed'),
    );
  };

  const label = state === 'copied' ? 'Copied' : state === 'failed' ? 'Copy failed' : 'Copy email';

  return (
    <>
      <button type="button" className="action action--secondary copy-email" data-state={state} onClick={copy}>
        <span className="action__label">{label}</span>
        {state === 'copied' ? <CheckIcon /> : <CopyIcon />}
      </button>
      <span className="visually-hidden" role="status">
        {state === 'copied' ? 'Email address copied to the clipboard.' : ''}
        {state === 'failed' ? `Copy failed. The address is ${email}.` : ''}
      </span>
    </>
  );
}
