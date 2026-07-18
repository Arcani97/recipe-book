import { MODULE_ID } from "./constants.js";

export function log(label, data) {
  if (data !== undefined) console.log(`${MODULE_ID} | ${label}`, data);
  else console.log(`${MODULE_ID} | ${label}`);
}
