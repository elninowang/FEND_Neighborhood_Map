
/** 硅谷中心坐标，也是这个项目的起始坐标 */
const start_point = {lat: 37.387474, lng: -122.057543};

const default_search_key = "food";

//const third_api_url = "http://zh.wikipedia.org/w/api.php?&action=query&titles=%E7%A1%85%E8%B0%B7&format=json&prop=revisions&rvprop=content";
const third_api_url = "https://free-api.heweather.com/s6/weather/forecast?location=%E5%9C%A3%E4%BD%95%E5%A1%9E&key=7959b2d195af4b38a2afe26eccd7493f&lang=cn&unit=m";

let map;

/**
 * 初始话地图，是由google map API在加载完成后直接调用
 */
function initMap() {
    // Constructor creates a new map - only center and zoom are required.
    map = new google.maps.Map($('#map').get(0), {
        center: start_point,
        styles: mapstyles,
        zoom: 9,
        mapTypeControl: false,
    });

    /** 启动 knockoutjs 的 MVVM 模式*/
    ko.applyBindings(new ViewModel());
};

/**
 * 如果谷歌地图加载错误的时候，可就执行这段代码
 */
var mapErrorHandler = function(){
    window.alert('谷歌地图加载错误，请重新刷新页面试试');
}

let ViewModel = function () {
    let self = this;

    /** 绑定输入框 */
    this.current = ko.observable('');
    this.currentFilter = ko.observable('');

    /** 绑定搜索结果列表 */
    this.markers = ko.observableArray([]);

    /** 地图中的弹出框 */
    this.infoWindow = new google.maps.InfoWindow();

    /** ViewModel类的启动函数 */
    (() => {
        let isFirst = true;
        map.addListener('bounds_changed', () => {
            let bounds = map.getBounds();

            // 设置搜索栏自动补全
            let autocomplete = new google.maps.places.Autocomplete(
                $('#search-place').get(0),
                {bounds: bounds}
            );
            autocomplete.addListener('place_changed', () => {
                let place = autocomplete.getPlace();
                self.searchPlaces(place.formatted_address);
            });
            
            // 自动搜素关键词，显示默认的所有点,
            if (isFirst) {
                self.searchPlaces(default_search_key);
                isFirst = false;
            }
        });
    })();

    /**
     * 筛选地址
     */
    this.filter = function () {
        let key = self.currentFilter().trim().toLowerCase();
        for (let marker of self.markers()) {
            if (marker.title.toLowerCase().indexOf(key) !== -1) {
                marker.setVisible(true);
            } else {
                marker.setVisible(false);
            }
        }
    };

    /**
     * 获得可自己自动计算后的用于 界面绑定的筛选列表
     */
    this.markersFilter = ko.pureComputed (() => 
        this.markers().filter(marker => {
            let key = self.currentFilter().trim().toLowerCase();
            return (marker.title.toLowerCase().indexOf(key) !== -1);
        }), this);

    /**
     * 搜索地名
     */
    this.search = function () {
        let address = this.current().trim();
        if (address) {
            self.searchPlaces(address);
        }
    };

    this.searchPlaces = function(address) {
        console.log("search place " + address);
        if (!address) address = self.current();
        if (address.length === 0) {
            window.alert('You must enter an address.');
            return;
        }
        self.clearMarkers();
        let bounds = map.getBounds();
        let placesService = new google.maps.places.PlacesService(map);
        placesService.textSearch({
            query: address,
            bounds: bounds
        }, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                self.createMarkersForPlaces(results);
            }
        });
    }

    /**
     * 给搜索出来的地址，在地图中添加标记
     * @param {*} places 
     */

    this.createMarkersForPlaces = function(places) {
        let bounds = new google.maps.LatLngBounds();
        for (let i = 0; i < places.length; i++) {
            let place = places[i];
            let marker;

            // 地图标记的时候，显示Google地图默认图标
            marker = new google.maps.Marker({
                map: map,
                title: place.name,
                position: place.geometry.location,
                id: place.place_id,
            });
    
            // 设置每个点点击弹出详细内容
            marker.addListener('click', () => {
                self.populateInfoWindow(marker, self.infoWindow);
            });
            self.markers.push(marker);
            if (place.geometry.viewport) {
                bounds.union(place.geometry.viewport);
            } else {
                bounds.extend(place.geometry.location);
            }
        }
        map.fitBounds(bounds);
    }

    /**
     * 清楚所有标记和弹出框
     */
    this.clearMarkers = function() {
        console.log('clearMarkers');
        self.markers().forEach(marker => marker.setMap(null));
        self.markers.removeAll();
    }

    /**
     * 绑定knockoutjs里面 当用户点击地址列表中的一项时
     *  @param {google.maps.Marker} marker 用户点击的项对应地图中的哪一个标记
     */
    this.showPlaceInfo = function(marker) {
        google.maps.event.trigger(marker, 'click');
        $('#nav').removeClass('open');  
    }.bind(this);

    /**
     * 
     * @param {google.maps.Marker} marker  需要弹出详细内容的标记
     * @param {google.maps.InfoWindow} infoWindow  弹出框对象
     */

    this.populateInfoWindow = function(marker, infoWindow) {
        if (infoWindow.marker != marker) {
            infoWindow.marker = marker;

            var service = new google.maps.places.PlacesService(map);
            service.getDetails({
                placeId: marker.id
            }, (place, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK) {
                    // 设置弹出框的内容
                    let html = '<div>';
                    if (place.name) {
                        html += `<h3>${place.name}</h3>`;
                    }
                    if (place.formatted_address) {
                        html += `<br>${place.adr_address}`;
                    }
                    if (place.formatted_phone_number) {
                        html += `<br>${place.formatted_phone_number}`;
                    }
                    html += '</div><br />';

                    let htmlWeather = `<div><strong>天气</strong><br><p>正在获取数据 </p></div>`;
                    infoWindow.setContent(html + htmlWeather);
                    infoWindow.open(map, marker);
        
                    fetch(third_api_url)
                    .then(response => response.json())  
                    .then(obj => {
                        let forecast = obj.HeWeather6[0].daily_forecast;
        
                        htmlWeather = `<div><strong>天气</strong><ul>`;
                        forecast.forEach(f => {
                            htmlWeather += `<li>${f.date}: 白天${f.cond_txt_d}，晚上${f.cond_txt_n} 最低${f.tmp_min}摄氏度 最高${f.tmp_max} C</li>`;
                        })
                        htmlWeather += `</ul></div>`;
        
                        infoWindow.setContent(html + htmlWeather);
                        infoWindow.open(map, marker);
                    })
                    .catch(error => {
                        // 获取错误
                        console.error(error);
                        htmlWeather = `<div>`
                            + `<strong>天气</strong><br><p>获取错误: </p>`
                            + `<span>${error}</span>`
                            + `</div>`
                        infoWindow.setContent(html + htmlWeather);
                        infoWindow.open(map, marker);
                    });
                }
            });

            infoWindow.addListener('closeclick', () => infoWindow.marker = null);
        }
    };

    /**
     * 用户在移动模式下点击了 是否开启导航栏
     */
    this.navOpenClass = ko.observable("");

    this.toggleNav = function() {
        let isNotOpen = (self.navOpenClass() === '');
        self.navOpenClass(isNotOpen? 'open': '');
        event.stopPropagation();
    }
}