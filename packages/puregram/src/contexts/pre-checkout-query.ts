import { inspectable } from 'inspectable'

import * as Interfaces from '../generated/telegram-interfaces'
import * as Methods from '../generated/methods'

import { Telegram } from '../telegram'
import { filterPayload, applyMixins } from '../utils/helpers'
import { PreCheckoutQuery } from '../updates/'

import { Context } from './context'
import { SendMixin } from './mixins'

interface PreCheckoutQueryContextOptions {
  telegram: Telegram
  update: Interfaces.TelegramUpdate
  payload: Interfaces.TelegramPreCheckoutQuery
  updateId: number
}

class PreCheckoutQueryContext extends Context {
  payload: Interfaces.TelegramPreCheckoutQuery

  constructor(options: PreCheckoutQueryContextOptions) {
    super({
      telegram: options.telegram,
      updateType: 'pre_checkout_query',
      updateId: options.updateId,
      update: options.update
    })

    this.payload = options.payload
  }

  /** Answers to the pending pre-checkout query */
  answerPreCheckoutQuery(
    ok?: boolean,
    errorMessage?: string,
    params?: Partial<Methods.AnswerPreCheckoutQueryParams>
  ) {
    return this.telegram.api.answerPreCheckoutQuery({
      pre_checkout_query_id: this.id,
      ok: ok ?? true,
      error_message: errorMessage,
      ...params
    })
  }
}

// @ts-expect-error [senderId: number] is not compatible with [senderId: number | undefined] :shrug:
interface PreCheckoutQueryContext extends PreCheckoutQuery, SendMixin { }
applyMixins(PreCheckoutQueryContext, [PreCheckoutQuery, SendMixin])

inspectable(PreCheckoutQueryContext, {
  serialize(context) {
    const payload = {
      id: context.id,
      from: context.from,
      senderId: context.senderId,
      currency: context.currency,
      totalAmount: context.totalAmount,
      invoicePayload: context.invoicePayload,
      shippingOptionId: context.shippingOptionId,
      orderInfo: context.orderInfo
    }

    return filterPayload(payload)
  }
})

export { PreCheckoutQueryContext }
