"use client";

import React, { useState, useEffect } from 'react';
import { useCartStore } from '@/store/useCartStore';
import { CreditCard, Lock, ShieldCheck, CheckCircle } from 'lucide-react';
import styles from './page.module.css';
import Link from 'next/link';
import { api } from '@/services/api';

declare global {
  interface Window {
    MercadoPago?: any;
  }
}

import { formatCurrency, parseNumber } from '@/utils/format';

export default function CheckoutPage() {
  const { items, getTotalPrice, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
    const [method, setMethod] = useState<'card' | 'pix'>('pix');
  const [pixData, setPixData] = useState<{ qrCode: string, copyKey: string } | null>(null);
    const [cardData, setCardData] = useState({ number: '', name: '', expiry: '', cvv: '' });
  

  const [clientData, setClientData] = useState({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      cpf: ''
  });
  const [addressData, setAddressData] = useState({
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      cep: ''
  });

  const totalPrice = getTotalPrice();

  const loadMercadoPago = async () => {
    const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;
    if (!publicKey) {
      throw new Error('Chave pública do Mercado Pago não configurada. Defina NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY no Vercel.');
    }

    if (!window.MercadoPago) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://sdk.mercadopago.com/js/v2';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Não foi possível carregar o SDK do Mercado Pago.'));
        document.head.appendChild(script);
      });
    }

    if (!window.MercadoPago) {
      throw new Error('SDK do Mercado Pago indisponível.');
    }

    return new window.MercadoPago(publicKey, { locale: 'pt-BR' });
  };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const { name, value } = e.target;
            setCardData(prev => ({ ...prev, [name]: value }));
    };

  const validateFields = () => {
      if (!clientData.firstName.trim() || !clientData.lastName.trim()) {
          alert("Por favor, insira nome e sobrenome.");
          return false;
      }
      if (!clientData.email.trim()) {
          alert("Por favor, insira o seu e-mail.");
          return false;
      }
      if (!clientData.phone.trim()) {
          alert("Por favor, insira o seu telefone.");
          return false;
      }
      if (!clientData.cpf.trim()) {
          alert("Por favor, insira o seu CPF.");
          return false;
      }
      if (!addressData.cep.trim() || !addressData.street.trim() || !addressData.number.trim()) {
          alert("Por favor, insira o seu CEP.");
          return false;
      }
      return true;
  };

    const handleCheckoutPro = async () => {
    if (!validateFields()) return;

    setLoading(true);
    try {
        const fullName = `${clientData.firstName.trim()} ${clientData.lastName.trim()}`;
        const shippingAddress = [
            `${addressData.street}, ${addressData.number}`,
            addressData.complement,
            addressData.neighborhood,
            `${addressData.city} - ${addressData.state}`,
            `CEP: ${addressData.cep}`
        ].filter(Boolean).join(' - ');
        const orderData = {
            shipping_address: shippingAddress,
            total_price: totalPrice,
            client_name: fullName,
            client_email: clientData.email,
            client_phone: clientData.phone,
            items: items.map(item => ({
                product_id: item.product.id,
                quantity: item.quantity,
                unit_price: item.unitPrice,
                selected_options: JSON.stringify(item.selectedOptions)
            }))
        };

        const data = await api.post('/orders/', orderData);

        if (method === 'card') {
            const mp = await loadMercadoPago();
            const expiryParts = cardData.expiry.split('/');
            const expirationMonth = expiryParts[0]?.trim();
            const expirationYear = expiryParts[1]?.trim();

            const tokenPayload = {
                cardNumber: cardData.number.replace(/\s+/g, ''),
                cardholderName: cardData.name,
                expirationMonth,
                expirationYear: expirationYear?.length === 2 ? `20${expirationYear}` : expirationYear,
                securityCode: cardData.cvv,
                identificationType: 'CPF',
                identificationNumber: clientData.cpf.replace(/\D/g, ''),
            };

            const tokenResult = await mp.fields.createCardToken(tokenPayload);
            if (!tokenResult?.id) {
                throw new Error('Não foi possível tokenizar o cartão. Verifique os dados informados.');
            }

            const payment = await api.post(`/orders/${data.id}/payment`, {
                method: 'card',
                email: clientData.email,
                first_name: clientData.firstName.trim(),
                last_name: clientData.lastName.trim(),
                cpf: clientData.cpf.replace(/\D/g, ''),
                token: tokenResult.id,
                payment_method_id: tokenResult.payment_method_id,
                installments: 1,
            });

            if (payment.status === 'approved' || payment.status === 'pending') {
                setSuccess(true);
                clearCart();
                return;
            }

            throw new Error('Pagamento não confirmado pelo Mercado Pago.');
        }

        const checkout = await api.post(`/orders/${data.id}/checkout`, {
            first_name: clientData.firstName.trim(),
            last_name: clientData.lastName.trim(),
            cpf: clientData.cpf.replace(/\D/g, ''),
            address: {
                street: addressData.street.trim(),
                number: addressData.number.trim(),
                complement: addressData.complement.trim(),
                neighborhood: addressData.neighborhood.trim(),
                city: addressData.city.trim(),
                state: addressData.state.trim(),
                cep: addressData.cep.trim()
            }
        });
        window.location.assign(checkout.sandbox_init_point || checkout.init_point);
    } catch (err: any) {
        console.error(err);
        alert(err.message || "Erro de conexão.");
    } finally {
        setLoading(false);
    }
  };

  const handlePay = async (e: React.FormEvent) => {
      e.preventDefault();
      handleCheckoutPro();
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
                  <CheckCircle size={80} color="#b8860b" style={{ marginBottom: '24px' }} />
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
                <h2 className={styles.sectionTitle}>1. Dados de Contato</h2>
                <div className={styles.formGrid}>
                    <div className={styles.inputGroup + ' ' + styles.fullWidth}>
                        <label>Nome</label>
                        <input 
                            type="text" 
                            placeholder="Seu nome" 
                            value={clientData.firstName} 
                            onChange={(e) => setClientData(prev => ({ ...prev, firstName: e.target.value }))} 
                            required 
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Sobrenome</label>
                        <input type="text" placeholder="Seu sobrenome" value={clientData.lastName} onChange={(e) => setClientData(prev => ({ ...prev, lastName: e.target.value }))} required />
                    </div>
                    <div className={styles.inputGroup}>
                        <label>E-mail</label>
                        <input 
                            type="email" 
                            placeholder="seuemail@exemplo.com" 
                            value={clientData.email} 
                            onChange={(e) => setClientData(prev => ({ ...prev, email: e.target.value }))} 
                            required 
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Telefone / WhatsApp</label>
                        <input 
                            type="text" 
                            placeholder="(11) 99999-9999" 
                            value={clientData.phone} 
                            onChange={(e) => setClientData(prev => ({ ...prev, phone: e.target.value }))} 
                            required 
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label>CPF</label>
                        <input type="text" inputMode="numeric" placeholder="000.000.000-00" value={clientData.cpf} onChange={(e) => setClientData(prev => ({ ...prev, cpf: e.target.value }))} required />
                    </div>
                </div>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>2. Endereço de Entrega</h2>
                <div className={styles.formGrid}>
                    <div className={styles.inputGroup + ' ' + styles.fullWidth}>
                        <label>CEP</label>
                        <input 
                            type="text" 
                            placeholder="00000-000" 
                            value={addressData.cep} 
                            onChange={(e) => setAddressData(prev => ({ ...prev, cep: e.target.value }))} 
                            required 
                        />
                    </div>
                    <div className={styles.inputGroup}><label>Rua / Avenida</label><input type="text" value={addressData.street} onChange={(e) => setAddressData(prev => ({ ...prev, street: e.target.value }))} required /></div>
                    <div className={styles.inputGroup}><label>Número</label><input type="text" value={addressData.number} onChange={(e) => setAddressData(prev => ({ ...prev, number: e.target.value }))} required /></div>
                    <div className={styles.inputGroup}><label>Complemento</label><input type="text" value={addressData.complement} onChange={(e) => setAddressData(prev => ({ ...prev, complement: e.target.value }))} /></div>
                    <div className={styles.inputGroup}><label>Bairro</label><input type="text" value={addressData.neighborhood} onChange={(e) => setAddressData(prev => ({ ...prev, neighborhood: e.target.value }))} /></div>
                    <div className={styles.inputGroup}><label>Cidade</label><input type="text" value={addressData.city} onChange={(e) => setAddressData(prev => ({ ...prev, city: e.target.value }))} required /></div>
                    <div className={styles.inputGroup}><label>Estado</label><input type="text" maxLength={2} value={addressData.state} onChange={(e) => setAddressData(prev => ({ ...prev, state: e.target.value.toUpperCase() }))} required /></div>
                </div>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>3. Método de Pagamento</h2>
                
                <div className={styles.methodSelector}>
                    <button 
                        className={method === 'card' ? styles.activeMethod : ''} 
                        onClick={() => setMethod('card')}
                    >
                        <CreditCard size={18} /> Cartão
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
                                {loading ? 'Processando...' : `Pagar ${formatCurrency(totalPrice)}`}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className={styles.pixArea}>
                        <div className={styles.pixInstruction}>
                            <p>Você será redirecionado ao Mercado Pago para concluir o pagamento via Pix.</p>
                            <button onClick={handleCheckoutPro} className={styles.payButton} disabled={loading}>
                                {loading ? 'Abrindo Mercado Pago...' : 'Continuar para o Mercado Pago'}
                            </button>
                        </div>
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
                    const primaryImage = item.product.images?.find(img => img.is_primary)?.url || item.product.images?.[0]?.url;
                    return (
                        <div key={uniqueKey} className={styles.itemRow}>
                            <div className={styles.itemImg} style={{ backgroundImage: primaryImage ? `url(${primaryImage})` : 'none' }} />
                            <div className={styles.itemDetails}>
                                <h4>{item.product.name}</h4>
                                <div className={styles.itemMeta}>
                                    {Object.entries(item.selectedOptions || {}).map(([optId, valId]) => {
                                        const option = item.product.options.find(o => o.id === parseInt(optId));
                                        const value = option?.values.find(v => v.id === valId);
                                        return <p key={optId}>{option?.name}: {value?.name}</p>;
                                    })}
                                </div>
                                <p className={styles.itemPrice}>{item.quantity}x {formatCurrency(item.unitPrice)}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className={styles.totalSection}>
                <div className={styles.totalRow}>
                    <span>Subtotal</span>
                    <span>{formatCurrency(totalPrice)}</span>
                </div>
                <div className={styles.totalRow}>
                    <span>Frete Premium</span>
                    <span>Grátis</span>
                </div>
                <div className={styles.totalRow + ' ' + styles.grandTotal} style={{ marginTop: '20px' }}>
                    <span>Total</span>
                    <span>{formatCurrency(totalPrice)}</span>
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
