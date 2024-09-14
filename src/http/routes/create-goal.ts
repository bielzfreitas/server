import { z } from "zod";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { createGoal } from "../../functions/create-goal";

export const createGoalRoute: FastifyPluginAsyncZod = async (app) => {
	//criando primeira rota - depois separar em outro arquivo
	//inserir uma nova meta
	//acessando os dados no corpo da request
	app.post(
		"/goals",
		{
			schema: {
				body: z.object({
					title: z.string(),
					//número / inteiro / no mínimo 1 e no máximo 7 (repetições dentro de uma semana)
					desiredWeeklyFrequency: z.number().int().min(1).max(7),
				}),
			},
		},
		async (request) => {
			//dizendo que meu body tem que ser um obj
			const { title, desiredWeeklyFrequency } = request.body;
			//colando um parse no body - caso não tenha informação, ele da erro
			await createGoal({
				title,
				desiredWeeklyFrequency,
			});
		},
	);
};
