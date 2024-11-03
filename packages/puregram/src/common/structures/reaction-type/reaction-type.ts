import * as Interfaces from '../../../generated/telegram-interfaces'

import { Structure } from '../../../types/interfaces'

import type { ReactionTypeCustomEmoji } from './custom-emoji'
import type { ReactionTypeEmoji } from './emoji'
import type { ReactionTypePaid } from './paid'

interface ReactionTypeMapping {
  emoji: ReactionTypeEmoji
  custom_emoji: ReactionTypeCustomEmoji
  paid: ReactionTypePaid
}

export class ReactionType implements Structure {
  constructor (public payload: Interfaces.TelegramReactionType) { }

  get [Symbol.toStringTag] () {
    return this.constructor.name
  }

  /** Is this reaction type the same as the `type`? */
  is <T extends Interfaces.TelegramReactionType['type']> (type: T): this is ReactionTypeMapping[T] {
    return this.payload.type === type
  }

  toJSON () {
    return this.payload
  }
}
