import { site } from '../config/site';
import { IconPin } from './icons';

export function FounderCard() {
  const { founder } = site;
  const initials = founder.name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('');

  return (
    <section className="founder shell">
      <p className="microlabel reveal">Quién está detrás</p>

      <div className="founder-card reveal">
        <div className="founder-photo" aria-hidden={founder.photoSrc ? undefined : true}>
          {founder.photoSrc ? (
            <img
              src={founder.photoSrc}
              alt={`${founder.name}, ${founder.role}`}
              width={220}
              height={220}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <span className="founder-monogram">{initials}</span>
          )}
        </div>
        <div>
          <p className="founder-name">{founder.name}</p>
          <p className="founder-role">{founder.role}</p>
          <p className="founder-location">
            <IconPin />
            {founder.location}
          </p>
        </div>
      </div>
    </section>
  );
}
