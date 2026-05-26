'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import ProductForm from '@/components/admin/ProductForm';

export default function NewProduct() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await api.get('/products/categories/');
        setCategories(data);
      } catch (err) {
        console.error('Error fetching categories', err);
      }
    };
    fetchCategories();
  }, []);

  const handleSubmit = async (payload: any) => {
    setLoading(true);
    try {
      await api.post('/products/', payload);
      alert('Produto cadastrado com sucesso!');
      window.location.href = '/admin/products';
    } catch (err: any) {
      alert('Erro ao criar produto: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '32px' }}>Novo Produto</h1>
      <ProductForm 
         categories={categories} 
         onSubmit={handleSubmit} 
         loading={loading} 
         buttonText="Criar Produto"
      />
    </div>
  );
}
