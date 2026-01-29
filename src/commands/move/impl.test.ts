import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  buildTestContext,
  createMockFirestore,
  type TestContext,
} from "../../test/context";
import type { LocalContext } from "../../context";
import move from "./impl";

// Helper to cast test context to LocalContext for testing
const asContext = (ctx: TestContext) => ctx as unknown as LocalContext;

describe("copy command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("successful copy", () => {
    it("copies a document to a new path", async () => {
      const mockFirestore = createMockFirestore({
        "users/user1": { name: "John", email: "john@example.com" },
      });
      const context = buildTestContext();
      context.getFirestore = () => mockFirestore;

      await move.call(asContext(context), {}, "users/user1", "users/user2");

      expect(mockFirestore._setCalls).toHaveLength(1);
      expect(mockFirestore._setCalls[0]!.path).toBe("users/user2");
      expect(mockFirestore._setCalls[0]!.data).toEqual({
        name: "John",
        email: "john@example.com",
      });
    });

    it("shows success message after copying", async () => {
      const mockFirestore = createMockFirestore({
        "users/user1": { name: "John" },
      });
      const context = buildTestContext();
      context.getFirestore = () => mockFirestore;

      await move.call(asContext(context), {}, "users/user1", "users/user2");

      expect(context.mockLogger.success).toHaveBeenCalledWith(
        expect.stringContaining("users/user1"),
      );
      expect(context.mockLogger.success).toHaveBeenCalledWith(
        expect.stringContaining("users/user2"),
      );
    });

    it("copies to a different collection", async () => {
      const mockFirestore = createMockFirestore({
        "users/user1": { name: "John", role: "admin" },
      });
      const context = buildTestContext();
      context.getFirestore = () => mockFirestore;

      await move.call(asContext(context), {}, "users/user1", "admins/admin1");

      expect(mockFirestore._setCalls).toHaveLength(1);
      expect(mockFirestore._setCalls[0]!.path).toBe("admins/admin1");
      expect(mockFirestore._setCalls[0]!.data).toEqual({
        name: "John",
        role: "admin",
      });
    });

    it("copies nested documents", async () => {
      const mockFirestore = createMockFirestore({
        "users/user1/orders/order1": { item: "Book", price: 20 },
      });
      const context = buildTestContext();
      context.getFirestore = () => mockFirestore;

      await move.call(
        asContext(context),
        {},
        "users/user1/orders/order1",
        "users/user1/orders/order2",
      );

      expect(mockFirestore._setCalls).toHaveLength(1);
      expect(mockFirestore._setCalls[0]!.path).toBe(
        "users/user1/orders/order2",
      );
      expect(mockFirestore._setCalls[0]!.data).toEqual({
        item: "Book",
        price: 20,
      });
    });

    it("handles empty document data", async () => {
      const mockFirestore = createMockFirestore({
        "users/user1": {},
      });
      const context = buildTestContext();
      context.getFirestore = () => mockFirestore;

      await move.call(asContext(context), {}, "users/user1", "users/user2");

      expect(mockFirestore._setCalls).toHaveLength(1);
      expect(mockFirestore._setCalls[0]!.data).toEqual({});
    });
  });

  describe("idField flag", () => {
    it("adds idField to copied document", async () => {
      const mockFirestore = createMockFirestore({
        "users/user1": { name: "John", email: "john@example.com" },
      });
      const context = buildTestContext();
      context.getFirestore = () => mockFirestore;

      await move.call(
        asContext(context),
        { idField: "_id" },
        "users/user1",
        "users/user2",
      );

      expect(mockFirestore._setCalls).toHaveLength(1);
      expect(mockFirestore._setCalls[0]!.data).toEqual({
        name: "John",
        email: "john@example.com",
        _id: "user2",
      });
    });

    it("uses custom idField name", async () => {
      const mockFirestore = createMockFirestore({
        "users/user1": { name: "John" },
      });
      const context = buildTestContext();
      context.getFirestore = () => mockFirestore;

      await move.call(
        asContext(context),
        { idField: "documentId" },
        "users/user1",
        "archive/doc123",
      );

      expect(mockFirestore._setCalls[0]!.data).toEqual({
        name: "John",
        documentId: "doc123",
      });
    });

    it("overwrites existing field with same name as idField", async () => {
      const mockFirestore = createMockFirestore({
        "users/user1": { name: "John", _id: "old-id" },
      });
      const context = buildTestContext();
      context.getFirestore = () => mockFirestore;

      await move.call(
        asContext(context),
        { idField: "_id" },
        "users/user1",
        "users/newuser",
      );

      expect(mockFirestore._setCalls[0]!.data).toEqual({
        name: "John",
        _id: "newuser",
      });
    });
  });

  describe("path validation", () => {
    it("errors when source is a collection path", async () => {
      const mockFirestore = createMockFirestore({});
      const context = buildTestContext();
      context.getFirestore = () => mockFirestore;

      await move.call(asContext(context), {}, "users", "archive/user1");

      expect(context.mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining("must be documents"),
      );
      expect(mockFirestore._setCalls).toHaveLength(0);
    });

    it("errors when destination is a collection path", async () => {
      const mockFirestore = createMockFirestore({
        "users/user1": { name: "John" },
      });
      const context = buildTestContext();
      context.getFirestore = () => mockFirestore;

      await move.call(asContext(context), {}, "users/user1", "archive");

      expect(context.mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining("must be documents"),
      );
      expect(mockFirestore._setCalls).toHaveLength(0);
    });

    it("errors when both paths are collection paths", async () => {
      const mockFirestore = createMockFirestore({});
      const context = buildTestContext();
      context.getFirestore = () => mockFirestore;

      await move.call(asContext(context), {}, "users", "archive");

      expect(context.mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining("must be documents"),
      );
      expect(mockFirestore._setCalls).toHaveLength(0);
    });
  });

  describe("source document validation", () => {
    it("errors when source document does not exist", async () => {
      const mockFirestore = createMockFirestore({});
      const context = buildTestContext();
      context.getFirestore = () => mockFirestore;

      await move.call(
        asContext(context),
        {},
        "users/nonexistent",
        "users/user2",
      );

      expect(context.mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining("does not exist"),
      );
      expect(mockFirestore._setCalls).toHaveLength(0);
    });
  });

  describe("spinner integration", () => {
    it("uses spinner for fetching source document", async () => {
      const mockFirestore = createMockFirestore({
        "users/user1": { name: "John" },
      });
      const context = buildTestContext();
      context.getFirestore = () => mockFirestore;

      await move.call(asContext(context), {}, "users/user1", "users/user2");

      expect(context.mockSpinner.promise).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          text: expect.stringContaining("Fetching"),
        }),
      );
    });

    it("uses spinner for copying to destination", async () => {
      const mockFirestore = createMockFirestore({
        "users/user1": { name: "John" },
      });
      const context = buildTestContext();
      context.getFirestore = () => mockFirestore;

      await move.call(asContext(context), {}, "users/user1", "users/user2");

      expect(context.mockSpinner.promise).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          text: expect.stringContaining("Copying"),
        }),
      );
    });
  });

  describe("error handling", () => {
    it("logs error when Firestore throws on getFirestore", async () => {
      const context = buildTestContext();
      context.getFirestore = () => {
        throw new Error("Connection failed");
      };

      await move.call(asContext(context), {}, "users/user1", "users/user2");

      expect(context.mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining("Connection failed"),
      );
    });

    it("logs generic error for non-Error exceptions", async () => {
      const context = buildTestContext();
      context.getFirestore = () => {
        throw "string error";
      };

      await move.call(asContext(context), {}, "users/user1", "users/user2");

      expect(context.mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining("unexpected error"),
      );
    });
  });
});
