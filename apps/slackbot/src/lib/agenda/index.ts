import { Agenda } from "agenda/es";
import { getMongoClient } from "../mongo";
import { registerJobs } from "./jobs";

let agenda;

export async function getAgenda() {
  if (agenda) return agenda;
  const mongoClient = await getMongoClient();
  agenda = new Agenda({ mongo: mongoClient.db() });
  registerJobs(agenda);
  return agenda;
}
