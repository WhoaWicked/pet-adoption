import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PetsModule } from '../pets/pets.module';
import { ApplicationsController } from './applications.controller';
import { ApplicationsRepository } from './applications.repository';
import { ApplicationsService } from './applications.service';

@Module({
  imports: [AuthModule, PetsModule],
  controllers: [ApplicationsController],
  providers: [ApplicationsService, ApplicationsRepository],
})
export class ApplicationsModule {}