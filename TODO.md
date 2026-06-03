# TODO - Corrigir erro do Onboarding finalizar()

## Step 1 - Localizar causa do 404 por ID determinístico
- [ ] Confirmar como `upsertById('configuracoes', configId, ...)` se comporta quando o documento já existe.
- [ ] Identificar onde pode estar ocorrendo um `getDocument`/`updateDocument` com ID inexistente (`id01sb25y2`).

## Step 2 - Ajustar upsert seguro para `configuracoes`
- [ ] Tornar `_findExistingDoc` mais robusto (principalmente para `configuracoes`).
- [ ] Garantir que o `updateDocument` sempre use o `$id` correto retornado do banco.

## Step 3 - Adicionar logs diagnósticos (opcional, mas recomendado)
- [ ] Logar `configId`, `barbeariaId`, e o resultado de `_findExistingDoc` para `configuracoes`.

## Step 4 - Testar onboarding
- [ ] Executar onboarding completo e confirmar ausência do erro 404.
- [ ] Confirmar que `onboarding_completo` vira `true`.

