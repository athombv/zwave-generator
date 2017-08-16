'use strict';

const fs = require('fs');
const path = require('path');
const request = require('request');
const async = require('async');
const ZwaveDriverGenerator = require('./ZwaveDriverGenerator');
const util = require('./util.js');

const productList = [];
const productsPath = path.join(__dirname, '../', 'products');

const q = async.queue((i, callback) => {
	request.get(`https://developers.athom.com/etc/zwaveproxy.php?pid=${i}`, (error, response, body) => {
		let json;
		try {
			json = JSON.parse(body);
		} catch (err) {
			console.error(`Failed to parse JSON for pid=${i}`);
			return callback();
		}

		console.log(json.FrequencyName);
		if (json.FrequencyName !== 'Europe') return callback();

		const productItem = {
			manufacturerId: util.parseUnknownValue(json.ManufacturerId),
			productTypeId: util.parseUnknownValue(json.ProductTypeId),
			productId: util.parseUnknownValue(json.ProductId),
			name: json.Name,
		};

		const zwaveDriverGenerator = new ZwaveDriverGenerator({
			zwaveAllianceProductId: i,
		});
		const manifest = zwaveDriverGenerator.generateDriverManifest(body);
		if (!manifest) return callback();
		console.log(productsPath);


		let outputPath;
		if (isNaN(productItem.manufacturerId) ||
			isNaN(productItem.productTypeId) ||
			isNaN(productItem.productId) ||
			productItem.manufacturerId === '' ||
			productItem.productTypeId === '' ||
			productItem.productId === '' || !productItem.manufacturerId || !productItem.productTypeId || !productItem.productId) {

			return callback();
		}

		if (!fs.existsSync(productsPath)) {
			fs.mkdirSync(productsPath);
		}
		if (!fs.existsSync(`${productsPath}/${productItem.manufacturerId}`)) {
			fs.mkdirSync(`${productsPath}/${productItem.manufacturerId}`);
		}
		if (!fs.existsSync(`${productsPath}/${productItem.manufacturerId}/${productItem.productTypeId}`)) {
			fs.mkdirSync(`${productsPath}/${productItem.manufacturerId}/${productItem.productTypeId}`);
		}
		if (!fs.existsSync(`${productsPath}/${productItem.manufacturerId}/${productItem.productTypeId}/${productItem.productId}`)) {
			fs.mkdirSync(`${productsPath}/${productItem.manufacturerId}/${productItem.productTypeId}/${productItem.productId}`);
		}

		outputPath = `${productsPath}/${productItem.manufacturerId}/${productItem.productTypeId}/${productItem.productId}/config.json`;
		if (fs.existsSync(outputPath)) {
			let j = 1;
			while (fs.existsSync(outputPath)) {
				outputPath = `${productsPath}/${productItem.manufacturerId}/${productItem.productTypeId}/${productItem.productId}/config-${j}.json`;
				j++;
			}
		}

		productItem.path = outputPath;
		productItem.zwaveAllianceProductId = i;

		productList.push(productItem);

		fs.writeFileSync(
			outputPath,
			JSON.stringify(manifest, null, '\t'), 'utf-8');

		console.log(`Created ${outputPath}`);

		callback();
	});
}, 25);

q.drain = function () {
	fs.writeFileSync(`${productsPath}/configSummary.json`, JSON.stringify(productList, null, '\t'), 'utf-8');
	console.log(`Created ${productsPath}/configSummary.json`);
	console.log('Finished downloading product catalogue');
};


for (let j = 0; j <= 9; j++) {
	for (let i = (j * 250); i < (j * 250) + 250; i++) {
		q.push(i, err => console.log(''));
	}
}
