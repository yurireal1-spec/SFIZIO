'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { parseNumber } from '@/utils/format';

export interface ProductFormData {
  name: string;
  slug: string;
  description: string;
  price: number | string;
  discount_price: number | string;
  stock: number;
  category_id: number | string;
  is_active: boolean;
  images: string[];
}

export interface ProductOptionValue {
  name: string;
  price_modifier: number;
  meta: string;
  image_url?: string;
}

export interface ProductOption {
  name: string;
  values: ProductOptionValue[];
}

interface ProductFormProps {
  initialData?: ProductFormData;
  initialOptions?: ProductOption[];
  categories: any[];
  onSubmit: (data: any) => Promise<void>;
  loading: boolean;
  buttonText: string;
}

const DEFAULT_DATA: ProductFormData = {
  name: '',
  slug: '',
  description: '',
  price: 0,
  discount_price: 0,
  stock: 0,
  category_id: '',
  is_active: true,
  images: []
};

export default function ProductForm({
  initialData,
  initialOptions = [],
  categories,
  onSubmit,
  loading,
  buttonText
}: ProductFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<ProductFormData>(DEFAULT_DATA);
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');

  // Initialize data
  useEffect(() => {
    if (initialData) {
      setFormData({
        ...DEFAULT_DATA,
        ...initialData,
        images: initialData.images || []
      });
    } else if (categories.length > 0) {
      setFormData(prev => ({ ...prev, category_id: categories[0].id }));
    }
    
    if (initialOptions.length > 0) {
      setOptions(initialOptions);
    }
  }, [initialData, initialOptions, categories]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as any;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : (name === 'price' || name === 'discount_price' ? value : (type === 'number' ? parseFloat(value) : value))
    }));
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    const generatedSlug = newName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ /g, '-').replace(/[^\w-]+/g, '');
    
    setFormData(prev => ({
      ...prev,
      name: newName,
      slug: prev.slug === '' || prev.slug === prev.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ /g, '-').replace(/[^\w-]+/g, '') ? generatedSlug : prev.slug
    }));
  };

  const addImage = () => {
    if (newImageUrl.trim() !== '') {
      setFormData(prev => ({ ...prev, images: [...prev.images, newImageUrl.trim()] }));
      setNewImageUrl('');
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  // Option Handlers
  const addOption = () => setOptions([...options, { name: '', values: [] }]);
  const removeOption = (index: number) => setOptions(options.filter((_, i) => i !== index));
  const addOptionValue = (optIdx: number) => {
    const newOpts = [...options];
    newOpts[optIdx].values.push({ name: '', price_modifier: 0, meta: '', image_url: '' });
    setOptions(newOpts);
  };
  const removeOptionValue = (optIdx: number, valIdx: number) => {
    const newOpts = [...options];
    newOpts[optIdx].values.splice(valIdx, 1);
    setOptions(newOpts);
  };
  const updateOptionName = (idx: number, name: string) => {
    const newOpts = [...options];
    newOpts[idx].name = name;
    setOptions(newOpts);
  };
  const updateOptionValue = (optIdx: number, valIdx: number, field: string, val: any) => {
    const newOpts = [...options];
    newOpts[optIdx].values[valIdx] = { ...newOpts[optIdx].values[valIdx], [field]: val };
    setOptions(newOpts);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseNumber(formData.price);
    const discountPrice = parseNumber(formData.discount_price);

    if (discountPrice > 0 && discountPrice >= price) {
      alert('O preço de desconto deve ser menor que o preço normal.');
      return;
    }

    const payload = {
      ...formData,
      price,
      discount_price: discountPrice > 0 ? discountPrice : null,
      category_id: parseInt(formData.category_id as string),
      images: formData.images.map((url, i) => ({ url, is_primary: i === 0 })),
      options: options.map(opt => ({
         name: opt.name,
         values: opt.values.map(val => ({
           ...val,
           image_url: val.image_url?.trim() === '' ? null : val.image_url
         }))
      }))
    };
    
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="admin-form" style={{ maxWidth: '1000px', width: '100%' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '32px' }}>
        <div>
          <h3 style={{ marginBottom: '24px' }}>Informações Básicas</h3>
          
          <div className="form-group">
            <label>NOME DO PRODUTO</label>
            <input name="name" value={formData.name} onChange={handleNameChange} required placeholder="Ex: Poltrona Charles Eames" />
          </div>

          <div className="form-group">
            <label>SLUG (URL-FRIENDLY)</label>
            <input name="slug" value={formData.slug} onChange={handleChange} placeholder="ex: poltrona-charles-eames" required />
            <small style={{ color: '#888', fontSize: '11px', marginTop: '4px', display: 'block' }}>URL gerada automaticamente baseada no nome.</small>
          </div>

          <div className="form-group">
            <label>DESCRIÇÃO</label>
            <textarea name="description" value={formData.description} onChange={handleChange} rows={5} required placeholder="Descreva os materiais, acabamento e inspiração da peça..." />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
            <div className="form-group">
              <label>PREÇO (R$)</label>
              <input type="text" inputMode="decimal" name="price" value={formData.price} onChange={handleChange} placeholder="Ex: 10,00" required />
            </div>
            <div className="form-group">
              <label>PREÇO DESCONTO (R$)</label>
              <input type="text" inputMode="decimal" name="discount_price" value={formData.discount_price || ''} onChange={handleChange} placeholder="Ex: 9,00" />
            </div>
            <div className="form-group">
              <label>ESTOQUE</label>
              <input type="number" name="stock" value={formData.stock} onChange={handleChange} required />
            </div>
          </div>
          
          <div className="form-group">
            <label>CATEGORIA</label>
            <select name="category_id" value={formData.category_id} onChange={handleChange} required>
              <option value="" disabled>Selecione uma categoria</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '32px', background: '#f8f9fa', padding: '16px', borderRadius: '8px' }}>
             <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} id="is_active" style={{ width: 'auto' }} />
             <label htmlFor="is_active" style={{ marginBottom: 0, cursor: 'pointer' }}>Produto Ativo (Visível na loja)</label>
          </div>
        </div>

        <div>
          <h3 style={{ marginBottom: '24px' }}>Mídia</h3>
          <div className="form-group">
            <label>ADICIONAR IMAGEM (URL)</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                value={newImageUrl} 
                onChange={(e) => setNewImageUrl(e.target.value)} 
                placeholder="https://..." 
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addImage(); } }}
              />
              <button type="button" onClick={addImage} className="btn-primary" style={{ padding: '0 16px', width: 'auto' }}>+</button>
            </div>
            
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {formData.images.map((url, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f8f9fa', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                   <div style={{ width: '48px', height: '48px', borderRadius: '4px', overflow: 'hidden', flexShrink: 0 }}>
                     <img src={url} alt={`img-${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                   </div>
                   <div style={{ flex: 1, fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#64748b' }}>
                     {url}
                     {idx === 0 && <span style={{ display: 'inline-block', marginLeft: '8px', padding: '2px 6px', background: '#e2e8f0', borderRadius: '4px', fontSize: '10px', color: '#334155', fontWeight: 600 }}>Capa</span>}
                   </div>
                   <button type="button" onClick={() => removeImage(idx)} className="btn-icon-danger">&times;</button>
                </div>
              ))}

              {formData.images.length === 0 && (
                <div style={{ marginTop: '16px', width: '100%', height: '160px', backgroundColor: '#f8f9fa', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed #e2e8f0' }}>
                   <div style={{ fontSize: '32px', color: '#cbd5e1', marginBottom: '8px' }}>📸</div>
                   <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 500 }}>Nenhuma imagem</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '48px', paddingTop: '40px', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h3 style={{ marginBottom: '4px' }}>Variantes do Produto</h3>
            <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>Crie variações de cores, materiais ou tamanhos.</p>
          </div>
        </div>

        {options.map((option, optIdx) => (
           <div key={optIdx} className="variant-card">
              <div className="variant-header">
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label>NOME DA VARIAÇÃO</label>
                  <input value={option.name} onChange={(e) => updateOptionName(optIdx, e.target.value)} placeholder="Ex: Material do Tampo" required />
                </div>
                <button type="button" onClick={() => removeOption(optIdx)} className="btn-icon-danger" title="Remover Variação">
                  &times;
                </button>
              </div>

              <div className="variant-values-container">
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '12px', textTransform: 'uppercase' }}>Valores da Variação</label>
                
                {option.values.map((val, valIdx) => (
                  <div key={valIdx} className="variant-value-row" style={{ gridTemplateColumns: '2fr 1fr 1fr 2fr auto' }}>
                    <input placeholder="Ex: Mármore Nero" value={val.name} onChange={(e) => updateOptionValue(optIdx, valIdx, 'name', e.target.value)} required />
                    <input type="number" step="0.01" placeholder="Adicional R$" value={val.price_modifier} onChange={(e) => updateOptionValue(optIdx, valIdx, 'price_modifier', parseFloat(e.target.value))} required />
                    <input placeholder="Meta (Hex/URL)" value={val.meta} onChange={(e) => updateOptionValue(optIdx, valIdx, 'meta', e.target.value)} />
                    <input placeholder="Foto Específica (Opcional URL)" value={val.image_url || ''} onChange={(e) => updateOptionValue(optIdx, valIdx, 'image_url', e.target.value)} />
                    <button type="button" onClick={() => removeOptionValue(optIdx, valIdx)} className="btn-icon-danger" style={{ width: '28px', height: '28px', fontSize: '16px' }}>&times;</button>
                  </div>
                ))}
                
                <button type="button" onClick={() => addOptionValue(optIdx)} style={{ background: 'none', border: 'none', color: '#0f172a', cursor: 'pointer', fontSize: '13px', fontWeight: 600, marginTop: '8px', padding: '8px 0' }}>
                  + Adicionar Valor
                </button>
              </div>
           </div>
        ))}
        
        <button type="button" onClick={addOption} className="btn-add-variant">
          + Adicionar Grupo de Variação
        </button>
      </div>

      <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
        <button type="button" onClick={() => router.back()} style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, color: '#334155' }}>
          Cancelar
        </button>
        <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '12px 32px' }}>
          {loading ? 'Salvando...' : buttonText}
        </button>
      </div>
    </form>
  );
}
