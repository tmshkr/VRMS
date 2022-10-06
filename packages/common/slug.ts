import cuid from "cuid";
const slugify = require("slugify");

export function getSlug(str: string): string {
  return `${slugify(str.toLowerCase())}-${cuid.slug()}`;
}
