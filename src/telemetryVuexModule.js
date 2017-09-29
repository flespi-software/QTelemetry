module.exports = function (Store, Vue) {
    const state = {
        deviceId: null,
        telemetry: {},
        server: null
    }

    const actions = {
        update ({ state, commit, rootState }) {
            commit('reqStart')
            return rootState.token && state.deviceId !== -1 ? Vue.http.get(`${state.server}/registry/devices/${state.deviceId}`, {
                params: {
                    fields: 'telemetry'
                }
            }).then((resp) => resp.json())
                .then((json) => {
                    commit('setTelemetry', json.result[0])
                    return json.result[0]
                })
                .catch((err) => { commit('reqFailed', err, { root: true }) }) : false
        }
    }

    const mutations = {
        init (state, device) {
            Vue.set(state, 'deviceId', device.id || -1)
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
        reqStart (state) {
            if (DEV) {
                console.log('Start Request Telemetry')
            }
        },
        clear (state) {
            Vue.set(state, 'telemetry', {})
            Vue.set(state, 'deviceId', null)
        },
        setServer (state, server) {
            Vue.set(state, 'server', server)
        }
    }

    Store.registerModule('telemetry', {
        namespaced: true,
        state,
        actions,
        mutations
    })
}