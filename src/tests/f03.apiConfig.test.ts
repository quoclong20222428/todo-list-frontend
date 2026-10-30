/**
 * F03 — api instance configuration
 *
 * Tests the axios singleton exported from src/api/api.ts directly.
 * Every HTTP call in the application flows through this instance.
 *
 * What regressions this can detect:
 *   - Content-Type header removed from axios.create() config
 *   - VITE_API_BASE_URL env variable name changed in api.ts (wiring broken)
 *   - axios.create() replaced with something that lacks HTTP methods
 *   - baseURL hardcoded instead of read from the environment variable
 *
 * No mocks required. The .env file is loaded by Vite/Vitest before tests run,
 * so import.meta.env.VITE_API_BASE_URL is populated with the real value.
 *
 * Test environment: node (default — no DOM needed).
 */

import { describe, it, expect } from "vitest";
import { api } from "@/api/api";

describe("F03 — api instance: configuration and wiring", () => {
  describe("Default headers", () => {
    it("sets Content-Type: application/json for all requests", () => {
      // axios.create({ headers: { 'Content-Type': ... } }) stores the value
      // directly on instance.defaults.headers (not under .common).
      // This catches removal of the Content-Type header from axios.create().
      expect(api.defaults.headers["Content-Type"]).toBe("application/json");
    });
  });

  describe("baseURL wiring", () => {
    it("reads baseURL from VITE_API_BASE_URL environment variable", () => {
      // Asserts that api.ts uses import.meta.env.VITE_API_BASE_URL.
      // If the variable name in api.ts is changed (e.g. to VITE_API_URL),
      // api.defaults.baseURL will be undefined while import.meta.env.VITE_API_BASE_URL
      // is still defined — causing this test to fail.
      expect(api.defaults.baseURL).toBe(import.meta.env.VITE_API_BASE_URL);
    });

    it("baseURL is an absolute HTTP URL (format independent of env value)", () => {
      // Verifies structural correctness of the baseURL independently of the
      // env variable value. Catches cases where VITE_API_BASE_URL is missing,
      // set to a relative path, or set to a bare port number.
      // Complements the env-wiring test above without duplicating it.
      expect(api.defaults.baseURL).toMatch(/^https?:\/\/.+/);
    });
  });

  describe("HTTP method surface", () => {
    it("exposes get, post, put, and delete methods", () => {
      // Catches regressions where the export is replaced with a plain object
      // or an Axios request function rather than an instance.
      expect(typeof api.get).toBe("function");
      expect(typeof api.post).toBe("function");
      expect(typeof api.put).toBe("function");
      expect(typeof api.delete).toBe("function");
    });
  });
});
