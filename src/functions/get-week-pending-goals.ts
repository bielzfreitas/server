import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";
import { db } from "../db";
import { goalCompletions, goals } from "../db/schema";
import { and, count, eq, gte, sql } from "drizzle-orm";
import { lte } from "drizzle-orm";

dayjs.extend(weekOfYear);

//retornar metas pendentes da semana
export async function getWeekPendingGoals() {
	//retorna o primeiro dia da semana atual
	const firstDayOfWeek = dayjs().startOf("week").toDate();
	//retorna sempre ultimo dia da semana atual
	const lastDayOfWeek = dayjs().endOf("week").toDate();

	//metas criadas até a semana atual
	const goalsCreatedUpToWeek = db.$with("goals_created_up_to_week").as(
		//se a data for menor ou igual ao ultimo dia da semana
		db
			.select({
				//filtrar os campos que estamos retornando
				id: goals.id,
				title: goals.title,
				desiredWeeklyFrequency: goals.desiredWeeklyFrequency,
				createdAt: goals.createdAt,
			})
			.from(goals)
			.where(lte(goals.createdAt, lastDayOfWeek)),
	);

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
				),
			)
			.groupBy(goalCompletions.goalId),
	);

	//Querry Principal
	const pendingGoals = await db
		.with(goalsCreatedUpToWeek, goalCompletionCounts)
		.select({
			id: goalsCreatedUpToWeek.id,
			title: goalsCreatedUpToWeek.title,
			desiredWeeklyFrequency: goalsCreatedUpToWeek.desiredWeeklyFrequency,
			//coalesce permite fazer um if - caso a variavel (valor) não exista, retorna default e converte para numero
			completionCount: sql /*sql*/`
				COALESCE(${goalCompletionCounts.completionCount}, 0)
			`.mapWith(Number),
		})
		.from(goalsCreatedUpToWeek)
		//os registros da tabela podem não existir - continua retornando memso se tiver 0 dados
		.leftJoin(
			goalCompletionCounts,
			eq(goalCompletionCounts.goalId, goalsCreatedUpToWeek.id),
		)
		.toSQL();

	return { pendingGoals };
}
