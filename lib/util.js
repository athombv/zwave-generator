'use strict';

function parseValueAsInteger(value, radix) {
	let result;
	try {
		result = parseInt(value, radix);
	} catch (err) {
		console.error(err.stack);
	}
	return result;
}

function parseUnknownValue(value) {
	let result = value;

	result = parseValueAsInteger(result, 16);

	if (isNaN(result)) {
		result = parseValueAsInteger(result, 10);
	}

	if (isNaN(result)) {
		result = parseValueAsInteger(result, 2);
	}

	if (isNaN(result)) return null;
	return result;
}

module.exports.parseValueAsInteger = parseValueAsInteger;
module.exports.parseUnknownValue = parseUnknownValue;

