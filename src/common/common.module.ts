import { Module, Logger, Scope  } from '@nestjs/common';
import { SharedService } from './shared.service';
import { INQUIRER } from '@nestjs/core';

@Module({
  providers: [
    {
      provide: Logger,
      scope: Scope.TRANSIENT,
      inject: [INQUIRER],
      useFactory: (parentClass: object) => {
        // Automatically sets context to the class name where injected
        return new Logger(parentClass.constructor.name);
      },
    },
    SharedService
  ],
  exports: [SharedService, Logger],
})
export class CommonModule {}
