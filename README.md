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
|  delay | Number  | Telemetry update delay  |2000|
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
 import { QTelemetry, install as installTelemetryVuexModule } from 'qtelemetry'
 
 components: {
   QTelemetry
 },
 created () {
   installTelemetryVuexModule(this.$store, Vue)
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
      :device="device"
      :propHistoryFlag="true"
      :delay="3000"
      :search="filterString"
      :server="'https://flespi.io'"
      @click:item="clickItemHandler"
      @diff="diffHandler"
      :inverted="false"
      :color="'grey-8'"
    >
    </q-telemetry>
````

#Demo
Coming soon

## License
[MIT](https://github.com/flespi-software/QTelemetry/blob/master/LICENSE) license.