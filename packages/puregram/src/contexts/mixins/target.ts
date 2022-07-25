import { Chat, User } from '../../common/structures'
import { ChatType } from '../../types/enums'
import { RequireValue } from '../../types/types'

/** This object represents a context which has sender data (e.g. `senderId`, `from` etc.) */
class TargetMixin {
  payload!: Record<string, any>

  /** Sender, empty for messages sent to channels */
  get from () {
    const { from } = this.payload

    if (!from) {
      return
    }

    return new User(from)
  }

  /**
   * Sender of the message, sent on behalf of a chat.
   * The channel itself for channel messages.
   * The supergroup itself for messages from anonymous group administrators.
   * The linked channel for messages automatically forwarded to the discussion group
   */
  get senderChat () {
    const { sender_chat } = this.payload

    if (!sender_chat) {
      return
    }

    return new Chat(sender_chat)
  }

  /** Conversation the message belongs to */
  get chat () {
    const { chat } = this.payload

    if (!chat) {
      return
    }

    return new Chat(chat)
  }

  /** Sender's ID */
  get senderId () {
    return this.from?.id
  }

  /** Chat ID */
  get chatId () {
    return this.chat?.id
  }

  /** Chat type */
  get chatType () {
    return this.chat?.type
  }

  /** Is this chat a private one? */
  isPM (): this is RequireValue<TargetMixin, 'chatType', ChatType.Private> {
    return this.chatType === ChatType.Private
  }

  /** Is this chat a group? */
  isGroup (): this is RequireValue<TargetMixin, 'chatType', ChatType.Group> {
    return this.chatType === ChatType.Group
  }

  /** Is this chat a supergroup? */
  isSupergroup (): this is RequireValue<TargetMixin, 'chatType', ChatType.Supergroup> {
    return this.chatType === ChatType.Supergroup
  }

  /** Is this chat a channel? */
  isChannel (): this is RequireValue<TargetMixin, 'chatType', ChatType.Channel> {
    return this.chatType === ChatType.Channel
  }
}

interface TargetMixin { }

export { TargetMixin }
