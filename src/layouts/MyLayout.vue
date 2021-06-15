<template>
  <q-layout ref="layout" view="hHh LpR lFf">
    <q-header>
      <q-toolbar class="bg-grey-9">
        <q-btn flat @click="layout.left = !layout.left">
          <q-icon name="menu" />
        </q-btn>
        <q-toolbar-title>
          Telemetry Viewer <sup>{{version}}</sup>
        </q-toolbar-title>
        <q-input :style="{maxWidth: searchWidth}" @focus="searchFocusHandler" @blur="searchBlurHandler" v-if="Object.keys(devices).length && token && !offline" type="text" v-model="search" color="white" dark>
          <q-icon slot="prepend" name="mdi-magnify" color="white"/>
        </q-input>
        <q-btn v-if="errors.length && token" @click="clearNotificationCounter" small flat round size="md" icon="notifications" class="floated notifications">
          <q-chip v-if="newNotificationCounter" floating color="red">{{newNotificationCounter}}</q-chip>
          <q-menu fit ref="popoverError">
            <q-list no-border style="max-height: 200px" link separator class="scroll">
              <q-item
                v-for="(error, index) in errors"
                :key="index"
                style="cursor: default"
              >
                <q-item-section>
                  <q-item-label>{{error}}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>
    <q-drawer side="left" v-model="layout.left" :content-class="{'bg-grey-9':true}" :content-style="{padding: '20px 16px 0'}" :breakpoint="576">
      <q-btn style="width: 100%" v-if="token" @click="LogoutHandler" inverted color="none">Logout</q-btn>
      <q-expansion-item group="left" :opened="!!token" class="text-white" v-if="Object.keys(devices).length && token" icon="developer_board" label="Parameters">
        <q-select v-if="Object.keys(devices).length && token" outlined dark color="white" :value="selectModel" @input="model => selectModel = model.value" :options="selectDeviceOptions">
          <q-icon slot="prepend" name="devices" />
        </q-select>
      </q-expansion-item>
      <q-expansion-item group="left" class="text-white" icon="settings" label="Settings">
        <div class="row">
          <q-input type="text" label="Host" v-model="server" dark color="white" class="full-width"/>
          <q-checkbox dark v-model="propHistoryFlag" label="History" class="text-grey uppercase full-width"/>
          <q-checkbox dark v-model="invertedTelemetry" label="Inverted" class="text-grey full-width"/>
          <q-select class="full-width" map-options emit-value outlined dark color="white" :value="telemetryColor" @input="model => telemetryColor = model.value" :options="telemetryColorOptions">
            <q-icon slot="prepend" name="color_lens" />
          </q-select>
        </div>
      </q-expansion-item>
    </q-drawer>
    <q-page-container>
      <q-page v-if="Object.keys(devices).length && token && !socketOffline">
        <q-telemetry
          :class="{'bg-grey-9': invertedTelemetry}" class="absolute-top-left absolute-bottom-right"
          :style="{transition: 'all .5s ease-in-out'}"
          :device="activeDevice"
          :propHistoryFlag="propHistoryFlag"
          :moduleName="moduleName"
          :search="search"
          :server="server"
          @click:item="clickItemHandler"
          @diff="diffHandler"
          :inverted="invertedTelemetry"
          :color="telemetryColor"
        />
      </q-page>
      <div v-else class="text-center text-uppercase text-grey-7" style="font-size: 3rem; padding-top: 30px">
        <q-btn @click="openWindow(`${$flespiServer}/login/#/providers`)" icon="mdi-account-circle" color="red-7" rounded label="login / register" size="lg"/>
      </div>
      <div v-if="!token && (offline || socketOffline)" class="text-center text-uppercase text-grey-7" style="font-size: 3rem; padding-top: 30px">
        <span v-if="!token && (!offline && !socketOffline)">Please, log in!</span>
        <span v-if="offline || socketOffline">Offline</span>
      </div>
    </q-page-container>
  </q-layout>
</template>

<script>
import telemetryVuexModule from '../store/telemetryVuexModule'
import { QSpinnerGears } from 'quasar'
import QTelemetry from '../components/QTelemetry'
import Vue from 'vue'
import { mapActions, mapMutations, mapState } from 'vuex'
import { version } from '../../package.json'

export default {
  name: 'index',
  components: {
    QTelemetry
  },
  data () {
    return {
      version,
      layout: {
        left: true
      },
      activeDeviceId: null,
      tokenModel: '',
      offlineIntervalId: 0,
      server: 'https://flespi.io',
      delay: 3,
      propHistoryFlag: true,
      search: '',
      invertedTelemetry: false,
      telemetryColor: '',
      searchWidth: '40px',
      stopHandler: () => {},
      moduleName: 'telemetry_container',
      telemetryColorOptions: [
        {
          label: 'Default',
          value: ''
        },
        {
          label: 'Dark',
          value: 'grey-9'
        },
        {
          label: 'White',
          value: 'white'
        },
        {
          label: 'Red',
          value: 'red'
        }
      ]
    }
  },
  computed: {
    ...mapState({
      token: (state) => state.token,
      devices: (state) => { if (state.hasDevicesInit) { return state.devices } return {} },
      hasDevicesInit: state => state.hasDevicesInit,
      offline (state) {
        if (state.offline) {
          this.$q.loading.show({
            spinner: QSpinnerGears,
            message: 'Waiting for connection',
            messageColor: 'white',
            spinnerSize: 250,
            spinnerColor: 'white'
          })
        } else {
          this.checkHasToken()
          this.$q.loading.hide()
        }
        return state.offline
      },
      errors: state => state.errors,
      socketOffline: state => state.socketOffline,
      newNotificationCounter: state => state.newNotificationCounter
    }),
    selectDeviceOptions () {
      return Object.keys(this.devices).map(id => ({
        label: this.devices[id].name || `#${id}`,
        value: id
      }))
    },
    selectModel: {
      get () {
        const ids = Object.keys(this.devices)
        if (ids.length) {
          if (!this.activeDeviceId || !ids.includes(this.activeDeviceId)) {
            this.init()
          }
          return this.activeDeviceId
        }
        return '-1'
      },
      set (id) {
        this.$q.localStorage.set('activeDeviceId', id)
        this.activeDeviceId = id
      }
    },
    activeDevice () {
      return this.devices[parseInt(this.activeDeviceId)]
    }
  },
  methods: {
    ...mapMutations([
      'setToken',
      'clearToken',
      'setDevicesInit',
      'unsetDevicesInit',
      'reqFailed',
      'addError',
      'clearNotificationCounter',
      'clearErrors'
    ]),
    ...mapActions([
      'getDevices',
      'checkConnection'
    ]),
    logIn () {
      this.$store.commit('setToken', this.tokenModel)
    },
    init () {
      const activeIdFroLocalStorage = this.$q.localStorage.getItem('activeDeviceId')
      const ids = Object.keys(this.devices)
      if (activeIdFroLocalStorage && Object.keys(this.devices).includes(activeIdFroLocalStorage)) {
        this.activeDeviceId = activeIdFroLocalStorage
        return activeIdFroLocalStorage
      } else {
        this.activeDeviceId = ids[0].toString()
        return ids[0].toString()
      }
    },
    clickItemHandler ({ deviceId }) {
      // id of active device
    },
    diffHandler (diff) {
      // difference in telemetry
    },
    searchFocusHandler () {
      this.searchWidth = '80%'
    },
    searchBlurHandler () {
      this.searchWidth = '40px'
    },
    LogoutHandler () {
      if (this.stopHandler) {
        this.stopHandler()
      }
      this.clearToken()
      this.unsetDevicesInit()
      this.getTokenListen()
    },
    autoLogin () {
      this.$store.commit('setToken', this.$route.params.token)
      setTimeout(() => {
        this.$router.push('/')
      }, 1000)
    },
    checkHasToken () {
      const sessionStorageToken = this.$q.sessionStorage.getItem('currentToken')
      if (this.$route.params && this.$route.params.token) {
        this.tokenModel = this.$route.params.token
        this.autoLogin()
      } else if (sessionStorageToken) {
        this.tokenModel = sessionStorageToken
        this.logIn()
      } else { this.getTokenListen() }
    },
    getTokenListen () {
      if (!this.token) {
        let tokenHandler = (event) => {
          if (typeof event.data === 'string' && ~event.data.indexOf('FlespiToken')) {
            this.tokenModel = event.data
            this.logIn()
            window.removeEventListener('message', tokenHandler)
          }
        }
        window.addEventListener('message', tokenHandler)
      }
    },
    openWindow (url, title) {
      title = title || 'auth'
      let w = 500, h = 600
      let dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : screen.left
      let dualScreenTop = window.screenTop !== undefined ? window.screenTop : screen.top

      let width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width
      let height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height

      let left = ((width / 2) - (w / 2)) + dualScreenLeft
      let top = ((height / 2) - (h / 2)) + dualScreenTop
      let newWindow = window.open(url, title, 'toolbar=no,location=no,status=yes,resizable=yes,scrollbars=yes, width=' + w + ', height=' + h + ', top=' + top + ', left=' + left)

      // Puts focus on the newWindow
      if (window.focus) {
        newWindow.focus()
      }
    }
  },
  watch: {
    token (token, prevToken) {
      // let connectHandler = () => {
      //   this.getDevices(this.server)
      //     .then(stopHandler => { this.stopHandler = stopHandler })
      //   Vue.connector.socket.off('connect', connectHandler)
      // }
      if (token && !this.hasDevicesInit) {
        this.getDevices(this.server)
          .then(stopHandler => { this.stopHandler = stopHandler })
      }
    },
    $route (val) {
      if (val.params && val.params.token) {
        this.autoLogin()
      }
    }
  },
  created () {
    this.$store.registerModule(this.moduleName, telemetryVuexModule(this.$store, Vue))
    this.checkHasToken()
    this.offlineIntervalId = setInterval(this.checkConnection, 5000)
    Vue.connector.socket.on('offline', () => {
      this.$store.commit('setSocketOffline', true)
    })
    Vue.connector.socket.on('connect', () => {
      this.$store.commit('setSocketOffline', false)
    })
  }
}
</script>

<style lang="stylus">
  .layout-aside-left
    .q-item-side
      color white
</style>
