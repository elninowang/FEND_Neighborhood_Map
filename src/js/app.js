
/** 美国 凤凰城 经纬度 Phoenix */
const start_point = {lat: 33.448377, lng: -112.074037};

let map;

function initMap() {
    // Constructor creates a new map - only center and zoom are required.
    map = new google.maps.Map($('#map').get(0), {
        center: start_point,
        zoom: 13
    });

    ko.applyBindings(new ViewModel());
}

// ViewModel
var ViewModel = function () {
    let self = this;

    this.current = ko.observable();
    this.use_poi_icon = ko.observable();
    this.markers = ko.observableArray([]);
    
    map.addListener('bounds_changed', () => {
        let autocomplete = new google.maps.places.Autocomplete(
            $('#search-place').get(0),
            {bounds: map.getBounds()}
        );
        autocomplete.addListener('place_changed', ()=>{
            let place = autocomplete.getPlace();
            self.searchPlaces(place.formatted_address);
        });
    });

    this.search = function () {
        var address = this.current().trim();
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
    
            var placeInfoWindow = new google.maps.InfoWindow();
            marker.addListener('click', function () {
                self.populateInfoWindow(this, placeInfoWindow);
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
        //map.clearOverlays();
        self.markers().forEach(marker => marker.setMap(null));
        self.markers.removeAll();
    }

    self.showPlaceInfo = function (marker) {
        google.maps.event.trigger(marker, 'click');
        $('#nav').removeClass('open');  
    }.bind(this);

    this.populateInfoWindow = function(marker, infowindow) {
        // Check to make sure the infowindow is not already opened on this marker.
        if (infowindow.marker != marker) {
            // Clear the infowindow content to give the streetview time to load.
            infowindow.setContent('');
            infowindow.marker = marker;
            // Make sure the marker property is cleared if the infowindow is closed.
            infowindow.addListener('closeclick', function () {
                infowindow.marker = null;
            });
            var streetViewService = new google.maps.StreetViewService();
            var radius = 50;
            // In case the status is OK, which means the pano was found, compute the
            // position of the streetview image, then calculate the heading, then get a
            // panorama from that and set the options
            function getStreetView(data, status) {
                if (status == google.maps.StreetViewStatus.OK) {
                    var nearStreetViewLocation = data.location.latLng;
                    var heading = google.maps.geometry.spherical.computeHeading(
                        nearStreetViewLocation, marker.position);
                    infowindow.setContent('<div>' + marker.title + '</div><div id="pano"></div>');
                    var panoramaOptions = {
                        position: nearStreetViewLocation,
                        pov: {
                            heading: heading,
                            pitch: 30
                        }
                    };
                    var panorama = new google.maps.StreetViewPanorama($('#pano').get(0), panoramaOptions);
                } else {
                    infowindow.setContent('<div>' + marker.title + '</div>' +
                        '<div>No Street View Found</div>');
                }
            }
            // Use streetview service to get the closest streetview image within
            // 50 meters of the markers position
            streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
            // Open the infowindow on the correct marker.
            infowindow.open(map, marker);
        }
    };

    this.toggleNav = function() {
        $('#nav').toggleClass('open');  
        event.stopPropagation();
    }
}
