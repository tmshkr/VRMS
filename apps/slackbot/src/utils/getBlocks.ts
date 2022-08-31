const lineReader = require("line-reader");

export const getBlocks = async (filePath: string) => {
  return new Promise((resolve, reject) => {
    const urlPrefix = /https:\/\/app.slack.com\/block-kit-builder\/.*#/;
    lineReader.eachLine(`content/${filePath}`, function (line, last) {
      if (urlPrefix.test(line)) {
        try {
          const json = JSON.parse(decodeURI(line.split(urlPrefix)[1]));
          resolve({
            blocks: json.blocks,
            text: json.blocks.find((el) => el.text?.text)?.text.text,
          });
        } catch (err) {
          console.error(err);
          reject("Invalid JSON");
        }
        return false;
      }
      if (last) {
        reject("Blocks not found");
      }
    });
  });
};
