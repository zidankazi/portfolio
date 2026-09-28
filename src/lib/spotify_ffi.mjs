// Runtime operations only. Spotify decoding and cache policy live in Gleam.
import { Result$Ok, Result$Error } from "../gleam.mjs";

export function new_cell(value) {
  return { value };
}

export function read_cell(cell) {
  return cell.value;
}

export function write_cell(cell, value) {
  cell.value = value;
}

export function now_ms() {
  return Date.now();
}

export async function request(method, url, headers, body) {
  try {
    const response = await fetch(url, {
      method,
      headers: Object.fromEntries(headers),
      body: method === "GET" ? undefined : body,
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    return Result$Ok([response.status, await response.text()]);
  } catch {
    // Do not expose request headers, credentials, or response bodies in errors.
    return Result$Error(undefined);
  }
}
