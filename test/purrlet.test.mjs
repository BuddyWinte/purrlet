import test from "node:test";
import assert from "node:assert/strict";
import Purrlet from "../dist/purrlet.mjs";

class MockProvider {
  constructor() {
    this.calls = 0;
  }

  async upload(file) {
    this.calls += 1;
    return `mock://${file.filename}`;
  }
}

Purrlet.registerProvider("mock", MockProvider);

test("upload succeeds and exposes metadata to validator context", async () => {
  let seenFilename = null;

  const client = new Purrlet({
    provider: "mock",
    validateFile: (_, context) => {
      seenFilename = context.filename;
      return true;
    },
  });

  const result = await client.upload(new Blob(["abc"], { type: "text/plain" }));
  assert.equal(result, "mock://upload.bin");
  assert.equal(seenFilename, "upload.bin");
});

test("built-in size validation blocks oversized uploads", async () => {
  const client = new Purrlet({
    provider: "mock",
    maxFileSize: 3,
  });

  await assert.rejects(
    () => client.upload(new Blob(["abcd"], { type: "text/plain" })),
    /File is too large/,
  );
});

test("uploadMany returns results and errors", async () => {
  class SometimesFailProvider {
    async upload(file) {
      if (file.filename === "fail.bin") throw new Error("boom");
      return `ok://${file.filename}`;
    }
  }

  Purrlet.registerProvider("sometimesfail", SometimesFailProvider);
  const client = new Purrlet({ provider: "sometimesfail" });

  const inputs = [
    { buffer: new Uint8Array([1]), filename: "a.bin", type: "application/octet-stream" },
    { buffer: new Uint8Array([2]), filename: "fail.bin", type: "application/octet-stream" },
    { buffer: new Uint8Array([3]), filename: "c.bin", type: "application/octet-stream" },
  ];

  const batch = await client.uploadMany(inputs, { concurrency: 2 });

  assert.equal(batch.successful, 2);
  assert.equal(batch.failed, 1);
  assert.equal(batch.results[0], "ok://a.bin");
  assert.equal(batch.results[2], "ok://c.bin");
  assert.equal(batch.results[1], null);
  assert.equal(batch.errors.length, 1);
  assert.equal(batch.errors[0].index, 1);
});
