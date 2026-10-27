import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Clock, Wallet, ChefHat, Sparkles, Check, Plus, Minus } from 'lucide-react';
import { useCheckIns } from '../context/CheckInContext';
import { cssTransition, CSS_EASE_OUT, DUR } from '../motion';

const PHOTO_BADGE = {
  background: 'rgba(7, 11, 20, 0.66)',
  WebkitBackdropFilter: 'blur(12px) saturate(160%)',
  backdropFilter: 'blur(12px) saturate(160%)',
  padding: '4px 10px',
  borderRadius: 'var(--r-pill)',
  fontSize: 'var(--text-caption)',
  fontWeight: 600,
  whiteSpace: 'nowrap'
};

const PlaceCard = ({ place }) => {
  const { stats, addCheckIn, undoCheckIn } = useCheckIns();
  const visitCount = stats.countByPlace[place.id] || 0;
  // A primeira imagem entra com fade sobre um skeleton, em vez de "pipocar" na tela.
  const [coverLoaded, setCoverLoaded] = useState(false);
  // Hover cobre o mouse; tapped cobre toque/teclado, já que hover sozinho não é
  // confiável em dispositivos móveis (regra "Hover vs Tap" da skill ui-ux-pro-max).
  const [isHovering, setIsHovering] = useState(false);
  const [tapped, setTapped] = useState(false);
  const [imgIndex, setImgIndex] = useState(0);
  const intervalRef = useRef(null);

  const active = isHovering || tapped;

  const gallery = place.images && place.images.length > 0 ? place.images : [place.image || '/foz_do_iguacu.jpg'];
  const hasCarousel = gallery.length > 1;
  const hasExtraInfo = Boolean(place.specialty || place.differential);
  const isInteractive = hasCarousel || hasExtraInfo;
  const differentialLabel = place.category === 'passeios' ? 'Curiosidade' : 'Informações Adicionais';

  useEffect(() => {
    if (active && hasCarousel) {
      intervalRef.current = setInterval(() => {
        setImgIndex(i => (i + 1) % gallery.length);
      }, 1400);
    } else {
      setImgIndex(0);
    }
    return () => clearInterval(intervalRef.current);
  }, [active, hasCarousel, gallery.length]);

  return (
    <div
      className="liquid-glass"
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-expanded={isInteractive ? active : undefined}
      aria-label={isInteractive ? `${place.name}, toque para ver mais fotos e detalhes` : undefined}
      style={{
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
        zIndex: active ? 10 : 1,
        transform: active ? 'scale(1.08) translateY(-6px)' : 'scale(1) translateY(0)',
        boxShadow: active ? '0 24px 48px rgba(7, 11, 20, 0.28)' : 'var(--card-shadow)',
        transition: cssTransition(['transform', 'box-shadow']),
        cursor: isInteractive ? 'pointer' : 'default'
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={() => isInteractive && setTapped(v => !v)}
      onKeyDown={(e) => {
        if (isInteractive && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          setTapped(v => !v);
        }
      }}
    >
      <div
        className={coverLoaded ? undefined : 'skeleton'}
        style={{ position: 'relative', height: '200px', width: '100%', overflow: 'hidden' }}
      >
        {gallery.map((src, idx) => (
          <img
            key={src}
            src={src}
            alt={place.name}
            loading="lazy"
            onLoad={idx === 0 ? () => setCoverLoaded(true) : undefined}
            onError={idx === 0 ? () => setCoverLoaded(true) : undefined}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: idx === imgIndex && (idx !== 0 || coverLoaded) ? 1 : 0,
              transition: `opacity ${DUR.slow}s ${CSS_EASE_OUT}`
            }}
          />
        ))}

        {/* Selos sobre a foto: numa linha que quebra, para não se sobreporem quando o
            cartão é estreito (coluna do roteiro no celular). Material escuro translúcido
            com texto claro, legível sobre qualquer foto. */}
        <div style={{
          position: 'absolute', top: '10px', left: '10px', right: '10px', zIndex: 2,
          display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '6px',
          pointerEvents: 'none'
        }}>
          {(place.avgPrice || place.entryFee !== undefined) && (
            <div style={{ ...PHOTO_BADGE, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Wallet size={13} aria-hidden="true" />
              {place.avgPrice
                ? `~R$ ${place.avgPrice} / pessoa`
                : (place.entryFee === 'Gratuito' ? 'Entrada Gratuita' : `R$ ${place.entryFee} / ingresso`)}
            </div>
          )}
          <div style={{ ...PHOTO_BADGE, marginLeft: 'auto', color: 'var(--brand-gold)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            {place.category.replaceAll('_', ' ')}
          </div>
        </div>

        {hasCarousel && (
          <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', zIndex: 2, display: 'flex', gap: '5px' }}>
            {gallery.map((_, idx) => (
              <div key={idx} style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: idx === imgIndex ? '#ffffff' : 'rgba(255, 255, 255, 0.45)',
                transition: cssTransition(['background'])
              }} />
            ))}
          </div>
        )}

      </div>

      <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '10px', fontWeight: '700' }} className="text-gradient">
          {place.name}
        </h3>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '15px', lineHeight: '1.5', flex: 1 }}>
          {place.description}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
            <MapPin size={16} color="var(--green)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{place.address}</span>
          </div>

          {place.time && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={16} color="var(--green)" style={{ flexShrink: 0 }} />
              <span>{place.time}</span>
            </div>
          )}
        </div>

        {/* Check-in: alimenta a porcentagem de Foz explorada e os troféus da aba Conquistas.
            stopPropagation para o clique não abrir/fechar o card junto.

            Antes era um botão só: já visitado, ele virava "registrar de novo", então quem
            tinha clicado por engano e clicava outra vez para desmarcar registrava uma
            SEGUNDA visita. Desfazer só existia numa tela diferente (Conquistas), num
            ícone pequeno — quem errava não tinha como voltar atrás ali mesmo.

            Agora, com visita registrada, vira um contador com os dois lados à mostra.
            Ambos com 44px de alvo e 8px de folga, como pede a diretriz de toque. */}
        {visitCount === 0 ? (
          <button
            onClick={(e) => { e.stopPropagation(); addCheckIn(place.id); }}
            aria-label={`Marcar ${place.name} como visitado`}
            className="btn-gold"
            style={{ marginTop: '15px', width: '100%', minHeight: '44px', padding: '9px', fontSize: '0.84rem', gap: '6px' }}
          >
            <Plus size={15} /> Já visitei
          </button>
        ) : (
          <div style={{ marginTop: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={(e) => { e.stopPropagation(); undoCheckIn(place.id); }}
              aria-label={`Remover uma visita de ${place.name}`}
              className="btn-glass"
              style={{
                minWidth: '44px', minHeight: '44px', padding: '0', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderColor: 'var(--green)', color: 'var(--green-dark)'
              }}
            >
              <Minus size={17} />
            </button>

            <span style={{
              flex: 1, minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '6px', fontSize: '0.84rem', fontWeight: 600, color: 'var(--green-dark)',
              background: 'var(--tint-soft)', border: '1px solid color-mix(in srgb, var(--leaf) 35%, transparent)',
              borderRadius: 'var(--r-sm)'
            }}>
              <Check size={15} /> Visitado {visitCount}x
            </span>

            <button
              onClick={(e) => { e.stopPropagation(); addCheckIn(place.id); }}
              aria-label={`Registrar mais uma visita em ${place.name}`}
              className="btn-glass"
              style={{
                minWidth: '44px', minHeight: '44px', padding: '0', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderColor: 'var(--green)', color: 'var(--green-dark)'
              }}
            >
              <Plus size={17} />
            </button>
          </div>
        )}

        <div style={{ marginTop: '15px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {place.tags.slice(0, 3).map(tag => (
            <span key={tag} style={{
              background: 'var(--tint-soft)',
              border: '1px solid color-mix(in srgb, var(--leaf) 35%, transparent)',
              padding: '2px 8px',
              borderRadius: 'var(--r-xs)',
              fontSize: 'var(--text-caption)',
              color: 'var(--text-muted)'
            }}>
              #{tag}
            </span>
          ))}
        </div>

        {hasExtraInfo && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            maxHeight: active ? '160px' : '0px',
            opacity: active ? 1 : 0,
            marginTop: active ? '15px' : '0px',
            paddingTop: active ? '14px' : '0px',
            borderTop: active ? '1px solid var(--card-border)' : '1px solid transparent',
            overflow: 'hidden',
            transition: cssTransition(['max-height', 'opacity', 'margin-top', 'padding-top', 'border-color'], DUR.slow)
          }}>
            {place.specialty && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.85rem' }}>
                <ChefHat size={16} color="var(--green)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span><strong>Especialidade:</strong> {place.specialty}</span>
              </div>
            )}
            {place.differential && (
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                fontSize: '0.85rem',
                background: 'var(--accent-gold-glow)',
                border: '1px solid rgba(242, 183, 10, 0.35)',
                borderRadius: 'var(--r-sm)',
                padding: '10px 12px'
              }}>
                <Sparkles size={16} color="#b8860b" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span><strong>{differentialLabel}:</strong> {place.differential}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaceCard;
