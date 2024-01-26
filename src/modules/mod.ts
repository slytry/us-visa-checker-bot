import { Composer } from "grammy/mod.ts";

import start from "./start.ts";
import visaChecker from "./visa-checker/mod.ts";

const composer = new Composer();

composer.use(start);
composer.use(visaChecker);

export default composer;
