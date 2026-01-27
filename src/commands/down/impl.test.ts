import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildTestContext, type TestContext } from "../../test/context";
import type { LocalContext } from "../../context";
import down from "./impl";

// Helper to cast test context to LocalContext for testing
const asContext = (ctx: TestContext) => ctx as unknown as LocalContext;

// Mock the logger
vi.mock("../../services/logger", () => ({
  logger: {
    log: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  },
}));

import { logger } from "../../services/logger";

describe("down command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("path detection", () => {
    it("treats paths with even segments as document paths", async () => {
      const context = buildTestContext({
        firestoreMock: {
          "users/abc123": { name: "John", email: "john@example.com" },
        },
      });

      await down.call(asContext(context), {}, "users/abc123");

      // Should output single document JSON
      expect(context.stdout).toContain("_id");
      expect(context.stdout).toContain("abc123");
    });

    it("treats paths with odd segments as collection paths", async () => {
      const context = buildTestContext({
        firestoreMock: {
          users: [
            { id: "user1", data: { name: "Alice" } },
            { id: "user2", data: { name: "Bob" } },
          ],
        },
      });

      await down.call(asContext(context), {}, "users");

      // Should output collection info
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining("2 document(s)"),
      );
    });
  });

  describe("document fetching", () => {
    it("outputs document data as JSON", async () => {
      const context = buildTestContext({
        firestoreMock: {
          "users/doc1": { name: "Test User", age: 25 },
        },
      });

      await down.call(asContext(context), {}, "users/doc1");

      // Verify output contains the document data
      const output = context.stdout;
      expect(output).toContain("Test User");
      expect(output).toContain("_id");
    });

    it("warns when document is not found", async () => {
      const context = buildTestContext({
        firestoreMock: {
          // Empty - no documents
        },
      });

      await down.call(asContext(context), {}, "users/nonexistent");

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Document not found"),
      );
    });
  });

  describe("collection fetching", () => {
    it("outputs collection data as JSON array", async () => {
      const context = buildTestContext({
        firestoreMock: {
          products: [
            { id: "prod1", data: { name: "Widget", price: 10 } },
            { id: "prod2", data: { name: "Gadget", price: 20 } },
          ],
        },
      });

      await down.call(asContext(context), {}, "products");

      // Verify output contains array data
      const output = context.stdout;
      expect(output).toContain("Widget");
      expect(output).toContain("Gadget");
    });

    it("warns when collection is empty", async () => {
      const context = buildTestContext({
        firestoreMock: {
          "empty-collection": [],
        },
      });

      await down.call(asContext(context), {}, "empty-collection");

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining("No documents found"),
      );
    });

    it("logs document count when collection has documents", async () => {
      const context = buildTestContext({
        firestoreMock: {
          orders: [
            { id: "o1", data: { total: 100 } },
            { id: "o2", data: { total: 200 } },
            { id: "o3", data: { total: 300 } },
          ],
        },
      });

      await down.call(asContext(context), {}, "orders");

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining("3 document(s)"),
      );
    });
  });

  describe("nested paths", () => {
    it("handles nested document paths", async () => {
      const context = buildTestContext({
        firestoreMock: {
          "users/user1/orders/order1": { item: "Book", qty: 2 },
        },
      });

      await down.call(asContext(context), {}, "users/user1/orders/order1");

      expect(context.stdout).toContain("Book");
    });

    it("handles nested collection paths", async () => {
      const context = buildTestContext({
        firestoreMock: {
          "users/user1/orders": [
            { id: "order1", data: { item: "Book" } },
            { id: "order2", data: { item: "Pen" } },
          ],
        },
      });

      await down.call(asContext(context), {}, "users/user1/orders");

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining("2 document(s)"),
      );
    });
  });

  describe("error handling", () => {
    it("logs error when Firestore throws", async () => {
      const context = buildTestContext();

      // Override getFirestore to throw
      context.getFirestore = () => {
        throw new Error("Connection failed");
      };

      await down.call(asContext(context), {}, "users");

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining("Connection failed"),
      );
    });
  });
});
