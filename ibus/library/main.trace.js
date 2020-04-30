// main.js
// require: jQuery, Template

// main
(function(configure) {
    let interface = window[configure.interface] = window[configure.interface] || {};
    // ready
    $(document).ready(function() {
        interface.refresh();
        // auto refresh
        window.setInterval(function() {
            interface.refresh();
        }, 5000);
    });
    /* Date.property */
    Date.prototype.format = function(fmt) {
        var o = {
            "M+" : this.getMonth() + 1,                   //月份
            "d+" : this.getDate(),                        //日
            "h+" : this.getHours(),                       //小时
            "m+" : this.getMinutes(),                     //分
            "s+" : this.getSeconds(),                     //秒
            "q+" : Math.floor((this.getMonth() + 3) / 3), //季度
            "S"  : this.getMilliseconds()                 //毫秒
        };
        if (/(y+)/.test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
        }
        for (var k in o) {
            if (new RegExp("(" + k + ")").test(fmt)) {
                fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
            }
        }
        return fmt;
    };
    /* Interface */
    const selectorMessage = '#message';
    const selectorModal = '#modal';
    const selectorDisplay = '#display';
    const selectorTemplates = '#templates';
    // 初始化弹出模块
    interface.modal = function(template, parameters, ready) {
        Template.mount(selectorModal, template, ['title', 'body', 'footer'], parameters);
		if (ready) { ready(template); }
    };
    // 模糊查找公交车站
    interface.findStation = function(template) {
        let [input, result] = [`${selectorModal} [name="input"]`, `${selectorModal} [name="result"]`];
        let item = `${template} [name="item"]`;
        NBBus.queryBusStations($(input).val()).then(function(resp) {
			$(result).empty();
			if (resp.STATIONS) {
				for (let i = 0; i < resp.STATIONS.length; i++) {
					Template.append(result, item, true, {
                        'station-name': resp.STATIONS[i].STATION_NAME
                    });
				}
			}
		});
    };
    // 模糊查找公交线路
    interface.findLine = function(template) {
        let [input, result] = [`${selectorModal} [name="input"]`, `${selectorModal} [name="result"]`];
        let item = `${template} [name="item"]`;
		NBBus.queryBusLines($(input).val()).then(function(resp) {
			$(result).empty();
			if (resp.BUS_LINES) {
				for (let i = 0; i < resp.BUS_LINES.length; i++) {
					Template.append(result, item, true, {
                        'line-name': resp.BUS_LINES[i].BUS_LINE_NAME,
						'line-id': resp.BUS_LINES[i].BUS_LINE_ID
                    });
				}
			}
	    });
	};
    // 反向:查找线路下的所有车站
    interface.reverseLineStations = function(template) {
        let lineFlag = `${selectorModal} input[name="line-flag"]`;
        if ($(lineFlag).val() === '1') {
            $(lineFlag).val('2');
        } else {
            $(lineFlag).val('1');
        }
        interface.findLineStations(template);
    };
    // 查找线路下的所有车站
    interface.findLineStations = function(template) {
        let [lineID, lineFlag] = [`${selectorModal} input[name="line-id"]`, `${selectorModal} input[name="line-flag"]`];
        let result = `${selectorModal} [name="result"]`;
        let item = `${template} [name="item"]`;
		NBBus.queryBusLineInfo2Decrypted($(lineID).val(), $(lineFlag).val()).then(function(resp) {
			$(result).empty();
			if (resp.BUS_LINE.STATIONS) {
				for (let i = 0; i < resp.BUS_LINE.STATIONS.length; i++) {
					Template.append(result, item, true, {
						'station-name': resp.BUS_LINE.STATIONS[i].STATION_NAME,
                        'station-rank': resp.BUS_LINE.STATIONS[i].STRANK,
                    });
				}
			}
        });
    };
    // 添加车站
    interface.addStation = function(strStationName, template) {
        let match = $(`${selectorDisplay} [name="station"] input[code="${strStationName}"]`);
        if (match.length === 0) {
            Template.append(selectorDisplay, template, true, {
                'station-name': strStationName
            });
        } else  {
            match.parents('[name="station"]').fadeOut();
            match.parents('[name="station"]').fadeIn();
        }
    };
    // 查找车站下的所有线路
    interface.findStationLines = function(template) {
        let stationName = `${selectorModal} input[name="station-name"]`;
        let result = `${selectorModal} [name="result"]`;
        let item = `${template} [name="item"]`;
        NBBus.queryBusLinesByStationName($(stationName).val()).then(function(resp) {
			$(result).empty();
			if (resp.STATIONS) {
                let lines = [];
				for (let i = 0; i < resp.STATIONS.length; i++) {
                    let code = resp.STATIONS[i].BUS_LINE_ID + resp.STATIONS[i].FLAG;
                    if (lines.indexOf(code) === -1) {
                        lines.push(code);  // 去重
                        Template.append(result, item, true, {
                            'line-name': resp.STATIONS[i].BUS_LINE_NAME,
                            'line-id': resp.STATIONS[i].BUS_LINE_ID,
                            'line-flag': resp.STATIONS[i].FLAG,
                            'station-name': resp.STATIONS[i].STATION_NAME,
                            'station-id': resp.STATIONS[i].STATION_ID,
                            'station-rank': resp.STATIONS[i].STRANK,
                            'start-station-name':resp.STATIONS[i].START_STATION,
                            'end-station-name': resp.STATIONS[i].END_STATION
                        });
                    }
				}
			}
        });
    };        
    // 添加线路
    interface.addLine = function(strLineName, intLineID, intLineFlag, strStationName, templateLine, templateStation) {
        // find the station-card
        let matchStation = $(`${selectorDisplay} > [name="station"] input[code="${strStationName}"]`);
        if (matchStation.length === 0) {
            // new station-card
            if (templateStation) {
                interface.addStation(strStationName, templateStation);
            } else {
                window.alert(`车站:'${strStationName}'不存在, 请新增后操作`);
                return;
            }
            // add line
            interface.addLine(strLineName, intLineID, intLineFlag, strStationName, templateLine);
        } else {
            let lines = matchStation.parents('[name="station"]').find('[name="lines"]');
            let matchLine = lines.find(`[name="line"] input[code="${intLineID}${intLineFlag}"]`);
            if (matchLine.length === 0) {
                // query
                NBBus.queryBusLineInfo2Decrypted(intLineID, intLineFlag).then(function(resp) {
                    if (resp.BUS_LINE.STATIONS) {
                        // find station-id, station-rank
                        let intStationID, intStationRank;
                        for (let i = 0; i < resp.BUS_LINE.STATIONS.length; i++) {
                            if (resp.BUS_LINE.STATIONS[i].STATION_NAME === strStationName) {
                                intStationID = resp.BUS_LINE.STATIONS[i].STATION_ID;
                                intStationRank = resp.BUS_LINE.STATIONS[i].STRANK;
                            }
                        }
                        Template.append(lines, templateLine, true, {
                            'line-name': strLineName,
                            'line-id': intLineID,
                            'line-flag': intLineFlag,
                            'station-name': strStationName,
                            'station-id': intStationID,
                            'station-rank': intStationRank,
                            'start-station-name': resp.BUS_LINE.START_STATION,
                            'end-station-name': resp.BUS_LINE.END_STATION,
                            'start-time': resp.BUS_LINE.START_TIME,
                            'end-time': resp.BUS_LINE.END_TIME
                        });
                        // refresh
                        interface.refresh();
                    }
                });
            } else {
                matchLine.parents('[name="line"]').fadeOut();
                matchLine.parents('[name="line"]').fadeIn();
            }
        }
    };
    // 刷新
    interface.refresh = function() {
        let stations = $(`${selectorDisplay} > [name="station"]`);
        // time
        let now = new Date();
        let message;
        if (stations.length === 0) {
            message = '未跟踪';
        } else {
            message = now.format('hh:mm:ss');
        }
        Template.render($(selectorMessage), {message: message});
        // loop
        for (let i = 0; i < stations.length; i++) {
            let lines = $(stations[i]).find('[name="lines"] > [name="line"]');
            for (let j = 0; j < lines.length; j++) {
                let line = $(lines[j]);
                let strLineName = line.find('input[name="line-name"]').val();
                let intLineID= line.find('input[name="line-id"]').val();
                let intLineFlag = line.find('input[name="line-flag"]').val();
                let intStationRank= line.find('input[name="station-rank"]').val();
                NBBus.getBusLineVehiclePos2Decrypted(intLineID, strLineName, intLineFlag).then(function(resp) {
                    NBBus.queryBusLineInfo2Decrypted(intLineID, intLineFlag).then(function(resp2) {
                        let vehicleInfo = '';
                        let progressValue = '100';
                        console.log(resp);
                        if (typeof resp.VEHICLE_POS === 'undefined' || resp.VEHICLE_POS.length === 0) {
                            vehicleInfo = '无车辆信息';
                            if (resp2.BUS_LINE.START_TIME) {
                                vehicleInfo = `${vehicleInfo} <small>(运营时间: ${resp2.BUS_LINE.START_TIME} - ${resp2.BUS_LINE.END_TIME})</small>`;
                            }
                        } else {
                            // 获取最近的两辆车
                            let nextVehicle, nextVehicle2;
                            for (let v = 0; v < resp.VEHICLE_POS.length; v++) {
                                let vehicle = resp.VEHICLE_POS[v];
                                if ((parseInt(intStationRank) - vehicle.STRANK) >= 0) {  // 车辆比目标站小的保留
                                    if (typeof nextVehicle === 'undefined') {  // n1 不存在, 车辆 -> n1
                                        nextVehicle = vehicle;
                                    } else {  // n1 存在
                                        if (nextVehicle.STRANK <= vehicle.STRANK) {  // 车辆比 n1 更近, 车辆 -> n1, n1 -> n2
                                            nextVehicle2 = nextVehicle;
                                            nextVehicle = vehicle;
                                        } else {  // 车辆比 n1 远
                                            if (typeof nextVehicle2 === 'undefined') {  // n2 不存在, 车辆 -> n2
                                                nextVehicle2 = vehicle;
                                            } else {  // n2 存在
                                                if (nextVehicle2.STRANK <= vehicle.STRANK) {  // 车辆比 n2 更近, 车辆 -> n2
                                                    nextVehicle2 = vehicle;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            // nextVehicle
                            if (typeof nextVehicle === 'undefined') {
                                vehicleInfo = '无可到达车辆信息';
                                if (resp2.BUS_LINE.START_TIME) {
                                    vehicleInfo = `${vehicleInfo} <small>(运营时间: ${resp2.BUS_LINE.START_TIME} - ${resp2.BUS_LINE.END_TIME})</small>`;
                                }
                            } else {
                                let nextVehicleState = (nextVehicle.POSITION == 1) ? '到达' : '前往';
                                let nextVehicleApart = (parseInt(intStationRank) - nextVehicle.STRANK) + 1;
                                if (nextVehicle.POSITION == 1) {
                                    nextVehicleApart = nextVehicleApart - 1;
                                }
                                // time
                                let nextVehicleTime = parseInt((now.getTime() - nextVehicle.TIME) / 1000);
                                // distance
                                let nextVehicleDistance = 0;
                                if (nextVehicleApart > 0) {
                                    for (let n = nextVehicle.STRANK - 1; n < parseInt(intStationRank); n++) {
                                        let [latSX, lonSX] = [parseFloat(resp2.BUS_LINE.STATIONS[n].GEO_LAT), parseFloat(resp2.BUS_LINE.STATIONS[n].GEO_LON)];
                                        let [latSY, lonSY] = [parseFloat(resp2.BUS_LINE.STATIONS[n + 1].GEO_LAT), parseFloat(resp2.BUS_LINE.STATIONS[n + 1].GEO_LON)];
                                        nextVehicleDistance = nextVehicleDistance + Math.sqrt((((latSX - latSY) * 111.31955) ** 2) + (((lonSX - lonSY) * 111.31955 * Math.cos((latSX + latSY) / 2)) ** 2));
                                    }
                                }
                                let nextVehicleDistanceText = '';
                                if (nextVehicleDistance >= 1) {
                                    nextVehicleDistanceText = `, <small>小于</small>${nextVehicleDistance.toFixed(2)}<small>千米</small>`
                                } else if (nextVehicleDistance > 0 && nextVehicleDistance < 1) {
                                    nextVehicleDistanceText = `, <small>小于</small>${parseInt(nextVehicleDistance * 1000)}<small>米</small>`
                                }
                                // progressValue
                                progressValue = parseInt(100 / 5 * nextVehicleDistance).toString();
                                if (parseInt(nextVehicleDistance) >= 100) {
                                    nextVehicleDistance = '100';
                                }
                                // vehicleInfo
                                vehicleInfo = `<small>[${nextVehicleState}]</small>${nextVehicle.STATION_NAME} (<small>还差</small>${nextVehicleApart}<small>站</small>${nextVehicleDistanceText}, ${nextVehicleTime}<small>秒前</small>)`;

                                // nextVehicle2
                                if (typeof nextVehicle2 !== 'undefined') {
                                    let nextVehicle2State = (nextVehicle2.POSITION == 1) ? '到达' : '前往';
                                    let nextVehicle2Apart = (parseInt(intStationRank) - nextVehicle2.STRANK) + 1;
                                    vehicleInfo = `${vehicleInfo} <small>/ Next: <small>[${nextVehicle2State}]</small>${nextVehicle2.STATION_NAME} (<small>还差</small>${nextVehicle2Apart}<small>站</small>)</small>`;
                                }
                            }
                        }

                        // 渲染
                        Template.render(line, {
                            'vehicle': vehicleInfo,
                            'progress': progressValue
                        });
                    });
                });
            }
        }
    };
})({
    interface: 'GFn',
});
