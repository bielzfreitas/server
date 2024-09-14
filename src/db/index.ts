//conexão com o bd
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
//exportando todas as exportações e jogar numa unica variavel schema
import * as schema from "./schema";
import { env } from "../env";

export const client = postgres(env.DATABASE_URL);
//faz log em todas as queries do bd - podendo ver no terminal
export const db = drizzle(client, { schema, logger: true });
