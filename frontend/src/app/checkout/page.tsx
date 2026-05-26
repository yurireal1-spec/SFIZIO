"use client";

import React, { useState, useEffect } from 'react';
import { useCartStore } from '@/store/useCartStore';
import { CreditCard, Lock, ShieldCheck, CheckCircleConfig } from 'lucide-react';
import styles from './page.module.css';
import Link from 'next/link';

export default function CheckoutPage() {
  const { items, getTotalPrice, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [method, setMethod] = useState<'card' | 'pix'>('card');
  const [pixData, setPixData] = useState<{ qrCode: string, copyKey: string } | null>(null);
  
  const [cardData, setCardData] = useState({
      number: '',
      name: '',
      expiry: '',
      cvv: ''
  });

  const totalPrice = getTotalPrice();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setCardData(prev => ({ ...prev, [name]: value }));
  };

  const handlePixGeneration = () => {
    setLoading(true);
    // Simulação de chamada ao backend para gerar Pix via Mercado Pago
    setTimeout(() => {
        setPixData({
            qrCode: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=sfizio-pix-mock-key-123456",
            copyKey: "00020126580014BR.GOV.BCB.PIX0136e3a0c5c3e0e0a5c3e0e0a5c3e0e0a5c3520400005303986540510.005802BR5913SFIZIO LOUNGE6009SAO PAULO62070503***6304E1B1"
        });
        setLoading(false);
        
        // Simulação de confirmação automática após 6 segundos (O usuário pediu automático)
        setTimeout(() => {
            setSuccess(true);
            setTimeout(() => {
                clearCart();
                window.location.href = '/';
            }, 3000);
        }, 6000);
    }, 1500);
  };

  const handlePay = async (e: React.FormEvent) => {
      e.preventDefault();
      if (method === 'pix') {
          handlePixGeneration();
          return;
      }
      
      setLoading(true);
      // Simulação de processamento via Mercado Pago (Cartão)
      try {
          const orderData = {
              shipping_address: "Alameda dos Jardins, 1000",
              total_price: totalPrice,
              items: items.map(item => ({
                  product_id: item.product.id,
                  quantity: item.quantity,
                  unit_price: item.product.discount_price || item.product.price,
                  selected_options: JSON.stringify(item.selectedOptions)
              }))
          };

          const response = await fetch('http://localhost:8000/api/v1/orders/', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(orderData)
          });

          if (response.ok) {
              setSuccess(true);
              setTimeout(() => {
                  clearCart();
                  window.location.href = '/';
              }, 4000);
          } else {
              alert("Erro ao processar pagamento. Tente novamente.");
          }
      } catch (err) {
          console.error(err);
          alert("Erro de conexão.");
      } finally {
          setLoading(false);
      }
  };

  if (items.length === 0 && !success) {
      return (
          <div className={styles.wrapper}>
              <div className={styles.container}>
                  <p>Sua sacola está vazia. <Link href="/">Voltar para a Coleção</Link></p>
              </div>
          </div>
      );
  }

  if (success) {
      return (
          <div className={styles.wrapper}>
              <div className={styles.successScreen} style={{ textAlign: 'center', padding: '100px 0' }}>
                  <CheckCircleConfig size={80} color="#b8860b" style={{ marginBottom: '24px' }} />
                  <h1 className={styles.title}>Pedido Confirmado</h1>
                  <p style={{ color: 'var(--text-secondary)' }}>
                      Sua peça SFIZIO já está sendo preparada. <br /> Recebemos sua confirmação de pagamento via Mercado Pago.
                  </p>
              </div>
          </div>
      );
  }

  return (
    <main className={styles.wrapper}>
      <div className={styles.container}>
        {/* Left Side: Forms */}
        <div className={styles.forms}>
            <h1 className={styles.title}>Checkout</h1>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>1. Endereço de Entrega</h2>
                <div className={styles.formGrid}>
                    <div className={styles.inputGroup + ' ' + styles.fullWidth}>
                        <label>CEP</label>
                        <input type="text" placeholder="00000-000" defaultValue="01419-001" required />
                    </div>
                    <div className={styles.inputGroup + ' ' + styles.fullWidth}>
                        <label>Endereço Completo</label>
                        <input type="text" placeholder="Alameda, Rua ou Avenida..." defaultValue="Alameda Santos, 1200 - Jardins, SP" required />
                    </div>
                </div>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>2. Método de Pagamento</h2>
                
                <div className={styles.methodSelector}>
                    <button 
                        className={method === 'card' ? styles.activeMethod : ''} 
                        onClick={() => setMethod('card')}
                    >
                        <CreditCard size={18} /> Cartão de Crédito
                    </button>
                    <button 
                        className={method === 'pix' ? styles.activeMethod : ''} 
                        onClick={() => setMethod('pix')}
                    >
                        <span className={styles.pixIcon}>X</span> Pix
                    </button>
                </div>

                {method === 'card' ? (
                    <>
                        <div className={styles.cardPreview}>
                            <div className={styles.cardChip} />
                            <div className={styles.cardNumber}>
                                {cardData.number || '•••• •••• •••• ••••'}
                            </div>
                            <div className={styles.cardBottom}>
                                <span>{cardData.name || 'NOME DO TITULAR'}</span>
                                <span>{cardData.expiry || 'MM/AA'}</span>
                            </div>
                        </div>

                        <form onSubmit={handlePay} className={styles.formGrid}>
                            <div className={styles.inputGroup + ' ' + styles.fullWidth}>
                                <label>Número do Cartão</label>
                                <input name="number" type="text" maxLength={19} value={cardData.number} onChange={handleInputChange} placeholder="0000 0000 0000 0000" required />
                            </div>
                            <div className={styles.inputGroup + ' ' + styles.fullWidth}>
                                <label>Nome no Cartão</label>
                                <input name="name" type="text" value={cardData.name} onChange={handleInputChange} placeholder="Ex: NOME SOBRENOME" required />
                            </div>
                            <div className={styles.inputGroup}>
                                <label>Validade</label>
                                <input name="expiry" type="text" maxLength={5} value={cardData.expiry} onChange={handleInputChange} placeholder="MM/AA" required />
                            </div>
                            <div className={styles.inputGroup}>
                                <label>CVC</label>
                                <input name="cvv" type="text" maxLength={4} value={cardData.cvv} onChange={handleInputChange} placeholder="000" required />
                            </div>

                            <button type="submit" className={styles.payButton} disabled={loading}>
                                {loading ? 'Processando...' : `Pagar R$ ${totalPrice.toLocaleString('pt-BR')}`}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className={styles.pixArea}>
                        {!pixData ? (
                            <div className={styles.pixInstruction}>
                                <p>Ao clicar abaixo, um QR Code será gerado para o pagamento instantâneo via Pix.</p>
                                <button onClick={handlePixGeneration} className={styles.payButton} disabled={loading}>
                                    {loading ? 'Gerando...' : 'Gerar QR Code Pix'}
                                </button>
                            </div>
                        ) : (
                            <div className={styles.pixDisplay}>
                                <div className={styles.qrFrame}>
                                    <img src={pixData.qrCode} alt="QR Code Pix" />
                                </div>
                                <p className={styles.pixHelp}>Escaneie o código acima com o app do seu banco</p>
                                <div className={styles.copyArea}>
                                    <input type="text" readOnly value={pixData.copyKey} />
                                    <button onClick={() => navigator.clipboard.writeText(pixData.copyKey)}>Copiar Código</button>
                                </div>
                                <div className={styles.waitingPayment}>
                                    <div className={styles.spinner} />
                                    <span>Aguardando confirmação automática...</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                <div style={{ marginTop: '20px', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <Lock size={14} /> Pagamento Seguro via Mercado Pago
                </div>
            </section>
        </div>

        {/* Right Side: Summary */}
        <aside className={styles.summaryPanel}>
            <h2 className={styles.sectionTitle}>Resumo do Pedido</h2>
            <div className={styles.itemsList}>
                {items.map((item, idx) => {
                    const uniqueKey = `${item.product.id}-${idx}`;
                    return (
                        <div key={uniqueKey} className={styles.itemRow}>
                            <div className={styles.itemImg} style={{ backgroundImage: `url(${item.product.images[0]?.url})` }} />
                            <div className={styles.itemDetails}>
                                <h4>{item.product.name}</h4>
                                <div className={styles.itemMeta}>
                                    {Object.entries(item.selectedOptions || {}).map(([optId, valId]) => {
                                        const option = item.product.options.find(o => o.id === parseInt(optId));
                                        const value = option?.values.find(v => v.id === valId);
                                        return <p key={optId}>{option?.name}: {value?.name}</p>;
                                    })}
                                </div>
                                <p className={styles.itemPrice}>{item.quantity}x R$ {item.product.price.toLocaleString('pt-BR')}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className={styles.totalSection}>
                <div className={styles.totalRow}>
                    <span>Subtotal</span>
                    <span>R$ {totalPrice.toLocaleString('pt-BR')}</span>
                </div>
                <div className={styles.totalRow}>
                    <span>Frete Premium</span>
                    <span>Grátis</span>
                </div>
                <div className={styles.totalRow + ' ' + styles.grandTotal} style={{ marginTop: '20px' }}>
                    <span>Total</span>
                    <span>R$ {totalPrice.toLocaleString('pt-BR')}</span>
                </div>
                
                <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem' }}>
                        <ShieldCheck size={16} color="#b8860b" /> Proteção ao Comprador SFIZIO
                    </div>
                </div>
            </div>
        </aside>
      </div>
    </main>
  );
}
