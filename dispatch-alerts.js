import { broadcastDueAlerts } from "../src/services/telegram.js";

const result = await broadcastDueAlerts();
console.log(JSON.stringify({ sent: result.length, items: result }, null, 2));
