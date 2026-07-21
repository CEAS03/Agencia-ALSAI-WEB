const ITEMS = [
  {
    title: 'Atención inmediata',
    body: 'Cada mensaje se responde al momento, a cualquier hora, y queda registrado en tu CRM con el contexto completo.',
  },
  {
    title: 'Seguimiento sin fugas',
    body: 'Recordatorios y seguimiento automático para prospectos que aún no agendan y pacientes que ya te visitaron.',
  },
  {
    title: 'Decisiones con datos',
    body: 'WhatsApp, agenda, marketing y ventas conectados en un solo sistema que muestra qué está funcionando.',
  },
];

export function SystemFlow() {
  return (
    <section className="flow shell">
      <p className="microlabel reveal">Qué conecta ALSAI</p>
      <h2 className="flow-heading reveal">Un sistema completo, no herramientas sueltas.</h2>

      <div className="flow-list">
        {ITEMS.map((item) => (
          <article key={item.title} className="flow-item reveal">
            <span className="flow-node" aria-hidden="true" />
            <div>
              <h3 className="flow-title">{item.title}</h3>
              <p className="flow-body">{item.body}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
