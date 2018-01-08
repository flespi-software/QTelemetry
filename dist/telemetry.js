module.exports = function (Store, Vue) {
    var state = {
        deviceId: null,
        telemetry: {},
        server: null
    }

    var actions = {
        update: function update (ref) {
            var state = ref.state;
            var commit = ref.commit;

            commit('reqStart')
            return Vue.http.headers.common['Authorization'] && state.deviceId ? Vue.http.get(((state.server) + "/registry/devices/" + (state.deviceId)), {
                params: {
                    fields: 'telemetry'
                }
            }).then(function (resp) { return resp.json(); })
                .then(function (json) {
                    commit('setTelemetry', json.result[0])
                    return json.result[0]
                })
                .catch(function (err) { commit('reqFailed', err, { root: true }) }) : false
        }
    }

    var mutations = {
        init: function init (state, device) {
            Vue.set(state, 'deviceId', device.id || 0)
            Vue.set(state, 'telemetry', device.telemetry || {})
        },

        setTelemetry: function setTelemetry (state, payload) {
            if (payload.telemetry) {
                Object.keys(payload.telemetry).forEach(function (key) {
                    if (!state.telemetry[key] || (state.telemetry[key] && state.telemetry[key].value !== payload.telemetry[key].value)) {
                        Vue.set(state.telemetry, key, payload.telemetry[key])
                    }
                })
            }
        },
        reqStart: function reqStart (state) {
            if (DEV) {
                console.log('Start Request Telemetry')
            }
        },
        clear: function clear (state) {
            Vue.set(state, 'telemetry', {})
            Vue.set(state, 'deviceId', null)
        },
        setServer: function setServer (state, server) {
            Vue.set(state, 'server', server)
        }
    }

    Store.registerModule('telemetry', {
        namespaced: true,
        state: state,
        actions: actions,
        mutations: mutations
    })
}
