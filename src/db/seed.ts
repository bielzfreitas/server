import { client, db } from ".";
import { goalCompletions, goals } from "./schema";
import dayjs from "dayjs";

/*
Para executar
- npm run seed

Abrindo no BD Drizzle
- npx drizzle-kit studio

Instalar lib de datas para trabalhar melhor com as datas
- npm i dayjs
*/

//arquivo que popula o banco de dados com dados ficticios
async function seed() {
	//como é executado várias vezes - limpar sempre que executar
	//tem que ser nessa ordem pois o "goalCompletions" depende do "goalId"
	//caso apague as metas antes, da erro de chave estrangeira (não tem cascade)
	await db.delete(goalCompletions);
	await db.delete(goals);

	//fazendo algumas inserções no bd
	//result cria um array e salva as três posições (registro) com TODOS os dados inseridos
	const result = await db
		.insert(goals)
		.values([
			{ title: "Acordar Cedo", desiredWeeklyFrequency: 5 },
			{ title: "Academia", desiredWeeklyFrequency: 3 },
			{ title: "Estudar", desiredWeeklyFrequency: 2 },
		])
		.returning(); //retorna os valores

	//referencia do primeiro dia dessa semana (o primeiro que antecede o dia que está rodando o seed)
	const startOfWeek = dayjs().startOf("week");

	//criando algumas metas completadas
	await db.insert(goalCompletions).values([
		//pegando a primeira meta
		{ goalId: result[0].id, createdAt: startOfWeek.toDate() }, //precisa converter o tipo "dayjs" para "toDate()"
		{ goalId: result[1].id, createdAt: startOfWeek.add(1, "day").toDate() }, //completado no começo da semana porém acrescentado 1 dia nela
	]);
}
seed().finally(() => {
	//depois do seed executar (independente de se der certo ou errado) fecha a conexão
	client.end();
});
