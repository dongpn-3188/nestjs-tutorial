import { Injectable } from '@nestjs/common';
import { I18nContext, I18nService, TranslateOptions } from 'nestjs-i18n';
import { DEFAULT_LIMIT, DEFAULT_MAX_LIMIT, DEFAULT_OFFSET } from './constants';

@Injectable()
export class SharedService {
  constructor(private readonly i18n: I18nService) {}

  getSharedMessage(key: string, variables?: Record<string, any>, options?: TranslateOptions): string {
    const lang = I18nContext.current()?.lang ?? 'en';
    return this.i18n.t(key, { lang, ...options, args: variables });
  }

  buildSlug(id: number, title: string): string {
    const normalizedTitle = String(title || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    return `${id}-${normalizedTitle}`;
  }

  normalizedLimitAndOffset(limit = DEFAULT_LIMIT, offset = DEFAULT_OFFSET, maxLimit = DEFAULT_MAX_LIMIT) {
    const normalizedLimit = Math.min(Math.max(limit, 1), maxLimit);
    const normalizedOffset = Math.max(offset, 0);
    return { limit: normalizedLimit, offset: normalizedOffset };  
  }
}
