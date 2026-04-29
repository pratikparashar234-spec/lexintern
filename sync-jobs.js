import { runAutomationPipeline } from "../src/services/automation/pipeline.js";

const result = await runAutomationPipeline();
console.log(JSON.stringify(result, null, 2));
