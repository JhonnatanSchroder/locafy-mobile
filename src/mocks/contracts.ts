function demoDateFromToday(offsetInDays: number) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offsetInDays);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export type MockContractStatus = 'ATIVO' | 'DEVOLVIDO' | 'FINALIZADO' | 'CANCELADO';

export type MockContractItem = {
  id: string;
  name: string;
  quantity?: number;
  description: string;
  priceLabel: string;
};

export type MockContractMovement = {
  id: string;
  type: 'retirada' | 'devolucao' | 'frete' | 'pagamento';
  title: string;
  description: string;
  date: string;
};

export type MockContract = {
  id: string;
  number: number;
  clientName: string;
  clientPhone?: string;
  clientWhatsapp?: string;
  status: MockContractStatus;
  jobAddress: string;
  startDate: string;
  nextChargeDate?: string;
  balance: number;
  itemsSummary: string;
  items: MockContractItem[];
  financial: {
    accumulated: number;
    payments: number;
    discounts: number;
    credits: number;
    remaining: number;
  };
  movements: MockContractMovement[];
};

export const contracts: MockContract[] = [
  {
    id: 'contract-148',
    number: 148,
    clientName: 'Construtora Horizonte',
    clientPhone: '(11) 98840-1480',
    clientWhatsapp: '(11) 98840-1480',
    status: 'ATIVO',
    jobAddress: 'Rua das Palmeiras, 245 - Centro',
    startDate: '2026-09-18',
    nextChargeDate: demoDateFromToday(0),
    balance: 1840,
    itemsSummary: '20 andaimes, 4 rodinhas, 2 tábuas',
    items: [
      { id: '1-1', name: 'Andaime', quantity: 20, description: 'Estrutura tubular para fachada', priceLabel: 'R$ 0,60/dia' },
      { id: '1-2', name: 'Rodinha', quantity: 4, description: 'Rodízios com trava', priceLabel: 'R$ 1,00/dia' },
      { id: '1-3', name: 'Tábua', quantity: 2, description: 'Pranchas de apoio', priceLabel: 'R$ 1,00/dia' },
    ],
    financial: {
      accumulated: 3120,
      payments: 1100,
      discounts: 120,
      credits: 60,
      remaining: 1840,
    },
    movements: [
      { id: 'm1', type: 'retirada', title: 'Retirada inicial', description: '20 andaimes enviados para a obra', date: '2026-09-18' },
      { id: 'm2', type: 'frete', title: 'Frete de entrega', description: 'Entrega realizada no período da manhã', date: '2026-09-18' },
      { id: 'm3', type: 'pagamento', title: 'Pagamento parcial', description: 'Recebido via Pix', date: '2026-09-25' },
    ],
  },
  {
    id: 'contract-152',
    number: 152,
    clientName: 'Marcos Vinícius Silva',
    clientPhone: '(11) 97752-0152',
    clientWhatsapp: '(11) 97752-0152',
    status: 'ATIVO',
    jobAddress: 'Av. Brasil, 910 - Jardim América',
    startDate: '2026-09-27',
    nextChargeDate: demoDateFromToday(4),
    balance: 620,
    itemsSummary: 'Betoneira 02, 8 andaimes',
    items: [
      { id: '2-1', name: 'Betoneira 02', description: 'Equipamento individual CSM', priceLabel: 'Semanal R$ 250,00' },
      { id: '2-2', name: 'Andaime', quantity: 8, description: 'Estrutura tubular', priceLabel: 'R$ 0,60/dia' },
    ],
    financial: {
      accumulated: 920,
      payments: 300,
      discounts: 0,
      credits: 0,
      remaining: 620,
    },
    movements: [
      { id: 'm4', type: 'retirada', title: 'Retirada de equipamentos', description: 'Betoneira 02 e andaimes retirados', date: '2026-09-27' },
      { id: 'm5', type: 'pagamento', title: 'Entrada recebida', description: 'Pagamento em dinheiro', date: '2026-09-27' },
    ],
  },
  {
    id: 'contract-139',
    number: 139,
    clientName: 'Oliveira Reformas LTDA',
    clientPhone: '(11) 96639-0139',
    clientWhatsapp: '(11) 96639-0139',
    status: 'DEVOLVIDO',
    jobAddress: 'Rua Projetada, 80 - Nova Esperança',
    startDate: '2026-08-30',
    nextChargeDate: demoDateFromToday(-3),
    balance: 280,
    itemsSummary: '12 andaimes, 6 tábuas',
    items: [
      { id: '3-1', name: 'Andaime', quantity: 12, description: 'Estrutura tubular', priceLabel: 'R$ 0,60/dia' },
      { id: '3-2', name: 'Tábua', quantity: 6, description: 'Pranchas de apoio', priceLabel: 'R$ 1,00/dia' },
    ],
    financial: {
      accumulated: 1680,
      payments: 1400,
      discounts: 0,
      credits: 0,
      remaining: 280,
    },
    movements: [
      { id: 'm6', type: 'retirada', title: 'Retirada', description: 'Materiais enviados para obra', date: '2026-08-30' },
      { id: 'm7', type: 'devolucao', title: 'Devolução total', description: 'Itens devolvidos com saldo pendente', date: '2026-09-28' },
    ],
  },
  {
    id: 'contract-121',
    number: 121,
    clientName: 'Fernanda Costa',
    clientPhone: '(11) 95521-0121',
    clientWhatsapp: '(11) 95521-0121',
    status: 'FINALIZADO',
    jobAddress: 'Rua São Bento, 44 - Vila Nova',
    startDate: '2026-08-10',
    balance: 0,
    itemsSummary: 'Betoneira 01',
    items: [{ id: '4-1', name: 'Betoneira 01', description: 'Equipamento individual Menegotti', priceLabel: 'Semanal R$ 250,00' }],
    financial: {
      accumulated: 750,
      payments: 750,
      discounts: 0,
      credits: 0,
      remaining: 0,
    },
    movements: [
      { id: 'm8', type: 'retirada', title: 'Retirada', description: 'Betoneira retirada pelo cliente', date: '2026-08-10' },
      { id: 'm9', type: 'devolucao', title: 'Devolução', description: 'Equipamento devolvido em boas condições', date: '2026-08-31' },
      { id: 'm10', type: 'pagamento', title: 'Quitação', description: 'Contrato finalizado sem saldo', date: '2026-08-31' },
    ],
  },
  {
    id: 'contract-144',
    number: 144,
    clientName: 'Rápida Engenharia',
    clientPhone: '(11) 94444-0144',
    clientWhatsapp: '(11) 94444-0144',
    status: 'CANCELADO',
    jobAddress: 'Av. Industrial, 1500 - Distrito',
    startDate: '2026-09-12',
    balance: 0,
    itemsSummary: 'Reserva cancelada',
    items: [{ id: '5-1', name: 'Andaime', quantity: 30, description: 'Reserva não retirada', priceLabel: 'R$ 0,60/dia' }],
    financial: {
      accumulated: 0,
      payments: 0,
      discounts: 0,
      credits: 0,
      remaining: 0,
    },
    movements: [{ id: 'm11', type: 'devolucao', title: 'Cancelamento', description: 'Cliente cancelou antes da retirada', date: '2026-09-12' }],
  },
];

export const dashboardSummary = {
  activeContracts: 18,
  chargesToday: 7,
  receivedToday: 1250,
  receivedMonth: 38420,
};

export const attentionItems = ['3 cobranças atrasadas', '2 contratos devolvidos com saldo', '1 betoneira em manutenção'];
