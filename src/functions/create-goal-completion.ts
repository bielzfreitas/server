//segunda rota
import dayjs from "dayjs";
import { db } from "../db";
import { goalCompletions, goals } from "../db/schema";
import { and, count, eq, gte, lte, sql } from "drizzle-orm";

//marcando como completa
interface CreateGoalCompletionRequest {
	goalId: string;
}

export async function createGoalCompletion({
	goalId,
}: CreateGoalCompletionRequest) {
	//retorna o primeiro dia da semana atual
	const firstDayOfWeek = dayjs().startOf("week").toDate();
	//retorna sempre ultimo dia da semana atual
	const lastDayOfWeek = dayjs().endOf("week").toDate();

	//retorna a contagem de metas concluidas nessa semana
	const goalCompletionCounts = db.$with("goal_completion_counts").as(
		//fazendo uma contagem
		db
			.select({
				goalId: goalCompletions.goalId,
				completionCount: count(goalCompletions.id).as("completionCount"),
			})
			.from(goalCompletions)
			.where(
				and(
					gte(goalCompletions.createdAt, firstDayOfWeek),
					lte(goalCompletions.createdAt, lastDayOfWeek),
					eq(goalCompletions.goalId, goalId),
				),
			)
			.groupBy(goalCompletions.goalId),
	);

	//criando common table
	const result = await db
		.with(goalCompletionCounts)
		.select({
			desiredWeeklyFrequency: goals.desiredWeeklyFrequency,
			//coalesce permite fazer um if - caso a variavel (valor) não exista, retorna default e converte para numero
			completionCount: sql /*sql*/`
				COALESCE(${goalCompletionCounts.completionCount}, 0)
			`.mapWith(Number),
		})
		.from(goals)
		.leftJoin(goalCompletionCounts, eq(goalCompletionCounts.goalId, goals.id))
		.where(eq(goals.id, goalId))
		.limit(1);

	const { completionCount, desiredWeeklyFrequency } = result[0];

	if (completionCount >= desiredWeeklyFrequency) {
		throw new Error("Goal already completed this week!");
	}
	//sempre retorna um array pq ele me permite inserir mais de um registro
	const insertResult = await db
		.insert(goalCompletions)
		.values({ goalId })
		.returning(); //retornando a meta que foi criada
	//retornando a meta e sempre em 0
	const goalCompletion = insertResult[0];

	//retornar a meta com um obj dentro - pq se mais pra frente precisar retornar mais coisa além da meta, somente adicionar
	return result;
}
