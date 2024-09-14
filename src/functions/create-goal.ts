//primeira rota

import { db } from "../db";
import { goals } from "../db/schema";

//quais são os dados - criar nova meta
interface CreateGoalRequest {
	title: string;
	desiredWeeklyFrequency: number;
}

export async function createGoal({
	title,
	desiredWeeklyFrequency,
}: CreateGoalRequest) {
	//sempre retorna um array pq ele me permite inserir mais de um registro
	const result = await db
		.insert(goals)
		.values({
			title,
			desiredWeeklyFrequency,
		})
		.returning(); //retornando a meta que foi criada

	//retornando a meta e sempre em 0
	const goal = result[0];

	//retornar a meta com um obj dentro - pq se mais pra frente precisar retornar mais coisa além da meta, somente adicionar
	return {
		goal,
	};
}
