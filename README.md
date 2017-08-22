# Z-Wave Generator

This a development tool that can be used to generate Z-Wave drivers for Homey (SDK1 and SDK2). Keep in mind, it does the heavy lifting, but it does not produce release-ready code. It is just meant to speed up the development process.

NOTE: this tool was created as a side project and might contain bugs.

## How to use it

### Install it
```bash
npm install -g https://github.com/athombv/zwave-generator
```

### Update products database (this might take a while), only necessary on first install
```bash
zwaveGenerator updateProducts
```

### Generate driver config and .js
```bash
zwaveGenerator generate --zwave-alliance-product-id 2336 --driver-id CO_Sensor --driver-class sensor --capabilities measure_temperature,measure_battery,alarm_co,alarm_heat
```

### Help
```bash
zwaveGenerator --help
```
