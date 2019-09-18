<template>
  <q-list separator no-border class="relative-position no-padding" style="min-height: 30vh">
    <q-item v-if="(!telemetryKeys.length || !filteredTelemetryKeys.length) && !isLoading" :class="[cls.bg]">
      <q-item-main>
        <q-item-tile label class="ellipsis text-bold text-center" :class="[cls.text]">Telemetry is empty</q-item-tile>
        <q-item-tile v-if="!telemetryKeys.length" sublabel class="ellipsis text-center" :class="[cls.text]">Init your
          device</q-item-tile>
        <q-item-tile v-if="!filteredTelemetryKeys.length && this.search" sublabel class="ellipsis text-center"
          :class="[cls.text]">Nothing found on your search</q-item-tile>
      </q-item-main>
    </q-item>
    <div v-if="isLoading" style="text-align: center; margin-top: 10%;">
      <q-spinner-gears size="70px" color="white" />
    </div>
    <VirtualList
      :size="55"
      :remain="15"
      v-if="filteredTelemetryKeys.length && !isLoading"
      style="position: absolute; top: 0; bottom: 0; left: 0; right: 0; height: auto;"
    >
      <q-item
        @click="clickItemHandler(index, key)"
        v-for="(valueObj, key, index) in filteredTelemetry"
        :key="key"
        style="transition: all .5s ease-in-out"
        :class="[!prevTelemetry[key] || prevTelemetry[key].value !== telemetry[key].value ? cls.highlight : cls.bg]"
      >
        <q-item-main>
          <q-item-tile label class="ellipsis text-bold" :class="[cls.text]">{{key}}<q-tooltip>{{key}}</q-tooltip>
          </q-item-tile>
          <q-item-tile sublabel class="ellipsis" :class="[cls.text]">
            <q-icon style="padding-right: 1px; cursor: pointer;" v-if="!!$copyText" name="mdi-content-copy"
              @click.stop.native="copyMessageHandler({index, content: telemetry[key].value})">
              <q-tooltip>copy</q-tooltip>
            </q-icon>
            <span>
              {{telemetry[key].value}}
              <q-tooltip>{{telemetry[key].value}}</q-tooltip>
            </span>
          </q-item-tile>
        </q-item-main>
        <q-item-side right><small :class="[cls.text]">{{fromNow(telemetry[key].ts * 1000)}}</small>
          <q-tooltip><small>{{getTime(telemetry[key].ts * 1000)}}</small></q-tooltip>
        </q-item-side>
        <q-popover class="shadow-1" ref="popovers">
          <q-list v-if="propHistoryFlag && history[key] && history[key].length" separator no-border>
            <q-item>
              <q-item-side left>
                <q-icon size="1.5rem" name="history" />
              </q-item-side>
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
    </VirtualList>
  </q-list>
</template>

<script>
import telemetryVuexModule from './telemetryVuexModule'
import Vue from 'vue'
import {
  mapState
} from 'vuex'
import moment from 'moment'
import VueClipboard from 'vue-clipboard2'
import debounce from 'lodash/debounce'
import VirtualList from 'vue-virtual-scroll-list'

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
  data() {
    return {
      prevTelemetry: {
        ...this.device.telemetry
      },
      history: {},
      filteredTelemetry: {},
      prevTelemetryTimeout: 0
    }
  },
  computed: {
    ...mapState({
      deviceId(state) {
        return this.moduleName && state[this.moduleName] ? state[this.moduleName].deviceId : null
      },
      telemetry(state) {
        return this.moduleName && state[this.moduleName] ? state[this.moduleName].telemetry : {}
      },
      isLoading(state) {
        return this.moduleName && state[this.moduleName] ? state[this.moduleName].isLoading : false
      }
    }),
    cls() {
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
        cls.highlight = `bg-grey-7`
      }
      return cls
    },
    telemetryKeys() {
      return Object.keys(this.telemetry)
    },
    filteredTelemetryKeys() {
      return Object.keys(this.filteredTelemetry)
    }
  },
  methods: {
    init(payload) {
      this.$store.commit(`${this.moduleName}/init`, payload)
    },
    clear() {
      this.$store.commit(`${this.moduleName}/clear`)
    },
    update() {
      return this.$store.dispatch(`${this.moduleName}/update`)
    },
    unsubscribe() {
      return this.$store.dispatch(`${this.moduleName}/unsubscribe`)
    },
    fromNow(ts) {
      return moment(ts).fromNow()
    },
    getTime(ts) {
      return moment(ts).format('L HH:mm:ss')
    },
    clickItemHandler(index, key) {
      this.$emit('click:item', {
        deviceId: this.deviceId
      })
    },
    makeHistory(newTelemetry) {
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
    getDiff() {
      return Object.keys(this.telemetry).reduce((acc, key) => {
        if (!this.prevTelemetry[key] || this.prevTelemetry[key].value !== this.telemetry[key].value) {
          acc[key] = this.telemetry[key]
        }
        return acc
      }, {})
    },
    copyMessageHandler({
      index,
      content
    }) {
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
    },
    setFilteredTelemetry(telemetry) {
      let filteredTelemetry = this.filteredTelemetry
      this.telemetryKeys.forEach((key) => {
        if (key.indexOf(this.search) !== -1) {
          this.$set(filteredTelemetry, key, this.telemetry[key])
        } else if (filteredTelemetry[key]) {
          this.$delete(filteredTelemetry, key)
        }
      })
    },
    telemetryDiffHistoryProcessing(telemetry) {
      const diff = this.getDiff()
      Object.keys(diff).length ? this.$emit('diff', diff) : this.$emit('diff', {
        ...telemetry
      })
      if (this.prevTelemetryTimeout) {
        clearTimeout(this.prevTelemetryTimeout)
      }
      this.prevTelemetryTimeout = setTimeout(() => {
        this.prevTelemetry = {
          ...telemetry
        }
        if (this.propHistoryFlag) {
          this.makeHistory(telemetry)
        }
        this.prevTelemetryTimeout = 0
      }, 1000)
    },
    telemetryProcessing(telemetry) {
      this.setFilteredTelemetry(telemetry)
      this.telemetryDiffHistoryProcessing(telemetry)
    }
  },
  watch: {
    device(device) {
      if (device.id) {
        if (device.id !== this.deviceId) {
          this.filteredTelemetry = {}
          this.unsubscribe()
          this.init(device)
          this.update()
          this.history = {}
          clearTimeout(this.prevTelemetryTimeout)
          this.prevTelemetry = {
            ...this.device.telemetry
          }
        }
      } else {
        this.clear()
        this.history = {}
        this.prevTelemetry = {}
      }
    },
    telemetry: {
      deep: true,
      handler(telemetry) {
        this.debouncedTelemetryProcessing(telemetry)
      }
    },
    search() {
      this.setFilteredTelemetry(this.telemetry)
    }
  },
  created() {
    this.debouncedTelemetryProcessing = debounce(this.telemetryProcessing, 500, {
      trailing: true
    })
    this.$store.registerModule(this.moduleName, telemetryVuexModule(this.$store, Vue))
    this.init(this.device)
    this.update()
  },
  beforeDestroy() {
    this.clear()
  },
  components: {
    VirtualList
  }
}
</script>

<style>
</style>
