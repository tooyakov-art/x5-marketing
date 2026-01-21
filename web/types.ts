
export type ViewState = 'home' | 'courses' | 'profile';
export type HomeTabState = 'photos' | 'design' | 'contracts';
export type Language = 'ru' | 'en' | 'kz';

export interface User {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  isGuest: boolean;
  plan: 'free' | 'pro' | 'black';
}

export type DesignType = 'kp' | 'presentation' | 'creative' | 'brand' | 'landing';
export type PhotoMode = 'studio' | 'lookbook' | 'product' | 'cyber';

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  mode: PhotoMode;
  aspectRatio: '1:1' | '16:9' | '9:16';
  liked: boolean;
  date: string;
}

export interface ContractFormData {
  // Common
  type: string;
  date: string;
  
  // Specific to Contracts
  partyA?: string;
  partyB?: string;
  subject?: string;
  amount?: string;
  
  // Specific to Design/Proposals
  description?: string; // The "Magic Prompt"
  designType?: DesignType;
  
  // Added
  logoBase64?: string;
}

export interface QnAPair {
  question: string;
  answer: string;
}

export interface AIAnalysisResponse {
  status: 'complete' | 'needs_info';
  contract?: string;
  questions?: string[];
  extractedData?: Partial<ContractFormData>; 
}

export interface ImageGenerationResponse {
  imageUrl?: string;
  error?: string;
}

export interface TechSuggestion {
  title: string;
  description: string;
  view: string;
  reason: string;
}

export interface CreativeHook {
  id: number;
  headline: string;
  badge?: string;
  smallText?: string;
  cta: string;
}

export interface InstagramPost {
  id: string;
  headline: string;
  description: string;
  cta: string;
  visualPrompt: string;
  status?: 'pending' | 'generating' | 'done' | 'error';
  generatedImageUrl?: string;
}

export interface KPPlanItem {
  id: string;
  title: string;
  description: string;
}

export interface KPPage {
  id: string;
  layout: 'cover' | 'timeline' | 'grid' | 'section_text' | 'contacts';
  title: string;
  content?: string;
  items?: { title: string; desc: string }[];
}

export interface KPPresentation {
  meta: { primaryColor: string; secondaryColor: string; font: string };
  pages: KPPage[];
}