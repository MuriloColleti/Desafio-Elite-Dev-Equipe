# Estacionamento Rotativo — Guia para Agentes de IA e Desenvolvedores

Aplicação de controle de estacionamento rotativo: o administrador configura os setores do pátio,
o motorista reserva e cancela vagas, entra em lista de espera quando não há cota, e o
administrador acompanha a procura por setor e o histórico de cada reserva.

Entrega do **Desafio Dev Elite — Live Coding**. Grupo, **4 horas**, stack livre.

Este arquivo é a fonte única de convenções. Leia antes de escrever qualquer código.

---

## 1. Premissas globais (inegociáveis)

1. **Idioma:** comunicação, documentação e nomes de domínio em **português do Brasil**. Código
   (identificadores) em inglês; mensagens e labels de usuário em pt-BR.
2. **Prazo manda.** São 4 horas com 6 pessoas. Diante de qualquer escolha entre "mais elegante" e
   "entrega o critério de aceite", vence o critério de aceite. Refatoração especulativa,
   abstração para caso futuro e infra além do combinado são desperdício de tempo aqui.
3. **Critério de aceite é contrato.** Cada story tem uma lista fechada no enunciado. Item que não
   está na lista não se implementa; item que está não se pula. É por essa lista que se avalia.
4. **Sem "AI smell":** proibido comentário óbvio que só repete o código, código morto,
   `console.log` de debug esquecido, ou qualquer marca de geração automática. Comentário só quando
   expressa uma restrição que o código não mostra — **por que**, não *o que*.
5. **Commits:** mensagens naturais de desenvolvedor humano. **Nunca** citar IA/Claude/assistente,
   nem `Co-Authored-By` de IA, nem emojis de robô, nem "generated with". Formato:
   `tipo(escopo): descrição` (Conventional Commits), imperativo, em pt-BR.
   O escopo é a story: `feat(estc-2): recusa reserva com placa já ativa`.

---

## 2. Contexto do desafio (restrições que vêm de fora)

Regras do enunciado que não são escolha nossa e não devem ser "melhoradas":

- O pátio é dividido em **setores**. Cada setor tem nome, localização, **cota de vagas
  reserváveis** e **tarifa por hora**.
- Uma vaga só pode ser reservada se **houver cota disponível** no setor. Ao reservar, a cota cai
  em 1; ao cancelar, volta em 1.
- Uma **mesma placa** pode ter no máximo **uma reserva ativa** ao mesmo tempo.
- Setor sem cota: o motorista pode entrar em **lista de espera** e ser contemplado se alguém
  cancelar.
- O administrador acompanha o **histórico de cada reserva** e os **setores mais procurados**.

---

## 3. As cinco stories e quem é dono

Uma story por pessoa, exceto ESTC-4 que tem duas. **Dono da story = dono do módulo do back e da
tela do front daquela story.** Ninguém edita módulo de outro; se precisar de algo lá, pede.

| Story | Título | Dono | Módulo back | Tela front |
|---|---|---|---|---|
| ESTC-1 | Cadastro e listagem de setores | *(Murilo)* | `sectors` | `SetoresPage` |
| ESTC-2 | Reserva e cancelamento de vagas | *(Lucas)* | `reservations` | `ReservasPage` |
| ESTC-3 | Ranking de setores mais reservados | *(Uallace)* | `ranking` | `RankingPage` |
| ESTC-4 | Lista de espera por setor | *(isabeli, rafael)* | `waitlist` | `EsperaPage` |
| ESTC-5 | Histórico de alterações da reserva | *(Marcos)* | `history` | `HistoricoPage` |

### ESTC-1 — Cadastro e listagem de setores

*Como administrador, quero cadastrar os setores do estacionamento e visualizá-los, para manter a
estrutura do pátio configurada e acessível.*

- Cadastrar setor com nome, localização, cota de vagas e tarifa por hora.
- Após o cadastro, o setor aparece na listagem **sem recarregar a página manualmente**.
- A tela principal exibe a lista de setores com seus dados.
- Nome vazio → recusado, **mensagem de erro exibida na tela**.
- Cota de vagas menor que 1 → recusado, mensagem de erro na tela.
- Tarifa negativa → recusado, mensagem de erro na tela.

### ESTC-2 — Reserva e cancelamento de vagas

*Como motorista, quero reservar antecipadamente uma vaga em um setor e poder cancelar, para
garantir lugar no pátio sem depender da disponibilidade no momento da chegada.*

- Reservar em setor com cota registra **placa, setor e data/hora prevista de chegada**, e reduz a
  cota disponível em 1.
- A tela reflete a nova cota disponível do setor após a reserva.
- Placa vazia → recusado, mensagem de erro na tela.
- Data/hora prevista **no passado** → recusado, mensagem de erro na tela.
- Setor sem cota disponível → recusado, motorista avisado na tela.
- Placa que já tem reserva ativa → recusado, motorista avisado do limite na tela.
- Cancelar uma reserva ativa a encerra e aumenta a cota disponível do setor em 1.

### ESTC-3 — Ranking de setores mais reservados

*Como administrador, quero ver quais setores são mais reservados, para entender a procura por cada
área do pátio.*

- O ranking exibe os setores ordenados pela **quantidade de reservas registradas**.
- Cada item mostra o total de vezes que o setor foi reservado.
- Nenhuma reserva registrada ainda → **estado vazio tratado, sem erro**.

> Conta **reservas registradas** (o que já aconteceu), não reservas ativas agora. Cancelar não
> tira o setor do ranking.

### ESTC-4 — Lista de espera por setor

*Como motorista, quero entrar em uma lista de espera quando o setor estiver sem cota disponível,
para ser contemplado automaticamente se alguém cancelar.*

- Setor sem cota disponível → é **oferecida** a entrada na lista de espera daquele setor.
- Entrar na lista registra placa, setor e data/hora prevista, e **não altera a cota** do setor.
- A tela exibe a lista de espera de cada setor **na ordem de entrada**.
- Placa que já tem reserva ativa **não** pode entrar na lista → avisada na tela.
- Placa que já está na lista daquele setor **não** pode entrar de novo → avisada na tela.
- Cancelar reserva ativa de setor **com** lista: a primeira placa passa a ter reserva ativa e sai
  da lista.
- Nesse caso, a cota disponível do setor **permanece a mesma**.
- Cancelar reserva ativa de setor **sem** lista: a cota disponível aumenta em 1.
- É possível **sair da lista por vontade própria**, e as placas seguintes avançam mantendo a ordem.
- Setor sem ninguém na lista → estado vazio tratado, sem erro.

### ESTC-5 — Histórico de alterações da reserva

*Como administrador, quero ver tudo o que aconteceu com uma reserva desde a sua criação, para
entender como ela chegou à situação atual e resolver contestações de motoristas.*

- Cada reserva tem uma visão de histórico com os eventos ocorridos, **do mais antigo para o mais
  recente**.
- Cada evento exibe **data/hora em que ocorreu** e **o que aconteceu**.
- Aparecem no histórico: a criação, o cancelamento, a entrada na lista de espera, a saída
  voluntária da lista, e a **promoção da lista para reserva ativa indicando qual cancelamento a
  originou**.
- Reserva recém-criada → histórico com **apenas o evento de criação, sem erro**.

---

## 4. Dependências entre stories (leia antes de começar)

As stories **não** são independentes. Ignorar isto custa merge quebrado na última hora.

- **ESTC-1 é a base.** Sem `Sector` no schema, ninguém roda. Sai primeiro, na fase 0.
- **ESTC-2 e ESTC-4 escrevem a mesma função de cancelamento.** Com fila → promove e a cota não
  muda; sem fila → cota +1. **Regra:** ESTC-2 entrega `cancel()` já chamando um
  `waitlist.promoverProximo(sectorId, tx)` que na primeira versão retorna `null`; ESTC-4 apenas
  preenche o corpo dessa função, **sem tocar no módulo `reservations`**. Quem violar isso gera
  conflito no ponto mais crítico do projeto.
- **ESTC-5 depende de todas.** Toda operação das outras stories grava evento. O registrador de
  eventos sai junto do schema (fase 0) e todo mundo chama desde o primeiro commit. Deixar para o
  fim é retrabalho em cinco arquivos ao mesmo tempo.
- **ESTC-3 só lê.** Não bloqueia ninguém e não é bloqueada — depende apenas de existirem reservas
  registradas.

**Ordem de merge na `dev`:** ESTC-1 → ESTC-2 → ESTC-4 → (ESTC-3 e ESTC-5 a qualquer momento).

---

## 4.1 Ciclo de vida da reserva e da lista de espera (definido pelo grupo)

Decisão do time, fora do enunciado. Vale para ESTC-2, ESTC-4 e ESTC-5.

### Os quatro estados

| Estado | Quando | Ocupa vaga? |
|---|---|---|
| `AGENDADO` | ao criar a reserva (padrão) | **sim** |
| `EM_USO` | após o check-in | **sim** |
| `CONCLUIDO` | após o check-out | não |
| `CANCELADO` | ao cancelar | não |

**Cota disponível = `quota` − reservas em `AGENDADO` ou `EM_USO`.**
Nunca escreva essa lista à mão: use `ocupaVaga()` de `common/reservation-status.ts`.

`EM_USO` ocupa vaga porque o carro está fisicamente no pátio — liberar no
check-in venderia o mesmo lugar duas vezes.

### Check-in e check-out

Um modal na reserva, com o botão decidido pelo estado atual:

- `AGENDADO` → botão **Check-in** → vira `EM_USO`, grava `checkedInAt`
- `EM_USO` → botão **Check-out** → vira `CONCLUIDO`, grava `checkedOutAt`
- `CONCLUIDO` e `CANCELADO` → só leitura, sem ação

As duas transições gravam evento no histórico (`CHECKED_IN`, `CHECKED_OUT`).

**Só o cancelamento aciona a lista de espera.** Check-out libera a vaga pela
cota, sem promover ninguém — quem estava na fila reserva normalmente.

### Quem é o próximo da fila

**O menor `position` do setor.** `WaitlistEntry.position` é atribuído na entrada
como `max(position do setor) + 1`, e **nunca é renumerado**: quem sai deixa um
buraco (1, 3, 7) e a ordem continua correta, porque só importa o menor. Renumerar
custaria escrita em N linhas e não muda o resultado.

A fila é **por setor**: o `position` só é comparável dentro do mesmo `sectorId`.

### O que acontece ao cancelar

Tudo numa transação só:

1. `UPDATE ... WHERE id = ? AND status = 'AGENDADO'` (ou `EM_USO`) — se não
   afetou linha, a reserva já não estava ativa e nada mais acontece.
2. Busca o menor `position` da fila daquele setor.
3. **Achou** → cria a reserva da placa promovida (`AGENDADO`), remove da fila,
   e a **cota não muda**.
   **Não achou** → a cota volta a subir em 1, naturalmente.

A cota não pode subir e descer no meio do caminho: haveria um instante em que a
vaga estaria livre para um terceiro motorista.

---

## 5. Stack

- **Back:** NestJS (TypeScript), Prisma ORM, PostgreSQL 16 via Docker Compose.
- **Front:** React + TypeScript + Vite, React Router.
- **Infra:** Docker Compose sobe apenas o Postgres. API e front rodam local (`npm run dev`).

Sem Redis, sem fila de mensageria, sem cache, sem autenticação com senha. Não está no enunciado e
não cabe em 4 horas.

---

## 6. Arquitetura

```
Browser → frontend (React + Vite :5173)
            → backend (NestJS :3000)
               src/
                 main.ts             bootstrap, CORS, ValidationPipe global, filtro de erro
                 prisma/             PrismaService (módulo global)
                 common/             erros de domínio, filtro de exceção, DTOs base
                 sectors/            ESTC-1
                 reservations/       ESTC-2
                 ranking/            ESTC-3
                 waitlist/           ESTC-4
                 history/            ESTC-5 (+ o registrador de eventos que todos usam)
               prisma/schema.prisma
```

**Um módulo Nest por story.** Cada módulo tem `*.controller.ts` (rota + DTO), `*.service.ts`
(regra de negócio) e `dto/`. O controller **não** fala com o Prisma direto — quem consulta é o
service.

No front, uma pasta por story em `src/pages/`, com o cliente HTTP compartilhado em `src/api/`.

---

## 7. Modelo de dados

Combinado na fase 0 e **congelado**. Mudança de schema depois disso passa pelo grupo — migration
concorrente é a forma mais rápida de parar seis pessoas ao mesmo tempo.

```prisma
model Sector {
  id           String   @id @default(uuid())
  name         String
  location     String
  quota        Int              // cota total de vagas reserváveis
  hourlyRate   Int              // tarifa por hora, EM CENTAVOS
  createdAt    DateTime @default(now())
  reservations Reservation[]
  waitlist     WaitlistEntry[]
}

model Reservation {
  id          String             @id @default(uuid())
  plate       String
  sectorId    String
  sector      Sector             @relation(fields: [sectorId], references: [id])
  expectedAt  DateTime           // data/hora prevista de chegada
  status       ReservationStatus @default(AGENDADO)
  createdAt    DateTime          @default(now())
  checkedInAt  DateTime?
  checkedOutAt DateTime?
  cancelledAt  DateTime?
  events      ReservationEvent[]

  @@index([sectorId])
  @@index([plate])
}

enum ReservationStatus { AGENDADO EM_USO CONCLUIDO CANCELADO }

model WaitlistEntry {
  id         String   @id @default(uuid())
  plate      String
  sectorId   String
  sector     Sector   @relation(fields: [sectorId], references: [id])
  expectedAt DateTime
  position   Int              // ordem de entrada; menor entra primeiro
  createdAt  DateTime @default(now())

  @@unique([sectorId, plate])   // ESTC-4: mesma placa não entra duas vezes na mesma lista
  @@index([sectorId, position])
}

model ReservationEvent {
  id            String               @id @default(uuid())
  reservationId String
  reservation   Reservation          @relation(fields: [reservationId], references: [id])
  type          ReservationEventType
  detail        String?              // ex.: id do cancelamento que originou a promoção
  occurredAt    DateTime             @default(now())

  @@index([reservationId, occurredAt])
}

enum ReservationEventType {
  CREATED
  CHECKED_IN
  CHECKED_OUT
  CANCELLED
  WAITLIST_JOINED
  WAITLIST_LEFT
  WAITLIST_PROMOTED
}
```

**Cota disponível é derivada, nunca armazenada.**
`disponível = sector.quota − count(reservations em AGENDADO ou EM_USO)`.
Use `ocupaVaga()` de `common/reservation-status.ts` — não repita a lista de estados.
Guardar um contador em coluna cria dois lugares para ficarem fora de sincronia. Proibido.

---

## 8. Convenções de código

- **Camadas:** controller (valida DTO + orquestra) → service (regra de negócio) → Prisma.
  Proibido query Prisma dentro do controller.
- **Validação de entrada** com `class-validator` no DTO (`@IsNotEmpty`, `@Min(1)`, `@Min(0)`).
  Regra que depende do banco (cota, placa duplicada) fica **no service**, não no DTO.
- **Erros:** lançar as classes de `common/errors.ts`; o filtro global traduz para HTTP. Todo erro
  sai no formato único `{ "error": { "code", "message" } }` — o front reage por `code`, nunca por
  texto. Proibido `throw new HttpException` espalhado pelos services.
- **Códigos de erro** são combinados e fixos: `SETOR_SEM_COTA`, `PLACA_JA_TEM_RESERVA`,
  `PLACA_JA_NA_LISTA`, `DATA_NO_PASSADO`, `SETOR_NAO_ENCONTRADO`, `RESERVA_NAO_ENCONTRADA`,
  `VALIDACAO`.
- **Dinheiro em centavos, sempre inteiro** (`hourlyRate`). Proibido float para valor monetário.
- **Datas em UTC** no back; formatação pt-BR só na renderização do front.
- **Tipagem:** proibido `any` em caminho de negócio. Os tipos vêm do Prisma Client.
- **Toda mudança de estado grava evento** via o registrador de `history/`. Não montar
  `ReservationEvent` na mão dentro dos outros módulos.
- Proibido `console.log` em código entregue.

---

## 9. Invariantes de correção

O que não pode quebrar nem sob clique duplo ou dois motoristas agindo ao mesmo tempo:

- **Reservar, cancelar e promover da fila rodam dentro de uma transação Prisma**
  (`prisma.$transaction`). Checar cota e criar a reserva em transações diferentes é exatamente
  como se vende a mesma vaga duas vezes.
- **Uma placa, uma reserva ativa** — verificado dentro da mesma transação da criação.
- **Cancelar não pode ter efeito duplo:** cancelar reserva já cancelada não mexe na cota. Fazer
  atualização condicional (`updateMany` com `where: { id, status: 'ACTIVE' }`) e conferir as
  linhas afetadas, em vez de ler-e-depois-escrever.
- **Promoção não devolve cota.** A vaga passa direto do cancelado para o primeiro da fila; se a
  cota subisse e descesse, existiria um instante em que ela está livre para um terceiro.
- **A ordem da lista de espera é estável.** Saída do meio não pode reordenar quem já estava.

---

## 10. Front-end

- **Seletor de perfil no topo, sem senha:** alterna *Administrador* / *Motorista* e muda a
  navegação visível. Não é autenticação e não guarda nada sensível — serve para a demo mostrar os
  dois papéis. Nenhuma regra do back depende dele.
- **Erro do back sempre vira mensagem na tela**, perto do formulário que a causou. Vários
  critérios de aceite dizem literalmente "a mensagem de erro é exibida na tela": `alert()` ou erro
  só no console reprova o item.
- **Estado vazio é tela, não erro.** ESTC-3 e ESTC-4 exigem estado vazio tratado.
- **Listas atualizam sem recarregar a página** (refetch após a mutação). Critério explícito da
  ESTC-1.

---

## 11. Fluxo de trabalho do grupo

**Fase 0 — primeiros 30 minutos, feita por quem pegou ESTC-1, com os outros acompanhando:**
schema Prisma completo (o da seção 7 inteiro, incluindo as tabelas das outras stories), migration
inicial, `PrismaService`, filtro de erro global, registrador de eventos, esqueleto do front com
rotas e cliente HTTP, e seed com três setores. Isso vai para a `dev` antes de qualquer story
começar.

Enquanto a fase 0 não estiver na `dev`, ninguém escreve código de story — só lê o enunciado e
desenha os DTOs.

### Branches

`main` é a entrega: só recebe merge da `dev` e deve estar sempre demonstrável. `dev` é a
integração, e é contra ela que todo mundo abre PR — ninguém abre PR direto na `main`.

As cinco branches de story já existem no remoto, criadas a partir da `dev`. Cada dono só faz
checkout da sua:

| Story | Branch | Dono |
|---|---|---|
| ESTC-1 | `estc-1-setores` | Murilo |
| ESTC-2 | `estc-2-reservas` | Lucas |
| ESTC-3 | `estc-3-ranking` | Uallace |
| ESTC-4 | `estc-4-espera` | isabeli, rafael |
| ESTC-5 | `estc-5-historico` | Marcos |

```
estc-N-*  →  dev  →  main
```

- **Commits pequenos e frequentes.** O histórico é evidência de processo.
- **Merge na ordem da seção 4**, sempre na `dev`. Antes de abrir PR,
  `git pull --rebase origin dev`.
- **Depois que alguém mergear na `dev`**, quem ainda está em story roda
  `git pull --rebase origin dev` para não acumular conflito para o fim.
- **`dev` → `main` só na integração final**, com o fluxo completo rodando (seção 11, último item).
- **Migration só na fase 0.** Se uma story precisar mesmo de coluna nova, avisa o grupo antes de
  gerar — duas migrations concorrentes travam todo mundo.
- **Ao terminar, marcar os critérios de aceite um a um contra a tela rodando**, não contra o
  código: o enunciado avalia comportamento observável. Item que não funciona, dizer que não
  funciona.
- **Os últimos 20 minutos são de integração e demo**, não de código novo. Alguém roda o fluxo
  completo do zero (`docker compose up`, migration, seed, os dois perfis) antes do fim.

---

## 12. Fora de escopo

Não fazer, mesmo sobrando tempo: login com senha, cobrança ou pagamento pela tarifa, check-in e
check-out de veículo, notificação por e-mail ou push, relatório financeiro, app nativo,
multi-tenant, deploy em nuvem.

Sobrando tempo, o destino é: repassar os critérios de aceite na tela e melhorar as mensagens de
erro.
