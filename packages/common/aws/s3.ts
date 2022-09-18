import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

const s3Client = new S3Client({ region: "us-west-1" });

export const getS3Object = async (bucket, key) => {
  try {
    const data = await s3Client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );
    const bodyContents = await streamToString(data.Body);
    return bodyContents;
  } catch (err) {
    console.log("Error", err);
  }
};

export const putS3Object = async (bucket, key, body) => {
  try {
    const data = await s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
      })
    );
    console.log(data);
  } catch (err) {
    console.log("Error", err);
  }
};

// Create a helper function to convert a ReadableStream to a string.
function streamToString(stream) {
  return new Promise((resolve, reject) => {
    const chunks: any = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });
}
