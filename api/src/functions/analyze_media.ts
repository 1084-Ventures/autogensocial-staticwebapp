import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import fetch from "node-fetch";
import type { components } from '../../generated/models';

// Use generated types
export type CognitiveTag = components["schemas"]["CognitiveTag"];
export type CognitiveObject = components["schemas"]["CognitiveObject"];
export type CognitiveCategory = components["schemas"]["CognitiveCategory"];
export type CognitiveCaption = components["schemas"]["CognitiveCaption"];
export type CognitiveDenseCaption = components["schemas"]["CognitiveDenseCaption"];
export type CognitiveBrand = components["schemas"]["CognitiveBrand"];
export type CognitivePerson = components["schemas"]["CognitivePerson"];

// Environment variables for Azure Cognitive Services
const COGSVCS_ENDPOINT = process.env.AZURE_COGSVCS_ENDPOINT;
const COGSVCS_KEY = process.env.AZURE_COGSVCS_KEY;

async function analyzeImageWithCognitiveServices(imageBase64: string, context: InvocationContext) {
    if (!COGSVCS_ENDPOINT || !COGSVCS_KEY) {
        throw new Error("Azure Cognitive Services endpoint or key not configured.");
    }
    // Remove data URL prefix if present
    const base64Data = imageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // Use Azure Computer Vision v4.0 GA for improved analysis
    // Add 'denseCaptions' to the features list for region-based captions
    const url = `${COGSVCS_ENDPOINT}/computervision/imageanalysis:analyze?api-version=2023-10-01&features=caption,tags,denseCaptions`;
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Ocp-Apim-Subscription-Key": COGSVCS_KEY,
            "Content-Type": "application/octet-stream"
        },
        body: buffer
    });
    if (!response.ok) {
        const errorText = await response.text();
        context.log("Cognitive Services error:", errorText);
        throw new Error(`Cognitive Services error: ${response.status}`);
    }
    return response.json();
}

export async function analyzeMedia(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log("[analyzeMedia] Request received");
    if (request.method !== "POST") {
        return {
            status: 405,
            body: JSON.stringify({ error: "Method Not Allowed" })
        };
    }
    let body: any;
    try {
        body = await request.json();
    } catch (err) {
        context.log("[analyzeMedia] Invalid JSON", err);
        return {
            status: 400,
            body: JSON.stringify({ error: "Invalid JSON in request body" })
        };
    }
    const imageBase64 = body.imageBase64;
    if (!imageBase64) {
        return {
            status: 400,
            body: JSON.stringify({ error: "imageBase64 is required" })
        };
    }
    try {
        const analysis = await analyzeImageWithCognitiveServices(imageBase64, context);
        // Post-process for richer tags and better suggested name (v4.0 response)
        // Caption
        const caption: CognitiveCaption | undefined = analysis.captionResult?.text
          ? { text: analysis.captionResult.text, confidence: analysis.captionResult.confidence }
          : undefined;
        // Tags
        const tags: CognitiveTag[] = Array.isArray(analysis.tagsResult?.values)
          ? analysis.tagsResult.values.map((t: any) => ({ name: t.name, confidence: t.confidence }))
          : [];
        // Categories
        const categories: CognitiveCategory[] = Array.isArray(analysis.categoriesResult?.values)
          ? analysis.categoriesResult.values.map((c: any) => ({ name: c.name, confidence: c.confidence }))
          : [];
        // Objects
        const objects: CognitiveObject[] = Array.isArray(analysis.objectsResult?.values)
          ? analysis.objectsResult.values.map((o: any) => ({
              object: o.object,
              confidence: o.confidence,
              rectangle: o.rectangle
            }))
          : [];
        // Dense Captions
        const denseCaptions: CognitiveDenseCaption[] = Array.isArray(analysis.denseCaptionsResult?.values)
          ? analysis.denseCaptionsResult.values.map((dc: any) => ({
              text: dc.text,
              confidence: dc.confidence,
              boundingBox: dc.boundingBox
            }))
          : [];
        // Brands
        const brands: CognitiveBrand[] = Array.isArray(analysis.brandsResult?.values)
          ? analysis.brandsResult.values.map((b: any) => ({ name: b.name, confidence: b.confidence }))
          : [];
        // People
        const people: CognitivePerson[] = Array.isArray(analysis.peopleResult?.values)
          ? analysis.peopleResult.values.map((p: any) => ({ confidence: p.confidence, rectangle: p.rectangle }))
          : [];
        // OCR Text
        let ocrText = '';
        if (analysis.readResult?.content) {
          ocrText = analysis.readResult.content;
        }
        // Suggested name: prefer most specific object, then brand, then tag, then caption
        let suggestedName = '';
        if (objects.length && (objects[0] as any).object) {
          suggestedName = (objects[0] as any).object;
        } else if (brands.length) {
          suggestedName = brands[0].name ?? "";
        } else if (tags.length) {
          suggestedName = tags[0].name ?? "";
        } else if (caption?.text) {
          suggestedName = caption.text;
        } else {
          suggestedName = "Image";
        }
        // Description: use caption
        const description = caption?.text || '';
        return {
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                suggestedName,
                description,
                tags,
                categories,
                objects,
                caption,
                denseCaptions,
                brands,
                people,
                ocrText,
                cognitiveData: analysis
            })
        };
    } catch (err: any) {
        context.log("[analyzeMedia] Error during analysis", err);
        return {
            status: 500,
            body: JSON.stringify({ error: err.message || "Failed to analyze image" })
        };
    }
}

app.http('analyze_media', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'analyze-media',
    handler: analyzeMedia
});
