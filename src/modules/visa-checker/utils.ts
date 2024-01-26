import { Ctx } from "./types.ts";

export function sleep(s: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, s * 1000);
  });
}

export function createLogger(reply: Ctx["reply"]) {
  return function (message: string) {
    const msg = `[${new Date().toISOString()}]: ${message}`;
    reply(msg);
    console.log(msg);
  };
}

export type Log = ReturnType<typeof createLogger>;

export function parseCookies(cookies: string[]) {
  const parsedCookies = cookies.reduce((acc, c) => {
    const [name, value] = c.split("=", 2);
    acc[name] = value;
    return acc;
  }, {} as Record<string, string>);

  cookies
    .map((c) => c.trim())
    .forEach((c) => {
      const [name, value] = c.split("=", 2);
      parsedCookies[name] = value;
    });

  return parsedCookies;
}
