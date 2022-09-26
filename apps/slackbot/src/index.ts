if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({ path: "../../.env" });
}

import { app } from "app";
import { getAgenda } from "common/agenda";
import { registerJobs } from "common/agenda/jobs";
import { initSync } from "common/google/sync";

(async () => {
  await app.start(process.env.PORT || 3000);
  console.log("⚡️ Bolt app is running!");
  const agenda = await getAgenda();
  registerJobs(agenda);
  agenda.start();
  console.log("Agenda started");
  initSync();
})();
