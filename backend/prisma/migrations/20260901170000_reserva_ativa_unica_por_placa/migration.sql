-- Uma placa tem no maximo uma reserva ocupando vaga (criterio de aceite da
-- ESTC-2). Indice parcial porque a placa pode ter varias reservas concluidas ou
-- canceladas no historico -- so os estados que ocupam vaga sao exclusivos.
--
-- Escrito a mao: o Prisma nao expressa indice parcial no schema. Se rodar
-- `prisma migrate dev` e ele sugerir remover este indice, NAO aceite.
CREATE UNIQUE INDEX "uq_reserva_ativa_por_placa"
  ON "reservations" ("plate")
  WHERE "status" IN ('AGENDADO', 'EM_USO');
