// nbbus.js (nbtong)
// 依赖 jQuery.ajax
// 依赖 CryptoJS.enc.Utf8, CryptoJS.enc.Base64, CryptoJS.DES, CryptoJS.mode.CBC, CryptoJS.pad.Pkcs7

window.NBBus = (function (namespace) {
    let self = namespace || {};
    /* Const */
    const Prefix = "https://wx.nbtong.cn/ningboWx";	
	/* Function */
	let decrypt = function(ciphertext, key) {
		let keyHex = CryptoJS.enc.Utf8.parse(key);
		let ivHex = CryptoJS.enc.Utf8.parse("12345678");
		let encryptedText = CryptoJS.enc.Base64.parse(ciphertext);
		let decrypted = CryptoJS.DES.decrypt({ ciphertext: encryptedText },
		                                     keyHex,
											 { iv: ivHex,
					                           mode: CryptoJS.mode.CBC,
					                           padding: CryptoJS.pad.Pkcs7});
		let decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
		return decryptedText;
	};
    /* Function:Promise */
	// jsonp->$.ajax函数，基于Promise
	let jsonp = function(settings) {
		let struct = {
			type: 'POST',
			dataType: 'jsonp',
			jsonp: 'jsonpcallback',
			async: false
		};
		return new Promise(function(resolve, reject) {
			Object.assign(struct, settings, {
				success: function(data) {
					if (data && data.length > 0) { resolve(data[0]); }
						else { reject(new Error('no return')); }
				},
				error: function(message) {
					reject(new Error(message));
				}
			});
			$.ajax(struct);
		});
	};
	// BusInfoService
	const urlBusInfoService = `${Prefix}/ubossInterface/mcallremoteservice.do`;
    // 查询公交线路(模糊查询)
	// -> {"method":"queryBusLines","BUS_LINE_NAME":"26","FLAG":"0","IS_LOGGED_1220":"true",
	//     "BUS_LINES":[{"BUS_LINE_ID":3236,"BUS_LINE_NAME":"26路"}]}
    self.queryBusLines = function(strBusLineName, intFlag = 0, settings) {
		let struct = {
			url: urlBusInfoService,
			data: {
				"PG_Data": JSON.stringify({
					"SERVICE_NAME": "BusInfoService",
    				"method": "queryBusLines",
    				"BUS_LINE_NAME": strBusLineName,
    				"FLAG": intFlag.toString()
				})
			}
		};
		if (typeof settings === 'object') { Object.assign(struct, settings); }
		return jsonp(struct);  // -> Promise
	};
	// 查询公交站点(模糊查询)
	// -> {"method":"queryBusStations","STATION_NAME":"长江路","IS_LOGGED_1220":"true",
	//     "STATIONS":[{"STATION_NAME":"云台山路长江路口"},{"STATION_NAME":"公交长江路站"},{"STATION_NAME":"长江路地铁站"}]}
	self.queryBusStations = function(strStationName, settings) {
		let struct = {
			url: urlBusInfoService,
			data: {
				"PG_Data": JSON.stringify({
					"SERVICE_NAME": "BusInfoService",
    				"method": "queryBusStations",
    				"STATION_NAME": strStationName
				})
			}
		};
		if (typeof settings === 'object') { Object.assign(struct, settings); }
		return jsonp(struct);  // -> Promise
	};
	// 基于公交站点查询公交线路(精确查询)
	// -> {"method":"queryBusLinesByStationName","STATION_NAME":"云台山路长江路口","IS_LOGGED_1220":"true",
	//     "STATIONS":[{"BUS_LINE_ID":"88006","STRANK":"2","STATION_ID":"224560","START_STATION":"公交长江路站","DURA":-1,
	//     "BC_LINE_ID":"542","BC_STATION_ID":"10957","STATIONS":0,"BUS_LINE_NAME":"737路","STATION_NAME":"云台山路长江路口",
	//     "END_STATION":"新路东岙","FLAG":"1","BC_ID":"22337"},{"BUS_LINE_ID":"88006","STRANK":"12","DAY_TYPE":"1",
	//     "STATION_ID":"224560","START_STATION":"新路东岙","DURA":-1,"BC_LINE_ID":"542","BC_STATION_ID":"10957",
	//     "STATIONS":0,"BUS_LINE_NAME":"737路","STATION_NAME":"云台山路长江路口","END_STATION":"公交长江路站","FLAG":"2",
	//     "BC_ID":"22337"}]}
	let BusLinesByStationNameCache = {};
	self.queryBusLinesByStationName = function(strStationName, settings) {
		// check cache
		let code = strStationName;
		if (code in BusLinesByStationNameCache) {
			return new Promise(function(resolve, reject) {
				resolve(BusLinesByStationNameCache[code]);
			});
		}
		let struct = {
			url: urlBusInfoService,
			data: {
				"PG_Data": JSON.stringify({
					"SERVICE_NAME": "BusInfoService",
    				"method": "queryBusLinesByStationName",
    				"STATION_NAME": strStationName
				})
			}
		};
		if (typeof settings === 'object') { Object.assign(struct, settings); }

		return jsonp(struct).then(function(resp) {
			// save to cache
			BusLinesByStationNameCache[code] = resp;
			return resp;
		});  // -> Promise
	};
	// 获得密钥
	// -> {"SUCCESS":"true","method":"getDESKey","KEY":"nbt_ztesoft_!@#$%^&==","IS_LOGGED_1220":"true"}
	self.getDESKey = function(settings) {
		let struct = {
			url: urlBusInfoService,
			data: {
				"PG_Data": JSON.stringify({
					"SERVICE_NAME": "BusInfoService",
    				"method": "getDESKey"
				})
			}
		};
		if (typeof settings === 'object') { Object.assign(struct, settings); }
		return jsonp(struct);  // -> Promise
	};
	// 查询公交线路信息
	// -> {"method":"queryBusLineInfo2","BUS_LINE_ID":"88006","FLAG":"1","IS_LOGGED_1220":"true",
	//     "SUCCESS":"true","BUS_LINE_NAME":"737路","CRYPTOGRAPH":"<CRYPTOGRAPH>"}
	let BusInfo2Cache = {};
	self.queryBusLineInfo2 = function(intBusLineID, intFlag = 1, settings) {
		// check cache
		let code = intBusLineID.toString() + intFlag.toString();
		if (code in BusInfo2Cache) {
			return new Promise(function(resolve, reject) {
				resolve(BusInfo2Cache[code]);
			});
		}
		let struct = {
			url: urlBusInfoService,
			data: {
				"PG_Data": JSON.stringify({
					"SERVICE_NAME": "BusInfoService",
    				"method": "queryBusLineInfo2",
					"BUS_LINE_ID": intBusLineID.toString(),
    				"FLAG": intFlag.toString()
				})
			}
		};
		if (typeof settings === 'object') { Object.assign(struct, settings); }
		return jsonp(struct).then(function(resp) {
			// save to cache
			BusInfo2Cache[code] = resp;
			return resp;
		});  // -> Promise
	};
	// 获得公交线路车辆坐标
	// -> {"method":"getBusLineVehiclePos2","BUS_LINE_ID":"88006","BUS_LINE_NAME":"737路","IS_LOGGED_1220":"true",
	//     "SUCCESS":"true","CRYPTOGRAPH":"<CRYPTOGRAPH>"}
	self.getBusLineVehiclePos2 = function(intBusLineID, strBusLineName, intFlag = 1, settings) {
		let struct = {
			url: urlBusInfoService,
			data: {
				"PG_Data": JSON.stringify({
					"SERVICE_NAME": "BusInfoService",
    				"method": "getBusLineVehiclePos2",
					"BUS_LINE_ID": intBusLineID.toString(),
					"BUS_LINE_NAME": strBusLineName,
    				"FLAG": intFlag.toString()
				})
			}
		};
		if (typeof settings === 'object') { Object.assign(struct, settings); }
		return jsonp(struct);  // -> Promise
	};
	// decrypt CRYPTOGRAPH to JSON
	self.parseCryptoGraph = function(strCryptoGraph, strKey) {
		let decryptedText = decrypt(strCryptoGraph, strKey);
		return JSON.parse(decryptedText);
	};

	/* Extend */
	let CryptoGraphKey = ['', 0];  // ['<key>', <timestamp>], 密钥环
	let CryptoGraphKeyInterval = 5 * 60 * 1000 // sec, 更新周期
	/* Extend:Function:Promise */
	// 更新CryptoGraphKey
	self.updateCryptoGraphKey = function() {
		return self.getDESKey().then(function(resp) {
			if (resp.SUCCESS === 'true') {
				CryptoGraphKey = [resp.KEY, (new Date()).getTime()];
			}
		});  // -> Promise
	};
	// 查询公交线路信息(解码)
	// -> {"BUS_LINE":{"BUS_LINE_ID":"88006","STATIONS":[{"GEO_LAT":"29.891397","STRANK":"0","GEO_LON":"121.83938",
	//     "STATION_ID":"165939","STATION_NAME":"公交长江路站","BC_STATION_ID":"10346","BC_ID":"22337"}, ...,
	//     {"GEO_LAT":"0","STRANK":"13","GEO_LON":"0","STATION_ID":"224559","STATION_NAME":"新路东岙",
	//     "BC_STATION_ID":"10954","BC_ID":"22337"}],"BUS_LINE_NAME":"737路","START_STATION":"公交长江路站",
	//     "BC_LINE_ID":"542","END_STATION":"新路东岙","END_TIME":"17:20","START_TIME":"06:30","FLAG":"1","BC_ID":"22337"}}
	// cache
	let BusInfo2DecryptedCache = {};
	self.queryBusLineInfo2Decrypted = function(intBusLineID, intFlag = 1, settings) {
		// check cache
		let code = intBusLineID.toString() + intFlag.toString();
		if (code in BusInfo2DecryptedCache) {
			return new Promise(function(resolve, reject) {
				resolve(BusInfo2DecryptedCache[code]);
			});
		}
		// update CryptoGraphKey
		let flow = null;
		if ((new Date()).getTime() - CryptoGraphKey[1] > CryptoGraphKeyInterval) {
			flow = self.updateCryptoGraphKey();
		}
		if (flow != null) {
			flow = flow.then(function() { return self.queryBusLineInfo2(intBusLineID, intFlag, settings); })
		} else {
			flow = self.queryBusLineInfo2(intBusLineID, intFlag, settings);
		}
		return flow.then(function(resp) {
			if (resp.SUCCESS === 'true' && resp.CRYPTOGRAPH != '') {
				let CryptoGraph = self.parseCryptoGraph(resp.CRYPTOGRAPH, CryptoGraphKey[0]);
				Object.assign(resp, CryptoGraph);
				// save to cache
				BusInfo2DecryptedCache[code] = resp;
			}
			return resp;
		})  // -> Promise
	};
	// 获得公交线路车辆坐标(解码)
	// -> {"VEHICLE_POS":[{"TIME":1587612422000,"STRANK":13,"CAR_ID":4560,"STATION_NAME":"北仑人民医院北",
	//     "CUR_STATION_ID":224560,"FLAG":"2","POSITION":0,"TIMEN":1587612422000}]}
	self.getBusLineVehiclePos2Decrypted = function(intBusLineID, strBusLineName, intFlag = 1, settings) {
		// update CryptoGraphKey
		let flow = null;
		if ((new Date()).getTime() - CryptoGraphKey[1] > CryptoGraphKeyInterval) {
			flow = self.updateCryptoGraphKey();
		}
		if (flow != null) {
			flow = flow.then(function() { return self.getBusLineVehiclePos2(intBusLineID, strBusLineName, intFlag, settings); })
		} else {
			flow = self.getBusLineVehiclePos2(intBusLineID, strBusLineName, intFlag, settings);
		}
		return flow.then(function(resp) {
			if (resp.SUCCESS === 'true' && resp.CRYPTOGRAPH != '') {
				let CryptoGraph = self.parseCryptoGraph(resp.CRYPTOGRAPH, CryptoGraphKey[0]);
				Object.assign(resp, CryptoGraph);
			}
			return resp;
		})  // -> Promise
	};

	return self;
})(window.NBBus);
