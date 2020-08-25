import { Agent } from 'https';

import { TelegramOptions } from '../interfaces';
import { Message } from '../updates/';

import {
  ApiMethod,
  AttachmentType,
  MessageEventName
} from '../types';

// @ts-expect-error
import { version } from '../../package.json';

export const defaultOptions: TelegramOptions = {
  token: undefined,
  agent: new Agent({
    keepAlive: true,
    keepAliveMsecs: 30000
  }),

  apiWait: 3000,
  apiBaseUrl: 'https://api.telegram.org/bot',
  apiRetryLimit: 3,
  apiTimeout: 30000,
  apiHeaders: {
    connection: 'keep-alive',
    'User-Agent': `puregram/${version} (+https://github.com/nitreojs/puregram)`
  }
};

export const events: [
  keyof Message,
  MessageEventName
][] = [
  ['newChatMembers', 'new_chat_members'],
  ['leftChatMember', 'left_chat_member'],
  ['newChatTitle', 'new_chat_title'],
  ['newChatPhoto', 'new_chat_photo'],
  ['deleteChatPhoto', 'delete_chat_photo'],
  ['groupChatCreated', 'group_chat_created'],
  ['supergroupChatCreated', 'supergroup_chat_created'],
  ['channelChatCreated', 'channel_chat_created'],
  ['migrateToChatId', 'migrate_to_chat_id'],
  ['migrateFromChatId', 'migrate_from_chat_id'],
  ['pinnedMessage', 'pinned_message'],
  ['invoice', 'invoice'],
  ['successfulPayment', 'successful_payment'],
];

export const mediaMethods: [ApiMethod, AttachmentType | 'media'][] = [
  ['sendPhoto', 'photo'],
  ['sendAudio', 'audio'],
  ['sendDocument', 'document'],
  ['sendVideo', 'video'],
  ['sendAnimation', 'animation'],
  ['sendVoice', 'voice'],
  ['sendVideoNote', 'video_note'],
  ['sendMediaGroup', 'media']
];
