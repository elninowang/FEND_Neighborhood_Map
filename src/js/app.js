
/** Silicon Valley */
const start_point = {lat: 37.387474, lng: -122.057543};

//const wikipedia_api_url = "http://zh.wikipedia.org/w/api.php?&action=query&titles=%E7%A1%85%E8%B0%B7&format=json&prop=revisions&rvprop=content";
const wikipedia_api_url = "https://free-api.heweather.com/s6/weather/forecast?location=%E5%9C%A3%E4%BD%95%E5%A1%9E&key=7959b2d195af4b38a2afe26eccd7493f&lang=cn&unit=m";

function initMap() {
    // Constructor creates a new map - only center and zoom are required.
    map = new google.maps.Map($('#map').get(0), {
        center: start_point,
        styles: mapstyles,
        zoom: 9,
        mapTypeControl: false,
    });

    ko.applyBindings(new ViewModel());
}

// ViewModel
let ViewModel = function () {
    let self = this;

    this.current = ko.observable();
    this.use_poi_icon = ko.observable();
    this.markers = ko.observableArray([]);

    this.infoWindow = new google.maps.InfoWindow();

    this.centerMarker = new google.maps.Marker({
        position: start_point,
        title: "硅谷",
        animation: google.maps.Animation.DROP,
        id: 1,
    });

    (function() {
        map.addListener('bounds_changed', function(){
            let autocomplete = new google.maps.places.Autocomplete(
                $('#search-place').get(0),
                {bounds: map.getBounds()}
            );
            autocomplete.addListener('place_changed', function(){
                let place = autocomplete.getPlace();
                self.searchPlaces(place.formatted_address);
            });
        });

        self.centerMarker.addListener('click', function () {
            self.showCenterInfoWindow(this, self.infoWindow);
        });

        self.centerMarker.setMap(map);
    })();
    
    this.showCenterInfoWindow = function(marker, infoWindow) {
        if (infoWindow.marker != marker) {
            infoWindow.marker = marker;
            fetch("http://api.map.baidu.com/telematics/v3/weather?location=%E5%8C%97%E4%BA%AC&output=json&ak=BxHHQAtW62yaGYTQnDjhlethS8brEAzf", {mode: "no-cors"})
            fetch("https://api.foursquare.com/v2/venues/4d9a662a674ca14376eaba43?client_id=NONGGLXBKX5VFFIKKEK1HXQPFAFVMEBTRXBWJUPEN4K14JUE&client_secret=ZZDD1SLJ4PA2X4AJ4V23OOZ53UM4SFZX0KORGWP5TZDK4YYJ&v=20130815")
            fetch(wikipedia_api_url)
            .then(response => response.json()) 
            .then(obj => {
                forecast = obj.HeWeather6[0].daily_forecast;
                console.log(forecast[0]);
                console.log(forecast[1]);
                console.log(forecast[2]);

                html = `<div><h1>硅谷-天气</h1><ul>`;
                forecast.forEach(f => {
                    html += `<li>${f.date}: 白天${f.cond_txt_d}，晚上${f.cond_txt_n} 最低${f.tmp_min}摄氏度 最高${f.tmp_max}摄氏度 ${f.wind_dir} ${f.wind_sc}</li>`;
                })
                html += `</ul></div>`;
                console.log(html);

                infoWindow.setContent(html);

                infoWindow.open(map, marker);
                infoWindow.addListener('closeclick', function () {
                    infoWindow.marker = null;
                });
            })
            .catch(error => {
                console.log(error);
            });
            
        }
    }

    this.search = function () {
        let address = this.current().trim();
        if (address) {
            self.searchPlaces(address);
        }
    };

    this.searchPlaces = function(address) {
        if (address == null) {
            address = $('#search-place').get(0).value;
        }
        if (address.length = 0) {
            window.alert('You must enter an address.');
            return;
        }
        self.clearMarkers();
        let bounds = map.getBounds();
        let placesService = new google.maps.places.PlacesService(map);
        placesService.textSearch({
            query: address,
            bounds: bounds
        }, function (results, status) {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                self.createMarkersForPlaces(results);
            }
        });
    }

    this.createMarkersForPlaces = function(places) {
        let bounds = new google.maps.LatLngBounds();
        for (let i = 0; i < places.length; i++) {
            let place = places[i];
            let marker;
            if (self.use_poi_icon()) {
                // Create a marker for each place.
                marker = new google.maps.Marker({
                    map: map,
                    icon: {
                        url: place.icon,
                        size: new google.maps.Size(35, 35),
                        origin: new google.maps.Point(0, 0),
                        anchor: new google.maps.Point(15, 34),
                        scaledSize: new google.maps.Size(25, 25)
                    },
                    title: place.name,
                    position: place.geometry.location,
                    id: place.place_id,
                });
            } else {
                marker = new google.maps.Marker({
                    map: map,
                    title: place.name,
                    position: place.geometry.location,
                    id: place.place_id,
                });
            }
    
            marker.addListener('click', function () {
                self.populateInfoWindow(this, self.infoWindow);
            });
            self.markers.push(marker);
            if (place.geometry.viewport) {
                // Only geocodes have viewport.
                bounds.union(place.geometry.viewport);
            } else {
                bounds.extend(place.geometry.location);
            }
        }
        map.fitBounds(bounds);
    }

    this.clearMarkers = function() {
        console.log('clearMarkers');
        self.markers().forEach( function(marker) {
            marker.setMap(null)
        });
        self.markers.removeAll();
        self.infoWindow.marker = null;
    }

    this.showPlaceInfo = function (marker) {
        google.maps.event.trigger(marker, 'click');
        $('#nav').removeClass('open');  
    }.bind(this);

    this.populateInfoWindow = function(marker, infoWindow) {
        if (infoWindow.marker != marker) {
            //infoWindow.marker = null;
            infoWindow.marker = marker;

            var service = new google.maps.places.PlacesService(map);
            service.getDetails({
                placeId: marker.id
            }, function (place, status) {
                if (status === google.maps.places.PlacesServiceStatus.OK) {
                    // Set the marker property on this infoWindow so it isn't created again.
                    var innerHTML = '<div>';
                    if (place.name) {
                        innerHTML += '<strong>' + place.name + '</strong>';
                    }
                    if (place.formatted_address) {
                        innerHTML += '<br>' + place.adr_address;
                    }
                    if (place.formatted_phone_number) {
                        innerHTML += '<br>' + place.formatted_phone_number;
                    }
                    if (place.photos) {
                        innerHTML += '<br><br><img src="' + place.photos[0].getUrl(
                            { maxHeight: 100, maxWidth: 200 }) + '">';
                    }
                    innerHTML += '</div>';
                    infoWindow.setContent(innerHTML);
                    infoWindow.open(map, marker);
                    // Make sure the marker property is cleared if the infoWindow is closed.
                }
            });
            infoWindow.addListener('closeclick', function () {
                infoWindow.marker = null;
            });
        }
    };

    this.toggleNav = function() {
        $('#nav').toggleClass('open');  
        event.stopPropagation();
    }
}
