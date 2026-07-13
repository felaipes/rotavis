import React from 'react';
import { MapPin, Clock } from 'lucide-react';

const PlaceCard = ({ place }) => {
  return (
    <div className="liquid-glass" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ position: 'relative', height: '200px', width: '100%' }}>
        <img 
          src={place.image || '/foz_do_iguacu.jpg'}
          alt={place.name} 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{ 
          position: 'absolute', 
          top: '10px', 
          right: '10px', 
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
      </div>
    </div>
  );
};

export default PlaceCard;
