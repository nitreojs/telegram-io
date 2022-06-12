import { Constructor } from '../../types/types'

import { Context } from '../context'

interface CloneMixinMetadata<P> {
  payload: P
}

class CloneMixin<C extends Context & Constructor<C>, Options extends Record<string, any>> {
  clone(options?: Options) {
    return new (this.constructor as C)({
      telegram: this.telegram,
      payload: this.payload,
      updateId: this.updateId!,
      update: this.update!,
      ...options
    })
  }
}

interface CloneMixin<C, Options> extends Context, CloneMixinMetadata<Options['payload']> { }

export { CloneMixin }