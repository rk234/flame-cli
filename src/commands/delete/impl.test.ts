import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  buildTestContext,
  createMockFirestore,
  type TestContext,
} from "../../test/context";
import type { LocalContext } from "../../context";
import del from "./impl";

// Helper to cast test context to LocalContext for testing
const asContext = (ctx: TestContext) => ctx as unknown as LocalContext;

describe("delete command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("confirmation prompt", () => {
    it("asks for confirmation before deleting a document", async () => {
      const mockFirestore = createMockFirestore({
        "users/user1": { name: "John" },
      });
      const context = buildTestContext();
      context.getFirestore = () => mockFirestore;
      context.mockLogger.prompt.mockResolvedValue(true);

      await del.call(asContext(context), {}, "users/user1");

      expect(context.mockLogger.prompt).toHaveBeenCalledWith(
        expect.stringContaining("document"),
        expect.objectContaining({ type: "confirm" }),
      );
    });

    it("asks for confirmation before deleting a collection", async () => {
      const mockFirestore = createMockFirestore({
        users: [{ id: "user1", data: { name: "John" } }],
      });
      const context = buildTestContext();
      context.getFirestore = () => mockFirestore;
      context.mockLogger.prompt.mockResolvedValue(true);

      await del.call(asContext(context), {}, "users");

      expect(context.mockLogger.prompt).toHaveBeenCalledWith(
        expect.stringContaining("collection"),
        expect.objectContaining({ type: "confirm" }),
      );
    });

    it("cancels deletion when user declines confirmation", async () => {
      const mockFirestore = createMockFirestore({
        "users/user1": { name: "John" },
      });
      const context = buildTestContext();
      context.getFirestore = () => mockFirestore;
      context.mockLogger.prompt.mockResolvedValue(false);

      await del.call(asContext(context), {}, "users/user1");

      expect(context.mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining("cancelled"),
      );
      expect(mockFirestore._deleteCalls).toHaveLength(0);
    });

    it("skips confirmation with --force flag", async () => {
      const mockFirestore = createMockFirestore({
        "users/user1": { name: "John" },
      });
      const context = buildTestContext();
      context.getFirestore = () => mockFirestore;

      await del.call(asContext(context), { force: true }, "users/user1");

      expect(context.mockLogger.prompt).not.toHaveBeenCalled();
      expect(mockFirestore._deleteCalls).toHaveLength(1);
    });
  });

  describe("document deletion", () => {
    it("deletes a single document", async () => {
      const mockFirestore = createMockFirestore({
        "users/user1": { name: "John" },
      });
      const context = buildTestContext();
      context.getFirestore = () => mockFirestore;

      await del.call(asContext(context), { force: true }, "users/user1");

      expect(mockFirestore._deleteCalls).toHaveLength(1);
      expect(mockFirestore._deleteCalls[0]!.path).toBe("users/user1");
    });

    it("shows success message after deleting document", async () => {
      const mockFirestore = createMockFirestore({
        "users/user1": { name: "John" },
      });
      const context = buildTestContext();
      context.getFirestore = () => mockFirestore;

      await del.call(asContext(context), { force: true }, "users/user1");

      expect(context.mockLogger.success).toHaveBeenCalledWith(
        expect.stringContaining("users/user1"),
      );
    });

    it("warns when document does not exist", async () => {
      const mockFirestore = createMockFirestore({});
      const context = buildTestContext();
      context.getFirestore = () => mockFirestore;

      await del.call(asContext(context), { force: true }, "users/nonexistent");

      expect(context.mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("not found"),
      );
      expect(mockFirestore._deleteCalls).toHaveLength(0);
    });
  });

  describe("collection deletion", () => {
    it("deletes all documents in a collection", async () => {
      const mockFirestore = createMockFirestore({
        users: [
          { id: "user1", data: { name: "Alice" } },
          { id: "user2", data: { name: "Bob" } },
          { id: "user3", data: { name: "Charlie" } },
        ],
      });
      const context = buildTestContext();
      context.getFirestore = () => mockFirestore;

      await del.call(asContext(context), { force: true }, "users");

      expect(mockFirestore._deleteCalls).toHaveLength(3);
    });

    it("shows success message with count after deleting collection", async () => {
      const mockFirestore = createMockFirestore({
        users: [
          { id: "user1", data: { name: "Alice" } },
          { id: "user2", data: { name: "Bob" } },
        ],
      });
      const context = buildTestContext();
      context.getFirestore = () => mockFirestore;

      await del.call(asContext(context), { force: true }, "users");

      expect(context.mockLogger.success).toHaveBeenCalledWith(
        expect.stringContaining("2 document(s)"),
      );
    });

    it("warns when collection is empty", async () => {
      const mockFirestore = createMockFirestore({
        users: [],
      });
      const context = buildTestContext();
      context.getFirestore = () => mockFirestore;

      await del.call(asContext(context), { force: true }, "users");

      expect(context.mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("No documents found"),
      );
      expect(mockFirestore._deleteCalls).toHaveLength(0);
    });
  });

  describe("nested paths", () => {
    it("deletes nested document", async () => {
      const mockFirestore = createMockFirestore({
        "users/user1/orders/order1": { item: "Book" },
      });
      const context = buildTestContext();
      context.getFirestore = () => mockFirestore;

      await del.call(
        asContext(context),
        { force: true },
        "users/user1/orders/order1",
      );

      expect(mockFirestore._deleteCalls).toHaveLength(1);
      expect(mockFirestore._deleteCalls[0]!.path).toBe(
        "users/user1/orders/order1",
      );
    });

    it("deletes nested collection", async () => {
      const mockFirestore = createMockFirestore({
        "users/user1/orders": [
          { id: "order1", data: { item: "Book" } },
          { id: "order2", data: { item: "Pen" } },
        ],
      });
      const context = buildTestContext();
      context.getFirestore = () => mockFirestore;

      await del.call(asContext(context), { force: true }, "users/user1/orders");

      expect(mockFirestore._deleteCalls).toHaveLength(2);
    });
  });

  describe("error handling", () => {
    it("logs error when Firestore throws", async () => {
      const context = buildTestContext();
      context.getFirestore = () => {
        throw new Error("Connection failed");
      };

      await del.call(asContext(context), { force: true }, "users/user1");

      expect(context.mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining("Connection failed"),
      );
    });
  });
});
