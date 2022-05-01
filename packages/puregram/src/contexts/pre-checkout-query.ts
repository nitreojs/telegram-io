import { inspectable } from 'inspectable'

import * as Interfaces from '../generated/telegram-interfaces'
import * as Methods from '../generated/methods'
import { BotCommand } from '../common/structures'

import { Optional } from '../types/types'
import { MediaInput } from '../media-source'
import { Telegram } from '../telegram'
import { filterPayload, applyMixins } from '../utils/helpers'
import { PreCheckoutQuery, Poll } from '../updates/'

import { Context } from './context'
import { MessageContext } from './message'

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

  /** Answers to pre-checkout query */
  async answerPreCheckoutQuery(
    params: Optional<Methods.AnswerPreCheckoutQueryParams, 'pre_checkout_query_id'>
  ): Promise<true> {
    return this.telegram.api.answerPreCheckoutQuery({
      pre_checkout_query_id: this.id,
      ...params
    })
  }

  /** Sends message to current chat */
  async send(
    text: string,
    params?: Optional<Methods.SendMessageParams, 'chat_id' | 'text'>
  ): Promise<MessageContext> {
    const response = await this.telegram.api.sendMessage({
      chat_id: this.senderId,
      text,
      ...params
    })

    return new MessageContext({
      telegram: this.telegram,
      payload: response
    })
  }

  /** Sends photo to current chat */
  async sendPhoto(
    photo: MediaInput,
    params?: Optional<Methods.SendPhotoParams, 'chat_id' | 'photo'>
  ): Promise<MessageContext> {
    const response = await this.telegram.api.sendPhoto({
      chat_id: this.senderId,
      photo,
      ...params
    })

    return new MessageContext({
      telegram: this.telegram,
      payload: response
    })
  }

  /** Sends document to current chat */
  async sendDocument(
    document: MediaInput,
    params?: Optional<Methods.SendDocumentParams, 'chat_id' | 'document'>
  ): Promise<MessageContext> {
    const response = await this.telegram.api.sendDocument({
      chat_id: this.senderId,
      document,
      ...params
    })

    return new MessageContext({
      telegram: this.telegram,
      payload: response
    })
  }

  /** Sends audio to current chat */
  async sendAudio(
    audio: MediaInput,
    params?: Optional<Methods.SendAudioParams, 'chat_id' | 'audio'>
  ): Promise<MessageContext> {
    const response = await this.telegram.api.sendAudio({
      chat_id: this.senderId,
      audio,
      ...params
    })

    return new MessageContext({
      telegram: this.telegram,
      payload: response
    })
  }

  /** Sends video to current chat */
  async sendVideo(
    video: MediaInput,
    params?: Optional<Methods.SendVideoParams, 'chat_id' | 'video'>
  ): Promise<MessageContext> {
    const response = await this.telegram.api.sendVideo({
      chat_id: this.senderId,
      video,
      ...params
    })

    return new MessageContext({
      telegram: this.telegram,
      payload: response
    })
  }

  /** Sends animation to current chat */
  async sendAnimation(
    animation: MediaInput,
    params?: Optional<Methods.SendAnimationParams, 'chat_id' | 'animation'>
  ): Promise<MessageContext> {
    const response = await this.telegram.api.sendAnimation({
      chat_id: this.senderId,
      animation,
      ...params
    })

    return new MessageContext({
      telegram: this.telegram,
      payload: response
    })
  }

  /** Sends video note to current chat */
  async sendVideoNote(
    videoNote: MediaInput,
    params?: Optional<Methods.SendVideoNoteParams, 'chat_id' | 'video_note'>
  ): Promise<MessageContext> {
    const response = await this.telegram.api.sendVideoNote({
      chat_id: this.senderId,
      video_note: videoNote,
      ...params
    })

    return new MessageContext({
      telegram: this.telegram,
      payload: response
    })
  }

  /** Sends voice to current chat */
  async sendVoice(
    voice: MediaInput,
    params?: Optional<Methods.SendVoiceParams, 'chat_id' | 'voice'>
  ): Promise<MessageContext> {
    const response = await this.telegram.api.sendVoice({
      chat_id: this.senderId,
      voice,
      ...params
    })

    return new MessageContext({
      telegram: this.telegram,
      payload: response
    })
  }

  /** Sends media group to current chat */
  async sendMediaGroup(
    mediaGroup: Methods.SendMediaGroupParams['media'],
    params?: Partial<Methods.SendMediaGroupParams>
  ): Promise<MessageContext[]> {
    const response = await this.telegram.api.sendMediaGroup({
      chat_id: this.senderId,
      media: mediaGroup,
      ...params
    })

    return response.map(
      (message: Interfaces.TelegramMessage) => new MessageContext({
        telegram: this.telegram,
        payload: message
      })
    )
  }

  /** Sends location to current chat */
  async sendLocation(
    latitude: number,
    longitude: number,
    params?: Optional<Methods.SendLocationParams, 'chat_id' | 'latitude' | 'longitude'>
  ): Promise<MessageContext> {
    const response = await this.telegram.api.sendLocation({
      ...params,
      chat_id: this.senderId,
      latitude,
      longitude
    })

    return new MessageContext({
      telegram: this.telegram,
      payload: response
    })
  }

  /** Sends venue to current chat */
  async sendVenue(
    params: Optional<Methods.SendVenueParams, 'chat_id'>
  ): Promise<MessageContext> {
    const response = await this.telegram.api.sendVenue({
      chat_id: this.senderId,
      ...params
    })

    return new MessageContext({
      telegram: this.telegram,
      payload: response
    })
  }

  /** Sends contact to current chat */
  async sendContact(
    params: Optional<Methods.SendContactParams, 'chat_id'>
  ): Promise<MessageContext> {
    const response = await this.telegram.api.sendContact({
      chat_id: this.senderId,
      ...params
    })

    return new MessageContext({
      telegram: this.telegram,
      payload: response
    })
  }

  /** Sends poll to current chat */
  async sendPoll(
    params: Optional<Methods.SendPollParams, 'chat_id'>
  ): Promise<MessageContext> {
    const response = await this.telegram.api.sendPoll({
      chat_id: this.senderId,
      ...params
    })

    return new MessageContext({
      telegram: this.telegram,
      payload: response
    })
  }

  /** Stops poll in current chat */
  async stopPoll(
    messageId: number,
    params?: Partial<Methods.StopPollParams>
  ): Promise<Poll> {
    const response = await this.telegram.api.stopPoll({
      chat_id: this.senderId,
      message_id: messageId,
      ...params
    })

    return new Poll(response)
  }

  /** Sends chat action to current chat */
  sendChatAction(
    action: Methods.SendChatActionParams['action'],
    params?: Optional<Methods.SendChatActionParams, 'chat_id'>
  ): Promise<true> {
    return this.telegram.api.sendChatAction({
      chat_id: this.senderId,
      action,
      ...params
    })
  }

  /** Sends sticker */
  async sendSticker(
    sticker: MediaInput,
    params?: Optional<Methods.SendStickerParams, 'sticker' | 'chat_id'>
  ): Promise<MessageContext> {
    const response = await this.telegram.api.sendSticker({
      sticker,
      chat_id: this.senderId,
      ...params
    })

    return new MessageContext({
      telegram: this.telegram,
      payload: response
    })
  }

  /** Sends dice */
  async sendDice(
    emoji: Methods.SendDiceParams['emoji'],
    params?: Partial<Methods.SendDiceParams>
  ): Promise<MessageContext> {
    const response = await this.telegram.api.sendDice({
      emoji,
      chat_id: this.senderId,
      ...params
    })

    return new MessageContext({
      telegram: this.telegram,
      payload: response
    })
  }

  /** Gets commands */
  async getMyCommands(): Promise<BotCommand[]> {
    const response = await this.telegram.api.getMyCommands()

    return response.map(
      (command: Interfaces.TelegramBotCommand) => new BotCommand(command)
    )
  }
}

interface PreCheckoutQueryContext extends PreCheckoutQuery { }
applyMixins(PreCheckoutQueryContext, [PreCheckoutQuery])

inspectable(PreCheckoutQueryContext, {
  serialize(query: PreCheckoutQueryContext) {
    const payload = {
      id: query.id,
      from: query.from,
      senderId: query.senderId,
      currency: query.currency,
      totalAmount: query.totalAmount,
      invoicePayload: query.invoicePayload,
      shippingOptionId: query.shippingOptionId,
      orderInfo: query.orderInfo
    }

    return filterPayload(payload)
  }
})

export { PreCheckoutQueryContext }
