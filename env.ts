import { load } from "dotenv";
import { cleanEnv, str, email } from "envalid";

await load({ export: true });

export const env = cleanEnv(Deno.env.toObject(), {
  BOT_TOKEN: str(),
  WEBHOOK_PATH: str(),
  USERNAME: email(),
  PASSWORD: str(),
  DATA: str(),
  SCHEDULE_ID: str(),
  FACILITY_ID: str(),
  BASE_URI: str(),
});
