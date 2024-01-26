import { env } from "../../../env.ts";
import { type Log, sleep, parseCookies } from "./utils.ts";
import * as cheerio from "cheerio";

let isRunning = true;

export const stopVisaChecker = (log: Log) => {
  isRunning = false;
  log("Bay Bay!");
};

type HH = Record<string, string>;

export async function startVisaChecker(currentBookedDate: string, log: Log) {
  isRunning = true;

  log(`Initializing with current date ${currentBookedDate}`);

  try {
    const sessionHeaders = await login(log);

    while (isRunning) {
      const date = await checkAvailableDate(sessionHeaders);

      // if (!date) {
      //   log("no dates available");
      // } else if (date > currentBookedDate) {
      //   log(
      //     `nearest date is further than already booked (${currentBookedDate} vs ${date})`
      //   );
      // } else {
      //   currentBookedDate = date;
      //   const time = await checkAvailableTime(sessionHeaders, date);

      //   book(sessionHeaders, date, time).then(() =>
      //     log(`booked time at ${date} ${time}`)
      //   );
      // }

      await sleep(3);
    }
  } catch (err) {
    console.error(err);
    log("Trying again");

    // startVisaChecker(currentBookedDate, log);
  }
}

async function login(log: Log) {
  log(`Logging in`);

  const response = await fetch(`${env.BASE_URI}/users/sign_in`);
  const anonymousHeaders = await extractHeaders(response);

  return fetch(`${env.BASE_URI}/users/sign_in`, {
    headers: Object.assign({}, anonymousHeaders, {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    }),
    method: "POST",
    body: new URLSearchParams({
      utf8: "✓",
      "user[email]": env.USERNAME,
      "user[password]": env.PASSWORD,
      policy_confirmed: "1",
      commit: "Acessar",
    }),
  }).then((res) =>
    Object.assign({}, anonymousHeaders, {
      Cookie: extractRelevantCookies(res),
    })
  );
}

function checkAvailableDate(headers: HH) {
  return fetch(
    `${env.BASE_URI}/schedule/${env.SCHEDULE_ID}/appointment/days/${env.FACILITY_ID}.json?appointments[expedite]=false`,
    {
      headers: Object.assign({}, headers, {
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
      }),
      cache: "no-store",
    }
  )
    .then((r) => r.json())
    .then((r) => handleErrors(r))
    .then((d) => (d.length > 0 ? d[0]["date"] : null));
}

function checkAvailableTime(headers: HH, date: string) {
  return fetch(
    `${env.BASE_URI}/schedule/${env.SCHEDULE_ID}/appointment/times/${env.FACILITY_ID}.json?date=${date}&appointments[expedite]=false`,
    {
      headers: Object.assign({}, headers, {
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
      }),
      cache: "no-store",
    }
  )
    .then((r) => r.json())
    .then((r) => handleErrors(r))
    .then((d) => d["business_times"][0] || d["available_times"][0]);
}

function handleErrors(response: Response) {
  const errorMessage = response["error"];

  if (errorMessage) {
    throw new Error(errorMessage);
  }

  return response;
}

async function book(headers: HH, date: string, time: string) {
  const url = `${env.BASE_URI}/schedule/${env.SCHEDULE_ID}/appointment`;

  const newHeaders = await fetch(url, { headers: headers }).then((response) =>
    extractHeaders(response)
  );

  return fetch(url, {
    method: "POST",
    redirect: "follow",
    headers: Object.assign({}, newHeaders, {
      "Content-Type": "application/x-www-form-urlencoded",
    }),
    body: new URLSearchParams({
      utf8: "✓",
      authenticity_token: newHeaders["X-CSRF-Token"],
      confirmed_limit_message: "1",
      use_consulate_appointment_capacity: "true",
      "appointments[consulate_appointment][facility_id]": env.FACILITY_ID,
      "appointments[consulate_appointment][date]": date,
      "appointments[consulate_appointment][time]": time,
      "appointments[asc_appointment][facility_id]": "",
      "appointments[asc_appointment][date]": "",
      "appointments[asc_appointment][time]": "",
    }),
  });
}

async function extractHeaders(res: Response) {
  const cookies = extractRelevantCookies(res);

  const html = await res.text();
  const $ = cheerio.load(html);
  const csrfToken = $('meta[name="csrf-token"]').attr("content") || "";

  return {
    Cookie: cookies,
    "X-CSRF-Token": csrfToken,
    Referer: env.BASE_URI,
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
    "Cache-Control": "no-store",
    Connection: "keep-alive",
  };
}

function extractRelevantCookies(res: Response) {
  const parsedCookies = parseCookies(res.headers.getSetCookie());
  return `_yatri_session=${parsedCookies["_yatri_session"]}`;
}
