<template>
    <q-list separator no-border>
        <q-item v-if="!Object.keys(telemetry).length || !Object.keys(filteredTelemetry).length" :class="[cls.bg]">
            <q-item-main>
                <q-item-tile label class="ellipsis text-bold text-center" :class="[cls.text]">Telemetry is empty</q-item-tile>
                <q-item-tile v-if="!Object.keys(telemetry).length" sublabel class="ellipsis text-center" :class="[cls.text]">Init your device</q-item-tile>
                <q-item-tile v-if="!Object.keys(filteredTelemetry).length && this.search" sublabel class="ellipsis text-center" :class="[cls.text]">Nothing found on your search</q-item-tile>
            </q-item-main>
        </q-item>
        <q-item @click="clickItemHandler(index, key)" v-if="Object.keys(filteredTelemetry).length" v-for="(key, index) in Object.keys(filteredTelemetry)" :key="key" style="transition: all .5s ease-in-out" :class="[!prevTelemetry[key] || prevTelemetry[key].value !== telemetry[key].value ? cls.highlight : cls.bg, cls.bg]">
            <q-item-main>
                <q-item-tile label class="ellipsis text-bold"  :class="[cls.text]">{{key}}<q-tooltip>{{key}}</q-tooltip></q-item-tile>
                <q-item-tile sublabel class="ellipsis"  :class="[cls.text]">{{telemetry[key].value}}<q-tooltip>{{telemetry[key].value}}</q-tooltip></q-item-tile>
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
    import { QList, QListHeader, QItem, QItemMain, QItemSide, QItemTile, QTooltip, QIcon, QPopover } from 'quasar-framework'
    import { createNamespacedHelpers } from 'vuex'
    import moment from 'moment'

    let { mapState, mapActions, mapMutations } = createNamespacedHelpers('telemetry')

    export default {
        name: 'QTelemetry',
        props: {
            device: {
                type: Object,
                required: true
            },
            delay: {
                type: Number,
                default: 2000
            },
            server: {
                type: String,
                default: ''
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
                intervalId: 0,
                prevTelemetry: {...this.device.telemetry},
                history: {}
            }
        },
        computed: {
            ...mapState([
                'deviceId',
                'telemetry'
            ]),
            cls () {
                let cls = {
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
                    if (key.indexOf(this.search) === 0) {
                        acc[key] = this.telemetry[key]
                    }
                    return acc
                }, {})
            }
        },
        methods: {
            ...mapMutations(['init', 'clear', 'setServer']),
            ...mapActions(['update']),
            fromNow (ts) {
                return moment(ts).fromNow()
            },
            getTime (ts) {
                return moment(ts).format('L HH:mm:ss')
            },
            clickItemHandler (index, key) {
                this.$emit('click:item', {deviceId: this.deviceId})
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
            }
        },
        components: { QList, QListHeader, QItem, QItemMain, QItemSide, QItemTile, QTooltip, QIcon, QPopover },
        watch: {
            device (device) {
                if (device.id && device.id !== this.deviceId) {
                    this.init(device)
                    this.history = {}
                    this.prevTelemetry = {...this.device.telemetry}
                }
            },
            telemetry: {
                deep: true,
                handler (telemetry) {
                    let diff = this.getDiff()
                    Object.keys(diff).length ? this.$emit('diff', diff) : this.$emit('diff', {...telemetry})
                    setTimeout(() => {
                        this.prevTelemetry = {...telemetry}
                        if (this.propHistoryFlag) {
                            this.makeHistory(telemetry)
                        }
                    }, 1000)
                }
            },
            delay (delay) {
                if (this.intervalId) {
                    clearInterval(this.intervalId)
                }
                this.intervalId = setInterval(this.update, this.delay)
            },
            server (server) {
                this.setServer(this.server)
            }
        },
        created () {
            this.setServer(this.server)
            this.init(this.device)
            this.update()
            this.intervalId = setInterval(this.update, this.delay)
        },
        beforeDestroy () {
            if (this.intervalId) {
                clearInterval(this.intervalId)
            }
            this.clear()
        }
    }
</script>

<style>
</style>
