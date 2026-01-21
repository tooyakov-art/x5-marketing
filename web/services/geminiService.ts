import { GoogleGenAI, Type } from "@google/genai";
import { ContractFormData, QnAPair, AIAnalysisResponse, ImageGenerationResponse, PhotoMode, TechSuggestion, CreativeHook, KPPresentation, KPPlanItem, InstagramPost } from "../types";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Helper for JSON parsing ---
const parseJSON = (text: string) => {
  try {
    // Remove markdown code blocks if present
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '');
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("JSON Parse Error:", e);
    return null;
  }
};

// --- MENTOR CHAT ---
export const getMentorChatResponse = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are X5 Mentor (Business & AI Expert). Reply to: "${prompt}". Keep it helpful, concise.`,
    });
    return response.text || "Ошибка связи с ментором.";
  } catch (e) {
    console.error(e);
    return "Ошибка связи.";
  }
};

// --- TECH SUGGESTIONS ---
export const getTechnologySuggestions = async (prompt: string): Promise<TechSuggestion[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Suggest X5 tools for: "${prompt}". Valid IDs: photo, design, contract, video, courses. Return JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  view: { type: Type.STRING },
                  reason: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });
    const data = parseJSON(response.text || "{}");
    return (data?.suggestions || []);
  } catch (e) {
    return [];
  }
};

// --- MARKETING HOOKS ---
export const generateMarketingHooks = async (goal: string, count: number = 4): Promise<CreativeHook[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Role: Marketer. Goal: "${goal}". Quantity: ${count}. Lang: Russian. Style: Viral. Return JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hooks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  headline: { type: Type.STRING },
                  badge: { type: Type.STRING },
                  smallText: { type: Type.STRING },
                  cta: { type: Type.STRING }
                },
                required: ["headline", "cta"]
              }
            }
          }
        }
      }
    });
    const data = parseJSON(response.text || "{}");
    return (data?.hooks || []).map((h: any) => ({ ...h, id: Date.now() + Math.random() }));
  } catch (e) {
    return [];
  }
};

// --- CONTRACTS ---
export const generateSmartTemplate = async (description: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Role: Lawyer. Contract (Russian) for: "${description}". Markdown.`,
    });
    return response.text || "";
  } catch (e) {
    return "Error generating template.";
  }
};

export const adaptContractTemplate = async (ctx: string, req: string, isImg: boolean = false): Promise<string> => {
  try {
    let contents: any = [];
    if (isImg) {
       // ctx is base64
       contents = {
         parts: [
            { inlineData: { mimeType: 'image/png', data: ctx } },
            { text: `Role: Lawyer. Adapt contract in image. Request: "${req}"` }
         ]
       };
    } else {
       contents = `Template: ${ctx}\nRole: Lawyer. Adapt contract. Request: "${req}". Output: Markdown.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
    });
    return response.text || "";
  } catch (e) {
    return "Error adapting contract.";
  }
};

// --- INSTAGRAM PLAN ---
export const generateInstagramPlan = async (co: string, desc: string, count: number, lang: string): Promise<InstagramPost[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Instagram plan (${count} posts) for ${co}. ${desc}. Lang: ${lang}. JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              headline: { type: Type.STRING },
              description: { type: Type.STRING },
              cta: { type: Type.STRING },
              visualPrompt: { type: Type.STRING }
            }
          }
        }
      }
    });
    const posts = parseJSON(response.text || "[]");
    return Array.isArray(posts) ? posts.map((p: any, idx: number) => ({ ...p, id: Date.now() + idx + "", status: 'pending' })) : [];
  } catch (e) {
    return [];
  }
};

// --- KP GENERATION ---
export const generateKPPlan = async (co: string, desc: string, pg: number, lang: string): Promise<KPPlanItem[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `KP Plan (${pg} slides) for ${co}. ${desc}. Lang: ${lang}. JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              description: { type: Type.STRING }
            }
          }
        }
      }
    });
    return parseJSON(response.text || "[]") || [];
  } catch (e) {
    return [];
  }
};

export const generateFullKPFromPlan = async (co: string, plan: KPPlanItem[], lang: string): Promise<KPPresentation | null> => {
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Generate JSON KP content for ${co} based on: ${JSON.stringify(plan)}. Lang: ${lang}. Return valid JSON with pages array (id, title, layout, content, items).`,
        config: { responseMimeType: "application/json" }
    });
    return parseJSON(response.text || "{}");
  } catch (e) {
    return null;
  }
};

// --- DESIGN ANALYSIS ---
export const getInitialQuestions = async (data: ContractFormData, docType: 'contract' | 'design'): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Ask 3 clarifying questions for: "${data.description}". JSON.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: { questions: { type: Type.ARRAY, items: { type: Type.STRING } } }
            }
        }
    });
    const json = parseJSON(response.text || "{}");
    return json?.questions || ["Уточните детали?"];
  } catch (e) {
    return ["Уточните детали?"];
  }
};

export const analyzeAndDraft = async (data: ContractFormData, history: QnAPair[], docType: 'contract' | 'design'): Promise<AIAnalysisResponse> => {
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Draft document for "${data.description}". History: ${JSON.stringify(history)}. Return Markdown string.`,
    });
    return { status: 'complete', contract: response.text || "Error", questions: [] };
  } catch (e) {
    return { status: 'complete', contract: "Error", questions: [] };
  }
};

// --- IMAGE PROMPTS ---
export const improvePrompt = async (prompt: string, mode: PhotoMode): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Improve prompt for ${mode}: "${prompt}". English. Keep it concise.`,
    });
    return response.text || prompt;
  } catch (e) {
    return prompt;
  }
};

// --- IMAGE GENERATION ---
export const generateImage = async (
  prompt: string, 
  mode: PhotoMode | string = 'studio', 
  aspectRatio: '1:1' | '16:9' | '9:16' | '3:4' | '4:3' = '1:1',
  referenceImagesBase64: string[] = [],
  tier: 'standard' | 'pro' = 'standard'
): Promise<ImageGenerationResponse> => {
    try {
        let finalPrompt = `Create an image. Style: ${mode}. ${prompt}`;
        if (mode === 'studio') finalPrompt = "Professional Studio Lighting. " + prompt;

        // Model Selection
        // Standard: gemini-2.5-flash-image (Nano Banana)
        // Pro: gemini-3-pro-image-preview (Nano Banana Pro)
        const model = tier === 'pro' ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';

        const parts: any[] = [{ text: finalPrompt }];
        
        // Add references if any
        for (const base64 of referenceImagesBase64) {
            parts.push({ inlineData: { mimeType: 'image/jpeg', data: base64 } });
        }

        const config: any = {
            imageConfig: { aspectRatio: aspectRatio }
        };
        
        // Only Pro supports size param, but we stick to aspect ratio primarily.
        // gemini-3-pro-image-preview supports imageSize: '1K' | '2K' | '4K'
        if (tier === 'pro') {
            config.imageConfig.imageSize = '2K';
        }

        const response = await ai.models.generateContent({
            model: model,
            contents: { parts },
            config: config
        });

        // Find image part
        const imgPart = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
        
        if (imgPart && imgPart.inlineData) {
            return { imageUrl: `data:${imgPart.inlineData.mimeType};base64,${imgPart.inlineData.data}` };
        }
        return { error: "AI не смог создать изображение." };

    } catch (e: any) {
        console.error("Image Gen Error:", e);
        return { error: "Ошибка генерации: " + e.message };
    }
};

// --- VIDEO GENERATION (VEO) ---
export const generateVideoFromImage = async (imageBase64: string, prompt: string): Promise<string | null> => {
    try {
        const model = 'veo-3.1-fast-generate-preview'; 

        let operation = await ai.models.generateVideos({
            model: model,
            prompt: prompt || "Animate this image",
            image: {
                imageBytes: imageBase64,
                mimeType: 'image/png' 
            },
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: '9:16' // Mobile format
            }
        });

        // Poll for completion
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // 5s poll
            operation = await ai.operations.getVideosOperation({operation: operation});
        }

        const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (videoUri) {
            // Must fetch with API key appended
            const vidRes = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
            const blob = await vidRes.blob();
            return URL.createObjectURL(blob);
        }
        return null;
    } catch (e) {
        console.error("Veo Error:", e);
        return null;
    }
};

export const generateVideoInterpolation = async (startImage: string, endImage: string, prompt: string): Promise<string | null> => {
    try {
        const model = 'veo-3.1-fast-generate-preview';
        
        let operation = await ai.models.generateVideos({
            model: model,
            prompt: prompt || "Morph from first image to second",
            image: {
                imageBytes: startImage,
                mimeType: 'image/png'
            },
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: '9:16',
                lastFrame: {
                    imageBytes: endImage,
                    mimeType: 'image/png'
                }
            }
        });

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            operation = await ai.operations.getVideosOperation({operation: operation});
        }

        const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (videoUri) {
            const vidRes = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
            const blob = await vidRes.blob();
            return URL.createObjectURL(blob);
        }
        return null;
    } catch (e) {
        console.error("Veo Interpolation Error:", e);
        return null;
    }
};

const GeminiService = {
  getMentorChatResponse,
  getTechnologySuggestions,
  generateMarketingHooks,
  generateSmartTemplate,
  adaptContractTemplate,
  generateInstagramPlan,
  generateKPPlan,
  generateFullKPFromPlan,
  getInitialQuestions,
  analyzeAndDraft,
  improvePrompt,
  generateImage,
  generateVideoFromImage,
  generateVideoInterpolation
};

export default GeminiService;