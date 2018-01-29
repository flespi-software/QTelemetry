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
|  server |  String | Telemetry update server  |''|
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

## Example
In App.vue:
```javascript
 import { QTelemetry, module as telemetryVuexModule } from 'qtelemetry'
 
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
      :server="server"
      @click:item="clickItemHandler"
      @diff="diffHandler"
      :inverted="invertedTelemetry"
      :color="telemetryColor"
    >
    </q-telemetry>
````

#Demo
Coming soon

## License
[MIT](https://github.com/flespi-software/QTelemetry/blob/master/LICENSE) license.