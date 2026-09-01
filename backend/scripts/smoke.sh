#!/usr/bin/env bash
# Smoke test da ESTC-1 contra a API de pé.
# Não substitui teste automatizado: confere que os critérios de aceite
# respondem de verdade, que é o que o enunciado avalia.

set -u

API="${API_URL:-http://localhost:3000}"
passou=0
falhou=0

verificar() {
  local nome="$1" esperado="$2" obtido="$3"
  if [ "$esperado" = "$obtido" ]; then
    printf '  ok    %s\n' "$nome"
    passou=$((passou + 1))
  else
    printf '  FALHA %s (esperado %s, obtido %s)\n' "$nome" "$esperado" "$obtido"
    falhou=$((falhou + 1))
  fi
}

status_de() {
  curl -s -o /dev/null -w '%{http_code}' "$@"
}

corpo_de() {
  curl -s "$@"
}

echo "Smoke ESTC-1 em $API"
echo

echo "Listagem"
verificar "GET /sectors responde 200" 200 "$(status_de "$API/sectors")"
total=$(corpo_de "$API/sectors" | grep -o '"id"' | wc -l | tr -d ' ')
if [ "$total" -ge 3 ]; then
  printf '  ok    seed carregado (%s setores)\n' "$total"
  passou=$((passou + 1))
else
  printf '  FALHA seed nao carregado (%s setores)\n' "$total"
  falhou=$((falhou + 1))
fi
if corpo_de "$API/sectors" | grep -q '"availableQuota"'; then
  echo "  ok    resposta traz availableQuota"
  passou=$((passou + 1))
else
  echo "  FALHA resposta sem availableQuota"
  falhou=$((falhou + 1))
fi

echo
echo "Cadastro"
nome="Setor Smoke $$"
criado=$(corpo_de -X POST "$API/sectors" -H 'Content-Type: application/json' \
  -d "{\"name\":\"$nome\",\"location\":\"Teste\",\"quota\":10,\"hourlyRate\":700}")
id=$(printf '%s' "$criado" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')
if [ -n "$id" ]; then
  echo "  ok    POST /sectors cria setor"
  passou=$((passou + 1))
else
  echo "  FALHA POST /sectors nao retornou id"
  falhou=$((falhou + 1))
fi
# Cota de setor novo comeca cheia: nenhuma reserva o ocupa ainda.
if printf '%s' "$criado" | grep -q '"availableQuota":10'; then
  echo "  ok    setor novo nasce com cota cheia"
  passou=$((passou + 1))
else
  echo "  FALHA cota inicial diferente da cota total"
  falhou=$((falhou + 1))
fi
if corpo_de "$API/sectors" | grep -q "$nome"; then
  echo "  ok    setor aparece na listagem seguinte"
  passou=$((passou + 1))
else
  echo "  FALHA setor nao aparece na listagem"
  falhou=$((falhou + 1))
fi

echo
echo "Validacoes (criterios de aceite da ESTC-1)"
verificar "nome vazio e recusado" 400 \
  "$(status_de -X POST "$API/sectors" -H 'Content-Type: application/json' \
     -d '{"name":"","location":"X","quota":5,"hourlyRate":100}')"
verificar "cota 0 e recusada" 400 \
  "$(status_de -X POST "$API/sectors" -H 'Content-Type: application/json' \
     -d '{"name":"X","location":"X","quota":0,"hourlyRate":100}')"
verificar "tarifa negativa e recusada" 400 \
  "$(status_de -X POST "$API/sectors" -H 'Content-Type: application/json' \
     -d '{"name":"X","location":"X","quota":5,"hourlyRate":-1}')"

erro=$(corpo_de -X POST "$API/sectors" -H 'Content-Type: application/json' \
  -d '{"name":"","location":"X","quota":5,"hourlyRate":100}')
if printf '%s' "$erro" | grep -q '"error".*"code".*"message"'; then
  echo "  ok    erro sai no formato { error: { code, message } }"
  passou=$((passou + 1))
else
  printf '  FALHA formato de erro inesperado: %s\n' "$erro"
  falhou=$((falhou + 1))
fi

echo
echo "Busca por id"
verificar "id inexistente responde 404" 404 \
  "$(status_de "$API/sectors/00000000-0000-4000-8000-000000000000")"
if corpo_de "$API/sectors/00000000-0000-4000-8000-000000000000" | grep -q 'SETOR_NAO_ENCONTRADO'; then
  echo "  ok    404 usa o code SETOR_NAO_ENCONTRADO"
  passou=$((passou + 1))
else
  echo "  FALHA code errado no 404"
  falhou=$((falhou + 1))
fi

echo
printf '%s passaram, %s falharam\n' "$passou" "$falhou"
[ "$falhou" -eq 0 ]
