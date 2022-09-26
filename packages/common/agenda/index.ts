import { Agenda } from "agenda/es";
import { getMongoClient } from "common/mongo";

let agenda;

export async function getAgenda() {
  if (agenda) return agenda;
  const mongoClient = await getMongoClient();
  agenda = new Agenda({ mongo: mongoClient.db() });
  return agenda;
}
