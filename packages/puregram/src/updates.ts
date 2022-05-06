import http from 'node:http'

import { inspectable } from 'inspectable'
import {
  Middleware,
  compose,
  noopNext,
  NextMiddleware
} from 'middleware-io'
import createDebug from 'debug'

import * as Contexts from './contexts'

import { Composer } from './common/structures/composer'
import { User } from './common/structures/user'

import { Telegram } from './telegram'
import { GetUpdatesParams } from './generated/methods'
import { TelegramUpdate, TelegramUser } from './generated/telegram-interfaces'
import { delay, parseRequestJSON } from './utils/helpers'
import { StartPollingOptions } from './types/interfaces'
import { Constructor, UpdateName, MessageEventName } from './types/types'
import { UpdateType } from './types/enums'
import { TelegramError } from './errors'

const debug = createDebug('puregram:updates')

// THIS PART OF FILE IS AUTO-GENERATED!
// SOURCE: scripts/generate-updates
// @autogenerated generate-updates-raw-events start
const rawEvents: [UpdateName, Constructor<any>][] = [
  ['callback_query', Contexts.CallbackQueryContext],
  ['channel_chat_created', Contexts.ChannelChatCreatedContext],
  ['chosen_inline_result', Contexts.ChosenInlineResultContext],
  ['delete_chat_photo', Contexts.DeleteChatPhotoContext],
  ['group_chat_created', Contexts.GroupChatCreatedContext],
  ['inline_query', Contexts.InlineQueryContext],
  ['invoice', Contexts.InvoiceContext],
  ['left_chat_member', Contexts.LeftChatMemberContext],
  ['message', Contexts.MessageContext],
  ['edited_message', Contexts.MessageContext],
  ['channel_post', Contexts.MessageContext],
  ['edited_channel_post', Contexts.MessageContext],
  ['migrate_to_chat_id', Contexts.MigrateToChatIdContext],
  ['migrate_from_chat_id', Contexts.MigrateFromChatIdContext],
  ['new_chat_members', Contexts.NewChatMembersContext],
  ['new_chat_photo', Contexts.NewChatPhotoContext],
  ['new_chat_title', Contexts.NewChatTitleContext],
  ['pinned_message', Contexts.PinnedMessageContext],
  ['poll', Contexts.PollContext],
  ['poll_answer', Contexts.PollAnswerContext],
  ['chat_member', Contexts.ChatMemberContext],
  ['my_chat_member', Contexts.ChatMemberContext],
  ['pre_checkout_query', Contexts.PreCheckoutQueryContext],
  ['shipping_query', Contexts.ShippingQueryContext],
  ['successful_payment', Contexts.SuccessfulPaymentContext],
  ['supergroup_chat_created', Contexts.SupergroupChatCreatedContext],
  ['message_auto_delete_timer_changed', Contexts.MessageAutoDeleteTimerChangedContext],
  ['video_chat_scheduled', Contexts.VideoChatScheduledContext],
  ['video_chat_started', Contexts.VideoChatStartedContext],
  ['video_chat_ended', Contexts.VideoChatEndedContext],
  ['video_chat_participants_invited', Contexts.VideoChatParticipantsInvitedContext],
  ['web_app_data', Contexts.WebAppDataContext],
  ['chat_join_request', Contexts.ChatJoinRequestContext]
]
// @autogenerated generate-updates-raw-events end

type ContextConstructor = Constructor<Contexts.Context>
type AllowArray<T> = T | T[]

const makeContexts = () => {
  const contexts: Record<string, ContextConstructor> = {}

  for (const [event, UpdateContext] of rawEvents) {
    contexts[event] = UpdateContext
  }

  return contexts
}

const events = makeContexts()

/** Updates class */
export class Updates {
  private readonly telegram: Telegram
  private retries: number = 0

  /** Is polling started? */
  isStarted: boolean = false
  /** Updates offset */
  offset: number = 0

  private composer: Composer<Contexts.Context> = Composer.builder<Contexts.Context>()
    .caught(
      (_context: Contexts.Context, error: Error) => (
        console.error(error)
      )
    )

  private composed!: Middleware<Contexts.Context>

  /** Constructor */
  constructor(telegram: Telegram) {
    this.telegram = telegram

    this.recompose()
  }

  get [Symbol.toStringTag]() {
    return this.constructor.name
  }

  use<T = {}>(middleware: Middleware<Contexts.Context & T>) {
    if (typeof middleware !== 'function') {
      throw new TypeError('Middleware must be function')
    }

    this.composer.use(middleware)
    this.recompose()

    return this
  }

  /** Subscribe to events */
  on<T = {}>(
    rawOnEvents: AllowArray<string>,
    rawHandlers: AllowArray<Middleware<Contexts.Context & T>>
  ) {
    const onEvents = Array.isArray(rawOnEvents)
      ? rawOnEvents
      : [rawOnEvents]

    const hasEvents = onEvents.every(Boolean)

    if (!hasEvents) {
      throw new TypeError('Events must be not empty')
    }

    const handler = Array.isArray(rawHandlers)
      ? compose(rawHandlers)
      : rawHandlers

    if (typeof handler !== 'function') {
      throw new TypeError('Handler must be function')
    }

    return this.use(
      (context: Contexts.Context & T, next: NextMiddleware): unknown => (
        context.is(onEvents)
          ? handler(context, next)
          : next()
      )
    )
  }

  /** Calls up the middleware chain */
  dispatchMiddleware(context: Contexts.Context) {
    return this.composed(context, noopNext) as Promise<void>
  }

  private recompose() {
    this.composed = this.composer.compose()
  }

  /** Stop polling */
  stopPolling() {
    this.isStarted = false
    this.retries = 0
  }

  /** Start polling */
  async startPolling(options: StartPollingOptions = {}) {
    if (this.isStarted) {
      throw new Error('Polling is already started')
    }

    if (!this.telegram.options.token) {
      throw new TypeError('Token is not set. Perhaps you forgot to set it?')
    }

    if (!this.telegram.bot) {
      debug('Fetching bot data...')

      let me!: TelegramUser

      try {
        me = await this.telegram.api.getMe()
      } catch (error) {
        debug('Unable to fetch bot info, perhaps no internet connection?')

        throw new TelegramError({
          error_code: -1,
          description: 'Unable to fetch bot data from the start'
        })
      }

      const bot: User = new User(me)

      this.telegram.bot = bot

      debug('Bot data fetched successfully:')
      debug(bot)
    }

    this.isStarted = true

    try {
      this.startFetchLoop(options)
    } catch (error) {
      this.isStarted = false

      throw error
    }
  }

  private async startFetchLoop(options: StartPollingOptions) {
    try {
      while (this.isStarted) {
        await this.fetchUpdates(options)
      }
    } catch (error) {
      debug(error)

      if (this.telegram.options.apiRetryLimit === -1) {
        debug('Trying to reconnect...')
      } else if (this.retries === this.telegram.options.apiRetryLimit) {
        if (this.telegram.options.apiRetryLimit === 0) {
          return debug('`apiRetryLimit` is set to 0, not trying to reconnect')
        }

        return debug(`Tried to reconnect ${this.retries} times, but it didn't work, cya next time`)
      } else {
        this.retries += 1

        debug(`Trying to reconnect, ${this.retries}/${this.telegram.options.apiRetryLimit} try`)
      }

      await delay(this.telegram.options.apiWait!)

      // not this.stopPolling() because it resets this.retries
      this.isStarted = false

      this.startPolling()
    }
  }

  private async fetchUpdates(options: StartPollingOptions) {
    const params: Partial<GetUpdatesParams> = {
      timeout: 15,
      allowed_updates: this.telegram.options.allowedUpdates!
    }

    if (this.offset) params.offset = this.offset
    if (options.offset) params.offset = options.offset
    if (options.timeout) params.timeout = options.timeout

    const updates: TelegramUpdate[] = await this.telegram.api.getUpdates(params)

    if (!updates) {
      /// Something is wrong with the internet connection I can feel it...

      debug('`fetchUpdates` error: unable to get updates')

      this.stopPolling()
      this.startPolling()

      return
    }

    if (!updates.length) {
      return
    }

    updates.forEach(
      async (update: TelegramUpdate) => {
        try {
          await this.handleUpdate(update)
        } catch (error) {
          debug('`fetchUpdates` error:')
          debug(error)
        }
      }
    )
  }

  async handleUpdate(update: TelegramUpdate): Promise<Contexts.Context | undefined> {
    this.offset = update.update_id + 1

    const type: UpdateName = (Object.keys(update) as UpdateName[])[1]

    let UpdateContext: ContextConstructor = events[type]

    debug('Event type:', type)

    if (!UpdateContext) {
      debug(`Unsupported context type \`${type}\``)

      return
    }

    debug('Update payload:')
    debug(update[type])

    let context: Contexts.Context & { isEvent?: boolean, eventType?: MessageEventName } = new UpdateContext({
      telegram: this.telegram,
      update,
      payload: update[type],
      type,
      updateId: update.update_id
    })

    const isEvent: boolean = context.isEvent === true && context.eventType !== undefined

    debug('Is event?', isEvent)

    if (isEvent) {
      UpdateContext = events[context.eventType!]

      context = new UpdateContext({
        telegram: this.telegram,
        update,
        payload: update.message,
        type: context.eventType!,
        updateId: update.update_id
      })
    }

    debug(context)

    this.dispatchMiddleware(context)

    return context
  }

  // FIXME: unacceptable return type
  getKoaMiddleware(): Function {
    return async (context: any) => {
      const update: any = context.request.body

      if (update === undefined) {
        context.status = 500

        throw new Error('request.body is undefined. Are you sure you parsed it (e.g. via koa-body)?')
      }

      context.status = 200
      context.set('connection', 'keep-alive')

      setImmediate(() => this.handleUpdate(update))
    }
  }

  // FIXME: unacceptable return type
  getWebhookMiddleware(): (req: http.IncomingMessage, res: http.ServerResponse) => Promise<void> {
    return async (req: http.IncomingMessage, res: http.ServerResponse) => {
      if (req.method !== 'POST') {
        return
      }

      const reqBody = (req as typeof req & { body: string | Record<string, any> }).body

      let update: any

      try {
        update = typeof reqBody === 'object' ? reqBody : await parseRequestJSON(req)
      } catch (error) {
        debug(error)

        return
      }

      if (update === undefined) {
        res.writeHead(500)
        res.end()

        throw new Error('req.body is undefined. Are you sure you parsed it (e.g. via body-parser)?')
      }

      res.writeHead(200)
      res.end()

      setImmediate(() => this.handleUpdate(update))
    }
  }
}

// THIS PART OF FILE IS AUTO-GENERATED!
// SOURCE: scripts/generate-updates
// @autogenerated generate-updates-on start
export interface Updates {
  /** Subscribe to events */
  on<T = {}>(events: UpdateType.CallbackQuery | 'callback_query', handlers: AllowArray<Middleware<Contexts.CallbackQueryContext & T>>): this
  on<T = {}>(events: UpdateType.ChannelChatCreated | 'channel_chat_created', handlers: AllowArray<Middleware<Contexts.ChannelChatCreatedContext & T>>): this
  on<T = {}>(events: UpdateType.ChosenInlineResult | 'chosen_inline_result', handlers: AllowArray<Middleware<Contexts.ChosenInlineResultContext & T>>): this
  on<T = {}>(events: UpdateType.DeleteChatPhoto | 'delete_chat_photo', handlers: AllowArray<Middleware<Contexts.DeleteChatPhotoContext & T>>): this
  on<T = {}>(events: UpdateType.GroupChatCreated | 'group_chat_created', handlers: AllowArray<Middleware<Contexts.GroupChatCreatedContext & T>>): this
  on<T = {}>(events: UpdateType.InlineQuery | 'inline_query', handlers: AllowArray<Middleware<Contexts.InlineQueryContext & T>>): this
  on<T = {}>(events: UpdateType.Invoice | 'invoice', handlers: AllowArray<Middleware<Contexts.InvoiceContext & T>>): this
  on<T = {}>(events: UpdateType.LeftChatMember | 'left_chat_member', handlers: AllowArray<Middleware<Contexts.LeftChatMemberContext & T>>): this
  on<T = {}>(events: UpdateType.Message | 'message', handlers: AllowArray<Middleware<Contexts.MessageContext & T>>): this
  on<T = {}>(events: UpdateType.EditedMessage | 'edited_message', handlers: AllowArray<Middleware<Contexts.MessageContext & T>>): this
  on<T = {}>(events: UpdateType.ChannelPost | 'channel_post', handlers: AllowArray<Middleware<Contexts.MessageContext & T>>): this
  on<T = {}>(events: UpdateType.EditedChannelPost | 'edited_channel_post', handlers: AllowArray<Middleware<Contexts.MessageContext & T>>): this
  on<T = {}>(events: UpdateType.MigrateToChatId | 'migrate_to_chat_id', handlers: AllowArray<Middleware<Contexts.MigrateToChatIdContext & T>>): this
  on<T = {}>(events: UpdateType.MigrateFromChatId | 'migrate_from_chat_id', handlers: AllowArray<Middleware<Contexts.MigrateFromChatIdContext & T>>): this
  on<T = {}>(events: UpdateType.NewChatMembers | 'new_chat_members', handlers: AllowArray<Middleware<Contexts.NewChatMembersContext & T>>): this
  on<T = {}>(events: UpdateType.NewChatPhoto | 'new_chat_photo', handlers: AllowArray<Middleware<Contexts.NewChatPhotoContext & T>>): this
  on<T = {}>(events: UpdateType.NewChatTitle | 'new_chat_title', handlers: AllowArray<Middleware<Contexts.NewChatTitleContext & T>>): this
  on<T = {}>(events: UpdateType.PinnedMessage | 'pinned_message', handlers: AllowArray<Middleware<Contexts.PinnedMessageContext & T>>): this
  on<T = {}>(events: UpdateType.Poll | 'poll', handlers: AllowArray<Middleware<Contexts.PollContext & T>>): this
  on<T = {}>(events: UpdateType.PollAnswer | 'poll_answer', handlers: AllowArray<Middleware<Contexts.PollAnswerContext & T>>): this
  on<T = {}>(events: UpdateType.ChatMember | 'chat_member', handlers: AllowArray<Middleware<Contexts.ChatMemberContext & T>>): this
  on<T = {}>(events: UpdateType.MyChatMember | 'my_chat_member', handlers: AllowArray<Middleware<Contexts.ChatMemberContext & T>>): this
  on<T = {}>(events: UpdateType.PreCheckoutQuery | 'pre_checkout_query', handlers: AllowArray<Middleware<Contexts.PreCheckoutQueryContext & T>>): this
  on<T = {}>(events: UpdateType.ShippingQuery | 'shipping_query', handlers: AllowArray<Middleware<Contexts.ShippingQueryContext & T>>): this
  on<T = {}>(events: UpdateType.SuccessfulPayment | 'successful_payment', handlers: AllowArray<Middleware<Contexts.SuccessfulPaymentContext & T>>): this
  on<T = {}>(events: UpdateType.SupergroupChatCreated | 'supergroup_chat_created', handlers: AllowArray<Middleware<Contexts.SupergroupChatCreatedContext & T>>): this
  on<T = {}>(events: UpdateType.MessageAutoDeleteTimerChanged | 'message_auto_delete_timer_changed', handlers: AllowArray<Middleware<Contexts.MessageAutoDeleteTimerChangedContext & T>>): this
  on<T = {}>(events: UpdateType.VideoChatScheduled | 'video_chat_scheduled', handlers: AllowArray<Middleware<Contexts.VideoChatScheduledContext & T>>): this
  on<T = {}>(events: UpdateType.VideoChatStarted | 'video_chat_started', handlers: AllowArray<Middleware<Contexts.VideoChatStartedContext & T>>): this
  on<T = {}>(events: UpdateType.VideoChatEnded | 'video_chat_ended', handlers: AllowArray<Middleware<Contexts.VideoChatEndedContext & T>>): this
  on<T = {}>(events: UpdateType.VideoChatParticipantsInvited | 'video_chat_participants_invited', handlers: AllowArray<Middleware<Contexts.VideoChatParticipantsInvitedContext & T>>): this
  on<T = {}>(events: UpdateType.WebAppData | 'web_app_data', handlers: AllowArray<Middleware<Contexts.WebAppDataContext & T>>): this
  on<T = {}>(events: UpdateType.ChatJoinRequest | 'chat_join_request', handlers: AllowArray<Middleware<Contexts.ChatJoinRequestContext & T>>): this
  on<T = {}>(events: AllowArray<string>, handlers: AllowArray<Middleware<Contexts.Context & T>>): this
}
// @autogenerated generate-updates-on end

inspectable(Updates, {
  serialize(updates: Updates) {
    return {
      isStarted: updates.isStarted,
      offset: updates.offset
    }
  }
})
