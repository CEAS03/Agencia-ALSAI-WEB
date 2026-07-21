import { useRef } from 'react';
import { usePageFx } from '../lib/motion';
import { useTransitionNavigate } from '../components/layout/PageTransition';
import { SecondaryCta } from '../components/ui/buttons';

export default function NotFoundPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const go = useTransitionNavigate();
  usePageFx(rootRef);

  return (
    <div ref={rootRef}>
      <section className="nf site-shell">
        <p className="eyebrow" data-fx="rise">
          Error 404
        </p>
        <div className="nf-code" data-fx="rise">
          404
        </div>
        <p className="t-lead" data-fx="rise">
          Esta página no existe o todavía no está publicada. El sistema, en cambio, sigue
          funcionando.
        </p>
        <SecondaryCta onPress={() => go('/')}>Volver al inicio</SecondaryCta>
      </section>
    </div>
  );
}
