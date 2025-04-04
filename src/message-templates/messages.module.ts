import { Module } from '@nestjs/common';
import { CampusMessagesService } from 'src/message-templates/campus-messages.service';
import { CollegeMessagesService } from 'src/message-templates/college-messages.service';
import { CommonMessagesService } from 'src/message-templates/common-messages.service';
import { DepartmentMessagesService } from 'src/message-templates/department-messages.service';
import { ReadingRoomMessagesService } from 'src/message-templates/reading-room-messages.service';
import { UserMessageService } from 'src/message-templates/user-messages.service';
@Module({
  providers: [
    CampusMessagesService,
    CollegeMessagesService,
    DepartmentMessagesService,
    UserMessageService,
    CommonMessagesService,
    ReadingRoomMessagesService,
  ],
  exports: [
    CampusMessagesService,
    CollegeMessagesService,
    DepartmentMessagesService,
    UserMessageService,
    CommonMessagesService,
    ReadingRoomMessagesService,
  ],
})
export class MessagesModule {}
