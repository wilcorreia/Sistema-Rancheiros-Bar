import { Product, Table, Order, PaymentRecord } from '../types';

export const INITIAL_PRODUCTS: Product[] = [
  // ESPETINHO
  {
    id: 'p-esp-1',
    name: 'Espetinho de Carne',
    category: 'Espetinho',
    price: 8.90,
    description: 'Espetinho de carne bovina na brasa.',
    available: true,
    printDestination: 'KITCHEN'
  },
  {
    id: 'p-esp-2',
    name: 'Espetinho de Frango',
    category: 'Espetinho',
    price: 7.90,
    description: 'Espetinho de peito de frango temperado na brasa.',
    available: true,
    printDestination: 'KITCHEN'
  },
  {
    id: 'p-esp-3',
    name: 'Espetinho de Tulipa',
    category: 'Espetinho',
    price: 8.90,
    description: 'Tulipa de frango suculenta assada na brasa.',
    available: true,
    printDestination: 'KITCHEN'
  },
  {
    id: 'p-esp-4',
    name: 'Espetinho de Linguiça',
    category: 'Espetinho',
    price: 7.90,
    description: 'Linguiça assada na brasa.',
    available: true,
    printDestination: 'KITCHEN'
  },
  {
    id: 'p-esp-5',
    name: 'Espetinho de Coração',
    category: 'Espetinho',
    price: 8.90,
    description: 'Coração de frango temperado na grelha.',
    available: true,
    printDestination: 'KITCHEN'
  },
  {
    id: 'p-esp-6',
    name: 'Queijo Coalho',
    category: 'Espetinho',
    price: 7.90,
    description: 'Espetinho de queijo coalho dourado na brasa.',
    available: true,
    printDestination: 'KITCHEN'
  },
  {
    id: 'p-esp-7',
    name: 'Pão de Alho',
    category: 'Espetinho',
    price: 7.90,
    description: 'Pão de alho recheado e tostado na brasa.',
    available: true,
    printDestination: 'KITCHEN'
  },
  {
    id: 'p-esp-8',
    name: 'Medalhão de Carne',
    category: 'Espetinho',
    price: 13.90,
    description: 'Medalhão de carne bovina envolvido em bacon crocante.',
    available: true,
    printDestination: 'KITCHEN'
  },
  {
    id: 'p-esp-9',
    name: 'Medalhão de Frango',
    category: 'Espetinho',
    price: 13.90,
    description: 'Medalhão de frango envolvido em bacon crocante.',
    available: true,
    printDestination: 'KITCHEN'
  },

  // JANTINHA
  {
    id: 'p-jan-1',
    name: 'Jantinha Simples',
    category: 'Jantinha',
    price: 21.90,
    description: 'Arroz, Farofa, Vinagrete, Creme de Alho, Mandioca + 1 Espetinho (Carne, Frango ou Linguiça).',
    available: true,
    printDestination: 'KITCHEN'
  },

  // ACOMPANHAMENTOS
  {
    id: 'p-ac-1',
    name: 'Arroz',
    category: 'Acompanhamentos',
    price: 3.50,
    description: 'Porção de arroz soltinho.',
    available: true,
    printDestination: 'KITCHEN'
  },
  {
    id: 'p-ac-2',
    name: 'Mandioca',
    category: 'Acompanhamentos',
    price: 3.50,
    description: 'Mandioca cozida macia.',
    available: true,
    printDestination: 'KITCHEN'
  },
  {
    id: 'p-ac-3',
    name: 'Vinagrete',
    category: 'Acompanhamentos',
    price: 3.50,
    description: 'Porção de vinagrete fresco.',
    available: true,
    printDestination: 'KITCHEN'
  },
  {
    id: 'p-ac-4',
    name: 'Farofa',
    category: 'Acompanhamentos',
    price: 3.50,
    description: 'Farofa temperada da casa.',
    available: true,
    printDestination: 'KITCHEN'
  },
  {
    id: 'p-ac-5',
    name: 'Creme de Alho',
    category: 'Acompanhamentos',
    price: 3.50,
    description: 'Creme de alho artesanal.',
    available: true,
    printDestination: 'KITCHEN'
  },
  {
    id: 'p-ac-6',
    name: 'Molho Rosé',
    category: 'Acompanhamentos',
    price: 2.50,
    description: 'Porção de molho rosé.',
    available: true,
    printDestination: 'KITCHEN'
  },

  // PASTÉIS TRADICIONAIS
  {
    id: 'p-pas-1',
    name: 'Pastel de Carne',
    category: 'Pastéis Tradicionais',
    price: 12.00,
    description: 'Pastel de feira crocante recheado com carne moída.',
    available: true,
    printDestination: 'KITCHEN'
  },
  {
    id: 'p-pas-2',
    name: 'Pastel de Frango',
    category: 'Pastéis Tradicionais',
    price: 12.00,
    description: 'Pastel crocante recheado com frango desfiado.',
    available: true,
    printDestination: 'KITCHEN'
  },
  {
    id: 'p-pas-3',
    name: 'Pastel de Queijo',
    category: 'Pastéis Tradicionais',
    price: 12.00,
    description: 'Pastel recheado com bastante queijo derretido.',
    available: true,
    printDestination: 'KITCHEN'
  },
  {
    id: 'p-pas-4',
    name: 'Pastel de Pizza',
    category: 'Pastéis Tradicionais',
    price: 12.00,
    description: 'Pastel recheado com queijo, presunto, tomate e orégano.',
    available: true,
    printDestination: 'KITCHEN'
  },
  {
    id: 'p-pas-5',
    name: 'Pastel Carne c/ Queijo',
    category: 'Pastéis Tradicionais',
    price: 13.00,
    description: 'Pastel de carne moída com queijo derretido.',
    available: true,
    printDestination: 'KITCHEN'
  },
  {
    id: 'p-pas-6',
    name: 'Pastel Frango c/ Queijo',
    category: 'Pastéis Tradicionais',
    price: 13.00,
    description: 'Pastel de frango desfiado com queijo derretido.',
    available: true,
    printDestination: 'KITCHEN'
  },
  {
    id: 'p-pas-7',
    name: 'Pastel Presunto e Queijo',
    category: 'Pastéis Tradicionais',
    price: 12.00,
    description: 'Pastel recheado com presunto e queijo derretido.',
    available: true,
    printDestination: 'KITCHEN'
  },
  {
    id: 'p-pas-8',
    name: 'Pastel Frango c/ Catupiry',
    category: 'Pastéis Tradicionais',
    price: 14.00,
    description: 'Pastel de frango desfiado com Catupiry cremoso.',
    available: true,
    printDestination: 'KITCHEN'
  },
  {
    id: 'p-pas-9',
    name: 'Pastel Carne c/ Catupiry',
    category: 'Pastéis Tradicionais',
    price: 14.00,
    description: 'Pastel de carne moída com Catupiry cremoso.',
    available: true,
    printDestination: 'KITCHEN'
  },
  {
    id: 'p-pas-10',
    name: 'Pastel Frango c/ Palmito',
    category: 'Pastéis Tradicionais',
    price: 14.00,
    description: 'Pastel de frango desfiado com palmito.',
    available: true,
    printDestination: 'KITCHEN'
  },

  // PASTÉIS DOCES
  {
    id: 'p-doc-1',
    name: 'Pastel Churros',
    category: 'Pastéis Doces',
    price: 6.00,
    description: 'Pastel doce sabor churros com canela e açúcar.',
    available: true,
    printDestination: 'DESSERT'
  },
  {
    id: 'p-doc-2',
    name: 'Pastel Doce de Leite',
    category: 'Pastéis Doces',
    price: 15.00,
    description: 'Pastel recheado com doce de leite cremoso.',
    available: true,
    printDestination: 'DESSERT'
  },
  {
    id: 'p-doc-3',
    name: 'Pastel Romeo e Julieta',
    category: 'Pastéis Doces',
    price: 15.00,
    description: 'Pastel recheado com queijo derretido e goiabada.',
    available: true,
    printDestination: 'DESSERT'
  },
  {
    id: 'p-doc-4',
    name: 'Pastel Banoffe',
    category: 'Pastéis Doces',
    price: 15.00,
    description: 'Pastel recheado com banana, doce de leite e canela.',
    available: true,
    printDestination: 'DESSERT'
  },
  {
    id: 'p-doc-5',
    name: 'Pastel Banana c/ Canela',
    category: 'Pastéis Doces',
    price: 15.00,
    description: 'Pastel recheado com banana e canela.',
    available: true,
    printDestination: 'DESSERT'
  },
  {
    id: 'p-doc-6',
    name: 'Pastel Morango c/ Chocolate',
    category: 'Pastéis Doces',
    price: 15.00,
    description: 'Pastel recheado com morango fresco e creme de chocolate.',
    available: true,
    printDestination: 'DESSERT'
  },

  // PORÇÕES
  {
    id: 'p-por-1',
    name: 'Batata Simples 250g',
    category: 'Porções',
    price: 16.00,
    description: 'Porção de 250g de batata frita crocante.',
    available: true,
    printDestination: 'KITCHEN'
  },
  {
    id: 'p-por-2',
    name: 'Batata Simples 500g',
    category: 'Porções',
    price: 29.90,
    description: 'Porção de 500g de batata frita crocante.',
    available: true,
    printDestination: 'KITCHEN'
  },

  // SUCOS E REFRI
  {
    id: 'p-suc-1',
    name: 'Suco Polpa 400ml',
    category: 'Sucos e Refri',
    price: 12.90,
    description: 'Sabores: Abacaxi, Abacaxi c/ Hortelã, Maracujá, Acerola, Goiaba e Cajú.',
    available: true,
    printDestination: 'BAR'
  },
  {
    id: 'p-suc-2',
    name: 'Suco Lata 290ml',
    category: 'Sucos e Refri',
    price: 5.50,
    description: 'Suco DelValle lata. Sabores: UVA e PÊSSEGO.',
    available: true,
    printDestination: 'BAR'
  },
  {
    id: 'p-ref-1',
    name: 'Coca Cola 1 Litro',
    category: 'Sucos e Refri',
    price: 8.00,
    description: 'Garrafa de Coca-Cola 1 Litro.',
    available: true,
    printDestination: 'BAR'
  },
  {
    id: 'p-ref-2',
    name: 'Refrigerante Lata',
    category: 'Sucos e Refri',
    price: 5.50,
    description: 'Coca Cola Original, sem Açúcar, Fanta, Guaraná Antártica, H2O lata.',
    available: true,
    printDestination: 'BAR'
  },
  {
    id: 'p-agu-1',
    name: 'Água sem Gás',
    category: 'Sucos e Refri',
    price: 3.00,
    description: 'Água mineral sem gás.',
    available: true,
    printDestination: 'BAR'
  },
  {
    id: 'p-agu-2',
    name: 'Água com Gás',
    category: 'Sucos e Refri',
    price: 3.50,
    description: 'Água mineral com gás.',
    available: true,
    printDestination: 'BAR'
  },
  {
    id: 'p-cop-1',
    name: 'Copo Completo',
    category: 'Sucos e Refri',
    price: 2.00,
    description: 'Copo com gelo e limão.',
    available: true,
    printDestination: 'BAR'
  },

  // CERVEJAS
  {
    id: 'p-cer-1',
    name: 'Brahma 600ml',
    category: 'Cervejas',
    price: 10.90,
    description: 'Cerveja Brahma 600ml trincando.',
    available: true,
    printDestination: 'BAR'
  },
  {
    id: 'p-cer-2',
    name: 'Amstel 600ml',
    category: 'Cervejas',
    price: 12.90,
    description: 'Cerveja Amstel 600ml gelada.',
    available: true,
    printDestination: 'BAR'
  },
  {
    id: 'p-cer-3',
    name: 'Original 600ml',
    category: 'Cervejas',
    price: 14.90,
    description: 'Cerveja Original 600ml gelada.',
    available: true,
    printDestination: 'BAR'
  },
  {
    id: 'p-cer-4',
    name: 'Heineken 600ml',
    category: 'Cervejas',
    price: 16.90,
    description: 'Cerveja Heineken 600ml gelada.',
    available: true,
    printDestination: 'BAR'
  },
  {
    id: 'p-cer-5',
    name: 'Heineken Zero 330ml',
    category: 'Cervejas',
    price: 10.90,
    description: 'Cerveja Heineken Long Neck 330ml sem álcool.',
    available: true,
    printDestination: 'BAR'
  }
];

export const INITIAL_TABLES: Table[] = [
  { id: 't1', name: 'Mesa 01', number: 1, capacity: 2, status: 'FREE' },
  { id: 't2', name: 'Mesa 02', number: 2, capacity: 4, status: 'FREE' },
  { id: 't3', name: 'Mesa 03', number: 3, capacity: 4, status: 'FREE' },
  { id: 't4', name: 'Mesa 04', number: 4, capacity: 6, status: 'FREE' },
  { id: 't5', name: 'Mesa 05', number: 5, capacity: 2, status: 'FREE' },
  { id: 't6', name: 'Mesa 06', number: 6, capacity: 8, status: 'FREE' },
  { id: 't7', name: 'Balcão 01', number: 7, capacity: 1, status: 'FREE' },
  { id: 't8', name: 'Balcão 02', number: 8, capacity: 1, status: 'FREE' },
  { id: 't9', name: 'Área Externa 01', number: 9, capacity: 4, status: 'FREE' },
  { id: 't10', name: 'Área Externa 02', number: 10, capacity: 4, status: 'FREE' },
];

export const INITIAL_ORDERS: Order[] = [];

// Clean sales history
export const generatePastPayments = (): PaymentRecord[] => {
  return [];
};

