/*
docker compose up -d
docker ps
caso não esteja rodando - docker ps -a
instalar ferramente? npm i drizzle-orm | npm i drizzle-kit -D
instalar npm i zod
*/

/*
Instalar Biblioteca parallel - algoritmo de geração de ID unico
- npm i @paralleldrive/cuid2

Rodando
- npx drizzle-kit generate 
- npx drizzle-kit migrate

Instalando o Postgres
- npm i postgres

Vendo o BD (pode executar várias vezes e abrir no navegador)
- npx drizzle-kit studio
- finalizar processo CTRL+C
*/

//Criando todas as tabelas que terão no projeto
import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

//Cadastrando meta
export const goals = pgTable("goals", {
	//preenche o id automaticamente
	id: text("id")
		.primaryKey()
		.$defaultFn(() => createId()),

	title: text("title").notNull(),
	desiredWeeklyFrequency: integer("desired_weekly_frequency").notNull(),

	//quando uma pessoa guarda uma data com os detalhes de fuzo horário
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		//quando alguem fazer uma nova meta o campo created at seja preenchido automaticamente com o fuzo horario
		.defaultNow(),
});

//Conclusões de Meta (quando usuário conclui uma meta)
export const goalCompletions = pgTable("goal_completions", {
	//preenche o id automaticamente
	id: text("id")
		.primaryKey()
		.$defaultFn(() => createId()),

	goalId: text("goal_id")
		.references(() => goals.id)
		.notNull(),

	//quando uma pessoa guarda uma data com os detalhes de fuzo horário
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		//quando alguem fazer uma nova meta o campo created at seja preenchido automaticamente com o fuzo horario
		.defaultNow(),
});
