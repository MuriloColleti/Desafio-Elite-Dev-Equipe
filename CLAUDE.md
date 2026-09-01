# CLAUDE.md

As instruções, convenções, arquitetura e decisões deste projeto vivem em `AGENTS.md` (fonte única,
para não duplicar). Leia antes de qualquer tarefa:

@AGENTS.md

## Notas específicas do Claude Code

- Responda sempre em **português do Brasil**.
- **Commits nunca citam IA/Claude** (nem `Co-Authored-By`, nem "generated with", nem emoji de
  robô). Ver premissa 5 em `AGENTS.md`.
- **Isto é live coding com 4 horas de relógio.** Antes de propor qualquer coisa, pergunte se ela
  entrega um critério de aceite listado na seção 3 do `AGENTS.md`. Se não entrega, não faça.
- **Não invente critério de aceite.** A lista de cada story é fechada. Funcionalidade que parece
  útil mas não está lá é escopo extra e custa tempo de quem precisa entregar o que é avaliado.
- **Respeite a fronteira de módulo.** Cada story tem um dono; código de story alheia não se edita.
  A exceção combinada é o gancho `waitlist.promoverProximo()` descrito na seção 4.
- Antes de dizer que uma story está pronta, confira os critérios **na tela rodando**, não no
  código. Dar por pronto o que não foi visto funcionando é o pior erro possível aqui.
