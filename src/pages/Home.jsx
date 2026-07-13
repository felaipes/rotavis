import React, { useState, useMemo } from 'react';
import { Search, Filter } from 'lucide-react';
import { categories, places } from '../data';
import PlaceCard from '../components/PlaceCard';
import { motion, AnimatePresence } from 'framer-motion';

const Home = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  // Semantic search simulation (keywords match tags, description, name)
  const filteredPlaces = useMemo(() => {
    return places.filter(place => {
      const matchesCategory = activeCategory === 'all' || place.category === activeCategory;

      if (!searchTerm) return matchesCategory;

      const term = searchTerm.toLowerCase();
      const matchName = place.name.toLowerCase().includes(term);
      const matchDesc = place.description.toLowerCase().includes(term);
      const matchTags = place.tags.some(tag => tag.toLowerCase().includes(term));

      return matchesCategory && (matchName || matchDesc || matchTags);
    });
  }, [searchTerm, activeCategory]);

  return (
    <div>
      {/* Hero Section */}
      <section style={{
        position: 'relative',
        padding: '100px 20px',
        textAlign: 'center',
        backgroundImage: 'url(/hero_cataratas.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(10, 26, 16, 0.45) 0%, rgba(10, 26, 16, 0.35) 70%, #faf7ef 100%)' }}></div>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px' }}>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ fontSize: '4rem', fontWeight: 800, marginBottom: '20px', lineHeight: 1.1, color: '#ffffff', textShadow: '0 2px 12px rgba(0, 0, 0, 0.5)' }}
          >
            Descubra a <span style={{ color: 'var(--accent-gold)' }}>Terra das Cataratas</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{ fontSize: '1.25rem', color: '#f0ece2', textShadow: '0 1px 8px rgba(0, 0, 0, 0.5)', marginBottom: '40px' }}
          >
            Cataratas monumentais, cultura de três países e gastronomia única aguardam você em Foz do Iguaçu.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="liquid-glass"
            style={{ display: 'flex', padding: '8px', maxWidth: '600px', margin: '0 auto' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', padding: '0 15px' }}>
              <Search color="var(--text-muted)" size={20} />
            </div>
            <input
              type="text"
              placeholder="Busque por cataratas, gastronomia, bares, compras..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-main)',
                padding: '15px 10px',
                width: '100%',
                outline: 'none',
                fontSize: '1.1rem'
              }}
            />
          </motion.div>
        </div>
      </section>

      <div className="container" style={{ padding: '60px 20px' }}>
        {/* Categories */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Filter color="var(--green-dark)" size={20} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Categorias</h2>
          </div>

          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '15px', scrollbarWidth: 'none' }}>
            <button
              className={`btn-glass ${activeCategory === 'all' ? 'active' : ''}`}
              onClick={() => setActiveCategory('all')}
              style={{ whiteSpace: 'nowrap' }}
            >
              Todos
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`btn-glass ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
                style={{ whiteSpace: 'nowrap' }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 600, marginBottom: '30px' }}>
            {filteredPlaces.length} {filteredPlaces.length === 1 ? 'resultado' : 'resultados'} encontrados
          </h2>

          <motion.div layout style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '30px'
          }}>
            <AnimatePresence>
              {filteredPlaces.map(place => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  key={place.id}
                >
                  <PlaceCard place={place} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {filteredPlaces.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <Search size={48} style={{ margin: '0 auto 20px', opacity: 0.5 }} />
              <p style={{ fontSize: '1.2rem' }}>Nenhum local encontrado para a sua busca.</p>
              <button onClick={() => { setSearchTerm(''); setActiveCategory('all'); }} className="btn-gold" style={{ marginTop: '20px' }}>
                Limpar Filtros
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
