module.exports = function (Store, Vue) {
    const state = {
        deviceId: null,
        telemetry: {},
        isLoading: false
    }

    const actions = {
        update: async function ({ state, commit }) {
            commit('reqStart')
            try {
                /* init telemetry */
                if (state.deviceId && !Object.keys(state.telemetry).length) {
                    state.isLoading = true
                    let telemetryResp = await Vue.connector.gw.getDevices(state.deviceId, { fields: 'telemetry'})
                    let telemetry = telemetryResp.data.result[0]
                    state.isLoading = false
                    commit('setTelemetry', telemetry)
                }
                /* subscribe to new device messages */
                Vue.connector.subscribeMessagesDevices(state.deviceId, (message) => { commit('setTelemetryFromMessage', {message: JSON.parse(message)}) })
            }
            catch(error) { commit('reqFailed', error, { root: true }) }
        },
        unsubscribe: async function ({ state, commit }) { Vue.connector.unsubscribeMessagesDevices(state.deviceId) }
    }

    const mutations = {
        init (state, device) {
            Vue.set(state, 'deviceId', device.id || 0)
            Vue.set(state, 'telemetry', device.telemetry || {})
        },

        setTelemetry (state, payload) {
            if (payload.telemetry) {
                Object.keys(payload.telemetry).forEach(key => {
                    if (!state.telemetry[key] || (state.telemetry[key] && state.telemetry[key].value !== payload.telemetry[key].value)) {
                        Vue.set(state.telemetry, key, payload.telemetry[key])
                    }
                })
            }
        },
        setTelemetryFromMessage (state, payload) {/* construct telemetry by message from mqtt */
            if (payload.message) {
                Object.keys(payload.message).forEach(key => {
                    if (key === 'device_id' || key === 'device_name') { return false }
                    if (!state.telemetry[key] || (state.telemetry[key] && state.telemetry[key].value !== payload.message[key])) {
                        Vue.set(state.telemetry, key, {value: payload.message[key], ts: payload.message.timestamp })
                    }
                })
            }
        },
        reqStart (state) {
            if (DEV) {
                console.log('Start Request Telemetry')
            }
        },
        clear (state) {
            Vue.connector.unsubscribeMessagesDevices(state.deviceId)
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