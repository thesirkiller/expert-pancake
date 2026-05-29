# GestorCoop

Sistema de Gestão de Cooperativas de Saúde - Migrado de Bubble.io para React + Supabase.

## 🚀 Tecnologias

- **Frontend**: React 19, React Router DOM 7
- **Build Tool**: Vite 7
- **Backend/Database**: Supabase (PostgreSQL)
- **Autenticação**: Supabase Auth
- **Storage**: Supabase Storage
- **Estilização**: CSS Vanilla com Design System

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais do Supabase
```

## 🔧 Configuração do Supabase

1. Crie um projeto no [Supabase](https://supabase.com)
2. Execute o schema SQL em `supabase/schema.sql` no SQL Editor
3. Configure o Storage bucket para avatares
4. Copie as credenciais para o arquivo `.env`:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_anon_key
```

## 🏃 Executando

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview
```

## 📁 Estrutura do Projeto

```
src/
├── components/
│   └── common/
│       ├── Header.jsx
│       └── ProtectedRoute.jsx
├── contexts/
│   └── AuthContext.jsx
├── pages/
│   ├── LoginPage.jsx
│   ├── HomePage.jsx
│   └── ProfilePage.jsx
├── services/
│   └── supabase.js
├── styles/
│   └── index.css
├── App.jsx
└── main.jsx

supabase/
├── schema.sql          # Schema do banco de dados
└── MIGRATION_MAPPING.md # Mapeamento Bubble → Supabase
```

## 📊 Módulos

- ✅ **Autenticação** - Login, logout, recuperação de senha
- ✅ **Perfil** - Edição de dados, foto, alteração de senha
- ✅ **Dashboard/Home** - Grid de módulos com permissões
- 🚧 **Gestão Geral** - Em desenvolvimento
- 🚧 **Gestão de RH** - Em desenvolvimento
- 🚧 **Gestão de Escalas** - Em desenvolvimento
- 🚧 **Financeiro** - Em desenvolvimento
- 🚧 **Educação Continuada** - Em desenvolvimento
- 🚧 **Assembleias** - Em desenvolvimento
- 🚧 **Orçamentos** - Em desenvolvimento

## 🔐 Sistema de Permissões

O sistema replica a lógica do Bubble:
- Cada cooperativa tem módulos ativos na assinatura
- Cada cooperado pertence a times
- Times têm permissões específicas por módulo
- Acesso aos módulos = (módulo ativo na cooperativa) AND (usuário tem permissão)

## 📝 Migração do Bubble

Consulte `supabase/MIGRATION_MAPPING.md` para o mapeamento completo de:
- Tabelas (Custom Types → Tables)
- Campos (Fields → Columns)  
- Options Sets → ENUMs
- Scripts de migração

## 📄 Licença

ISC
