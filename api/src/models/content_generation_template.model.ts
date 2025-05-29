import { BaseModel } from './base.model';

export enum ContentType {
    TEXT = 'text',
    VIDEO = 'video',
    MULTI_IMAGE = 'multi-image',
    IMAGE = 'image',
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
}

export interface PromptVariable {
    name: string;
    values: string[];
    description?: string;
}

export interface VisualStyle {
  themes: Array<{
    font: {
      family: string;
      size: string;
      weight: 'normal' | 'bold';
      style: 'normal' | 'italic';
    };
    color: {
      text: string;
      background: string;
      box: string;
      boxText: string;
      outline?: string;
    };
    outline?: {
      color?: string;
      width?: number;
    };
    alignment?: {
      textAlign?: 'left' | 'center' | 'right';
    };
  }>;
}

export interface ImageSettings {
  container?: {
    width?: number;
    height?: number;
    aspectRatio?: 'square' | 'portrait' | 'landscape';
    padding?: number;
  };
  format?: {
    minResolution?: { width: number; height: number };
    maxFileSize?: number;
    imageFormat?: 'png' | 'jpeg';
  };
  overlay?: {
    text?: { allowed?: boolean; maxLength?: number };
    position?: 'top' | 'center' | 'bottom';
  };
  filters?: string[];
  altText?: boolean;
  effects?: string[];
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
    image: ImageSettings;
}

export interface TemplateInfo {
    name: string;
    description?: string;
    brandId: string;
    contentType: ContentType;
    targetPlatforms: string[];
}

export interface ContentGenerationTemplateDocument extends BaseModel {
    templateInfo: TemplateInfo;
    schedule: Schedule | {};
    settings: TemplateSettings | {};
}

export interface ContentGenerationTemplate extends BaseModel {
    templateInfo: TemplateInfo;
    schedule: Schedule | {};
    settings: TemplateSettings | {};
}

export interface ContentTemplateCreate {
    templateInfo: TemplateInfo;
    schedule?: Schedule | {};
    settings?: TemplateSettings | {};
}

export interface ContentTemplateUpdate {
    templateInfo?: {
        name?: string;
        description?: string;
        contentType?: ContentType;
        brandId?: string;  // Allow brand transfers
    };
    schedule?: Partial<Schedule>;
    settings?: {
        promptTemplate?: Partial<TemplateSettings['promptTemplate']>;
        visualStyle?: Partial<VisualStyle>;
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
    if (!info.targetPlatforms || !Array.isArray(info.targetPlatforms) || info.targetPlatforms.length === 0) {
        errors.push('At least one target platform is required');
    }

    return { isValid: errors.length === 0, errors };
}

export function validateSchedule(schedule?: Schedule): { isValid: boolean; errors: string[] } {
    if (!schedule) return { isValid: true, errors: [] };
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

    return { isValid: errors.length === 0, errors };
}

export function validateTemplateSettings(settings?: TemplateSettings): { isValid: boolean; errors: string[] } {
    if (!settings) return { isValid: true, errors: [] };
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
    // Validate visual style (new schema)
    if (!settings.visualStyle) {
      errors.push('Visual style is required');
    } else {
      const vs = settings.visualStyle;
      if (!Array.isArray(vs.themes) || vs.themes.length === 0) {
        errors.push('At least one theme is required in visual style');
      } else {
        vs.themes.forEach((theme, idx) => {
          if (!theme.font) errors.push(`Theme[${idx}]: font is required`);
          if (!theme.color) errors.push(`Theme[${idx}]: color is required`);
        });
      }
    }
    // Validate image (basic presence)
    if (!settings.image) {
      errors.push('Image settings are required');
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