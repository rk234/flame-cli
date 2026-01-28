import type { ReadStream } from "tty";

export async function readFullStream(stream: ReadStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    let bufs: Buffer[] = [];
    stream.on("data", (chunk) => {
      bufs.push(Buffer.from(chunk));
    });

    stream.on("end", () => {
      resolve(Buffer.concat(bufs));
    });

    stream.on("error", (error) => {
      reject(error);
    });
  });
}
