// Dynamically set hostname for certbot
const fs = require("fs");
const path = require("path");
const SERVER_NAMES = process.argv[2];

fs.readdirSync(__dirname).forEach((file) => {
  if (file.endsWith(".conf")) {
    const filepath = path.join(__dirname, file);
    fs.readFile(filepath, "utf8", function (err, data) {
      if (err) return console.log(err);

      const result = data.replace(/SERVER_NAMES/g, SERVER_NAMES);
      fs.writeFile(filepath, result, "utf8", function (err) {
        if (err) return console.log(err);
      });
    });
  }
});
