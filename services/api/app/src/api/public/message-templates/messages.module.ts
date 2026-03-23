import { Module } from '@nestjs/common';
import { CampusMessagesService } from 'src/api/public/message-templates/campus-messages.service';
import { CollegeMessagesService } from 'src/api/public/message-templates/college-messages.service';
import { CommonMessagesService } from 'src/api/public/message-templates/common-messages.service';
import { DepartmentMessagesService } from 'src/api/public/message-templates/department-messages.service';
import { UserMessageService } from 'src/api/public/message-templates/user-messages.service';
@Module({
  providers: [
    CampusMessagesService,
    CollegeMessagesService,
    DepartmentMessagesService,
    UserMessageService,
    CommonMessagesService,
  ],
  exports: [
    CampusMessagesService,
    CollegeMessagesService,
    DepartmentMessagesService,
    UserMessageService,
    CommonMessagesService,
  ],
})
export class MessagesModule {}
