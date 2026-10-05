# Locafy Mobile — Handoff completo para novo agente Codex

> Documento de continuidade do projeto mobile do Locafy.
> Objetivo: permitir que um novo agente Codex assuma o desenvolvimento sem depender do histórico anterior da conversa.
> Antes de alterar qualquer arquivo, o agente deve ler este documento inteiro, inspecionar o repositório atual e comparar o estado real do código com este handoff.

---

# 1. Visão geral do produto

**Locafy** é um sistema de gestão de locações de equipamentos, inicialmente focado em:

- andaimes;
- rodinhas;
- tábuas;
- betoneiras.

O sistema terá duas interfaces principais:

1. **Locafy Web**
   - Laravel
   - Inertia
   - Vue 3
   - TypeScript
   - Tailwind/shadcn
   - principal fonte de regras de negócio e administração;

2. **Locafy Mobile**
   - React Native
   - Expo
   - TypeScript
   - Expo Router
   - NativeWind
   - interface operacional mobile.

O mobile NÃO será uma aplicação de negócio independente.

Arquitetura futura:

```text
React Native
    ↓
Laravel API /api/v1
    ↓
Actions / Services do domínio
    ↓
Banco
```

As regras críticas de negócio devem continuar no Laravel.

---

# 2. Princípio arquitetural mais importante

O aplicativo mobile deve ser tratado como:

```text
uma interface cliente
```

e não como:

```text
um segundo backend
```

Portanto, NÃO colocar no app regras críticas como:

- cálculo de dias cobrados;
- exclusão de domingos;
- regra das 10h;
- total de contrato;
- saldo financeiro;
- mudança automática de status;
- validação de estoque;
- regras de cobrança;
- regras de pagamento;
- finalização de contrato.

No futuro, o app envia comandos ou consultas para a API Laravel e o backend decide.

Exemplo futuro:

```text
POST /api/v1/contracts/148/finalize
```

O app NÃO deve decidir sozinho se o contrato pode ser finalizado.

---

# 3. Stack atual confirmada

O projeto foi criado com `create-expo-app`.

Versões que o agente anterior confirmou:

```text
expo                 ~57.0.26
expo-router          ~57.0.24
react-native         0.86.3
react                19.2.3
typescript           ~6.0.3
react-native-reanimated 4.5.1
react-native-safe-area-context ~5.7.0
react-native-screens ~4.26.0
```

Também foram instalados/configurados:

```text
nativewind 4.2.7
tailwindcss ^3.4.17
lucide-react-native
babel-preset-expo
prettier-plugin-tailwindcss
```

O projeto usa:

```text
src/app
```

como raiz do Expo Router.

O `app.json` possui `typedRoutes` habilitado.

Não há diretórios `ios/` ou `android/`; manter o fluxo Expo/CNG.

O projeto usa `package-lock.json`, portanto preferir `npm`/`npx`.

---

# 4. Estado atual do app

A primeira fase visual foi implementada e testada no **Expo Go**, funcionando corretamente.

O usuário confirmou manualmente que o app abriu e navegou sem problemas.

Já existem:

- Expo Router;
- Stack raiz;
- Bottom Tabs;
- NativeWind funcionando;
- Lucide React Native;
- suporte atual a tema claro/escuro;
- Dashboard;
- lista de Contratos;
- detalhes de Contrato;
- placeholders de Cobranças, Clientes e Mais;
- mocks locais;
- types;
- utilities;
- componentes visuais reutilizáveis.

---

# 5. Estrutura atual relevante

A implementação ficou aproximadamente assim:

```text
src/
├── app/
│   ├── _layout.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx
│   │   ├── contracts.tsx
│   │   ├── charges.tsx
│   │   ├── clients.tsx
│   │   └── more.tsx
│   └── contracts/
│       └── [id].tsx
│
├── components/
│   ├── ui/
│   │   ├── StatCard.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── SectionHeader.tsx
│   │   └── MoneyValue.tsx
│   ├── dashboard/
│   │   ├── AttentionCard.tsx
│   │   └── QuickAction.tsx
│   └── contracts/
│       └── ContractCard.tsx
│
├── constants/
│   └── theme.ts
│
├── mocks/
│   └── contracts.ts
│
├── types/
│   └── contract.ts
│
├── utils/
│   ├── formatCurrency.ts
│   └── formatDate.ts
│
└── global.css
```

Confirmar no repositório real antes de assumir nomes exatos.

---

# 6. Configuração NativeWind

Arquivos criados/configurados:

```text
babel.config.js
metro.config.js
tailwind.config.js
nativewind-env.d.ts
src/global.css
```

Configuração aprovada:

- NativeWind v4 estável;
- Tailwind 3.x;
- `withNativeWind(config, { input })`;
- Babel configurado com `jsxImportSource: 'nativewind'`;
- `src/global.css` como entrada;
- `app.json` com Metro para web.

Não migrar para NativeWind v5 RC sem solicitação explícita.

---

# 7. Identidade visual aprovada

O visual atual foi aprovado pelo usuário.

A identidade deve ser preservada.

Características:

- azul forte como cor principal;
- fundo navy muito escuro;
- cards azul/cinza escuro;
- bordas discretas;
- texto claro;
- texto secundário cinza-azulado;
- verde para sucesso/ativo;
- laranja para atenção;
- vermelho apenas para perigo/erro;
- cards arredondados;
- espaçamento confortável;
- aparência SaaS moderna;
- foco operacional.

A referência visual aproximada usada também no Web é:

```text
Primary
#2563EB

Background dark
#020617

Card
#0F172A

Card secondary
#111C30

Border
#1E293B

Foreground
#F8FAFC

Muted foreground
#94A3B8

Success
#10B981

Warning
#F59E0B

Danger
#EF4444
```

Não espalhar hexadecimais desnecessariamente nas telas.

Preferir tokens/configuração central.

---

# 8. Navegação atual

Bottom Tabs aprovadas:

```text
Início
Contratos
Cobranças
Clientes
Mais
```

A aba `Mais` deve futuramente levar a:

- Produtos;
- Equipamentos;
- Relatórios;
- Atividades;
- Configurações;
- Perfil.

Não adicionar muitas abas principais.

---

# 9. Dashboard atual

O Dashboard já possui visual funcional com mocks.

Informações atuais:

- contratos ativos;
- cobranças para hoje;
- recebido hoje;
- recebido no mês;
- seção “Precisa de atenção”;
- ações rápidas.

Ações rápidas:

```text
Novo contrato
Registrar pagamento
Nova retirada
Ver cobranças
```

Visual aprovado, mas já foi decidido fazer alguns refinamentos.

---

# 10. Refinamentos visuais aprovados para próxima etapa

A próxima implementação ainda NÃO foi concluída.

Ela deve refinar as telas existentes antes/de forma conjunta com Cobranças.

## Dashboard

### Header azul

Reduzir um pouco a altura.

Manter a identidade e texto de boas-vindas.

### Cards de estatísticas

Remover textos provisórios como:

```text
mock local
```

### “Precisa de atenção”

O card atual ficou visualmente pesado.

Refinar para:

- fundo menos agressivo;
- laranja em:
  - borda;
  - ícone;
  - pequenos indicadores;
- não usar uma grande área marrom/vermelha forte.

### Ações rápidas

Manter grade 2x2, mas mais compacta.

Remover textos temporários como:

```text
Ação visual nesta fase
```

`Ver cobranças` deve navegar para a aba Cobranças.

---

# 11. Contratos — refinamentos aprovados

A lista de contratos atual ficou visualmente boa.

Próximos refinamentos:

## IDs

Não usar:

```text
CT-2026-0148
```

Preferir dado separado:

```ts
id: 'contract-148'
number: 148
```

e formatar na UI:

```text
#148
```

ou:

```text
Contrato #148
```

Não armazenar `'#148'` como dado de domínio.

## Filtros

Filtros:

```text
Todos
Ativos
Devolvidos
Finalizados
Cancelados
```

Usar `ScrollView horizontal` para não cortar opções.

## Próxima cobrança

Diferenciar visualmente:

```text
Hoje
Atrasada há X dias
Próxima em ...
data futura
```

Isso é somente apresentação mockada nesta fase.

Nenhuma regra financeira real.

---

# 12. Detalhes do contrato — refinamentos aprovados

A tela de detalhes foi uma das partes visualmente mais aprovadas.

Manter:

- status;
- cliente;
- endereço da obra;
- início;
- resumo financeiro;
- itens;
- timeline;
- barra de ações inferior.

Formato do título:

```text
Contrato #148
```

Adicionar ações visuais do cliente:

- telefone;
- WhatsApp;
- localização.

Nesta etapa elas podem ser somente visuais.

Não precisa deep-link ainda.

## Resumo financeiro

Manter:

- acumulado até hoje;
- pagamentos;
- descontos;
- créditos;
- restante.

Valores são mocks.

Não calcular.

## Itens

Hoje cada item ocupa card grande.

Refinar para um único card com linhas compactas:

```text
Itens

20x Andaime
R$ 0,60/dia
────────────
4x Rodinha
R$ 1,00/dia
────────────
2x Tábua
R$ 1,00/dia
```

## Barra inferior

Manter:

```text
Retirada
Devolução
Frete
Pagamento
```

Essa decisão de UX foi explicitamente aprovada.

---

# 13. Próximo módulo mobile: Cobranças

Esta é a próxima feature planejada.

A aba Cobranças atualmente é placeholder.

Ela deve virar uma tela operacional central.

O objetivo é que Cobranças funcione visualmente como uma **fila de trabalho do dia**, não como relatório financeiro desktop.

Fluxo esperado:

```text
Abro o app
    ↓
Vejo cobranças de hoje
    ↓
Vejo atrasadas
    ↓
Abro cobrança
    ↓
Ver contrato
ou
Receber
```

---

# 14. Conceito futuro de Charge

No backend Laravel futuramente:

```text
Charge
```

representará um snapshot do valor devido de um contrato em determinado momento.

Status:

```text
PENDING
PARTIAL
PAID
CANCELLED
```

Labels mobile:

```text
PENDING   → Pendente
PARTIAL   → Parcial
PAID      → Paga
CANCELLED → Cancelada
```

O mobile NÃO implementa regra financeira.

---

# 15. Tipo planejado para Charge

Criar:

```text
src/types/charge.ts
```

Exemplo:

```ts
export type ChargeStatus =
    | 'PENDING'
    | 'PARTIAL'
    | 'PAID'
    | 'CANCELLED';

export type Charge = {
    id: string;
    contractId: string;
    clientName: string;
    dueDate: string;
    amount: number;
    remainingAmount: number;
    status: ChargeStatus;
    observation?: string | null;
};
```

IMPORTANTE:

`contractId` deve usar o mesmo tipo do `Contract.id` atual.

Não migrar os IDs do projeto inteiro apenas para esta feature.

---

# 16. Mocks planejados para Cobranças

Criar:

```text
src/mocks/charges.ts
```

Mocks variados:

- hoje;
- atrasadas;
- próximas;
- pagas;
- parciais;
- canceladas.

Exemplo conceitual:

```text
João da Silva
Contrato #148
Hoje
R$ 380,00
Pendente
```

Outro:

```text
Construtora Horizonte
Contrato #152
Atrasada há 3 dias
R$ 620,00
Pendente
```

Outro:

```text
Oliveira Reformas
Contrato #139
Hoje
R$ 450,00
Parcial
Restante R$ 180,00
```

---

# 17. Regra importante para datas mockadas

Não usar datas fixas que deixem de funcionar amanhã.

Gerar datas relativas ao dia atual:

```text
hoje
hoje - 3 dias
hoje + 5 dias
```

Isso é permitido SOMENTE na camada de mocks/UI.

Não confundir isso com regra de negócio real.

O objetivo é garantir que as abas:

```text
Hoje
Atrasadas
Próximas
```

sempre tenham dados demonstrativos.

---

# 18. Tela de Cobranças planejada

Arquivo existente:

```text
src/app/(tabs)/charges.tsx
```

Substituir o placeholder.

Cabeçalho:

```text
Cobranças
Acompanhe valores previstos e pendências.
```

Resumo superior compacto:

```text
Para hoje
7 cobranças

Em atraso
3 cobranças
```

Não ocupar espaço demais.

---

# 19. Filtros de Cobranças

Filtros locais:

```text
Hoje
Atrasadas
Próximas
Todas
```

Funcionam somente sobre mocks.

Não implementar query/API.

---

# 20. ChargeCard

Criar:

```text
src/components/charges/ChargeCard.tsx
```

Conteúdo:

- cliente;
- número do contrato;
- situação/data;
- valor;
- status;
- botão Ver contrato;
- botão Receber quando aplicável.

Exemplo:

```text
João da Silva          PENDENTE

Contrato #148

Hoje

R$ 380,00

[ Ver contrato ] [ Receber ]
```

Cores contextuais:

```text
Hoje       → azul
Atrasada   → laranja/vermelho discreto
Próxima    → neutro
Paga       → verde
Parcial    → amarelo/laranja
```

Evitar cards agressivamente coloridos.

---

# 21. Navegação Cobrança → Contrato

O botão:

```text
Ver contrato
```

deve navegar para:

```text
/contracts/[id]
```

usando `contractId`.

Essa ligação visual entre módulos é importante.

---

# 22. Modal visual de pagamento

Criar:

```text
src/components/charges/PaymentModal.tsx
```

Usar apenas componentes nativos.

NÃO instalar biblioteca de bottom sheet.

Pode usar:

```text
Modal
KeyboardAvoidingView
ScrollView
TextInput
Pressable
```

Visualmente pode parecer uma bottom sheet.

Campos:

```text
Registrar pagamento

Contrato #148
João da Silva

Valor da cobrança
R$ 380,00

Valor recebido
[ R$ 380,00 ]

Forma de pagamento
[ PIX ]

Desconto
[ R$ 0,00 ]

Próxima cobrança
[ 18/10/2026 ]

Observação
[ opcional ]

[ Cancelar ] [ Confirmar ]
```

Formas:

```text
PIX
Dinheiro
Cartão
Transferência
Outro
```

---

# 23. Regra importantíssima sobre PaymentModal

NÃO implementar:

```text
valor + desconto = total
```

NÃO implementar:

- cálculo automático;
- pagamento real;
- atualização persistente;
- mudança real da cobrança;
- próxima cobrança como regra real;
- validação financeira de domínio.

Pode usar state local somente para UX.

Ao confirmar:

- fechar modal;
- opcionalmente exibir feedback simples;
- NÃO persistir.

---

# 24. Arquivos planejados na próxima etapa

Provavelmente alterar:

```text
src/app/(tabs)/index.tsx
src/components/ui/StatCard.tsx
src/components/dashboard/AttentionCard.tsx
src/components/dashboard/QuickAction.tsx
src/app/(tabs)/contracts.tsx
src/components/contracts/ContractCard.tsx
src/app/contracts/[id].tsx
src/mocks/contracts.ts
src/types/contract.ts
src/app/(tabs)/charges.tsx
```

Criar:

```text
src/types/charge.ts
src/mocks/charges.ts
src/components/charges/ChargeCard.tsx
src/components/charges/PaymentModal.tsx
```

O agente deve inspecionar o estado real antes de editar.

---

# 25. O que NÃO implementar agora

Não implementar:

- API;
- Axios;
- fetch real;
- TanStack Query;
- Zustand;
- Redux;
- React Hook Form;
- Zod;
- SecureStore;
- autenticação;
- Laravel integration;
- banco;
- AsyncStorage para persistência de domínio;
- pagamentos reais;
- cálculos financeiros;
- Clientes completo;
- Produtos completo;
- Equipamentos completo.

---

# 26. Roadmap mobile após Cobranças

Sequência desejada:

```text
✅ Base Expo
✅ Dashboard
✅ Contratos
✅ Detalhes do contrato
→ Refinamentos
→ Cobranças
→ Clientes
→ Equipamentos
→ Produtos
→ Mais / Configurações
→ Autenticação/API Laravel
```

A ordem pode ser refinada, mas não pular imediatamente para API.

Primeiro queremos validar UX mobile.

---

# 27. Contexto do domínio para futuras telas

## Client

Cliente pode ser:

- pessoa física;
- pessoa jurídica.

Campos futuros:

- nome;
- CPF/CNPJ;
- telefone;
- endereço residencial;
- observação.

Um cliente pode ter vários contratos.

---

## Product

Produto é o tipo/categoria comercial.

Exemplos:

```text
Andaime
Rodinha
Tábua
Betoneira
```

Tipos:

```text
QUANTITY
INDIVIDUAL
```

### QUANTITY

Exemplos:

- Andaime
- Rodinha
- Tábua

Controlados por quantidade.

### INDIVIDUAL

Exemplo:

- Betoneira

O produto representa a categoria.

As unidades físicas são Equipments.

---

# 28. Product x Equipment

Não confundir.

Exemplo:

```text
Product
Betoneira
```

e:

```text
Equipment
Betoneira 01
Betoneira 02
Betoneira 03
```

Relacionamento futuro:

```text
Product hasMany Equipments
Equipment belongsTo Product
```

Tela mobile futura de Equipamentos deve mostrar individualmente:

```text
Betoneira 01
Menegotti
Disponível

Betoneira 02
CSM
Alugado

Betoneira 03
Menegotti
Manutenção
```

Status:

```text
AVAILABLE
RENTED
MAINTENANCE
INACTIVE
```

Labels genéricos:

```text
Disponível
Alugado
Manutenção
Inativo
```

---

# 29. Regras futuras de Contrato — contexto apenas

Não implementar no mobile agora.

Status:

```text
ATIVO
DEVOLVIDO
FINALIZADO
CANCELADO
```

Regras futuras no Laravel:

- ativo enquanto houver equipamento fora;
- ao devolver tudo → DEVOLVIDO;
- FINALIZADO apenas com tudo devolvido + saldo financeiro zero;
- finalização explícita pelo usuário;
- múltiplas retiradas;
- devoluções parciais;
- várias categorias no mesmo contrato.

---

# 30. Regras futuras de andaime/acessórios

Contexto futuro para UI, não implementar lógica.

Default:

```text
Andaime: R$ 0,60/peça/dia
Rodinha: R$ 1,00/unidade/dia
Tábua: R$ 1,00/unidade/dia
```

Regras no backend:

- domingo não cobra;
- sábado normalmente cobra;
- contrato pode desabilitar sábado;
- regra das 10h:
  - retirada antes das 10h não conta o dia;
  - retirada às/depois das 10h conta;
  - devolução antes das 10h não cobra o dia;
  - devolução às/depois das 10h cobra.

O mobile não calcula nada disso.

---

# 31. Regras futuras de betoneira

Preço padrão:

```text
dia   R$ 120
semana R$ 250
mês   R$ 500
```

Sem excluir sábados/domingos.

Sem regra das 10h.

A unidade física é selecionada individualmente.

O mobile apenas mostra os dados retornados pelo backend.

---

# 32. Fretes futuros

Tipos:

```text
ENTREGA
ENTREGA_ADICIONAL
BUSCA
OUTRO
```

Default atual de negócio:

```text
R$ 15
```

Editável por ocorrência.

Frete entra no valor devido.

No mobile a ação “Frete” já existe visualmente no detalhe de contrato.

---

# 33. Cobranças futuras — regra de domínio

Contexto apenas.

Charge é snapshot do valor devido.

Status:

```text
PENDING
PARTIAL
PAID
CANCELLED
```

A central de cobranças futura terá:

```text
Hoje
Atrasadas
Próximas
Todas
```

Cobrança pode ter observação.

Após pagamento integral, próxima cobrança pode ser definida, normalmente 15 dias depois.

Pagamento parcial mantém saldo pendente.

Essas regras pertencem ao Laravel.

---

# 34. Pagamentos futuros

Formas:

```text
PIX
Dinheiro
Cartão
Transferência
Outro
```

Suporta:

- parcial;
- desconto;
- crédito;
- pagamento antecipado.

Uma cobrança não deve ser dividida automaticamente em várias pelo mobile.

O backend será autoridade.

---

# 35. Experiência mobile desejada

O app deve priorizar:

```text
informação operacional rápida
```

Não transformar telas em tabelas desktop.

Exemplos de uso:

- abrir o app de manhã;
- ver cobranças do dia;
- ver atrasadas;
- abrir contrato;
- registrar retirada/devolução/pagamento;
- ligar/WhatsApp/rota do cliente;
- ver equipamento disponível;
- conferir saldo.

---

# 36. Princípios de componentização

Evitar dois extremos:

```text
tela gigante com tudo dentro
```

e:

```text
componente para cada <Text>
```

Criar componentes quando houver:

- reutilização real;
- responsabilidade visual clara;
- ganho de legibilidade.

Componentes aprovados até agora:

```text
StatCard
StatusBadge
SectionHeader
MoneyValue
AttentionCard
QuickAction
ContractCard
```

Planejados:

```text
ChargeCard
PaymentModal
```

---

# 37. Types e mocks

Manter separados.

Exemplo:

```text
src/types/
src/mocks/
```

Não colocar arrays grandes diretamente nas páginas.

A intenção futura é substituir:

```text
mockContracts
mockCharges
```

por:

```text
contractApi.list()
chargeApi.list()
```

ou hooks/query, sem reescrever UI inteira.

---

# 38. API futura

Quando a API Laravel existir, arquitetura provável:

```text
screens/components
      ↓
hooks / TanStack Query
      ↓
api client
      ↓
Laravel /api/v1
```

Somente adicionar essa camada quando o backend estiver preparado.

Provavelmente futuramente usar:

- TanStack Query;
- SecureStore;
- Laravel Sanctum/token;
- React Hook Form;
- Zod;

mas NÃO instalar agora sem necessidade.

---

# 39. Forma de trabalho desejada com o agente

O usuário está aprendendo React Native enquanto constrói.

Antes de mudanças relevantes:

1. inspecionar estado atual;
2. explicar o que pretende fazer;
3. listar arquivos que serão criados/alterados;
4. explicar conceitos novos;
5. aguardar aprovação quando a tarefa for grande;
6. implementar uma etapa pequena;
7. explicar o resultado;
8. dizer como testar.

Não construir o aplicativo inteiro de uma vez.

Não adicionar recursos futuros sem solicitação.

---

# 40. Validação mínima após mudanças

Rodar:

```bash
npx expo lint
npx tsc --noEmit
```

Quando fizer sentido, testar:

```bash
npx expo start
```

O usuário já validou o app com Expo Go.

Evitar deixar processos long-running desnecessariamente.

---

# 41. Vulnerabilidades npm

Na primeira instalação foi reportado algo como:

```text
35 vulnerabilities
```

O agente anterior NÃO rodou:

```bash
npm audit fix
```

de propósito.

Não fazer atualizações automáticas destrutivas de dependências do Expo apenas para zerar audit.

Antes de mudar versões, verificar compatibilidade com Expo SDK 57.

---

# 42. Arquivos antigos do template

Já foram removidos para evitar conflito:

```text
src/app/index.tsx
src/app/explore.tsx
src/components/app-tabs.tsx
src/components/app-tabs.web.tsx
```

Não recriar sem motivo.

---

# 43. Regras para o novo agente Codex

Ao assumir o projeto:

1. leia este documento integralmente;
2. inspecione `package.json`;
3. confirme Expo SDK e dependências;
4. inspecione `src/app`;
5. inspecione `src/components`;
6. inspecione `src/mocks`;
7. inspecione `src/types`;
8. inspecione NativeWind;
9. confirme o estado atual do Git/repositório;
10. compare o código real com este handoff;
11. em caso de divergência, o código real atual tem prioridade;
12. explique divergências antes de modificar;
13. não implemente API;
14. não altere stack sem necessidade.

---

# 44. Próxima tarefa recomendada ao assumir

A próxima tarefa já foi planejada e aprovada:

```text
Refinamentos visuais existentes
+
Módulo Cobranças mockado
```

Antes de implementar, confirme que essa etapa ainda não foi parcialmente feita no repositório.

Se ainda estiver pendente, seguir os pontos deste documento.

---

# 45. Prompt inicial recomendado para o Codex

Depois de colocar este arquivo dentro do projeto, enviar:

```text
Leia integralmente o arquivo de handoff do Locafy Mobile antes de alterar qualquer coisa.

Depois:

1. inspecione o repositório atual;
2. confirme stack e versões;
3. compare o código real com o handoff;
4. informe o que já está implementado e o que está pendente;
5. identifique qualquer divergência;
6. apresente um plano curto para a próxima tarefa aprovada: refinamentos visuais + módulo Cobranças mockado.

Não implemente nada antes da minha aprovação.
```

---

# 46. Resumo executivo

Estado atual:

```text
✅ Expo SDK 57
✅ React Native + TypeScript
✅ Expo Router
✅ NativeWind v4
✅ Lucide
✅ Bottom Tabs
✅ Dashboard
✅ Contratos
✅ Detalhes do contrato
✅ Tema visual aprovado
✅ Expo Go validado manualmente
⬜ Refinamentos visuais aprovados
⬜ Cobranças completo com mocks
⬜ Clientes completo
⬜ Equipamentos
⬜ Produtos
⬜ API
⬜ autenticação
```

Próximo foco:

```text
Refinamentos
+
Cobranças
```

Princípio central:

```text
mobile apresenta
Laravel decide
```
