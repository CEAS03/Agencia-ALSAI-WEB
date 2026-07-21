import { useId, useState, type ReactNode } from 'react';

export interface AccordionItem {
  q: string;
  a: ReactNode;
}

/**
 * Acordeón sobrio. La altura anima con grid-template-rows (0fr → 1fr),
 * sin medir el contenido; el ícono + rota a × al abrir.
 */
export function Accordion({ items }: { items: AccordionItem[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const baseId = useId();

  return (
    <div className="acc" data-fx-group>
      {items.map((item, i) => {
        const isOpen = open === i;
        const panelId = `${baseId}-p${i}`;
        const headId = `${baseId}-h${i}`;
        return (
          <div className={`acc-item${isOpen ? ' is-open' : ''}`} key={i}>
            <button
              id={headId}
              className="acc-head"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpen(isOpen ? null : i)}
            >
              {item.q}
              <span className="acc-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </span>
            </button>
            <div id={panelId} role="region" aria-labelledby={headId} className="acc-body">
              <div>{typeof item.a === 'string' ? <p>{item.a}</p> : item.a}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
