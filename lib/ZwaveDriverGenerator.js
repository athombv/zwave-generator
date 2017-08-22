'use strict';

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const request = require('request');
const exec = require('child_process').exec;
const beautify = require('js-beautify').js_beautify;

const util = require('./util.js');
const stringify = require('./stringify');
const commonCommandClasses = require('./commonCommandClasses');

const zwaveAllianceProductsURL = 'http://products.z-wavealliance.org/Products/';

class ZwaveDriver {

	constructor(options) {
		this.options = Object.assign({
			sdkVersion: 2,
			zwaveAllianceProductId: undefined,
			driverId: undefined,
			driverClass: undefined,
			capabilities: [],
			startGenerating: false,
		}, options);

		if (this.options.startGenerating) {
			this._generateConfigFile()
				.then(() => {
					this._generateDriverJS();
					console.log('Driver configuration and driver.js has been created for', this.options.driverId);
				})
				.catch(err => console.error(err.stack));
		}
	}

	_generateConfigFile() {
		return new Promise((resolve, reject) => {
			this._createDirs();
			this._fetchDataFromZwaveProxy()
				.then(manifest => resolve(manifest))
				.catch(err => reject(err));
		});
	}

	_createDirs() {

		console.log('Creating directories...');

		this.dir = '';
		if (!fs.existsSync(path.join(process.cwd(), 'app.json'))) {
			this.dir = 'out';
		}

		if (!fs.existsSync(path.join(process.cwd(), this.dir))) {
			fs.mkdirSync(path.join(process.cwd(), this.dir));
		}

		if (!fs.existsSync(path.join(process.cwd(), this.dir, 'config'))) {
			fs.mkdirSync(path.join(process.cwd(), this.dir, 'config'));
		}

		if (!fs.existsSync(path.join(process.cwd(), this.dir, 'config/drivers'))) {
			fs.mkdirSync(path.join(process.cwd(), this.dir, 'config/drivers'));
		}

		if (!fs.existsSync(path.join(process.cwd(), this.dir, 'drivers'))) {
			fs.mkdirSync(path.join(process.cwd(), this.dir, 'drivers'));
		}

		if (!fs.existsSync(path.join(process.cwd(), this.dir, `drivers/${this.options.driverId}`))) {
			fs.mkdirSync(path.join(process.cwd(), this.dir, `drivers/${this.options.driverId}`));
		}

		if (!fs.existsSync(path.join(process.cwd(), this.dir, `drivers/${this.options.driverId}/assets`))) {
			fs.mkdirSync(path.join(process.cwd(), this.dir, `drivers/${this.options.driverId}/assets`));
		}

		if (!fs.existsSync(path.join(process.cwd(), this.dir, `drivers/${this.options.driverId}/assets/images`))) {
			fs.mkdirSync(path.join(process.cwd(), this.dir, `drivers/${this.options.driverId}/assets/images`));
		}
	}

	// TODO download device image after parseDataFromZwaveProxy
	_fetchDataFromZwaveProxy() {

		console.log('Fetching data from Z-Wave Alliance...');

		return new Promise((resolve, reject) => {
			request(`${zwaveAllianceProductsURL}${this.options.zwaveAllianceProductId}/JSON`, (error, response, body) => {
				// request(`${zwaveProxyURL}?pid=${this.options.zwaveAllianceProductId}`, (error, response, body) => {
				if (error || response.statusCode !== 200) return reject(error || response.statusCode);
				console.log('Creating manifest....');
				this.manifest = this.generateDriverManifest(body, this.options.driverId, this.options.zwaveAllianceProductId, this.options.driverClass, this.options.capabilities);
				console.log('Downloading driver image...');
				if (this.manifest.zwave.hasOwnProperty('imageRemotePath') &&
					typeof this.manifest.zwave.imageRemotePath !== 'undefined') {
					this._downloadDriverImage();
				}
				fs.writeFileSync(path.join(process.cwd(), this.dir, `/config/drivers/${this.options.driverId}.json`), JSON.stringify(this.manifest, null, '\t'), 'utf-8');
				console.log(`Created ${path.join(process.cwd(), this.dir, `/config/drivers/${this.options.driverId}.json`)}`);
				return resolve(this.manifest);
			});
		});
	}

	_downloadDriverImage() {

		request(this.manifest.zwave.imageRemotePath)
			.pipe(fs.createWriteStream(
				path.join(
					process.cwd(),
					this.dir,
					`/drivers/${this.options.driverId}/assets/images/original.png`
				)
			).on('close', err => {
				if (err) return console.error(err.stack);

				// Create resized images
				sharp(path.join(
					process.cwd(),
					this.dir,
					`/drivers/${this.options.driverId}/assets/images/original.png`
				))
					.resize(500, 500)
					.toFile(path.join(
						process.cwd(),
						this.dir,
						`/drivers/${this.options.driverId}/assets/images/large.png`
					), err => {
						if (err) return console.error('Error resizing image', err);
					})
					.resize(75, 75)
					.toFile(path.join(
						process.cwd(),
						this.dir,
						`/drivers/${this.options.driverId}/assets/images/small.png`
					), err => {
						if (err) return console.error('Error resizing image', err);
					});
			}));
	}

	generateDriverManifest(body, driverId, productId, driverClass, capabilities) {
		let json;
		try {
			json = JSON.parse(body);
		} catch (err) {
			return new Error('Failed to parse data from Z-Wave Alliancey');
		}

		let manufacturerId = null;
		let productTypeId = null;

		try {
			manufacturerId = util.parseUnknownValue(json.ManufacturerId);
			productTypeId = util.parseUnknownValue(json.ProductTypeId);
			productId = util.parseUnknownValue(json.ProductId);
		} catch (err) {
			return new Error('Failed to parse device identifiers');
		}

		// Check if device has needed identifiers
		if (isNaN(manufacturerId) ||
			isNaN(productTypeId) ||
			isNaN(productId)) {
			return new Error('No valid device identifiers found');
		}

		// Construct driver manifest object
		const manifest = {
			id: driverId,
			class: driverClass,
			name: {
				en: json.Name,
			},
			capabilities,
			images: {
				large: `/drivers/${driverId}/assets/images/large.png`,
				small: `/drivers/${driverId}/assets/images/small.png`,
			},
			zwave: {
				manufacturerId: [manufacturerId],
				productTypeId: [productTypeId],
				productId: [productId],
				wakeUpInterval: 3600, // TODO random default value -> fetch from z-wave device
				learnmode: {
					instruction: {
						en: json.InclusionDescription,
					},
				},
				productDocumentation: json.ManualUrl,
				zwaveAllianceProductId: this.options.zwaveAllianceProductId,
				imageRemotePath: json.Image,
				associationGroups: [],
				associationGroupsOptions: {},
			},
		};

		// Get unlearnmode if defined
		if (json.hasOwnProperty('ExclusionDescription') &&
			typeof json.ExclusionDescription !== 'undefined' &&
			json.ExclusionDescription !== '') {

			manifest.zwave.unlearnmode = {
				instruction: {
					en: json.ExclusionDescription,
				},
			};
		}

		// Get associationGroups and associationGroupsOptions if defined
		if (json.hasOwnProperty('AssociationGroups') &&
			Array.isArray(json.AssociationGroups)) {

			json.AssociationGroups.forEach(associationGroup => {
				let associationGroupNumber;
				try {
					associationGroupNumber = parseInt(associationGroup.GroupNumber, 2);
				} catch (err) {
					return;
				}

				if (isNaN(associationGroupNumber)) return;

				manifest.zwave.associationGroups.push(associationGroupNumber);

				if (associationGroup.hasOwnProperty('Description')) {
					manifest.zwave.associationGroupsOptions[associationGroup.GroupNumber] = {
						hint: {
							en: associationGroup.Description,
						},
					};
				}
			});
		}

		// Get driver settings
		if (json.ConfigurationParameters
			&& Array.isArray(json.ConfigurationParameters)) {
			manifest.settings = [];

			console.log(this.options);
			json.ConfigurationParameters.forEach(configurationParameter => {

				const settingObj = {};
				settingObj.id = configurationParameter.ParameterNumber;
				settingObj.value = configurationParameter.DefaultValue;
				settingObj.label = {
					en: configurationParameter.Name,
				};
				settingObj.hint = {
					en: configurationParameter.Description,
				};

				if (this.options.sdkVersion === 2) {
					settingObj.zwave = {
						index: configurationParameter.ParameterNumber,
						size: configurationParameter.Size
					}
				} else {
					settingObj._size = configurationParameter.Size;
				}

				// guess type
				if (configurationParameter.ConfigurationParameterValues &&
					Array.isArray(configurationParameter.ConfigurationParameterValues) &&
					configurationParameter.ConfigurationParameterValues.length === 2 &&
					(configurationParameter.ConfigurationParameterValues[0].From === '0' || configurationParameter.ConfigurationParameterValues[0].From === '1') &&
					(configurationParameter.ConfigurationParameterValues[0].To === '0' || configurationParameter.ConfigurationParameterValues[0].To === '1') &&
					(configurationParameter.ConfigurationParameterValues[0].From === '0' || configurationParameter.ConfigurationParameterValues[0].From === '1') &&
					(configurationParameter.ConfigurationParameterValues[0].To === '0' || configurationParameter.ConfigurationParameterValues[0].To === '1')
				) {
					settingObj.type = 'checkbox';

					if (settingObj.value === 0) {
						settingObj.value = false;
					} else {
						settingObj.value = true;
					}
				} else if (configurationParameter.ConfigurationParameterValues &&
					Array.isArray(configurationParameter.ConfigurationParameterValues) &&
					configurationParameter.ConfigurationParameterValues.length >= 3) {

					// Probably dropdown
					const dropdownOptions = [];
					configurationParameter.ConfigurationParameterValues.forEach(setting => {
						dropdownOptions.push({
							id: setting.From.toString() || setting.To.toString(),
							label: {
								en: setting.Description,
							},
						});
					});
					settingObj.values = dropdownOptions;
					settingObj.type = 'dropdown';
					settingObj.value = settingObj.value.toString();

				} else {
					settingObj.attr = {};
					if (configurationParameter.ConfigurationParameterValues[0].hasOwnProperty('From')) { settingObj.attr.min = configurationParameter.ConfigurationParameterValues[0].From; }
					if (configurationParameter.ConfigurationParameterValues[0].hasOwnProperty('To')) { settingObj.attr.max = configurationParameter.ConfigurationParameterValues[0].To; }


					// Determine if values are signed or not: https://msdn.microsoft.com/en-us/library/s3f49ktz.aspx
					// size is one, and max is larger than 127 -> unsigned
					if ((configurationParameter.Size === 1 && settingObj.attr.max > 127 && settingObj.attr.max < 255) ||
						(configurationParameter.Size === 2 && settingObj.attr.max > 32767 && settingObj.attr.max < 65535) ||
						(configurationParameter.Size === 4 && settingObj.attr.max > 2147483647 && settingObj.attr.max < 4294967295)) {
						settingObj.signed = false;
					}

					settingObj.type = 'number';
				}

				manifest.settings.push(settingObj);
			});
		}

		return manifest;
	}

	_generateDriverJS() {

		if (this.options.sdkVersion === 2) return this._generateSDK2DriverJS();
		return this._generateSDK1DriverJS();
	}

	_generateSDK2DriverJS() {
		console.log(`Generating ${path.join(process.cwd(), `drivers/${this.manifest.id}/driver.js`)} ...`);
		const capabilities = {};
		let capabilityJS = ``;
		this.manifest.capabilities.forEach(capability => {
			let availableDefaultCommandClasses = [];
			try {
				availableDefaultCommandClasses = fs.readdirSync(path.join(
					__dirname,
					'../',
					`node_modules/homey-meshdriver/lib/zwave/system/capabilities/${capability}`
				)).map(file => path.parse(file).name);
			} catch (err) {
				console.error(err)
				return;
			}
			console.log(capability)
			availableDefaultCommandClasses.forEach(availableDefaultCommandClass => {
				capabilityJS = capabilityJS + `\n\t\tthis.registerCapability('${capability}', '${availableDefaultCommandClass}');`
			})
		});

		const deviceJS = `${"'use strict';" +
			"\n\nconst ZwaveDevice = require('homey-meshdriver').ZwaveDevice;" +
			`\n\n// Documentation: ${this.manifest.zwave.productDocumentation}` + 
			"\n\nclass CustomZwaveDevice extends ZwaveDevice {" +
			"\n\tonMeshInit() {" +
			capabilityJS +
			"\n\t}" +
			"\n}" +
			"\nmodule.exports = CustomZwaveDevice;"}`;

		fs.writeFileSync(
			path.join(
				process.cwd(),
				this.dir,
				`drivers/${this.manifest.id}/device.js`
			),
			beautify(deviceJS, {
				indent_with_tabs: true,
			}),
			'utf-8'
		);

		exec(`eslint ${path.join(process.cwd(), this.dir, `drivers/${this.manifest.id}/device.js`)} --fix`);
	}


	_generateSDK1DriverJS() {
		console.log(`Generating ${path.join(process.cwd(), `drivers/${this.manifest.id}/driver.js`)} ...`);

		const capabilities = {};
		this.manifest.capabilities.forEach(capability => {
			capabilities[capability] = commonCommandClasses[capability];
		});

		const settingsObj = {};
		this.manifest.settings.forEach(setting => {
			settingsObj[setting.id] = { index: setting.id, size: setting._size };
		});

		const driverJS = `${"'use strict';" +
		"\n\nconst path = require('path');" +
		"\nconst ZwaveDriver = require('homey-zwavedriver');" +
		`\n\n// Documentation: ${this.manifest.zwave.productDocumentation}` +
		'\n\nmodule.exports = new ZwaveDriver(path.basename(__dirname), {' +
		'\ncapabilities: '}${
			stringify(capabilities)}, settings: ${
			stringify(settingsObj)
			}\n});`;

		fs.writeFileSync(
			path.join(
				process.cwd(),
				this.dir,
				`drivers/${this.manifest.id}/driver.js`
			),
			beautify(driverJS, {
				indent_with_tabs: true,
			}),
			'utf-8'
		);

		exec(`eslint ${path.join(process.cwd(), this.dir, `drivers/${this.manifest.id}/driver.js`)} --fix`);
	}
}

module.exports = ZwaveDriver;
