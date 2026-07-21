import { useRef } from 'react';
import { usePageFx } from '../lib/motion';
import { Eyebrow, MaskHeading } from '../components/ui/primitives';

/**
 * AVISO DE PRIVACIDAD (/aviso-de-privacidad).
 * Contenido portado del aviso estático de la tarjeta (public/
 * aviso-privacidad.html, que se conserva por compatibilidad), adaptado
 * al contexto del sitio: aplica a clínicas y negocios de servicios.
 */
export default function AvisoPrivacidadPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  usePageFx(rootRef);

  return (
    <div ref={rootRef}>
      <section className="site-sec site-sec--first" aria-labelledby="priv-title">
        <div className="site-shell">
          <div className="priv-page">
            <Eyebrow>Agencia ALSAI</Eyebrow>
            <MaskHeading
              as="h1"
              id="priv-title"
              className="h-sec"
              text="Aviso de **privacidad.**"
              style={{ marginTop: 16 }}
            />
            <p className="priv-updated" data-fx="rise">
              Última actualización: julio 2026
            </p>

            <div className="priv-hl" data-fx="rise">
              Tus datos y los de tus clientes o pacientes <strong>nunca se venden, rentan ni
              comparten</strong> con terceros con fines comerciales. Se usan únicamente para
              brindarte el servicio que solicitas.
            </div>

            <div data-fx="rise">
              <h2>Responsable</h2>
              <p>
                Agencia ALSAI (Carlos Álvarez), con domicilio en Querétaro, Qro., México, es
                responsable del tratamiento de los datos personales que nos proporcionas a través
                de este sitio.
              </p>
            </div>

            <div data-fx="rise">
              <h2>Qué datos recabamos</h2>
              <ul>
                <li>
                  Datos de contacto: nombre, nombre de tu negocio o clínica, WhatsApp y correo
                  (opcional).
                </li>
                <li>
                  Respuestas que compartes durante el diagnóstico sobre la operación de tu
                  negocio.
                </li>
              </ul>
            </div>

            <div data-fx="rise">
              <h2>Para qué los usamos</h2>
              <ul>
                <li>Preparar y enviarte el diagnóstico de tu negocio.</li>
                <li>Contactarte para dar seguimiento y, si lo deseas, agendar una reunión.</li>
                <li>Presentarte propuestas de servicios de ALSAI relacionadas con tu solicitud.</li>
              </ul>
            </div>

            <div data-fx="rise">
              <h2>Confidencialidad</h2>
              <p>
                Tratamos tu información y la de tus clientes o pacientes con estricta
                confidencialidad. Aplicamos medidas razonables de seguridad y solo el equipo de
                ALSAI accede a ella para prestarte el servicio. No se transfiere a terceros
                ajenos, salvo obligación legal.
              </p>
            </div>

            <div data-fx="rise">
              <h2>Tus derechos</h2>
              <p>
                Puedes solicitar en cualquier momento acceder, rectificar o eliminar tus datos,
                así como dejar de recibir comunicaciones. Basta con pedirlo por el mismo medio por
                el que nos contactaste.
              </p>
            </div>

            <div data-fx="rise">
              <h2>Consentimiento</h2>
              <p>
                Al enviar tus datos a través de este sitio, aceptas el tratamiento descrito en
                este aviso.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
