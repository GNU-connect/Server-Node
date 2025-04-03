import { Module } from '@nestjs/common';
import { CampusMessagesService } from 'src/message-templates/campus-messages.service';
import { CollegeMessagesService } from 'src/message-templates/college-messages.service';
import { DepartmentMessagesService } from 'src/message-templates/department-messages.service';

@Module({
  providers: [
    CampusMessagesService,
    CollegeMessagesService,
    DepartmentMessagesService,
  ],
  exports: [
    CampusMessagesService,
    CollegeMessagesService,
    DepartmentMessagesService,
  ],
})
export class MessagesModule {}
