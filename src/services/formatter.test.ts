import { describe, it, expect } from "vitest";
import { formatDocument, formatDocuments } from "./formatter";

describe("formatter", () => {
  describe("formatDocument", () => {
    it("formats a single document as JSON with _id field", () => {
      const doc = {
        id: "doc123",
        data: { name: "Test", value: 42 },
      };

      const result = formatDocument(doc);
      const parsed = JSON.parse(result);

      expect(parsed._id).toBe("doc123");
      expect(parsed.name).toBe("Test");
      expect(parsed.value).toBe(42);
    });

    it("merges document data with id at the top level", () => {
      const doc = {
        id: "user1",
        data: { email: "test@example.com", active: true },
      };

      const result = formatDocument(doc);
      const parsed = JSON.parse(result);

      expect(parsed).toEqual({
        _id: "user1",
        email: "test@example.com",
        active: true,
      });
    });

    it("handles empty data object", () => {
      const doc = {
        id: "empty",
        data: {},
      };

      const result = formatDocument(doc);
      const parsed = JSON.parse(result);

      expect(parsed).toEqual({ _id: "empty" });
    });

    it("handles nested objects", () => {
      const doc = {
        id: "nested",
        data: {
          profile: {
            firstName: "John",
            lastName: "Doe",
          },
        },
      };

      const result = formatDocument(doc);
      const parsed = JSON.parse(result);

      expect(parsed.profile.firstName).toBe("John");
      expect(parsed.profile.lastName).toBe("Doe");
    });

    it("handles arrays in data", () => {
      const doc = {
        id: "withArray",
        data: {
          tags: ["a", "b", "c"],
          numbers: [1, 2, 3],
        },
      };

      const result = formatDocument(doc);
      const parsed = JSON.parse(result);

      expect(parsed.tags).toEqual(["a", "b", "c"]);
      expect(parsed.numbers).toEqual([1, 2, 3]);
    });

    it("outputs pretty-printed JSON", () => {
      const doc = {
        id: "pretty",
        data: { key: "value" },
      };

      const result = formatDocument(doc);

      // Should have newlines (pretty printed)
      expect(result).toContain("\n");
      // Should have indentation
      expect(result).toContain("  ");
    });
  });

  describe("formatDocuments", () => {
    it("formats multiple documents as JSON array", () => {
      const docs = [
        { id: "doc1", data: { name: "First" } },
        { id: "doc2", data: { name: "Second" } },
      ];

      const result = formatDocuments(docs);
      const parsed = JSON.parse(result);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(2);
      expect(parsed[0]._id).toBe("doc1");
      expect(parsed[1]._id).toBe("doc2");
    });

    it("returns empty array string for empty input", () => {
      const result = formatDocuments([]);

      expect(result).toBe("[]");
    });

    it("includes _id field for each document", () => {
      const docs = [
        { id: "a", data: { x: 1 } },
        { id: "b", data: { x: 2 } },
        { id: "c", data: { x: 3 } },
      ];

      const result = formatDocuments(docs);
      const parsed = JSON.parse(result);

      expect(parsed.every((d: { _id: string }) => "_id" in d)).toBe(true);
      expect(parsed.map((d: { _id: string }) => d._id)).toEqual([
        "a",
        "b",
        "c",
      ]);
    });

    it("outputs pretty-printed JSON array", () => {
      const docs = [{ id: "doc", data: { key: "value" } }];

      const result = formatDocuments(docs);

      // Should have newlines (pretty printed)
      expect(result).toContain("\n");
    });

    it("handles documents with different data shapes", () => {
      const docs = [
        { id: "user", data: { name: "Alice", age: 30 } },
        { id: "product", data: { title: "Widget", price: 9.99 } },
      ];

      const result = formatDocuments(docs);
      const parsed = JSON.parse(result);

      expect(parsed[0].name).toBe("Alice");
      expect(parsed[1].title).toBe("Widget");
    });
  });
});
