import { useRef } from 'react';
import { usePageFx } from '../lib/motion';
import { Eyebrow, MaskHeading } from '../components/ui/primitives';
import { SystemDemo } from '../components/demo/SystemDemo';
import { DEMO_HOME } from '../components/demo/demoScripts';
import { HeroHome } from './home/HeroHome';
import { Friccion } from './home/Friccion';
import { Sistema } from './home/Sistema';
import { Modulos } from './home/Modulos';
import { Sectores } from './home/Sectores';
import { Casos } from './home/Casos';
import { MetodoNosotros } from './home/MetodoNosotros';
import { FaqCierre } from './home/FaqCierre';

/**
 * HOME — orquesta las 12 secciones del blueprint (sección 7.1 del brief).
 * usePageFx monta una sola vez los reveals declarativos (data-fx) de toda
 * la página; los momentos firma viven en cada sección.
 */
export default function HomePage() {
  const rootRef = useRef<HTMLDivElement>(null);
  usePageFx(rootRef);

  return (
    <div ref={rootRef}>
      <HeroHome />
      <Friccion />
      <Sistema />

      {/* ── 4 · Demostración real ── */}
      <section className="site-sec" id="demo" aria-labelledby="demo-title">
        <div className="site-shell">
          <Eyebrow>Demostración real</Eyebrow>
          <MaskHeading
            id="demo-title"
            className="h-sec"
            text="Una conversación visible. **Un sistema completo actuando detrás.**"
            style={{ marginTop: 18 }}
          />
          <SystemDemo script={DEMO_HOME} />
        </div>
      </section>

      <Modulos />
      <Sectores />
      <Casos />
      <MetodoNosotros />
      <FaqCierre />
    </div>
  );
}
