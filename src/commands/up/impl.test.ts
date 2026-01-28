import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  buildTestContext,
  createMockFirestore,
  type TestContext,
} from "../../test/context";
import type { LocalContext } from "../../context";
import up from "./impl";

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

describe("up command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("single document upload", () => {
    it("uploads a single document to a document path", async () => {
      const mockFirestore = createMockFirestore();
      const context = buildTestContext();
      context.getFirestore = () => mockFirestore;

      const docData = JSON.stringify({ name: "John", email: "john@test.com" });

      await up.call(asContext(context), { data: docData }, "users/user1");

      // Verify document was set
      expect(mockFirestore._setCalls).toHaveLength(1);
      expect(mockFirestore._setCalls[0]!.path).toBe("users/user1");
      expect(mockFirestore._setCalls[0]!.data).toEqual({
        name: "John",
        email: "john@test.com",
      });
    });

    it("uploads a single document with merge option", async () => {
      const mockFirestore = createMockFirestore();
      const context = buildTestContext();
      context.getFirestore = () => mockFirestore;

      const docData = JSON.stringify({ name: "John" });

      await up.call(
        asContext(context),
        { data: docData, merge: true },
        "users/user1",
      );

      // Verify merge option was passed
      expect(mockFirestore._setCalls).toHaveLength(1);
      expect(mockFirestore._setCalls[0]!.options).toEqual({ merge: true });
    });

    it("logs success message after uploading single document", async () => {
      const mockFirestore = createMockFirestore();
      const context = buildTestContext();
      context.getFirestore = () => mockFirestore;

      const docData = JSON.stringify({ name: "John" });

      await up.call(asContext(context), { data: docData }, "users/user1");

      expect(logger.success).toHaveBeenCalledWith(
        expect.stringContaining("users/user1"),
      );
    });

    it("uploads single document to collection path with idField", async () => {
      const mockFirestore = createMockFirestore();
      const context = buildTestContext();
      context.getFirestore = () => mockFirestore;

      const docData = JSON.stringify({
        _id: "custom-id",
        name: "John",
      });

      await up.call(
        asContext(context),
        { data: docData, idField: "_id" },
        "users",
      );

      // Verify document was set with custom ID
      expect(mockFirestore._setCalls).toHaveLength(1);
      expect(mockFirestore._setCalls[0]!.path).toBe("users/custom-id");
    });
  });

  describe("multiple documents upload", () => {
    it("uploads multiple documents to a collection with idField", async () => {
      const mockFirestore = createMockFirestore();
      const context = buildTestContext();
      context.getFirestore = () => mockFirestore;

      const docsData = JSON.stringify([
        { _id: "user1", name: "Alice" },
        { _id: "user2", name: "Bob" },
        { _id: "user3", name: "Charlie" },
      ]);

      await up.call(
        asContext(context),
        { data: docsData, idField: "_id" },
        "users",
      );

      // Verify all documents were set
      expect(mockFirestore._setCalls).toHaveLength(3);
      expect(mockFirestore._setCalls[0]!.path).toBe("users/user1");
      expect(mockFirestore._setCalls[1]!.path).toBe("users/user2");
      expect(mockFirestore._setCalls[2]!.path).toBe("users/user3");
    });

    it("uploads multiple documents with auto-generated IDs when no idField", async () => {
      const mockFirestore = createMockFirestore();
      const context = buildTestContext();
      context.getFirestore = () => mockFirestore;

      const docsData = JSON.stringify([{ name: "Alice" }, { name: "Bob" }]);

      await up.call(asContext(context), { data: docsData }, "users");

      // Verify documents were added (not set)
      expect(mockFirestore._addCalls).toHaveLength(2);
      expect(mockFirestore._addCalls[0]!.collection).toBe("users");
      expect(mockFirestore._addCalls[1]!.collection).toBe("users");
    });

    it("logs completion message after uploading multiple documents", async () => {
      const mockFirestore = createMockFirestore();
      const context = buildTestContext();
      context.getFirestore = () => mockFirestore;

      const docsData = JSON.stringify([{ name: "Alice" }, { name: "Bob" }]);

      await up.call(asContext(context), { data: docsData }, "users");

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining("Upload complete"),
      );
    });

    it("uploads multiple documents with merge option", async () => {
      const mockFirestore = createMockFirestore();
      const context = buildTestContext();
      context.getFirestore = () => mockFirestore;

      const docsData = JSON.stringify([
        { _id: "user1", name: "Alice" },
        { _id: "user2", name: "Bob" },
      ]);

      await up.call(
        asContext(context),
        { data: docsData, idField: "_id", merge: true },
        "users",
      );

      // Verify merge option was passed to all documents
      expect(mockFirestore._setCalls).toHaveLength(2);
      expect(mockFirestore._setCalls[0]!.options).toEqual({ merge: true });
      expect(mockFirestore._setCalls[1]!.options).toEqual({ merge: true });
    });
  });

  describe("error handling", () => {
    it("logs error when no document data is provided", async () => {
      const context = buildTestContext();

      await up.call(asContext(context), { data: "" }, "users/user1");

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining("No document data found"),
      );
    });

    it("logs error when JSON is invalid", async () => {
      const context = buildTestContext();

      await up.call(
        asContext(context),
        { data: "not valid json" },
        "users/user1",
      );

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining("Failed to upload"),
      );
    });

    it("logs error when uploading array to document path", async () => {
      const mockFirestore = createMockFirestore();
      const context = buildTestContext();
      context.getFirestore = () => mockFirestore;

      const docsData = JSON.stringify([{ name: "Alice" }, { name: "Bob" }]);

      await up.call(asContext(context), { data: docsData }, "users/user1");

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining("array of documents"),
      );
    });

    it("logs error when uploading single doc to collection without idField", async () => {
      const mockFirestore = createMockFirestore();
      const context = buildTestContext();
      context.getFirestore = () => mockFirestore;

      const docData = JSON.stringify({ name: "John" });

      await up.call(asContext(context), { data: docData }, "users");

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining("Failed to upload"),
      );
    });

    it("handles Firestore errors gracefully", async () => {
      const context = buildTestContext();
      context.getFirestore = () => {
        throw new Error("Connection failed");
      };

      const docData = JSON.stringify({ name: "John" });

      await up.call(asContext(context), { data: docData }, "users/user1");

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining("Failed to upload"),
      );
    });
  });

  describe("data flag vs stdin", () => {
    it("uses data flag when provided", async () => {
      const mockFirestore = createMockFirestore();
      const context = buildTestContext();
      context.getFirestore = () => mockFirestore;

      const docData = JSON.stringify({ source: "flag" });

      await up.call(asContext(context), { data: docData }, "users/user1");

      expect(mockFirestore._setCalls[0]!.data).toEqual({ source: "flag" });
    });
  });
});
