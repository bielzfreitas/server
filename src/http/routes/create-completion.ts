import { z } from "zod";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { createGoalCompletion } from "../../functions/create-goal-completion";

export const createCompletionRoute: FastifyPluginAsyncZod = async (app) => {
	app.post(
		"/completions",
		{
			schema: {
				body: z.object({
					goalId: z.string(),
				}),
			},
		},
		async (request) => {
			//dizendo que meu body tem que ser um obj
			const { goalId } = request.body;
			//colando um parse no body - caso não tenha informação, ele da erro
			await createGoalCompletion({
				goalId,
			});
		},
	);
};
