<template>
    <q-list separator no-border class="relative-position no-padding" style="min-height: 30vh">
        <q-item v-if="(!Object.keys(telemetry).length || !Object.keys(filteredTelemetry).length) && !isLoading" :class="[cls.bg]">
            <q-item-main>
                <q-item-tile label class="ellipsis text-bold text-center" :class="[cls.text]">Telemetry is empty</q-item-tile>
                <q-item-tile v-if="!Object.keys(telemetry).length" sublabel class="ellipsis text-center" :class="[cls.text]">Init your device</q-item-tile>
                <q-item-tile v-if="!Object.keys(filteredTelemetry).length && this.search" sublabel class="ellipsis text-center" :class="[cls.text]">Nothing found on your search</q-item-tile>
            </q-item-main>
        </q-item>
        <div v-if="isLoading" style="text-align: center; margin-top: 10%;">
            <q-spinner-gears size="70px" color="white" />
        </div>
        <q-item @click="clickItemHandler(index, key)" v-if="Object.keys(filteredTelemetry).length" v-for="(key, index) in Object.keys(filteredTelemetry)" :key="key" style="transition: all .5s ease-in-out" :class="[!prevTelemetry[key] || prevTelemetry[key].value !== telemetry[key].value ? cls.highlight : cls.bg, cls.bg]">
            <q-item-main>
                <q-item-tile label class="ellipsis text-bold"  :class="[cls.text]">{{key}}<q-tooltip>{{key}}</q-tooltip></q-item-tile>
                <q-item-tile sublabel class="ellipsis"  :class="[cls.text]">
                    <q-icon style="padding-right: 1px" v-if="!!$copyText" name="mdi-content-copy" @click.stop.native="copyMessageHandler({index, content: telemetry[key].value})"><q-tooltip>copy</q-tooltip></q-icon>
                    <span>
                        {{telemetry[key].value}}
                        <q-tooltip>{{telemetry[key].value}}</q-tooltip>
                    </span>
                </q-item-tile>
            </q-item-main>
            <q-item-side right><small  :class="[cls.text]">{{fromNow(telemetry[key].ts * 1000)}}</small><q-tooltip><small>{{getTime(telemetry[key].ts * 1000)}}</small></q-tooltip></q-item-side>
            <q-popover class="shadow-1" ref="popovers">
                <q-list v-if="propHistoryFlag && history[key] && history[key].length" separator no-border>
                    <q-item>
                        <q-item-side left><q-icon size="1.5rem" name="history"/></q-item-side>
                        <q-item-main>
                            <q-item-tile class="ellipsis">History</q-item-tile>
                        </q-item-main>
                    </q-item>
                    <q-item v-for="(obj, index) in history[key]" :key="index">
                        <q-item-main>
                            <q-item-tile label class="ellipsis">{{obj.value}}</q-item-tile>
                        </q-item-main>
                        <q-item-side right><small>{{getTime(obj.ts * 1000)}}</small></q-item-side>
                    </q-item>
                </q-list>
            </q-popover>
        </q-item>
    </q-list>
</template>

<script>
    import telemetryVuexModule from './telemetryVuexModule'
    import Vue from 'vue'
    import { mapState } from 'vuex'
    import moment from 'moment'
    import VueClipboard from 'vue-clipboard2'

    Vue.use(VueClipboard)

    export default {
        name: 'QTelemetry',
        props: {
            device: {
                type: Object,
                required: true
            },
            moduleName: {
                type: String,
                default: 'telemetry'
            },
            propHistoryFlag: {
                type: Boolean,
                default: false
            },
            search: {
                type: String,
                default: ''
            },
            color: {
                type: String,
                default: ''
            },
            inverted: Boolean
        },
        data () {
            return {
                prevTelemetry: { ...this.device.telemetry },
                history: {}
            }
        },
        computed: {
            ...mapState({
                deviceId (state) {
                    return this.moduleName && state[this.moduleName] ? state[this.moduleName].deviceId : null
                },
                telemetry (state) {
                    return this.moduleName && state[this.moduleName] ? state[this.moduleName].telemetry : {}
                },
                isLoading (state) {
                    return this.moduleName && state[this.moduleName] ? state[this.moduleName].isLoading : false
                }
            }),
            cls () {
                const cls = {
                    text: `text-${this.color}`,
                    bg: '',
                    highlight: 'bg-grey-3'
                }
                if (this.inverted) {
                    if (this.color) {
                        cls.text = `text-${this.color}`
                    } else {
                        cls.text = 'text-white'
                    }
                    cls.bg = `bg-dark`
                    cls.highlight = `bg-grey-9`
                }
                return cls
            },
            filteredTelemetry () {
                return Object.keys(this.telemetry).reduce((acc, key) => {
                    if (key.indexOf(this.search) !== -1) {
                        acc[key] = this.telemetry[key]
                    }
                    return acc
                }, {})
            }
        },
        methods: {
            init (payload) {
                this.$store.commit(`${this.moduleName}/init`, payload)
            },
            clear () {
                this.$store.commit(`${this.moduleName}/clear`)
            },
            update () {
                return this.$store.dispatch(`${this.moduleName}/update`)
            },
            unsubscribe () {
                return this.$store.dispatch(`${this.moduleName}/unsubscribe`)
            },
            fromNow (ts) {
                return moment(ts).fromNow()
            },
            getTime (ts) {
                return moment(ts).format('L HH:mm:ss')
            },
            clickItemHandler (index, key) {
                this.$emit('click:item', { deviceId: this.deviceId })
            },
            makeHistory (newTelemetry) {
                Object.keys(newTelemetry).forEach(key => {
                    if (!this.history[key]) {
                        this.history[key] = [newTelemetry[key]]
                    }
                    if (this.history[key].length) {
                        if (this.history[key][0].value !== newTelemetry[key].value) {
                            this.history[key].unshift(newTelemetry[key])
                            if (this.history[key].length > 10) {
                                this.history[key].pop()
                            }
                        }
                    }
                })
            },
            getDiff () {
                return Object.keys(this.telemetry).reduce((acc, key) => {
                    if (!this.prevTelemetry[key] || this.prevTelemetry[key].value !== this.telemetry[key].value) {
                        acc[key] = this.telemetry[key]
                    }
                    return acc
                }, {})
            },
            copyMessageHandler ({ index, content }) {
                this.$copyText(JSON.stringify(content))
                    .then((e) => {
                        this.$q.notify({
                            type: 'positive',
                            icon: 'content_copy',
                            message: `Value copied`,
                            timeout: 1000,
                            position: 'bottom-left'
                        })
                    }, (e) => {
                        this.$q.notify({
                            type: 'negative',
                            icon: 'content_copy',
                            message: `Error coping value`,
                            timeout: 1000,
                            position: 'bottom-left'
                        })
                    })
            }
        },
        watch: {
            device (device) {
                if (device.id) {
                    if (device.id !== this.deviceId) {
                        this.unsubscribe()
                        this.init(device)
                        this.update()
                        this.history = {}
                        this.prevTelemetry = { ...this.device.telemetry }
                    }
                } else {
                    this.clear()
                    this.history = {}
                    this.prevTelemetry = {}
                }
            },
            telemetry: {
                deep: true,
                handler (telemetry) {
                    const diff = this.getDiff()
                    Object.keys(diff).length ? this.$emit('diff', diff) : this.$emit('diff', { ...telemetry })
                    setTimeout(() => {
                        this.prevTelemetry = { ...telemetry }
                        if (this.propHistoryFlag) {
                            this.makeHistory(telemetry)
                        }
                    }, 1000)
                }
            }
        },
        created () {
            this.$store.registerModule(this.moduleName, telemetryVuexModule(this.$store, Vue))
            this.init(this.device)
            this.update()
        },
        beforeDestroy () {
            this.clear()
        }
    }
</script>

<style>
</style>
