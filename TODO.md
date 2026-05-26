# TODO - Correções Appwrite SaaS multi-tenant (barbearias)

## Checklist (aprovado)

1. Criar hook `useBarbearia` + Context global (React Context)
   - Buscar usuário via `account.get()`
   - Query em `barbearias` por `Query.equal("user_id", user.$id)`
   - Enquanto carrega: exibir loading (sem redirecionar)
   - Se achar: salvar no contexto e navegar para `/dashboard/[slug]`
   - Se não achar: navegar para onboarding em `/dashboard/[slug]/onboarding`

2. Ajustar guard de rota (`src/rotas/RotaProtegida.jsx`)
   - Usar o hook/context `useBarbearia`
   - Validar onboarding por presença de registros e/ou `configuracoes_barbearia.onboarding_completo`
   - Decidir entre `/dashboard/[slug]/onboarding` e dashboard

3. Corrigir onboarding sequencial (`src/pages/Onboarding.jsx`)
   - Step 1: garantir criação do documento em `barbearias` e obter `barbearia.$id`
   - Step 2: criar `configuracoes_barbearia` com `barbearia_id: barbearia.$id`
   - Step 3: criar `horarios_atendimento` com `barbearia_id: barbearia.$id`
   - Step 4: criar `servicos` com `barbearia_id: barbearia.$id`
   - Step 5: setar `onboarding_completo: true`
   - Step 6: redirecionar para `/dashboard/[slug]`

4. Corrigir queries do dashboard/subpáginas
   - Garantir `Query.equal("barbearia_id", barbearia.$id)` sempre (usar `$id`, nunca `id`)

5. Helper para criar agendamento com relacionamentos corretos
   - Função que cria agendamento com:
     - `barbearia_id: barbearia.$id`
     - `cliente_id: cliente.$id`
     - `servico_id: servico.$id`
     - `status: "pendente"`

6. Ajustar fluxo de login para não redirecionar para onboarding quando barbearia já existe

## Observações
- Não alterar estrutura/pastas.
- Não alterar IDs de DB/collections (manter via env).
- Permissões “any” não devem ser mexidas.

