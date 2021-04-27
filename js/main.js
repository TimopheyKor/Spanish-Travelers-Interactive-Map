/*
	Spanish Travelers - Interactive Map
	This is a public offshoot of The Spanish Travelers Project : Artist Travelers
	Artist Travelers was a collaboration between the Milwaukee Art Museum's
	Americans in Spain exhibition and Marquette University's Spanish Travelers
	project.
	Author: Timophey Korolev
	Email: timophey.korolev@marquette.edu, timopheykor@gmail.com
	Libraries: jQuery, Leaflet, Esri
	The general structure of this JS is learned from an example of a similar
	project, the Boyd Map.
	The primary functionality of this code is to replace leaflet's default
	popup with a more advanced popup, henceforth known as InteractivePopup,
	containing image and text information stored in leaflet features with
	additional properties.
	InteractivePopup is a full-screen HTML overlay with 
	display areas for a large image, descriptive text, and an interactive
	image gallery.
*/
// Index of first image shown in InteractivePopup
const MAIN_IMAGE = 0;

// SIZE of padding in the popup CSS
const POPUP_INFO_PADDING = 10;

// Zoom level at which the map is initially generated
const INITIAL_ZOOM = 7;

// View changes to this zoom when a feature is clicked
const LOCAL_ZOOM = 15;

// Furthest a user can zoom in / out, respectively
const MAX_ZOOM = 20;
const MIN_ZOOM = 5;

// Map is initially generated with these coords in the center
const CENTER = [39.85880, -2.6];

// Corners defining area a user can view
const MAXBOUND_CORNER_ONE = [46.270583, -14.947324]
const MAXBOUND_CORNER_TWO = [30.780441, 9.621250]

// Reset Zoom button in index.html
const resetZoomBtn = document.querySelector('.zoom-button');

// Div in index.html used as a container for the gallery in InteractivePopup
const GALLERY_SLIDE = document.querySelector('.gallery-slide');

// Integer value that provides a buffer for the gallery scrolling 
// functionality
const GALLERY_SCROLL_BUFFER = 2;

// Arrow objects in index.html used to interact with the gallery in
// InteractivePopup
const prevBtn = document.querySelector('#prevBtn');
const nextBtn = document.querySelector('#nextBtn');

// Average width of images in the gallery of InteractivePopup
const SIZE = 400;

function main() {
    var maxBounds = createMaxBounds();
    var leafMap = createBaseMap(maxBounds);
    counter = 0;
    importTileLayers(leafMap);
    importJsonData(leafMap);
    initGallery();
    addEventCheck(leafMap);
}
main();

// createMaxBounds creates a leaflet object that defines the maximum boundaries
// users can scroll within.
function createMaxBounds() {
    var corner1 = L.latLng(MAXBOUND_CORNER_ONE),
        corner2 = L.latLng(MAXBOUND_CORNER_TWO),
        maxBounds = L.latLngBounds(corner1, corner2);
    return maxBounds;
}

// createBaseMap returns the leaflet map object with the provided boundaries and
// 'Imagery' basemap.
function createBaseMap(bounds) {
    var map = L.map('map', {
        center: CENTER,
        zoom: INITIAL_ZOOM,
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM,
        maxBounds: bounds
    })
    var base = L.esri.basemapLayer('Imagery');
    base.addTo(map);
    return map;
}

// importTileLayers imports georeferenced maps from servers, layers them
// on top of the leaflet & esri base maps, and adds an overlayed control
// UI that lets users check which maps they want to see.
function importTileLayers(map) {
    // Create a JavaScript map object to contain names of layers
    var overlays = new Map();

    // This is the format for adding georeferenced maps to the base map, using 
    // historical maps of Spain and Granada as examples. To add your own maps
    // to the leaflet base simply adjust the L.tileLayer function
    // parameters to your needs or add new variables = L.tileLayer.
    var spainTileLayer = L.tileLayer(
        'https://api.maptiler.com/tiles/bd9d2250-587c-4447-b942-f322e65be0d1/{z}/{x}/{y}.png?key=VQGDLzTLM54Idfavr6jT', {
            attribution: 'Rendered with <a href="https://www.maptiler.com/desktop/">MapTiler Desktop</a>',
            crossOrigin: true
        }).addTo(map);
    // Add the map and its name to the JS map object
    overlays.set("Spain", spainTileLayer);

    var granadaTileLayer = L.tileLayer(
        'https://api.maptiler.com/tiles/71cac88f-c3e4-4fcf-a7eb-c49aee6ca935/{z}/{x}/{y}.png?key=VQGDLzTLM54Idfavr6jT', {
            attribution: 'Rendered with <a href="https://www.maptiler.com/desktop/">MapTiler Desktop</a>',
            crossOrigin: true
        }).addTo(map);
    overlays.set("Granada", granadaTileLayer);

    // Create a control box overlay that lets users select which layers they 
    // can see using a leaflet function
    L.control.layers(null, Object.fromEntries(overlays)).addTo(map);
}

// importJsonData uses jQuery's ajax function to read json data from a URI
// and uses the markerCluster plugin to create interactive points on the map.
// The URI inside of the $.ajax("URI") function parameter is where you'll put
// the location of your json data file.
function importJsonData(map) {
    $.ajax("https://raw.githubusercontent.com/TimopheyKor/SpanishTravelersV3/master/Map_Points_Data.json", {
        dataType: "json",
        success: function(response) {
            // Information for a custom leaflet marker.
            var geojsonMarkerOptions = {
                radius: 14,
                fillColor: "#00d458",
                color: "#000",
                weight: 2,
                opacity: 1,
                fillOpacity: 0.7
            };

            // Creating leaflet objects from the json file.
            var geoJsonPoints = L.geoJSON(response.features, {
                pointToLayer: function(_, latlng) {
                    return L.circleMarker(latlng, geojsonMarkerOptions);
                },
                onEachFeature: function(feature, layer) {

                    // Adding an on-click event listener to each feature
                    // which opens the InteractivePopup.
                    layer.on('click', function(e) {
                        if (map.getZoom() < LOCAL_ZOOM) {
                            var pointLoction = L.latLng(feature.geometry.coordinates[1], feature.geometry.coordinates[0]);
                            map.flyTo(pointLoction, LOCAL_ZOOM);
                        }
                        openPopup(feature, layer);
                    });
                }
            });

            // Using the esri markerCluster plugin to cluster all of 
            // the features.
            var markerCluster = L.markerClusterGroup();
            markerCluster.addLayer(geoJsonPoints);

            // Adding the clustered features with on-click functionality
            // to the map.
            markerCluster.addTo(map);
        }
    });
}

// openPopup shows the InteractivePopup
function openPopup(feature, layer) {
    hideTitle();
    getPopupContent(feature, layer);
    document.getElementById("my-popup").style.height = "100%";
    document.getElementById("return-to-map-btn").style.display = "block";
}

// closePopup hides the InteractivePopup
function closePopup() {
    document.getElementById("my-popup").style.height = "0";
    document.querySelector('.gallery-slide').innerHTML = "";
    document.getElementById("return-to-map-btn").style.display = "none";
    counter = 0;
    showTitle();
}

// hideTitle removes the title
function hideTitle() {
    console.log("Hiding Title");
    document.getElementById("title").style.opacity = 0;
}

// hideTitle shows the title
function showTitle() {
    document.getElementById("title").style.opacity = 1;
}

// getPopupContent assigns point-specific content to the InteractivePopup when 
// it opens, with data drawn from the json file
function getPopupContent(feature) {
    // Get the list of images for the popup gallery from the .json file
    var imageArray = feature.properties.images;
    var popupTitle = feature.properties.name;

    // Populate the popup gallery with the images from the imageArray
    createGallery(popupTitle, imageArray);

    // Select the first image in the array to be injected into HTML when the popup opens
    selectImage(imageArray[MAIN_IMAGE].imgURL, imageArray[MAIN_IMAGE].tombstone, imageArray[MAIN_IMAGE].description);

    // Add an event listener to all the images in the gallery so that they'll call selectImage() on click
    activateImageSelection(galleryImages, imageArray);
}

// createGallery populates InteractivePopup's gallery with images from the json 
// file
function createGallery(popupTitle, imageArray) {
    // Get variables & set popup title
    var imageGallery = document.querySelector('.gallery-slide');
    var titleField = document.getElementById("my-popup-title");
    var galleryLength = imageArray.length;
    titleField.innerHTML = '<h2>' + popupTitle + '</h2>';

    // Loop through the array of images, put in gallery
    var i;
    for (i = 0; i < galleryLength; i++) {
        var imageURL = imageArray[i].imgURL;
        var imageEntry = document.createElement("img")
        imageEntry.src = imageURL;
        imageEntry.className = "gallery-image"
        imageEntry.title = i.toString();
        imageGallery.appendChild(imageEntry)
    }

    // Updating variables needed for interactive gallery
    galleryImages = document.querySelectorAll('.gallery-slide img')
    counter = 0;
    GALLERY_SLIDE.style.transform = 'translateX(' + (-SIZE * counter) + 'px)';
}

// focusOnImage makes the selected InteractivePopup image full-screen when 
// it's clicked
function focusOnImage() {
    var imageDiv = document.getElementById("my-popup-image");
    var image = document.getElementById("specific-image");
    if (imageDiv.style.height == "100vh") {
        console.log("Closing condition activated");
        closeImage();
    } else {
        imageDiv.style.backgroundColor = "rgba(0, 0, 0, 0.9)"
        imageDiv.style.height = "100vh";
        imageDiv.style.width = "100vw";
        imageDiv.style.top = "0";
        imageDiv.style.left = "0";
        imageDiv.style.top = "0";
        imageDiv.style.left = "0";
        imageDiv.style.zIndex = "1";
        imageDiv.style.padding = "20px";
        imageDiv.requestFullscreen();
        image.style.height = "100%";
        image.style.width = "auto";
    }
}

// closeImage hides fullscreen images if they're clicked again.
function closeImage() {
    var imageDiv = document.getElementById("my-popup-image");
    var image = document.getElementById("specific-image");
    imageDiv.style.backgroundColor = "rgba(0, 0, 0, 0)"
    imageDiv.style.height = "";
    imageDiv.style.width = "";
    imageDiv.style.top = "80px";
    imageDiv.style.left = "40px";
    imageDiv.style.right = "50vw";
    imageDiv.style.bottom = "40px";
    imageDiv.style.zIndex = "0";
    imageDiv.style.padding = "0";
    document.exitFullscreen();
    image.style.height = "100%";
    image.style.width = "100%";
}

// addEventCheck adds event listeners to the document that make sure the escape
// key properly exits out of any full-screen functionality, and for the
// Reset Zoom Button to reset the zoom on click.
function addEventCheck(map) {
    document.addEventListener("keyup", function(event) {
        var x = event.code;
        if (x == "Escape") {
            if (document.getElementById("my-popup-image").style.height == "100vh") {
                closeImage();
            }
        }
    });
    resetZoomBtn.addEventListener('click', function(event) {
        map.setView(CENTER, INITIAL_ZOOM);
    });
}

// activateReadMoreButton show a "read more" button if description text in the
// InteractivePopup is out-of-bounds what it's opened, which allows users to 
// see the rest of the text when clicked.
function activateReadMoreButton() {
    var readMoreButton = document.querySelector(".read-more-button");
    readMoreButton.style.display = "block";
    readMoreButton.disabled = false;
}

// disableReadMoreButton hides the "read more" button if all of the
// InteractivePopup text is visible when it's opened.
function disableReadMoreButton() {
    var readMoreButton = document.querySelector(".read-more-button");
    readMoreButton.style.display = "none";
    readMoreButton.disabled = true;
}

// enableScroll allows users to scroll in InteractivePopup description fields
function enableScroll() {
    var popupInfo = document.getElementById("my-popup-info");
    var descriptionDiv = document.getElementById("my-popup-description");
    popupInfo.style.overflow = "scroll";
    descriptionDiv.scrollIntoView({ behavior: "smooth", block: "end" });
    $("#my-popup-info").removeClass('stop-scrolling');
    disableReadMoreButton()
}

// disableScroll disables the functionality for users to scroll in
// InteractivePopup description fields
function disableScroll() {
    var popupInfo = document.getElementById("my-popup-info");
    popupInfo.style.overflow = "hidden";
    $("#my-popup-info").addClass('stop-scrolling');
}

// checkOverflow compares the combined heights of text in InteractivePopup
// description fields and determines if scrolling is necessary or not.
function checkOverflow() {
    var popupInfo = document.getElementById("my-popup-info");
    var tombstoneDiv = document.getElementById("my-popup-tombstone");
    var titleDiv = document.getElementById("my-popup-title");
    var descriptionDiv = document.getElementById("my-popup-description");
    var dividers = document.querySelector('.solid').getBoundingClientRect();
    var popupInfoBound = popupInfo.getBoundingClientRect();
    if ((descriptionDiv.scrollHeight + tombstoneDiv.scrollHeight + titleDiv.scrollHeight + (dividers.height * 2) + (POPUP_INFO_PADDING * 10)) > popupInfoBound.height) {
        console.log("Description out of bounds!");
        return true;
    }
    return false;
}

// selectImage reads all data from an image in the InteractivePopup gallery 
// when it's clicked
function selectImage(imgURL, tombstone, description) {
    // Get the HTML fields which contain the image, tombstone, and description
    var mainImageField = document.getElementById("my-popup-image");
    var tombstoneField = document.getElementById("my-popup-tombstone");
    var descriptionField = document.getElementById("my-popup-description");
    var titleField = document.getElementById("my-popup-title");
    if (document.getElementById("my-popup").style.height == "100%") {
        titleField.scrollIntoView({ behavior: "smooth", block: "end" });
    }

    // Inject the data of the selected image into the HTML fields
    mainImageField.innerHTML = '<img id = "specific-image" src = "' + imgURL + '">'
    tombstoneField.innerHTML = '<p>' + tombstone + '</p>'

    // Checking for images without description data to avoid null error
    if (description == null) {
        description = "";
    }
    descriptionField.innerHTML = '<p>' + description + '</br></br></p>';

    // Resetting defaults for scrollability
    disableScroll();
    disableReadMoreButton();
    if (checkOverflow()) {
        // Activate Read More button if checkOverflow returns true
        activateReadMoreButton();
    }
}

// activateImageSelection gives each image in the InteractivePopup gallery
// on-click functionality to be selected
function activateImageSelection(galleryImages, imageArray) {
    var i;
    var tombstoneArray = [];
    var descriptionArray = [];
    for (i = 0; i < galleryImages.length; i++) {
        image = galleryImages[i]
        tombstoneArray.push(imageArray[i].tombstone);
        descriptionArray.push(imageArray[i].description)
        image.addEventListener('click', function() {
            selectImage(this.src, tombstoneArray[parseInt(this.title)], descriptionArray[parseInt(this.title)]);
        });
    }
}

// initGallery sets the initial position of the gallery and resets button states
function initGallery() {
    GALLERY_SLIDE.style.transform = 'translateX(' + (-SIZE * counter) + 'px)';
    darkenBtn(prevBtn);
}

// darkenBtn lowers the visibility of a button when it's rendered inactive
function darkenBtn(btn) {
    btn.style.color = 'darkgray';
    btn.style.opacity = '0.5'
}

// activateBtn increases the visibility of a button when it's rendered active
function activateBtn(btn) {
    btn.style.color = 'white';
    btn.style.opacity = '0.8'
}

// slideNext moves the position of the gallery to the left, simulating
// scrolling through a gallery.
function slideNext() {
    GALLERY_SLIDE.style.transition = "transform 0.4s ease-in-out";
    if (counter < (galleryImages.length - GALLERY_SCROLL_BUFFER)) {
        counter++;
        GALLERY_SLIDE.style.transform = 'translateX(' + (-SIZE * counter) + 'px)';
        activateBtn(prevBtn);
    } else {
        console.log('Last image reached: no next');
    }
    if (counter == (galleryImages.length - GALLERY_SCROLL_BUFFER)) { // Goes one past the final image
        darkenBtn(nextBtn);
    }
}

// slidePrev moves the position of the gallery to the right, simulating
// scrolling through a gallery.
function slidePrev() {
    GALLERY_SLIDE.style.transition = "transform 0.4s ease-in-out";
    if (counter > 0) {
        counter--;
        GALLERY_SLIDE.style.transform = 'translateX(' + (-SIZE * counter) + 'px)';
        activateBtn(nextBtn);
    } else {
        console.log('First image reached: no previous, counter: ' + counter)
    }
    if (counter == 0) {
        darkenBtn(prevBtn);
    }
}