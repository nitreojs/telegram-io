import * as Interfaces from '../../../generated/telegram-interfaces'

import { ReactionType } from './reaction-type'

export class ReactionTypePaid extends ReactionType {
  constructor (public payload: Interfaces.TelegramReactionTypePaid) {
    super(payload)
  }

  /** Type of the reaction, always `paid` */
  get type () {
    return this.payload.type
  }
}
