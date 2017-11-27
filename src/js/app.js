

/** 美国 凤凰城 经纬度 Phoenix */
const start_point = {lat: 33.448377, lng: -112.074037};

let map;
let markers = [];

function initMap() {
    // Constructor creates a new map - only center and zoom are required.
    map = new google.maps.Map($('#map').get(0), {
        center: start_point,
        zoom: 13
    });
    map.addListener('bounds_changed', () => {
        console.log("bounds = " + map.getBounds());
        let autocomplete = new google.maps.places.Autocomplete(
            $('#search-place').get(0),
            {bounds: map.getBounds()}
        );
        autocomplete.addListener('place_changed', ()=>{
            let place = autocomplete.getPlace();
            searchPlaces(place.formatted_address);
        });
    });

    $('#search-button').on('click', () => searchPlaces());
}

function searchPlaces(address) {
    if (address == null) {
        address = $('#search-place').get(0).value;
    }
    console.log("addrss = " + address);
    if (address.length = 0) {
        window.alert('You must enter an address.');
        return;
    }
    clearMarkers();
    let bounds = map.getBounds();
    console.log("bounds: " + bounds);
    let placesService = new google.maps.places.PlacesService(map);
    placesService.textSearch({
        query: address,
        bounds: bounds
    }, function (results, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            createMarkersForPlaces(results);
        }
    });

}

function createMarkersForPlaces(places) {
    let bounds = new google.maps.LatLngBounds();
    for (let i = 0; i < places.length; i++) {
        let place = places[i];
        let icon = {
            url: place.icon,
            size: new google.maps.Size(35, 35),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(15, 34),
            scaledSize: new google.maps.Size(25, 25)
        };
        // Create a marker for each place.
        let marker = new google.maps.Marker({
            map: map,
            //icon: icon,
            title: place.name,
            position: place.geometry.location,
            id: place.place_id
        });

        var placeInfoWindow = new google.maps.InfoWindow();
        marker.addListener('click', function () {
            populateInfoWindow(this, placeInfoWindow);
        });
        markers.push(marker);
        if (place.geometry.viewport) {
            // Only geocodes have viewport.
            bounds.union(place.geometry.viewport);
        } else {
            bounds.extend(place.geometry.location);
        }
    }
    map.fitBounds(bounds);
}

function clearMarkers() {
    //map.clearOverlays();
    for (marker of markers) {
        marker.setMap(null);
    }
    markers = [];
}

// This function populates the infowindow when the marker is clicked. We'll only allow
// one infowindow which will open at the marker that is clicked, and populate based
// on that markers position.
function populateInfoWindow(marker, infowindow) {
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
        console.log(streetViewService);
        var radius = 50;
        // In case the status is OK, which means the pano was found, compute the
        // position of the streetview image, then calculate the heading, then get a
        // panorama from that and set the options
        function getStreetView(data, status) {
            if (status == google.maps.StreetViewStatus.OK) {
                console.log(".StreetViewStatus.OK");
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
                console.log("no street view");
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
}

$(() => {
    $('#nav_btn').on('click', (event) => {
        $('#nav').toggleClass('open');  
        event.stopPropagation();
    });
});

