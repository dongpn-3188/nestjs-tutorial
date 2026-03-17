import { Injectable } from '@nestjs/common';
import { I18nContext, I18nService, TranslateOptions } from 'nestjs-i18n';

@Injectable()
export class SharedService {
  constructor(private readonly i18n: I18nService) {}
  getSharedMessage(key: string, options?: TranslateOptions): string {
    const lang = I18nContext.current()?.lang ?? 'en';
    return this.i18n.t(key, { lang, ...options });
  }
}
