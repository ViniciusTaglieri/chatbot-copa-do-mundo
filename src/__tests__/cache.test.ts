import { describe, it, expect, beforeEach } from "vitest"
import { getFromCache, setToCache, clearCache } from "@/lib/cache"

describe("cache", () => {
  beforeEach(() => {
    clearCache()
  })

  it("should return null for non-existent keys", () => {
    expect(getFromCache("nonexistent")).toBeNull()
  })

  it("should store and retrieve values", () => {
    setToCache("key1", { data: "test" })
    expect(getFromCache("key1")).toEqual({ data: "test" })
  })

  it("should return null for expired entries", () => {
    setToCache("key2", "value", -1)
    expect(getFromCache("key2")).toBeNull()
  })

  it("should clear all entries", () => {
    setToCache("a", 1)
    setToCache("b", 2)
    clearCache()
    expect(getFromCache("a")).toBeNull()
    expect(getFromCache("b")).toBeNull()
  })
})
