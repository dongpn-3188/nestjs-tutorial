import { Injectable } from '@nestjs/common';
import { SharedService } from './common/shared.service';

@Injectable()
export class AppService {
  constructor(private readonly sharedService: SharedService) {}
  getHello(): string {
    return this.sharedService.getSharedMessage('message.HELLO');
  }
}
