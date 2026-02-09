


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;




ALTER SCHEMA "public" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."lado_divida_enum" AS ENUM (
    'DEVO',
    'ME_DEVE'
);


ALTER TYPE "public"."lado_divida_enum" OWNER TO "postgres";


CREATE TYPE "public"."tipo_conta_enum" AS ENUM (
    'DINHEIRO',
    'CONTA_CORRENTE',
    'CARTAO_CREDITO'
);


ALTER TYPE "public"."tipo_conta_enum" OWNER TO "postgres";


CREATE TYPE "public"."tipo_movimentacao_enum" AS ENUM (
    'ENTRADA',
    'SAIDA',
    'TRANSFERENCIA',
    'AJUSTE'
);


ALTER TYPE "public"."tipo_movimentacao_enum" OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."categorias" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nome" "text" NOT NULL,
    "ativa" boolean DEFAULT true,
    "user_id" "uuid",
    "tipo_categoria" "extensions"."tipo_categoria_enum" DEFAULT 'SAIDA'::"extensions"."tipo_categoria_enum" NOT NULL,
    "is_default" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."categorias" OWNER TO "postgres";


COMMENT ON COLUMN "public"."categorias"."ativa" IS 'Se false, categoria fica oculta para o usuário, histórico permanece';



COMMENT ON COLUMN "public"."categorias"."tipo_categoria" IS 'Define se a categoria é usada para ENTRADA ou SAIDA';



COMMENT ON COLUMN "public"."categorias"."is_default" IS 'Categoria criada pelo sistema, pode ser ocultada pelo usuário';



CREATE TABLE IF NOT EXISTS "public"."compras_cartao" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "conta_cartao_id" "uuid" NOT NULL,
    "data_compra" "date" NOT NULL,
    "descricao" "text" NOT NULL,
    "valor_total" numeric NOT NULL,
    "numero_parcelas" integer NOT NULL,
    "categoria_id" "uuid",
    "subcategoria_id" "uuid",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "user_id" "uuid",
    CONSTRAINT "compras_cartao_numero_parcelas_check" CHECK (("numero_parcelas" > 0)),
    CONSTRAINT "compras_cartao_valor_total_check" CHECK (("valor_total" > (0)::numeric))
);


ALTER TABLE "public"."compras_cartao" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nome" "text" NOT NULL,
    "tipo_conta" "public"."tipo_conta_enum" NOT NULL,
    "saldo_inicial" numeric,
    "limite_total" numeric,
    "ativa" boolean DEFAULT true,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "user_id" "uuid"
);


ALTER TABLE "public"."contas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dividas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "agente" "text" NOT NULL,
    "lado" "public"."lado_divida_enum" NOT NULL,
    "saldo_inicial" numeric NOT NULL,
    "ativa" boolean DEFAULT true,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "user_id" "uuid"
);


ALTER TABLE "public"."dividas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."movimentacoes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "data" "date" NOT NULL,
    "tipo" "public"."tipo_movimentacao_enum" NOT NULL,
    "conta_origem_id" "uuid",
    "conta_destino_id" "uuid",
    "valor" numeric NOT NULL,
    "categoria_id" "uuid",
    "subcategoria_id" "uuid",
    "descricao" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "user_id" "uuid",
    CONSTRAINT "chk_movimentacao_contas" CHECK (((("tipo" = 'ENTRADA'::"public"."tipo_movimentacao_enum") AND ("conta_destino_id" IS NOT NULL) AND ("conta_origem_id" IS NULL)) OR (("tipo" = 'SAIDA'::"public"."tipo_movimentacao_enum") AND ("conta_origem_id" IS NOT NULL) AND ("conta_destino_id" IS NULL)) OR (("tipo" = 'TRANSFERENCIA'::"public"."tipo_movimentacao_enum") AND ("conta_origem_id" IS NOT NULL) AND ("conta_destino_id" IS NOT NULL)) OR (("tipo" = 'AJUSTE'::"public"."tipo_movimentacao_enum") AND ((("conta_origem_id" IS NOT NULL) AND ("conta_destino_id" IS NULL)) OR (("conta_origem_id" IS NULL) AND ("conta_destino_id" IS NOT NULL)))))),
    CONSTRAINT "movimentacoes_valor_check" CHECK (("valor" > (0)::numeric))
);


ALTER TABLE "public"."movimentacoes" OWNER TO "postgres";


COMMENT ON COLUMN "public"."movimentacoes"."categoria_id" IS 'Categoria opcional. Pode ser definida posteriormente';



CREATE TABLE IF NOT EXISTS "public"."movimentos_divida" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "divida_id" "uuid" NOT NULL,
    "data" "date" NOT NULL,
    "valor" numeric NOT NULL,
    "descricao" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "user_id" "uuid"
);


ALTER TABLE "public"."movimentos_divida" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."parcelas_cartao" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "compra_cartao_id" "uuid" NOT NULL,
    "competencia" "date" NOT NULL,
    "valor" numeric NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "user_id" "uuid",
    CONSTRAINT "parcelas_cartao_valor_check" CHECK (("valor" > (0)::numeric))
);


ALTER TABLE "public"."parcelas_cartao" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subcategorias" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "categoria_id" "uuid" NOT NULL,
    "nome" "text" NOT NULL,
    "ativa" boolean DEFAULT true,
    "user_id" "uuid"
);


ALTER TABLE "public"."subcategorias" OWNER TO "postgres";


COMMENT ON TABLE "public"."subcategorias" IS 'Subcategorias são usadas apenas para categorias de SAIDA';



COMMENT ON COLUMN "public"."subcategorias"."categoria_id" IS 'Deve referenciar apenas categorias do tipo SAIDA (regra de aplicação)';



ALTER TABLE ONLY "public"."categorias"
    ADD CONSTRAINT "categorias_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."compras_cartao"
    ADD CONSTRAINT "compras_cartao_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contas"
    ADD CONSTRAINT "contas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dividas"
    ADD CONSTRAINT "dividas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."movimentacoes"
    ADD CONSTRAINT "movimentacoes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."movimentos_divida"
    ADD CONSTRAINT "movimentos_divida_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."parcelas_cartao"
    ADD CONSTRAINT "parcelas_cartao_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subcategorias"
    ADD CONSTRAINT "subcategorias_pkey" PRIMARY KEY ("id");



CREATE UNIQUE INDEX "categorias_nome_tipo_unique" ON "public"."categorias" USING "btree" ("nome", "tipo_categoria");



ALTER TABLE ONLY "public"."compras_cartao"
    ADD CONSTRAINT "compras_cartao_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias"("id");



ALTER TABLE ONLY "public"."compras_cartao"
    ADD CONSTRAINT "compras_cartao_conta_cartao_id_fkey" FOREIGN KEY ("conta_cartao_id") REFERENCES "public"."contas"("id");



ALTER TABLE ONLY "public"."compras_cartao"
    ADD CONSTRAINT "compras_cartao_subcategoria_id_fkey" FOREIGN KEY ("subcategoria_id") REFERENCES "public"."subcategorias"("id");



ALTER TABLE ONLY "public"."movimentacoes"
    ADD CONSTRAINT "movimentacoes_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias"("id");



ALTER TABLE ONLY "public"."movimentacoes"
    ADD CONSTRAINT "movimentacoes_conta_destino_id_fkey" FOREIGN KEY ("conta_destino_id") REFERENCES "public"."contas"("id");



ALTER TABLE ONLY "public"."movimentacoes"
    ADD CONSTRAINT "movimentacoes_conta_origem_id_fkey" FOREIGN KEY ("conta_origem_id") REFERENCES "public"."contas"("id");



ALTER TABLE ONLY "public"."movimentacoes"
    ADD CONSTRAINT "movimentacoes_subcategoria_id_fkey" FOREIGN KEY ("subcategoria_id") REFERENCES "public"."subcategorias"("id");



ALTER TABLE ONLY "public"."movimentos_divida"
    ADD CONSTRAINT "movimentos_divida_divida_id_fkey" FOREIGN KEY ("divida_id") REFERENCES "public"."dividas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."parcelas_cartao"
    ADD CONSTRAINT "parcelas_cartao_compra_cartao_id_fkey" FOREIGN KEY ("compra_cartao_id") REFERENCES "public"."compras_cartao"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subcategorias"
    ADD CONSTRAINT "subcategorias_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias"("id") ON DELETE RESTRICT;



CREATE POLICY "Allow read categories" ON "public"."categorias" FOR SELECT USING (true);





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


REVOKE USAGE ON SCHEMA "public" FROM PUBLIC;
GRANT ALL ON SCHEMA "public" TO PUBLIC;








































































































































































GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."categorias" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."categorias" TO "authenticated";



GRANT ALL ON TABLE "public"."contas" TO "anon";
GRANT ALL ON TABLE "public"."contas" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."subcategorias" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."subcategorias" TO "authenticated";


































