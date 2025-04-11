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

export interface ContentGenerationTemplateDocument extends BaseModel {
    templateInfo: TemplateInfo;
    schedule: Schedule;
    settings: TemplateSettings;
}

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

// Validation functions
export function validateTemplateInfo(info: TemplateInfo): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!info.name || info.name.length < 1 || info.name.length > 100) {
        errors.push('Name is required and must be between 1 and 100 characters');
    }
    
    if (info.description && info.description.length > 500) {
        errors.push('Description must not exceed 500 characters');
    }
    
    if (!info.brandId || !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(info.brandId)) {
        errors.push('Valid brand ID (UUID) is required');
    }
    
    if (!Object.values(ContentType).includes(info.contentType)) {
        errors.push('Valid content type is required');
    }

    return { isValid: errors.length === 0, errors };
}

export function validateSchedule(schedule: Schedule): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!schedule.daysOfWeek || !schedule.daysOfWeek.length) {
        errors.push('At least one day of week is required');
    } else {
        const validDays = Object.values(DayOfWeek);
        if (!schedule.daysOfWeek.every(day => validDays.includes(day))) {
            errors.push('Invalid day of week specified');
        }
    }
    
    if (!schedule.timeSlots || !schedule.timeSlots.length) {
        errors.push('At least one time slot is required');
    } else {
        schedule.timeSlots.forEach((slot, index) => {
            if (slot.hour < 0 || slot.hour > 23) {
                errors.push(`Time slot ${index + 1}: Hour must be between 0 and 23`);
            }
            if (slot.minute < 0 || slot.minute > 59) {
                errors.push(`Time slot ${index + 1}: Minute must be between 0 and 59`);
            }
            if (!slot.timezone || !isValidTimezone(slot.timezone)) {
                errors.push(`Time slot ${index + 1}: Valid timezone is required`);
            }
        });
    }

    if (schedule.maxPostsPerDay !== undefined && (schedule.maxPostsPerDay < 1 || schedule.maxPostsPerDay > 10)) {
        errors.push('Max posts per day must be between 1 and 10');
    }

    return { isValid: errors.length === 0, errors };
}

export function validateTemplateSettings(settings: TemplateSettings): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Validate prompt template
    if (!settings.promptTemplate.systemPrompt) {
        errors.push('System prompt is required');
    }
    if (!settings.promptTemplate.userPrompt) {
        errors.push('User prompt is required');
    }
    if (!settings.promptTemplate.model) {
        errors.push('Model name is required');
    }
    if (settings.promptTemplate.temperature !== undefined && 
        (settings.promptTemplate.temperature < 0 || settings.promptTemplate.temperature > 2)) {
        errors.push('Temperature must be between 0 and 2');
    }
    
    // Validate visual style
    if (settings.visualStyle.colors) {
        const { colors } = settings.visualStyle;
        Object.entries(colors).forEach(([key, value]) => {
            if (value && !isValidHexColor(value)) {
                errors.push(`Invalid hex color for ${key}`);
            }
        });
    }
    
    // Validate content strategy
    if (settings.contentStrategy.keywords && 
        !Array.isArray(settings.contentStrategy.keywords)) {
        errors.push('Keywords must be an array');
    }

    return { isValid: errors.length === 0, errors };
}

function isValidHexColor(color: string): boolean {
    return /^#[0-9A-F]{6}$/i.test(color);
}

function isValidTimezone(timezone: string): boolean {
    try {
        Intl.DateTimeFormat(undefined, { timeZone: timezone });
        return true;
    } catch (e) {
        return false;
    }
}