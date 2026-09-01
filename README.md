# Estacionamento Rotativo

Controle de estacionamento rotativo: o administrador configura os setores do pátio, o motorista
reserva e cancela vagas, entra em lista de espera quando não há cota, e o administrador acompanha
a procura por setor e o histórico de cada reserva.

Desafio Dev Elite — Live Coding. NestJS + Prisma + PostgreSQL no back, React + Vite no front.

> **Convenções, arquitetura e divisão de trabalho estão no [AGENTS.md](AGENTS.md).**
> Leia antes de escrever código — principalmente a seção 4, que explica as dependências entre as
> stories e por que a ordem de merge importa.

---

## Setup

### Tudo em container (mais rápido)

```bash
docker compose up --build
```

Sobe banco, API e front. A migration e o seed rodam sozinhos na subida.
Abra **http://localhost:5173** — o nginx faz proxy de `/api` para a API, então
não há CORS nem URL de API no bundle.

Para conferir que subiu certo: `bash backend/scripts/smoke.sh` (ou
`API_URL=http://localhost:5173/api bash backend/scripts/smoke.sh` para testar
pelo mesmo caminho que o browser usa).

---

## Setup manual (para desenvolver)

Pré-requisitos: Node 20+, Docker e Docker Compose.

### 1. Banco

Na raiz do projeto:

```bash
docker compose up -d db
```

Sobe um PostgreSQL 16 em `localhost:5432` (usuário, senha e base: `estacionamento`).

### 2. Backend — porta 3000

```bash
cd backend
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev
npx ts-node prisma/seed.ts
npm run dev
```

### 3. Frontend — porta 5173

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Abra http://localhost:5173.

---

## Divisão do time

Uma story por pessoa, exceto a ESTC-4 que tem duas. Cada dono é responsável pelo módulo do
back **e** pela tela do front da sua story.

| Story | Título | Dono | Módulo back | Tela front |
|---|---|---|---|---|
| ESTC-1 | Cadastro e listagem de setores | Murilo | `sectors` | `SetoresPage` |
| ESTC-2 | Reserva e cancelamento de vagas | Lucas | `reservations` | `ReservasPage` |
| ESTC-3 | Ranking de setores mais reservados | Uallace | `ranking` | `RankingPage` |
| ESTC-4 | Lista de espera por setor | Isabeli e Rafael | `waitlist` | `EsperaPage` |
| ESTC-5 | Histórico de alterações da reserva | Marcos | `history` | `HistoricoPage` |

Os critérios de aceite de cada story estão na seção 3 do [AGENTS.md](AGENTS.md).

---

## O que a fase 0 já entregou

A base compartilhada, para que ninguém precise esperar:

- Schema Prisma **completo**, incluindo as tabelas das outras stories (`reservations`,
  `waitlist_entries`, `reservation_events`) — assim ninguém precisa gerar migration nova.
- `PrismaService` como módulo global.
- Filtro de erro global: toda falha sai como `{ "error": { "code", "message" } }`.
  As classes de erro estão em `backend/src/common/errors.ts` — lance de lá, não monte resposta
  de erro na mão.
- `HistoryService.registrar(evento, tx)`: o registrador de eventos que **todas** as stories devem
  chamar ao mudar estado de reserva. Recebe a transação para o evento sofrer rollback junto com a
  operação que o originou.
- `TxClient` (`backend/src/common/transaction.ts`): o tipo de cliente transacional que reservar,
  cancelar e promover da fila compartilham.
- Módulo `sectors` (ESTC-1) e `SectorsService.obterCotaDisponivel(sectorId, tx)`, que ESTC-2 e
  ESTC-4 usam para checar cota dentro da própria transação.
- Seed com três setores.

### Como registrar sua story

Ao começar, adicione seu módulo em `backend/src/app.module.ts` e sua rota no router do front.
Nada além disso deve ser tocado fora da sua pasta.

---

## Decisões que valem conhecer

**Cota disponível é derivada, nunca armazenada.**
`disponível = sector.quota − reservas ativas do setor`. Não existe coluna de contador: dois
lugares para o mesmo número é como se vende a mesma vaga duas vezes.

**Reservar, cancelar e promover da fila correm numa transação só.**
Checar cota e criar a reserva em transações separadas abre a janela para duas reservas na última
vaga.

**A promoção da lista de espera não devolve cota.**
A vaga passa direto do cancelado para o primeiro da fila. Se a cota subisse e descesse, haveria um
instante em que ela estaria livre para um terceiro.

**Dinheiro em centavos, sempre inteiro.**
`hourlyRate` é `Int`. O front converte na hora de exibir.

**O seletor de perfil não é autenticação.**
Alterna a navegação entre Administrador e Motorista para a demo mostrar os dois papéis. Nenhuma
regra do backend depende dele — login não está no escopo (AGENTS.md §12).

---

## Status de implementação

| Story | Back | Front | Observações |
|---|---|---|---|
| Fase 0 (base) | ✅ | ✅ | Migrations conferidas no banco; seed; stack completa em container |
| ESTC-1 Setores | ✅ | 🔄 | API: 12/12 no smoke. Front compila e é servido, mas a tela ainda não foi clicada por um humano |
| ESTC-2 Reservas | ⬜ | ⬜ | |
| ESTC-3 Ranking | ⬜ | ⬜ | |
| ESTC-4 Lista de espera | ⬜ | ⬜ | |
| ESTC-5 Histórico | ⬜ | ⬜ | |

Mantenha esta tabela sincronizada com a realidade. Marcar como pronto o que não foi visto
funcionando na tela é o pior erro possível aqui.
