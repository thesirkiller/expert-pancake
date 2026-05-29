# Mapeamento de Tabelas: Bubble.io → Supabase

Este documento mapeia os tipos de dados do Bubble.io para as tabelas do Supabase, facilitando a migração dos dados.

## Tabela de Mapeamento

| Bubble.io (Custom Type)          | Supabase (Tabela)        | Observações                              |
|----------------------------------|--------------------------|------------------------------------------|
| `custom.cooperativas`            | `cooperativas`           | Entidade principal                       |
| `custom.cooperados`              | `cooperados`             | Vinculada a `auth.users`                 |
| `custom.times_internos`          | `times_internos`         | Times/equipes internas                   |
| -                                | `times_internos_cooperados` | Relação N:N (nova tabela)            |
| `custom.assembleias`             | `assembleias`            | Assembleias da cooperativa               |
| `custom.pautas_de_reuniao`       | `pautas_reuniao`         | Renomeado para snake_case                |
| -                                | `votos_assembleia`       | Nova tabela para votos                   |
| `custom.e_servicos`              | `servicos_financeiros`   | Renomeado para clareza                   |
| -                                | `escalas`                | Extraído do módulo de escalas            |
| -                                | `cursos`                 | Módulo EAD                               |
| -                                | `aulas`                  | Módulo EAD                               |
| -                                | `progresso_curso`        | Tracking de progresso                    |
| -                                | `documentos_rh`          | Módulo RH                                |
| -                                | `afastamentos`           | Módulo RH                                |
| -                                | `orcamentos`             | Módulo orçamentos                        |
| -                                | `orcamento_itens`        | Itens do orçamento                       |

## Mapeamento de Campos

### cooperativas
| Bubble Field                      | Supabase Column     | Tipo      |
|-----------------------------------|---------------------|-----------|
| `_id`                             | `id`                | UUID      |
| `Created Date`                    | `created_at`        | TIMESTAMPTZ |
| `Modified Date`                   | `updated_at`        | TIMESTAMPTZ |
| `nome_text`                       | `nome`              | TEXT      |
| `cnpj_text`                       | `cnpj`              | TEXT      |
| `logo_image`                      | `logo_url`          | TEXT      |
| `lista_de_modulos_list_option...` | `modulos_ativos`    | ENUM[]    |

### cooperados
| Bubble Field                      | Supabase Column     | Tipo      |
|-----------------------------------|---------------------|-----------|
| `_id`                             | `id`                | UUID      |
| `Created Date`                    | `created_at`        | TIMESTAMPTZ |
| `email`                           | `email`             | TEXT      |
| `nome_text`                       | `nome`              | TEXT      |
| `cpf_text`                        | `cpf`               | TEXT      |
| `data_de_nascimento_date`         | `data_nascimento`   | DATE      |
| `telefone_principal__whats__text` | `whatsapp`          | TEXT      |
| `foto_image`                      | `foto_url`          | TEXT      |
| `primeiro_acesso_boolean`         | `primeiro_acesso`   | BOOLEAN   |
| `admin_coop_boolean`              | `admin_coop`        | BOOLEAN   |
| `colaborador_interno_boolean`     | `colaborador_interno` | BOOLEAN |
| `minha_cooperativa_custom_cooperativas` | `cooperativa_id` | UUID FK |
| `meus_times_list_custom_times_internos` | via tabela N:N | -       |

### times_internos
| Bubble Field                      | Supabase Column     | Tipo      |
|-----------------------------------|---------------------|-----------|
| `_id`                             | `id`                | UUID      |
| `nome_text`                       | `nome`              | TEXT      |
| `permissoes_list_option_permissoes_modulos` | `permissoes` | ENUM[] |
| `cooperativa_custom_cooperativas` | `cooperativa_id`    | UUID FK   |

### servicos_financeiros (ex: e_servicos)
| Bubble Field                      | Supabase Column     | Tipo      |
|-----------------------------------|---------------------|-----------|
| `_id`                             | `id`                | UUID      |
| `fix_entrada_date`                | `data_entrada`      | DATE      |
| `valor_number`                    | `valor`             | NUMERIC   |
| `valor_para_a_cooperativa_number` | `valor_para_cooperativa` | NUMERIC |
| `cooperativa_custom_cooperativas` | `cooperativa_id`    | UUID FK   |

## Mapeamento de Option Sets → ENUMs

### option.permissoes_modulos → permissao_modulo
| Bubble Value            | Supabase Value         |
|-------------------------|------------------------|
| `meus_dados`            | `meus_dados`           |
| `dashboard`             | `dashboard`            |
| `gest_o_geral`          | `gestao_geral`         |
| `gest_o_de_rh`          | `gestao_de_rh`         |
| `gest_o_de_escalas`     | `gestao_de_escalas`    |
| `financeiro`            | `financeiro`           |
| `educa__o_continuada`   | `educacao_continuada`  |
| `assembleias`           | `assembleias`          |

### option.status_de_escala → status_escala
| Bubble Value            | Supabase Value         |
|-------------------------|------------------------|
| (definir)               | `pendente`             |
| (definir)               | `confirmada`           |
| (definir)               | `cancelada`            |
| (definir)               | `executada`            |

## Script de Migração (Exemplo)

```javascript
// Exemplo: Migrar cooperativas do Bubble para Supabase
const migrateCooperativas = async (bubbleData) => {
  for (const coop of bubbleData) {
    await supabase.from('cooperativas').insert({
      id: coop._id, // Manter o mesmo ID se possível
      created_at: coop['Created Date'],
      updated_at: coop['Modified Date'],
      nome: coop.nome_text,
      cnpj: coop.cnpj_text,
      logo_url: coop.logo_image,
      modulos_ativos: mapModulos(coop.lista_de_modulos_list_option_permissoes_modulos)
    })
  }
}

const mapModulos = (bubbleModulos) => {
  const mapping = {
    'gest_o_geral': 'gestao_geral',
    'gest_o_de_rh': 'gestao_de_rh',
    'gest_o_de_escalas': 'gestao_de_escalas',
    'educa__o_continuada': 'educacao_continuada',
    // ... outros
  }
  return bubbleModulos.map(m => mapping[m] || m)
}
```

## Próximos Passos

1. **Exportar dados do Bubble** via API ou CSV
2. **Criar projeto Supabase** e executar `schema.sql`
3. **Executar scripts de migração** para cada tabela
4. **Verificar integridade** dos dados migrados
5. **Configurar Storage buckets** para arquivos/imagens
6. **Ajustar URLs de imagens** para apontar para Supabase Storage
