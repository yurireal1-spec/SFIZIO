import { Product } from '@/types';

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Sofá Nuage Curvo",
    slug: "sofa-nuage-curvo",
    price: 18500,
    description: "Inspirado na fluidez das nuvens, o Sofá Nuage combina o minimalismo contemporâneo com o conforto extremo do bouclé italiano. \n\nSua estrutura curva permite uma integração orgânica com o ambiente, tornando-o a peça central de livings sofisticados. Cada unidade é estofada manualmente por artesãos especializados.",
    category: { id: 1, name: "Sofás", slug: "sofas" },
    is_active: true,
    stock: 5,
    images: [{ id: 1, url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc", is_primary: true }],
    options: [
      {
        id: 1,
        name: "Tecido",
        values: [
          { id: 1, name: "Bouclé Off-White", meta: "#f5f5f5", price_modifier: 0 },
          { id: 2, name: "Bouclé Cinza Luna", meta: "#d1d1d1", price_modifier: 0 },
          { id: 3, name: "Veludo Sage", meta: "#b2bcaf", price_modifier: 1500 }
        ]
      },
      {
        id: 4,
        name: "Base / Pés",
        values: [
          { id: 8, name: "Latão Escovado", meta: "#d4af37", price_modifier: 0 },
          { id: 9, name: "Nogueira Maciça", meta: "#5d4037", price_modifier: 0 }
        ]
      }
    ]
  },
  {
    id: 2,
    name: "Mesa Pietra Mármore",
    slug: "mesa-pietra-marmore",
    price: 24900,
    description: "A Mesa Pietra é uma celebração da matéria-prima bruta refinada pelo design. O tampo em mármore Calacatta selecionado apresenta veios únicos, garantindo que cada peça seja uma obra de arte exclusiva. \n\nA base robusta em carvalho ebanizado oferece o contraponto perfeito à leveza visual do mármore.",
    category: { id: 2, name: "Mesas", slug: "mesas" },
    is_active: true,
    stock: 2,
    images: [{ id: 2, url: "https://images.unsplash.com/photo-1577140917170-285929fb55b7", is_primary: true }],
    options: [
      {
        id: 2,
        name: "Mármore do Tampo",
        values: [
          { id: 4, name: "Calacatta Oro", meta: "#ffffff", price_modifier: 0 },
          { id: 5, name: "Nero Marquina", meta: "#1a1a1a", price_modifier: 2000 }
        ]
      },
      {
        id: 5,
        name: "Acabamento da Base",
        values: [
          { id: 10, name: "Bronze Champagne", meta: "#b87333", price_modifier: 0 },
          { id: 11, name: "Preto Carbono", meta: "#121212", price_modifier: 0 }
        ]
      }
    ]
  },
  {
    id: 3,
    name: "Poltrona Gaia",
    slug: "poltrona-gaia",
    price: 8900,
    discount_price: 7500,
    description: "A Poltrona Gaia une ergonomia e estética escandinava. Construída em nogueira maciça com encaixes tradicionais de marcenaria, ela oferece durabilidade para gerações. \n\nO assento em couro natural envelhece com dignidade, desenvolvendo uma pátina que conta a história de seu uso.",
    category: { id: 3, name: "Cadeiras", slug: "cadeiras" },
    is_active: true,
    stock: 10,
    images: [{ id: 3, url: "https://images.unsplash.com/photo-1598191383441-1f427ad44410", is_primary: true }],
    options: [
      {
        id: 3,
        name: "Revestimento",
        values: [
          { id: 6, name: "Couro Natural Mel", meta: "#c68a53", price_modifier: 0 },
          { id: 7, name: "Couro Café", meta: "#4b3621", price_modifier: 0 }
        ]
      },
      {
        id: 6,
        name: "Madeira da Estrutura",
        values: [
          { id: 12, name: "Nogueira Natural", meta: "#8d6e63", price_modifier: 0 },
          { id: 13, name: "Carvalho Ebanizado", meta: "#212121", price_modifier: 0 }
        ]
      }
    ]
  }
];

export interface CategoryCard {
    id: number;
    name: string;
    slug: string;
    description: string;
    imageUrl: string;
}

export const MOCK_CATEGORIES: CategoryCard[] = [
    {
        id: 1,
        name: "Sofás Living",
        slug: "sofas-living",
        description: "Encontre a harmonia perfeita entre formas orgânicas e o conforto absoluto dos materiais nobres.",
        imageUrl: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e"
    },
    {
        id: 2,
        name: "Mesas de Jantar",
        slug: "mesas-de-jantar",
        description: "Peças esculturais em mármore e metais que transformam encontros em experiências artísticas.",
        imageUrl: "https://images.unsplash.com/photo-1530018607912-eff2df114f11"
    },
    {
        id: 3,
        name: "Poltronas de Autor",
        slug: "poltronas-de-autor",
        description: "A assinatura do seu ambiente através de linhas icônicas e madeiras certificadas.",
        imageUrl: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7"
    }
];
