import { GoogleGenAI, Type, Schema } from "@google/genai";
import { DreamAnalysis, ImageResolution } from "../types";

// Helper to get AI instance with current key
// This is crucial because process.env.API_KEY might be updated by the user via window.aistudio
const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Analyzes the audio blob: transcribes it and provides a Jungian interpretation + image prompt.
 * Uses gemini-2.5-flash for speed and multimodal capability.
 */
export const analyzeDreamAudio = async (base64Audio: string, mimeType: string): Promise<DreamAnalysis> => {
  const ai = getAiClient();
  
  const analysisSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      transcription: { type: Type.STRING, description: "Verbatim transcription of the dream recording in Chinese." },
      imagePrompt: { type: Type.STRING, description: "A detailed, vivid, surrealist image generation prompt in English capturing the core emotional theme of the dream. Focus on visual symbolism." },
      interpretation: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "A poetic title for the dream in Chinese." },
          summary: { type: Type.STRING, description: "A brief summary of the dream narrative in Chinese." },
          archetypes: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING }, 
            description: "List of key Jungian archetypes identified (e.g., Shadow, Anima, Wise Old Man) in Chinese." 
          },
          analysis: { type: Type.STRING, description: "A structured Jungian psychological analysis of the dream symbols and themes in Chinese." }
        },
        required: ["title", "summary", "archetypes", "analysis"]
      }
    },
    required: ["transcription", "imagePrompt", "interpretation"]
  };

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Audio
          }
        },
        {
          text: `你是一位专业的荣格派梦境分析师和超现实主义艺术家。
          1. 准确将用户的梦境录音转录为中文。
          2. 生成一个富有创意的英文图像提示词 (imagePrompt)，用于生成代表梦境核心情感的超现实主义画作。
          3. 提供深度的心理学解读（使用中文）。
          请以 JSON 格式返回结果。`
        }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: analysisSchema
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from Gemini");

  return JSON.parse(text) as DreamAnalysis;
};

/**
 * Generates an image based on the prompt using gemini-3-pro-image-preview.
 * Supports resolution selection.
 */
export const generateDreamImage = async (prompt: string, resolution: ImageResolution): Promise<string> => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
      parts: [{ text: prompt }]
    },
    config: {
      imageConfig: {
        imageSize: resolution,
        aspectRatio: "4:3", // Classic art ratio
      }
    }
  });

  // Extract image
  // The response structure for images in generateContent involves iterating parts
  const parts = response.candidates?.[0]?.content?.parts;
  if (!parts) throw new Error("No image generated");

  for (const part of parts) {
    if (part.inlineData && part.inlineData.data) {
      return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
    }
  }

  throw new Error("Could not find image data in response");
};

/**
 * Creates a chat session for follow-up questions.
 * Uses gemini-3-pro-preview.
 */
export const createDreamChat = (dreamData: DreamAnalysis) => {
  const ai = getAiClient();
  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: `你是一位乐于助人且富有洞察力的梦境伴侣。
      用户刚刚记录了一个梦。
      
      以下是背景信息：
      转录文本："${dreamData.transcription}"
      解读："${JSON.stringify(dreamData.interpretation)}"
      
      请回答用户关于这个梦境中的符号、意义或感受的后续问题。
      回答要具有同理心，偏向荣格心理学视角，并且简洁明了。请始终使用中文回答。`
    }
  });
};