import { useEffect, useState } from 'react';

interface ToastItem {
  id: number;
  message: string;
  on: boolean;
}

type Listener = (toasts: ToastItem[]) => void;

let toasts: ToastItem[] = [];
let listener: Listener | null = null;
let nextId = 1;

function emit() {
  listener?.([...toasts]);
}

/** Muestra un aviso breve no bloqueante. */
export function toast(message: string): void {
  const id = nextId++;
  toasts = [...toasts.slice(-2), { id, message, on: false }];
  emit();
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      toasts = toasts.map((t) => (t.id === id ? { ...t, on: true } : t));
      emit();
    }),
  );
  window.setTimeout(() => {
    toasts = toasts.map((t) => (t.id === id ? { ...t, on: false } : t));
    emit();
    window.setTimeout(() => {
      toasts = toasts.filter((t) => t.id !== id);
      emit();
    }, 260);
  }, 2600);
}

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    listener = setItems;
    return () => {
      listener = null;
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="toaster" role="status" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={`toast${t.on ? ' is-on' : ''}`}>
          <span className="toast-dot" aria-hidden="true" />
          {t.message}
        </div>
      ))}
    </div>
  );
}
