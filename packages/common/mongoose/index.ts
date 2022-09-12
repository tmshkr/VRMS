export const mongoose = require("mongoose");
mongoose.connection.on("open", function () {
  console.log("Connected to mongo server");
});

mongoose.connect(process.env.MONGO_URI, {
  dbName: `vrms-${process.env.ENVIRONMENT}`,
});
