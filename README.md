# QTelemetry

> Simple Quasar component that displays device telemetry from flespi.io

## Install
````bash
$ npm install git+https://github.com/flespi-software/QTelemetry.git --save
````

## Props
| Name  | Type | Description  |Default |
|---|---|---|---|
| device  | Object  | A device that needs to track telemetry  | *Required* |
|  moduleName | String  | Telemetry vuex module name |telemetry|
|  propHistoryFlag | Boolean  |  History display flag |false|
|  search | String  | The search string for telemetry parameters  |''|
|  color | String  |  Text color |''|
| inverted |  Boolean |  Inverted mode. Color is applied to background instead. |false|

## Events
| Name  |  Description  | Payload |
|---|---|---|
|click:item| Handling click by property of telemetry| {device_id}|
|diff|Handling difference of telemetry|{Difference with prev state of telemetry or current telemetry in first time}|

## Requirements:

- [Node.js](https://nodejs.org/en/) (>=6.x)
- npm version 3+ and [Git](https://git-scm.com/).
- Register Vue plugin from flespi-io-js with MQTT version protocol 5

## Example
Add in quasar.conf.js
```js
extras: [
    'mdi'
]
framework: {
      components: [
          'QIcon',
          'QList',
          'QItem',
          'QItemSection',
          'QItemLabel',
          'QSpinnerGears',
          'QTooltip',
          'QMenu'
      ],
      plugins: [
          'Notify'
      ]
}
```
In App.vue:
```javascript
 import { QTelemetry, telemetryVuexModule} from 'qtelemetry'

 components: {
   QTelemetry
 },
 created () {
   this.$store.registerModule(this.moduleName, telemetryVuexModule(this.$store, Vue))
 }
```
````javascript
device = {
    "id":1,
    "ident":"ident:ident",
    "messages_ttl":31536000,
    "name":"Device",
    "phone":"+111291234567",
    "telemetry":{...}
}

````
````vue
<q-telemetry
      v-if="Object.keys(devices).length && token"
      :device="activeDevice"
      :propHistoryFlag="propHistoryFlag"
      :moduleName="moduleName"
      :search="search"
      @click:item="clickItemHandler"
      @diff="diffHandler"
      :inverted="invertedTelemetry"
      :color="telemetryColor"
    >
    </q-telemetry>
````

#Demo
Check it out [live](https://flespi-software.github.io/QTelemetry)!

![Screenshot](/misc/screenshot.png?raw=true "Telemetry Viewer!")

## Build Setup

``` bash
# clone the repo
$ git clone https://github.com/flespi-software/QTelemetry.git telemetryviewer

# go into app's directory and install dependencies
$ cd telemetryviewer
$ npm install

# serve with hot reload at localhost:7006
$ npm run dev

# build for production with minification
$ npm run build

## License
[MIT](https://github.com/flespi-software/QTelemetry/blob/master/LICENSE) license.
