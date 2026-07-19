export async function readJson(request, limit = 16_384) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (Buffer.byteLength(body) > limit) throw new Error("request body too large");
  }
  return JSON.parse(body || "{}");
}
