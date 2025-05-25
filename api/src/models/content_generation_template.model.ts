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
  container: {
    align: 'left' | 'center' | 'right';
    vertical: 'top' | 'middle' | 'bottom';
    opacity?: number;
  };
  themes: Array<{
    font: string;
    fontSize: string;
    fontWeight: 'normal' | 'bold';
    fontStyle: 'normal' | 'italic';
    fontColor: string;
    backgroundColor: string;
  }>;
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
      // Validate container
      if (!vs.container) {
        errors.push('Visual style container is required');
      } else {
        if (!['left', 'center', 'right'].includes(vs.container.align)) {
          errors.push('Container align must be left, center, or right');
        }
        if (!['top', 'middle', 'bottom'].includes(vs.container.vertical)) {
          errors.push('Container vertical must be top, middle, or bottom');
        }
        if (vs.container.opacity !== undefined && (vs.container.opacity < 0 || vs.container.opacity > 1)) {
          errors.push('Container opacity must be between 0 and 1');
        }
      }
      // Validate themes
      if (!Array.isArray(vs.themes) || vs.themes.length === 0) {
        errors.push('At least one theme is required in visual style');
      } else {
        vs.themes.forEach((theme, idx) => {
          if (!theme.font) errors.push(`Theme[${idx}]: font is required`);
          if (!theme.fontSize) errors.push(`Theme[${idx}]: fontSize is required`);
          if (!['normal', 'bold'].includes(theme.fontWeight)) errors.push(`Theme[${idx}]: fontWeight must be normal or bold`);
          if (!['normal', 'italic'].includes(theme.fontStyle)) errors.push(`Theme[${idx}]: fontStyle must be normal or italic`);
          if (!theme.fontColor || !isValidHexColor(theme.fontColor)) errors.push(`Theme[${idx}]: fontColor must be a valid hex color`);
          if (!theme.backgroundColor || !isValidHexColor(theme.backgroundColor)) errors.push(`Theme[${idx}]: backgroundColor must be a valid hex color`);
        });
      }
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