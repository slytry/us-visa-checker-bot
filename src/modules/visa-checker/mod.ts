import { Composer } from "grammy/mod.ts";
import { startVisaChecker, stopVisaChecker } from "./visa-checker.ts";
import { env } from "../../../env.ts";
import { createLogger } from "./utils.ts";

const composer = new Composer();

composer.command("check", (ctx) => {
  const log = createLogger(ctx.reply.bind(ctx));
  startVisaChecker(env.DATA, log);
});

composer.command("stopCheck", (ctx) => {
  const log = createLogger(ctx.reply.bind(ctx));
  stopVisaChecker(log);
});

export default composer;
