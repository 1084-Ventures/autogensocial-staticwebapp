import { BaseModel } from './base.model';

export enum ContentType {
    POST = 'post',
    REEL = 'reel',
    CAROUSEL = 'carousel',
    STORY = 'story',
}

export enum DayOfWeek {
    MONDAY = 'monday',
    TUESDAY = 'tuesday',
    WEDNESDAY = 'wednesday',
    THURSDAY = 'thursday',
    FRIDAY = 'friday',
    SATURDAY = 'saturday',
    SUNDAY = 'sunday'
}

export interface TimeSlot {
    hour: number;      // 0-23
    minute: number;    // 0-59
    timezone: string;  // e.g., 'America/New_York'
}

export interface Schedule {
    daysOfWeek: DayOfWeek[];
    timeSlots: TimeSlot[];
    frequency?: 'daily' | 'weekly' | 'monthly';
    maxPostsPerDay?: number;
}

export interface PromptVariable {
    name: string;
    values: string[];
    description?: string;
}

export interface VisualStyle {
    fonts?: {
        primary?: string;
        secondary?: string;
    };
    colors?: {
        primary?: string;
        secondary?: string;
        background?: string;
        text?: string;
    };
    imageLayout?: 'square' | 'portrait' | 'landscape';
    overlayStyle?: {
        opacity?: number;
        position?: 'top' | 'bottom' | 'full';
    };
}

export interface TemplateSettings {
    promptTemplate: {
        systemPrompt: string;
        userPrompt: string;
        temperature?: number;
        maxTokens?: number;
        model: string;
        variables?: PromptVariable[];
    };
    visualStyle: VisualStyle;
    contentStrategy: {
        targetAudience?: string;
        tone?: string;
        keywords?: string[];
        hashtagStrategy?: string;
        callToAction?: string;
    };
    platformSpecific?: {
        instagram?: {
            useReels?: boolean;
            useCarousel?: boolean;
            useStories?: boolean;
        };
        facebook?: {
            useReels?: boolean;
            groupIds?: string[];
        };
        tiktok?: {
            useDuets?: boolean;
            useStitches?: boolean;
        };
    };
}

export interface TemplateInfo {
    name: string;
    description?: string;
    brandId: string;
    contentType: ContentType;
}

// Document structure for Cosmos DB
export interface ContentGenerationTemplateDocument extends BaseModel {
    templateInfo: TemplateInfo;
    schedule: Schedule;
    settings: TemplateSettings;
}

// API interface
export interface ContentGenerationTemplate extends BaseModel {
    templateInfo: TemplateInfo;
    schedule: Schedule;
    settings: TemplateSettings;
}

export interface ContentTemplateCreate 
    extends Omit<ContentGenerationTemplate, keyof BaseModel> {}

export interface ContentTemplateUpdate {
    templateInfo?: {
        name?: string;
        description?: string;
        contentType?: ContentType;
    };
    schedule?: Partial<Schedule>;
    settings?: {
        promptTemplate?: Partial<TemplateSettings['promptTemplate']>;
        visualStyle?: Partial<VisualStyle>;
        contentStrategy?: Partial<TemplateSettings['contentStrategy']>;
        platformSpecific?: Partial<TemplateSettings['platformSpecific']>;
    };
}