
(function ($) {
	'use strict';
	var CITY = '合肥市';
	var CENTRA_ADDRESS = '义安区人民政府';
	var CENTRA_POINT;
	var CENTRA_ZOOM = 15;
	var map=new BMap.Map("mapContainer");
	var markerIcon = new BMap.Icon("../images/marker.png", new BMap.Size(21, 28));
	var infoFields = {
		'精品酒店': [
			'name', 'address', 'number'
		],
		'星级农家乐': [
			'name', 'address', 'number'
		]
	}
//	
	var $listItemTmpl = $(''
			+ '<li class="listItem">'
            +   '<a href="javascript:void(0)">'
            +     '<i class="iconfont icon-didian"><em class="itemIndex"></em></i>'
            +     '<span class="itemName"></span>'
            +     '<a href="" class="itemmsg">基本信息</a>'
            +     '<a href="" class="itemempt">从业人员</a>'
            +   '</a>'
            + '</li>');
	var $collapseListItemTmpl = $(''
			+ '<li class="listGroup">'
            +   '<a data-toggle="collapse" href="" class="collapsed"><span class="streetName"></span><i class="iconfont icon-xia"></i></a>'
            +   '<div class="panel-collapse collapse" role="tabpanel">'
            +     '<ul class="poilist">'
            +     '</ul>'
            +   '</div>'
            + '</li>');
	
	var $listContainer = $('#listContainer ul');
	var validItems = [];

	var initData = function () {
		for (var idx = 0; idx < mapData.length; idx ++) {
			//创建左侧列表项
			var mapItem = mapData[idx];
			var $item = $listItemTmpl.clone();
			$item.find('.itemIndex').text(idx + 1);
			$item.find('.itemName').text(mapItem.name);
			$item.find('.itemmsg').attr("href",mapItem.msglink);
			$item.find('.itemempt').attr("href",mapItem.emptlink);
			$item.attr('index', idx);
			$item.data(mapItem);
			$item.appendTo($listContainer);
			
   			var $infoWindow = $('<div></div>');
   			if (!infoFields[mapItem.categoryName]) {
   				console.log('undefined category:' + mapItem.categoryName);
   			} else {
   				var fields = infoFields[mapItem.categoryName];
   				for (var idxField = 0; idxField < fields.length; idxField ++) {
   					var fieldLabel, fieldValue;
   					if (fields[idxField] == 'name') {
   						fieldLabel = '<i class="iconfont icon-icon-test3 info-icon"></i>';
   						fieldValue = '<span class="name">' + mapItem.name + '</span>';
   					} else if (fields[idxField] == 'address') {
   						fieldLabel = '地址：';
   						fieldValue = mapItem.address;
   					} else {
                           fieldLabel = '电话：';
                           fieldValue = mapItem.number;
   					}
   					if (fieldValue) {
   						fieldValue = fieldValue.split('\n').join('<br/>');
   						$infoWindow.append($(''
   								+ '<div class="infoRow">'
   								+   '<div class="infoLabel" data="">' + fieldLabel + '</div>'
   								+   '<div class="infoValue">' + fieldValue + '</div>'
   								+ '</div>'));
   					}
   				}
   				if(mapItem.categoryImg){
   					$infoWindow.prepend('<div class="fieldImg"><img src="' + mapItem.categoryImg + '"/></div>');
   				}
   
   				mapItem.infoWindowHTML = $infoWindow.prop('outerHTML');
   			}
			
			$item.hover(function () {
	        	var idx = $(this).attr('index');
	        	if (mapData[idx].marker) {
	        		mapData[idx].marker.setAnimation(BMAP_ANIMATION_BOUNCE);
	        		map.panTo(mapData[idx].marker.getPosition());
	        	}

			}, function () {
	        	var idx = $(this).attr('index');
	        	if (mapData[idx].marker) {
	        		mapData[idx].marker.setAnimation();
	        	}
	        }).click(function () {
	        	var idx = $(this).attr('index');
	        	if (mapData[idx].marker) {
	        		map.panTo(mapData[idx].marker.getPosition());
            		var mapItem = findItemByName(mapData[idx].marker.getTitle());
            		if (mapItem && mapItem.infoWindow) {
            			mapData[idx].marker.openInfoWindow(mapItem.infoWindow);
            		}
	        	}

	        });
		}

		//合并条目相邻，街道相同的数据
		var collapseIndex = 0;
		$('.listItem').each(function () {
			var mapItem = $(this).data();
			if (!mapItem['归属街镇']) {
				return;
			}
			var $collapseContainer = $(this).prev();
			if ($collapseContainer.data('street') != mapItem['归属街镇']) {
				collapseIndex ++;
				$collapseContainer = $collapseListItemTmpl.clone();
				$collapseContainer.find('>a').attr('href', '#collapse_' + collapseIndex);
				$collapseContainer.find('>a span').text(mapItem['归属街镇']);
				$collapseContainer.find('>div').attr('id', 'collapse_' + collapseIndex);
				$collapseContainer.data('street', mapItem['归属街镇']);
				$collapseContainer.insertBefore($(this));
			}
			$(this).appendTo($collapseContainer.find('.poilist'));
		});
		$listContainer.find('[data-toggle="collapse"]:first').trigger('click');
	}

	var initMap = function () {
		map = new BMap.Map("mapContainer");
//        map.centerAndZoom(new BMap.Point(118.989706, 30.63969), 15);
        map.enableScrollWheelZoom();
        map.enableKeyboard();
        map.enableDragging();
        map.enableDoubleClickZoom();

        var scaleControl = new BMap.ScaleControl({
            anchor: BMAP_ANCHOR_BOTTOM_LEFT
        });
        scaleControl.setUnit(BMAP_UNIT_IMPERIAL);
        map.addControl(scaleControl);

        map.addControl(new BMap.NavigationControl({
            anchor: BMAP_ANCHOR_TOP_LEFT,
            type: BMAP_NAVIGATION_CONTROL_LARGE
        }));
        
        map.addControl(new BMap.MapTypeControl({
    		mapTypes:[
                BMAP_NORMAL_MAP,
                BMAP_SATELLITE_MAP,
                BMAP_PERSPECTIVE_MAP
            ]
        }));
        
        (new BMap.Geocoder()).getPoint("合肥市", function (point) {
            if (point) {
            	CENTRA_POINT = point;
                map.centerAndZoom(new BMap.Point(117.273254,31.843941), CENTRA_ZOOM);
        	}
        }, CITY);
	}

	// 根据categoryId和keywords过滤
	var filter = function (categoryId, keywords) {
		$('.listItem', $listContainer).addClass('hide');
		$('.listGroup', $listContainer).addClass('hide');

		validItems = [];
		for (var idx = 0; idx < mapData.length; idx ++) {
			var mapItem = mapData[idx];
//			mapItem.marker = undefined;
			if (categoryId && categoryId != mapItem.categoryId) {
				continue;
			}
			if (keywords && mapItem.name.indexOf(keywords) < 0) {
				continue;
			}
			validItems.push(mapItem);
			var $item = $listContainer.find('.listItem[index="' + idx + '"]');
			$item.find('.itemIndex').text(validItems.length);
			$item.removeClass('hide')
			$item.closest('.listGroup').removeClass('hide');
		}

		map.clearOverlays();
		buildMarkers(validItems);
	}
	
	var buildMarkers = function () {
		if (validItems.length > 0) {
			var targetMapItem = validItems[0];
			(new BMap.Geocoder()).getPoint('义安区' + targetMapItem.address, function (point) {
				var mapItem = validItems[0];
				if (mapItem && targetMapItem.name == mapItem.name) {
		            validItems.shift();
		            if (point) {
						point.lat=targetMapItem.lat;
						point.lng=targetMapItem.lng;
		            	var $goHereButton = $(''
		            		+ '<div class="goHere">'
		            		+   '<a href="http://api.map.baidu.com/marker'
		            		+     '?location=' + point.lat + ',' + point.lng
		            		+     '&title=' + encodeURIComponent(mapItem.name)
		            		+     '&content=' + encodeURIComponent('义安区' + mapItem.address)
		            		+     '&output=html" target="_blank">到这去</a>'
		            		+ '</div>');
		            	var $infoWindow = $(mapItem.infoWindowHTML);
		            	$infoWindow.append($goHereButton);
		            	mapItem.infoWindow = new BMap.InfoWindow($infoWindow.prop('outerHTML'));

		            	mapItem.marker = new BMap.Marker(point, {
		            		icon: markerIcon
		            	});
		            	mapItem.marker.setTitle(mapItem.name);
		            	map.addOverlay(mapItem.marker);

		            	mapItem.marker.addEventListener('click', function () {
		            		var mapItem = findItemByName(this.getTitle());
		            		if (mapItem && mapItem.infoWindow) {
		            			this.openInfoWindow(mapItem.infoWindow);
		            			/*document.getElementById('infoWindowQRCode').onload = function (){
		            				mapItem.infoWindow.redraw();
		            			}*/
		            		}
		            	});
		        	}
				}
	            buildMarkers();
	        }, CITY);
		}
	}

	var findItemByName = function (name) {
		for (var idx = 0; idx < mapData.length; idx ++) {
			if (mapData[idx].name == name) {
				return mapData[idx];
			}
		}
	}
	
	$(document).ready(function () {
		initData();
		initMap();
		filter();
		
		var $search = $('#searchForm input[name="keywords"]');

		$('.item a.circle-btn').each(function () {
			$(this).click(function () {
				$(this).addClass('current').parent().siblings().find('a').removeClass('current')
				var categoryId = $(this).attr('categoryId');
				if (categoryId == '0' || categoryId == '') {
					categoryId = undefined;
				}
				var keywords = $search.val();
				filter(categoryId, keywords);
				
				//点击分类按钮后，地图恢复最初居中状态
				if (CENTRA_POINT) {
	                map.centerAndZoom(CENTRA_POINT, CENTRA_ZOOM);
				}
				return false;
			});
		});

		var lastKeywords = '', lastEventTime = 0;
		var checkSearch = function () {
			var keywords = $search.val();
			if (keywords != lastKeywords && new Date().getTime() - lastEventTime > 500) {
				lastKeywords = keywords;
				filter(undefined, keywords);
			}
			setTimeout(checkSearch, 20);
		}
		
		$search.on('keyup', function (event) {
			lastEventTime = new Date().getTime();
		});

		checkSearch();
		windowResize()
	});

//	var getWindowWidth = function() {
//		return window['innerWidth'] || document.compatMode==='CSS1Compat' && document.documentElement['clientWidth'] || document.body['clientWidth'];
//	}
//	var getWindowHeight = function() {
//		return window['innerHeight'] || document.compatMode==='CSS1Compat' && document.documentElement['clientHeight'] || document.body['clientHeight'];
//	}
//
//	var windowResize = function () {
//		if (map) {
//			map.setSize(new BMap.Size(getWindowWidth() - 335, getWindowHeight() - 80));
//		}
//	}
//
//	$(window).resize(function () {
//		windowResize()
//	});

})(jQuery);