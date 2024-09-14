import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";
import { db } from "../db";
import { goalCompletions, goals } from "../db/schema";
import { and, count, eq, gte, sql } from "drizzle-orm";
import { lte } from "drizzle-orm";
import { desc } from "drizzle-orm";

dayjs.extend(weekOfYear);

//retornar metas pendentes da semana
export async function getWeekSummary() {
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
	const goalsCompletedInWeek = db.$with("ggoals_completed_in_week").as(
		//fazendo uma contagem
		db
			.select({
				id: goalCompletions.id,
				title: goals.title,
				completedAt: goalCompletions.createdAt,
				completedAtDate: sql /*sql*/`
					DATE(${goalCompletions.createdAt})
				`.as("completedAtDate"),
			})
			.from(goalCompletions)
			.innerJoin(goals, eq(goals.id, goalCompletions.goalId))
			.orderBy(desc(goalCompletions.createdAt))
			.where(
				and(
					gte(goalCompletions.createdAt, firstDayOfWeek),
					lte(goalCompletions.createdAt, lastDayOfWeek),
				),
			),
	);

	//table expression - agrupando dados pela data
	const goalsCompletedByWeekDay = db.$with("goals_completed_by_week_day").as(
		db
			.select({
				completedAtDate: goalsCompletedInWeek.completedAtDate,
				//usando json agragrede - converte em um array
				completions: sql /*sql*/`
					JSON_AGG(
						JSON_BUILD_OBJECT(
							'id', ${goalsCompletedInWeek.id},
							'title', ${goalsCompletedInWeek.title},
							'completedAt', ${goalsCompletedInWeek.completedAt}
						)
					)
				`.as("completions"),
			})
			.from(goalsCompletedInWeek)
			.orderBy(desc(goalsCompletedInWeek.completedAtDate))
			.groupBy(goalsCompletedInWeek.completedAtDate),
	);

	type GoalsPerDay = Record<string, {
		id: string
		title: string
		completedAt: string
	}[]>

	const result = await db
		.with(goalsCreatedUpToWeek, goalsCompletedInWeek, goalsCompletedByWeekDay)
		.select({
			completed:
				sql /*sql*/`(SELECT COUNT(*) FROM ${goalsCompletedInWeek})`.mapWith(
					Number,
				),
			total:
				sql /*sql*/`(SELECT SUM(${goalsCreatedUpToWeek.desiredWeeklyFrequency}) FROM ${goalsCreatedUpToWeek})`.mapWith(
					Number,
				),
			//agregacao para não repetir os dados
			goalsPerDay: sql /*sql*/<GoalsPerDay>`
				JSON_OBJECT_AGG(
					${goalsCompletedByWeekDay.completedAtDate},
					${goalsCompletedByWeekDay.completions}
				)
			`,
		})
		.from(goalsCompletedByWeekDay);

	return {
		summary: result[0],
	};
}
