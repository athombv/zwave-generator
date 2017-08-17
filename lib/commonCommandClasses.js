'use strict';

module.exports = {
	onoff: [{
		command_class: 'COMMAND_CLASS_SWITCH_BINARY',
		command_get: 'SWITCH_BINARY_GET',
		command_set: 'SWITCH_BINARY_SET',
		command_set_parser: value => ({
			'Switch Value': (value) ? 'on/enable' : 'off/disable',
		}),
		command_report: 'SWITCH_BINARY_REPORT',
		command_report_parser: report => {
			if (report && report.hasOwnProperty('Value')) {
				if (report.Value === 'on/enable') return true;
				else if (report.Value === 'off/disable') return false;
			}
			return null;
		},
	}, {
		command_class: 'COMMAND_CLASS_BASIC',
		command_report: 'BASIC_SET',
		command_report_parser: report => {
			if (report && report.hasOwnProperty('Value')) return report.Value === 255;
			return null;
		},
	}],
	dim: {
		command_class: 'COMMAND_CLASS_SWITCH_MULTILEVEL',
		command_get: 'SWITCH_MULTILEVEL_GET',
		command_set: 'SWITCH_MULTILEVEL_SET',
		command_set_parser: value => ({
			Value: Math.round(value * 99),
			'Dimming Duration': 255,
		}),
		command_report: 'SWITCH_MULTILEVEL_REPORT',
		command_report_parser: report => {
			if (report && report.hasOwnProperty('Value (Raw)')) {
				if (report['Value (Raw)'][0] === 255) return 1;
				return report['Value (Raw)'][0] / 99;
			}
			return null;
		},
	},
	alarm_battery: {
		command_class: 'COMMAND_CLASS_BATTERY',
		command_get: 'BATTERY_GET',
		command_report: 'BATTERY_REPORT',
		command_report_parser: report => {
			if (report && report.hasOwnProperty('Battery Level')) {
				return report['Battery Level'] === 'battery low warning';
			}
			return null;
		},
	},
	alarm_contact: [
		{
			command_class: 'COMMAND_CLASS_SENSOR_BINARY',
			command_get: 'SENSOR_BINARY_GET',
			command_report: 'SENSOR_BINARY_REPORT',
			command_report_parser: report => {
				if (report && report.hasOwnProperty('Sensor Value')) {
					return report['Sensor Value'] === 'detected an event';
				}
				return null;
			},
		}, {
			command_class: 'COMMAND_CLASS_BASIC',
			command_report: 'BASIC_SET',
			command_report_parser: report => {
				if (report && report.hasOwnProperty('Value')) {
					return report.Value === 255;
				}
				return null;
			},
		},
	],
	alarm_water: {
		command_class: 'COMMAND_CLASS_SENSOR_ALARM',
		command_get: 'SENSOR_ALARM_GET',
		command_get_parser: () => ({
			'Sensor Type': 'Water Leak Alarm',
		}),
		command_report: 'SENSOR_ALARM_REPORT',
		command_report_parser: report => {
			if (report) {
				if (report.hasOwnProperty('Sensor Type')) {
					return report['Sensor Type'] !== 'Water Leak Alarm';
				} else if (report.hasOwnProperty('Sensor State')) {
					return report['Sensor State'] === 'alarm';
				}
			}
			return null;
		},
	},
	alarm_tamper: {
		command_class: 'COMMAND_CLASS_SENSOR_ALARM',
		command_get: 'SENSOR_ALARM_GET',
		command_get_parser: () => ({
			'Sensor Type': 'General Purpose Alarm',
		}),
		command_report: 'SENSOR_ALARM_REPORT',
		command_report_parser: report => {
			if (report) {
				if (report.hasOwnProperty('Sensor Type')) {
					return report['Sensor Type'] !== 'General Purpose Alarm';
				} else if (report.hasOwnProperty('Sensor State')) {
					return report['Sensor State'] === 'alarm';
				}
			}
			return null;
		},
	},
	alarm_motion: {
		command_class: 'COMMAND_CLASS_SENSOR_BINARY',
		command_get: 'SENSOR_BINARY_GET',
		command_report: 'SENSOR_BINARY_REPORT',
		command_report_parser: report => {
			if (report && report.hasOwnProperty('Sensor Value')) {
				return report['Sensor Value'] === 'detected an event';
			}
			return null;
		},
	},
	alarm_smoke: {
		command_class: 'COMMAND_CLASS_SENSOR_ALARM',
		command_get: 'SENSOR_ALARM_GET',
		command_get_parser: () => ({
			'Sensor Type': 'Smoke Alarm',
		}),
		command_report: 'SENSOR_ALARM_REPORT',
		command_report_parser: report => {
			if (report && report.hasOwnProperty('Sensor Type') && report['Sensor Type'] === 'Smoke Alarm') {
				return report['Sensor State'] === 'alarm';
			}
			return null;
		},
	},

	alarm_heat: {
		command_class: 'COMMAND_CLASS_SENSOR_ALARM',
		command_get: 'SENSOR_ALARM_GET',
		command_get_parser: () => ({
			'Sensor Type': 'Heat Alarm',
		}),
		command_report: 'SENSOR_ALARM_REPORT',
		command_report_parser: report => {
			if (report && report.hasOwnProperty('Sensor Type') && report['Sensor Type'] === 'Heat Alarm') {
				return report['Sensor State'] === 'alarm';
			}
			return null;
		},
	},
	measure_battery: {
		command_class: 'COMMAND_CLASS_BATTERY',
		command_get: 'BATTERY_GET',
		command_report: 'BATTERY_REPORT',
		command_report_parser: report => {
			if (report['Battery Level'] === 'battery low warning') return 1;
			if (report.hasOwnProperty('Battery Level (Raw)')) return report['Battery Level (Raw)'][0];
			return null;
		},
	},
	measure_temperature: {
		command_class: 'COMMAND_CLASS_SENSOR_MULTILEVEL',
		command_report: 'SENSOR_MULTILEVEL_REPORT',
		command_report_parser: report => {
			if (report.hasOwnProperty('Sensor Type') && report.hasOwnProperty('Sensor Value (Parsed)')) {
				if (report['Sensor Type'] === 'Temperature (version 1)') return report['Sensor Value (Parsed)'];
			}
			return null;
		},

	},
	measure_luminance: {
		command_class: 'COMMAND_CLASS_SENSOR_MULTILEVEL',
		command_report: 'SENSOR_MULTILEVEL_REPORT',
		command_report_parser: report => {
			if (report.hasOwnProperty('Sensor Type') && report.hasOwnProperty('Sensor Value (Parsed)')) {
				if (report['Sensor Type'] === 'Luminance (version 1)') return report['Sensor Value (Parsed)'];
			}
			return null;
		},
	},
	measure_humidity: {
		command_class: 'COMMAND_CLASS_SENSOR_MULTILEVEL',
		command_report: 'SENSOR_MULTILEVEL_REPORT',
		command_report_parser: report => {
			if (report.hasOwnProperty('Sensor Type') && report.hasOwnProperty('Sensor Value (Parsed)')) {
				if (report['Sensor Type'] === 'Relative humidity (version 2)') return report['Sensor Value (Parsed)'];
			}
			return null;
		},
	},
	measure_ultraviolet: {
		command_class: 'COMMAND_CLASS_SENSOR_MULTILEVEL',
		command_get_parser: () => ({
			'Sensor Type': 'Ultraviolet (v5)',
			Properties1: {
				Scale: 0,
			},
		}),
		command_report: 'SENSOR_MULTILEVEL_REPORT',
		command_report_parser: report => {
			if (report.hasOwnProperty('Sensor Type') && report.hasOwnProperty('Sensor Value (Parsed)')) {
				if (report['Sensor Type'] === 'Ultraviolet (v5)') return report['Sensor Value (Parsed)'];
			}
			return null;
		},
	},
	measure_power: {
		command_class: 'COMMAND_CLASS_METER',
		command_get: 'METER_GET',
		command_get_parser: () => ({
			'Sensor Type': 'Electric meter',
			Properties1: {
				Scale: 0,
			},
		}),
		command_report: 'METER_REPORT',
		command_report_parser: report => {
			if (report.hasOwnProperty('Properties2') &&
				report.Properties2.hasOwnProperty('Scale bits 10') &&
				report.Properties2['Scale bits 10'] === 2) {
				return report['Meter Value (Parsed)'];
			}
			return null;
		},
	},
	meter_power: {
		command_class: 'COMMAND_CLASS_METER',
		command_get: 'METER_GET',
		command_get_parser: () => ({
			'Sensor Type': 'Electric meter',
			Properties1: {
				Scale: 2,
			},
		}),
		command_report: 'METER_REPORT',
		command_report_parser: report => {
			if (report.hasOwnProperty('Properties2') &&
				report.Properties2.hasOwnProperty('Scale bits 10') &&
				report.Properties2['Scale bits 10'] === 0) {
				return report['Meter Value (Parsed)'];
			}
			return null;
		},
	},
	target_temperature: {
		command_class: 'COMMAND_CLASS_THERMOSTAT_SETPOINT',
		command_get: 'THERMOSTAT_SETPOINT_GET',
		command_get_parser: ({
			Level: {
				'Setpoint Type': 'Heating 1',
			},
		}),
		command_set: 'THERMOSTAT_SETPOINT_SET',
		command_set_parser: value => {

			// Create value buffer
			const bufferValue = new Buffer(2);
			bufferValue.writeUInt16BE((Math.round(value * 2) / 2 * 10).toFixed(0));

			return {
				Level: {
					'Setpoint Type': 'Heating 1',
				},
				Level2: {
					Size: 2,
					Scale: 0,
					Precision: 1,
				},
				Value: bufferValue,
			};
		},
		command_report: 'THERMOSTAT_SETPOINT_REPORT',
		command_report_parser: report => {
			if (report && report.hasOwnProperty('Level2')
				&& report.Level2.hasOwnProperty('Scale')
				&& report.Level2.hasOwnProperty('Precision')
				&& report.Level2.Scale === 0
				&& typeof report.Level2.Size !== 'undefined') {

				let readValue;
				try {
					readValue = report.Value.readUIntBE(0, report.Level2.Size);
				} catch (err) {
					return null;
				}

				if (typeof readValue !== 'undefined') {
					return readValue / Math.pow(10, report.Level2.Precision);
				}
				return null;
			}
			return null;
		},
	},
};
