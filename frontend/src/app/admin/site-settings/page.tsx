'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';

export default function SiteSettings() {
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await api.get('/cms/');
      setSettings(data);
    } catch (err) {
      console.error('Error fetching settings', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (key: string, value: string) => {
    setSaving(key);
    try {
      await api.patch(`/cms/${key}`, { value });
      fetchSettings();
    } catch (err) {
      alert('Erro ao salvar configuração');
    } finally {
      setSaving(null);
    }
  };

  const createInitialSettings = async () => {
    setLoading(true);
    try {
      const heroData = {
        title: "A Essência do Design Atemporal",
        subtitle: "Nova Coleção 2026",
        description: "Móveis assinados que elevam o habitar à categoria de arte. Conheça o novo minimalismo sofisticado da SFIZIO.",
        button_text: "Explorar Coleção",
        image_url: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6"
      };

      await api.post('/cms/', {
        key: 'hero_content',
        value: JSON.stringify(heroData),
        description: 'Conteúdo da seção Hero da página inicial'
      });
      
      fetchSettings();
    } catch (err) {
      alert('Erro ao inicializar configurações');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '32px' }}>Configurações do Site</h1>

      {loading ? (
        <p>Carregando...</p>
      ) : settings.length === 0 ? (
        <div style={{ background: '#fff', padding: '40px', borderRadius: '12px', textAlign: 'center' }}>
          <p style={{ marginBottom: '24px' }}>Nenhuma configuração encontrada. Deseja inicializar os padrões?</p>
          <button onClick={createInitialSettings} className="btn-primary">Inicializar Padrões</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {settings.map(setting => (
            <div key={setting.id} className="admin-form" style={{ maxWidth: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div>
                  <h3 style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>{setting.key.replace('_', ' ')}</h3>
                  <p style={{ color: '#888', fontSize: '13px' }}>{setting.description}</p>
                </div>
                <button 
                   disabled={saving === setting.key}
                   onClick={() => handleUpdate(setting.key, setting.value)}
                   className="btn-primary"
                >
                  {saving === setting.key ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>

              {(() => {
                if (setting.key === 'hero_content') {
                  try {
                    const parsed = JSON.parse(setting.value || '{}');
                    
                    const handleHeroChange = (field: string, val: string) => {
                      const newParsed = { ...parsed, [field]: val };
                      const newValueString = JSON.stringify(newParsed, null, 2);
                      const newSettings = settings.map(s => s.key === setting.key ? { ...s, value: newValueString } : s);
                      setSettings(newSettings);
                    };

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                           <label>TÍTULO PRINCIPAL</label>
                           <input value={parsed.title || ''} onChange={e => handleHeroChange('title', e.target.value)} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                           <label>SUBTÍTULO</label>
                           <input value={parsed.subtitle || ''} onChange={e => handleHeroChange('subtitle', e.target.value)} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                           <label>DESCRIÇÃO</label>
                           <textarea rows={3} value={parsed.description || ''} onChange={e => handleHeroChange('description', e.target.value)} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                             <label>TEXTO DO BOTÃO</label>
                             <input value={parsed.button_text || ''} onChange={e => handleHeroChange('button_text', e.target.value)} />
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                             <label>URL DA IMAGEM DE FUNDO</label>
                             <input value={parsed.image_url || ''} onChange={e => handleHeroChange('image_url', e.target.value)} />
                          </div>
                        </div>
                        {parsed.image_url && (
                           <div style={{ height: '150px', background: `url(${parsed.image_url}) center/cover`, borderRadius: '8px', border: '1px solid #ddd' }}></div>
                        )}
                      </div>
                    );
                  } catch (err) {
                    // Fallback se o JSON estiver inválido
                  }
                }

                // Fallback comum
                return (
                  <div className="form-group">
                    <label>VALOR (JSON/TEXTO)</label>
                    <textarea 
                      value={setting.value} 
                      onChange={(e) => {
                        const newSettings = settings.map(s => s.key === setting.key ? { ...s, value: e.target.value } : s);
                        setSettings(newSettings);
                      }}
                      rows={10} 
                      style={{ fontFamily: 'monospace', fontSize: '12px' }}
                    />
                  </div>
                );
              })()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
