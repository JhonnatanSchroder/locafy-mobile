import type { Charge } from '@/types/charge';

function demoDateFromToday(offsetInDays: number) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offsetInDays);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

// Datas relativas existem apenas para manter a demo útil enquanto não há API.
export const charges: Charge[] = [
  {
    id: 'charge-1',
    contractId: 'contract-148',
    clientName: 'Construtora Horizonte',
    dueDate: demoDateFromToday(0),
    amount: 380,
    remainingAmount: 380,
    status: 'PENDING',
    observation: 'Cobrança prevista para hoje.',
  },
  {
    id: 'charge-2',
    contractId: 'contract-152',
    clientName: 'Marcos Vinícius Silva',
    dueDate: demoDateFromToday(0),
    amount: 250,
    remainingAmount: 250,
    status: 'PENDING',
  },
  {
    id: 'charge-3',
    contractId: 'contract-139',
    clientName: 'Oliveira Reformas LTDA',
    dueDate: demoDateFromToday(0),
    amount: 450,
    remainingAmount: 180,
    status: 'PARTIAL',
    observation: 'Cliente já realizou pagamento parcial.',
  },
  {
    id: 'charge-4',
    contractId: 'contract-139',
    clientName: 'Oliveira Reformas LTDA',
    dueDate: demoDateFromToday(-3),
    amount: 620,
    remainingAmount: 620,
    status: 'PENDING',
  },
  {
    id: 'charge-5',
    contractId: 'contract-148',
    clientName: 'Construtora Horizonte',
    dueDate: demoDateFromToday(-6),
    amount: 315,
    remainingAmount: 115,
    status: 'PARTIAL',
  },
  {
    id: 'charge-6',
    contractId: 'contract-152',
    clientName: 'Marcos Vinícius Silva',
    dueDate: demoDateFromToday(5),
    amount: 420,
    remainingAmount: 420,
    status: 'PENDING',
  },
  {
    id: 'charge-7',
    contractId: 'contract-148',
    clientName: 'Construtora Horizonte',
    dueDate: demoDateFromToday(12),
    amount: 760,
    remainingAmount: 760,
    status: 'PENDING',
  },
  {
    id: 'charge-8',
    contractId: 'contract-121',
    clientName: 'Fernanda Costa',
    dueDate: demoDateFromToday(-8),
    amount: 750,
    remainingAmount: 0,
    status: 'PAID',
  },
  {
    id: 'charge-9',
    contractId: 'contract-144',
    clientName: 'Rápida Engenharia',
    dueDate: demoDateFromToday(7),
    amount: 180,
    remainingAmount: 0,
    status: 'CANCELLED',
    observation: 'Cobrança cancelada junto com a reserva.',
  },
];
