'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/services/api';
import ProductForm, { ProductFormData, ProductOption } from '@/components/admin/ProductForm';

export default function EditProduct() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  const [initialData, setInitialData] = useState<ProductFormData | undefined>();
  const [initialOptions, setInitialOptions] = useState<ProductOption[]>([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const cats = await api.get('/products/categories/');
        setCategories(cats);

        if (id) {
          const productsResponse = await api.get('/products/?limit=1000');
          const products = productsResponse.items || [];
          const product = products.find((p: any) => p.id === parseInt(id as string));
          
          if (product) {
            setInitialData({
              name: product.name,
              slug: product.slug,
              description: product.description,
              price: product.price,
              discount_price: product.discount_price || 0,
              stock: product.stock,
              category_id: product.category_id,
              is_active: product.is_active,
              images: product.images?.map((img: any) => img.url) || []
            });

            if (product.options) {
               setInitialOptions(product.options.map((opt: any) => ({
                 name: opt.name,
                 values: opt.values.map((v: any) => ({
                    name: v.name,
                    price_modifier: v.price_modifier,
                    meta: v.meta || '',
                    image_url: v.image_url || ''
                 }))
               })));
            }
          } else {
            alert('Produto não encontrado');
            router.push('/admin/products');
          }
        }
      } catch (err) {
        console.error('Error fetching data', err);
      } finally {
        setFetching(false);
      }
    };
    fetchInitialData();
  }, [id, router]);

  const handleSubmit = async (payload: any) => {
    setLoading(true);
    try {
      await api.put(`/products/${id}`, payload);
      alert('Produto atualizado com sucesso!');
      window.location.href = '/admin/products';
    } catch (err: any) {
      alert('Erro ao atualizar produto: ' + err.message);
      setLoading(false);
    }
  };

  if (fetching) return <div style={{ padding: '40px' }}>Carregando produto...</div>;

  return (
    <div>
      <h1 style={{ marginBottom: '32px' }}>Editar Produto #{id}</h1>
      <ProductForm 
         initialData={initialData}
         initialOptions={initialOptions}
         categories={categories} 
         onSubmit={handleSubmit} 
         loading={loading} 
         buttonText="Salvar Alterações"
      />
    </div>
  );
}
