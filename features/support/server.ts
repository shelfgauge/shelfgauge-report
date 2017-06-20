import * as http from "http";

export const REQUESTS = [] as any[];
export const ERRORS = [] as any[];

export function reset() {
  REQUESTS.length = 0;
  ERRORS.length = 0;
}

export function lastRequest() {
  if (ERRORS.length > 0) {
    throw new Error(ERRORS.join("\n"));
  }
  return REQUESTS[REQUESTS.length - 1];
}

export function lastResponse() {
  return "I am the walrus";
}

export const app = http.createServer((req, res) => {
  let data = "";
  req.on("data", chunk => (data += chunk)).on("end", () => {
    REQUESTS.push(data);
    res.end(lastResponse());
  });
});

export function address(): string {
  if (!app.listening) {
    app.listen(0);
  }

  const addr = app.address();
  if (addr.address.includes(":")) {
    return `[${addr.address}]:${addr.port}`;
  } else {
    return `${addr.address}:${addr.port}`;
  }
}
