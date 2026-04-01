import { Module, Logger, Scope  } from '@nestjs/common';
import { SharedService } from './shared.service';
import { INQUIRER } from '@nestjs/core';

@Module({
  providers: [
    {
      provide: Logger,
      scope: Scope.TRANSIENT,
      inject: [INQUIRER],
      useFactory: (parentClass?: object) => {
        // Automatically sets context to the class name where injected
        const context =
          parentClass && (parentClass as any).constructor && (parentClass as any).constructor.name
            ? (parentClass as any).constructor.name
            : 'UnknownContext';
        return new Logger(context);
      },
    },
    SharedService
  ],
  exports: [SharedService, Logger],
})
export class CommonModule {}
