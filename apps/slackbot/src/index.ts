if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({ path: "../.env" });
}

import { app } from "app";
import { getAgenda } from "lib/agenda";

(async () => {
  await app.start(process.env.PORT || 3000);
  console.log("⚡️ Bolt app is running!");
  const agenda = await getAgenda();
  agenda.start();
  console.log("Agenda started");
})();
