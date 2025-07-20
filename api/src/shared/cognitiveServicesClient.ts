import fetch from "node-fetch";

const endpoint = process.env.AZURE_COGSVCS_ENDPOINT;
const key = process.env.AZURE_COGSVCS_KEY;

if (!endpoint || !key) {
  throw new Error("Azure Cognitive Services endpoint or key not configured.");
}

export async function callCognitiveServices(path: string, body: Buffer | string, contentType = "application/octet-stream") {
  const url = `${endpoint}${path}`;
  // Always provide a valid string for the key, never undefined
  const headers: Record<string, string> = {
    "Ocp-Apim-Subscription-Key": key || '',
    "Content-Type": contentType
  };
  const response = await fetch(url, {
    method: "POST",
    headers,
    body
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cognitive Services error: ${response.status} - ${errorText}`);
  }
  return response.json();
}
