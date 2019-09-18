export default function (Store, Vue) {
  const state = {
    deviceId: null,
    telemetry: {},
    isLoading: false,
    updateIntervalId: 0
  }

  const actions = {
    update: async function ({
      state,
      commit
    }) {
      try {
        /* init telemetry */
        if (state.deviceId && !Object.keys(state.telemetry).length) {
          state.isLoading = true
          let messages = [],
            messagesProcess = () => {
              messages.forEach((packet) => {
                let topic = packet.topic,
                  message = packet.payload,
                  name = topic.split('/').reverse()[0]
                if (name === 'position') {
                  return false
                }
                let value = message.toString(),
                  ts = packet.properties && packet.properties.userProperties && packet.properties.userProperties.timestamp,
                  telemetry = {
                    [name]: {
                      value,
                      ts
                    }
                  }
                commit('setParameter', telemetry)
              })
              messages = []
            }
          /* subscribe to new device telemetry */
          let grants = await Vue.connector.socket.subscribe({
            name: `flespi/state/gw/devices/${state.deviceId}/telemetry/+`,
            handler(message, topic, packet) {
              messages.push(packet)
            }
          })
          state.updateIntervalId = setInterval(messagesProcess, 500)
          state.isLoading = false
        }
      } catch (error) {
        commit('reqFailed', error, {
          root: true
        })
      }
    },
    unsubscribe: async function ({
      state,
      commit
    }) {
      clearInterval(state.updateIntervalId)
      Vue.connector.socket.unsubscribe(`flespi/state/gw/devices/${state.deviceId}/telemetry/+`)
    }
  }

  const mutations = {
    init(state, device) {
      Vue.set(state, 'deviceId', device.id || 0)
      Vue.set(state, 'telemetry', device.telemetry || {})
    },

    setParameter(state, payload) {
      Object.keys(payload).forEach(key => {
        if (!state.telemetry[key] || (state.telemetry[key] && state.telemetry[key].ts <= payload[key].ts)) {
          Vue.set(state.telemetry, key, payload[key])
        }
      })
    },
    clear(state) {
      Vue.connector.socket.unsubscribe(`flespi/state/gw/devices/${state.deviceId}/telemetry/+`)
      Vue.set(state, 'telemetry', {})
      Vue.set(state, 'deviceId', null)
    }
  }

  return {
    namespaced: true,
    state,
    actions,
    mutations
  }
}
