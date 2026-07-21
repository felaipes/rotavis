import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Clock, Wallet, ChefHat, Sparkles } from 'lucide-react';

const PlaceCard = ({ place }) => {
  const [isHovering, setIsHovering] = useState(false);
  const [imgIndex, setImgIndex] = useState(0);
  const intervalRef = useRef(null);

  const gallery = place.images && place.images.length > 0 ? place.images : [place.image || '/foz_do_iguacu.jpg'];
  const hasCarousel = gallery.length > 1;
  const hasExtraInfo = Boolean(place.specialty || place.differential);

  useEffect(() => {
    if (isHovering && hasCarousel) {
      intervalRef.current = setInterval(() => {
        setImgIndex(i => (i + 1) % gallery.length);
      }, 1400);
    } else {
      setImgIndex(0);
    }
    return () => clearInterval(intervalRef.current);
  }, [isHovering, hasCarousel, gallery.length]);

  return (
    <div
      className="liquid-glass"
      style={{
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
        zIndex: isHovering ? 10 : 1,
        transform: isHovering ? 'scale(1.08) translateY(-6px)' : 'scale(1) translateY(0)',
        boxShadow: isHovering ? '0 24px 48px rgba(7, 11, 20, 0.28)' : 'var(--card-shadow)',
        transition: 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.3s ease'
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div style={{ position: 'relative', height: '200px', width: '100%', overflow: 'hidden' }}>
        {gallery.map((src, idx) => (
          <img
            key={src}
            src={src}
            alt={place.name}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: idx === imgIndex ? 1 : 0,
              transition: 'opacity 0.6s ease'
            }}
          />
        ))}

        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 2,
          background: 'rgba(7, 11, 20, 0.7)',
          backdropFilter: 'blur(10px)',
          padding: '4px 12px',
          borderRadius: '99px',
          fontSize: '0.8rem',
          color: 'var(--accent-gold)',
          fontWeight: '600',
          textTransform: 'uppercase'
        }}>
          {place.category.replace('_', ' ')}
        </div>

        {place.avgPrice && (
          <div style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            zIndex: 2,
            background: 'rgba(7, 11, 20, 0.7)',
            backdropFilter: 'blur(10px)',
            padding: '4px 12px',
            borderRadius: '99px',
            fontSize: '0.8rem',
            color: '#ffffff',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <Wallet size={13} />
            ~R$ {place.avgPrice} / pessoa
          </div>
        )}

        {hasCarousel && (
          <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', zIndex: 2, display: 'flex', gap: '5px' }}>
            {gallery.map((_, idx) => (
              <div key={idx} style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: idx === imgIndex ? '#ffffff' : 'rgba(255, 255, 255, 0.45)',
                transition: 'background 0.3s ease'
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

        <div style={{ marginTop: '15px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {place.tags.slice(0, 3).map(tag => (
            <span key={tag} style={{
              background: 'rgba(27, 94, 60, 0.07)',
              border: '1px solid rgba(27, 94, 60, 0.18)',
              padding: '2px 8px',
              borderRadius: '6px',
              fontSize: '0.75rem',
              color: '#4a6b58'
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
            maxHeight: isHovering ? '160px' : '0px',
            opacity: isHovering ? 1 : 0,
            marginTop: isHovering ? '15px' : '0px',
            paddingTop: isHovering ? '14px' : '0px',
            borderTop: isHovering ? '1px solid var(--card-border)' : '1px solid transparent',
            overflow: 'hidden',
            transition: 'max-height 0.35s ease, opacity 0.3s ease, margin-top 0.35s ease, padding-top 0.35s ease, border-color 0.35s ease'
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
                borderRadius: '8px',
                padding: '10px 12px'
              }}>
                <Sparkles size={16} color="#b8860b" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span><strong>Diferencial:</strong> {place.differential}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaceCard;
