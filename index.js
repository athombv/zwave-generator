#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const _ = require('underscore');
const commander = require('commander');
const ZwaveDriverGenerator = require('./lib/ZwaveDriverGenerator');

commander
	.version(require(path.join(__dirname, 'package.json')))
	.option('--manufacturer-id <manufacturer-id>', 'Manufacturer ID')
	.option('--sdk-version <sdk-version>', 'SDK Version')
	.option('--product-type-id <product-type-id>', 'Product Type ID')
	.option('--product-id <product-id>', 'Product ID')
	.option('--zwave-alliance-product-id <zwave-alliance-product-id>', 'Z-Wave Alliance Product ID')
	.option('--driver-id <driver-id>', 'Driver ID')
	.option('--driver-class <driver-class>', 'Driver class')
	.option('--capabilities <capabilities>', 'Comma separated list of capabilities', value => value.split(','));

commander.command('generate')
	.description('generates a z-wave driver config and driver.js')
	.action(generate);

commander.command('updateProducts')
	.description('updates the product database')
	.action(() => require('./lib/downloadProductCatalogue'));

commander.parse(process.argv);

function generate() {

	try {
		commander.sdkVersion = parseInt(commander.sdkVersion, 10);
		if (isNaN(commander.sdkVersion)) commander.sdkVersion = 2;
	} catch (err) {
		return console.error('Failed to parse sdkVersion as integer');
	}

	try {
		commander.manufacturerId = parseInt(commander.manufacturerId, 10);
	} catch (err) {
		return console.error('Failed to parse manufacturerId as integer');
	}

	try {
		commander.productTypeId = parseInt(commander.productTypeId, 10);
	} catch (err) {
		return console.error('Failed to parse productTypeId as integer');
	}

	try {
		commander.productId = parseInt(commander.productId, 10);
	} catch (err) {
		return console.error('Failed to parse productId as integer');
	}

	if ((!commander.manufacturerId || !commander.productTypeId || !commander.productId) && !commander.zwaveAllianceProductId) {
		return console.error('Missing --zwave-alliance-product-id or missing ' +
			'--manufacturer-id, --product-type-id, --product-id');
	}

	if (!commander.zwaveAllianceProductId) {
		commander.zwaveAllianceProductId = findZwaveAllianceProductId();
	}

	try {
		commander.zwaveAllianceProductId = parseInt(commander.zwaveAllianceProductId, 10);
	} catch (err) {
		return console.error('Failed to parse zwaveAllianceProductId as integer');
	}

	return new ZwaveDriverGenerator({
		sdkVersion: commander.sdkVersion,
		zwaveAllianceProductId: commander.zwaveAllianceProductId,
		driverId: commander.driverId || 'driver_id_placeholder',
		driverClass: commander.driverClass || 'driver_class_placeholder',
		capabilities: commander.capabilities || [],
		startGenerating: true,
	});
}

function findZwaveAllianceProductId() {

	// If zwaveAllianceProductId is not provided, find it in configSummary.json
	if (!commander.zwaveAllianceProductId) {
		const file = fs.readFileSync(path.join(__dirname, 'products', 'configSummary.json'), 'utf8');

		let configSummary = null;
		try {
			configSummary = JSON.parse(file);
		} catch (err) {
			return console.error('Could not parse configSummary.json as JSOn');
		}

		const configObj = _.findWhere(configSummary, {
			productId: commander.productId,
			productTypeId: commander.productTypeId,
			manufacturerId: commander.manufacturerId,
		});

		if (!configObj) {
			return console.error(`Could not find device data in configSummary for productId ${commander.productId}, 
			productTypeId ${commander.productTypeId}, manufacturerId ${commander.manufacturerId}`);
		}

		return configObj.zwaveAllianceProductId;
	}
}
