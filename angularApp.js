var app = angular.module('ecoAngular1App',[]);

app.factory('myCars', function(){
  var o = {
    myCars: [
      {vehicleMake: "Audi", vehicleModel: "A3 e-tron", vehicleSpec: "(2014-)"},
      {vehicleMake: "Audi", vehicleModel: "Q7 e-Tron", vehicleSpec: "(2015-)"},
      {vehicleMake: "Nissan", vehicleModel: "e-NV200 Combi", vehicleSpec: "(2015-)"},
      {vehicleMake: "Nissan", vehicleModel: "e-NV200 Evalia", vehicleSpec: "(2015-)"},
      {vehicleMake: "Nissan", vehicleModel: "e-NV200 van", vehicleSpec: "(2014-)"},
      {vehicleMake: "Ford", vehicleModel: "C-MAX Energi", vehicleSpec: "(2014-)"},
      {vehicleMake: "Ford", vehicleModel: "Focus EV", vehicleSpec: "(2014-)"},
      {vehicleMake: "Ford", vehicleModel: "Fusion Energi", vehicleSpec: "(2015-)"}
    ]
  };
    return o;
});

app.factory('myDetails', ['$http', '$q', function($http, $q){

  var o = {
    myDetails:{
    "name": "My location",
    "latitude": "",
    "vehicleMake": "",
    "vehicleModel": "",
    "vehicleSpec": "",
    "longitude": ""
    }
  };

  o.set_car = function(selectedCar){
    console.log("hello, in factory! selectedCar:", selectedCar);
    o.myDetails.vehicleMake = selectedCar.vehicleMake;
    o.myDetails.vehicleModel = selectedCar.vehicleModel;
    o.myDetails.vehicleSpec = selectedCar.vehicleSpec;
  };

  o.getMyCoords = function(){
    var deferred = $q.defer();

    // var instructionEl = document.getElementById("instruction");

    if (navigator.geolocation) {
      console.log("Finding your location...");
      // instructionEl.innerHTML = "<span class='animated fadeIn'>Finding your location...</span>";
    navigator.geolocation.getCurrentPosition(showPosition, showError);
    } else {
        console.log("Geolocation is not supported by this browser.");
        // instructionEl.innerHTML = "Geolocation is not supported by this browser.";
    }
    function showPosition(position){
      console.log("your coords found:", position.coords);
      deferred.resolve(position.coords);
      // console.log("latlng:", position.coords.latitude+ " " + position.coords.longitude );
      // o.myDetails.latitude = position.coords.latitude;
      // o.myDetails.longitude = position.coords.longitude;
      // instructionEl.innerHTML = "<span class='animated fadeIn'>Got your location.</span>";
    }
    function showError(error) {
      deferred.reject();
      switch(error.code) {
        case error.PERMISSION_DENIED:
            instructionEl.innerHTML = "User denied the request for Geolocation.";
            break;
        case error.POSITION_UNAVAILABLE:
            instructionEl.innerHTML = "Location information is unavailable.";
            break;
        case error.TIMEOUT:
            instructionEl.innerHTML = "The request to get user location timed out.";
            break;
        case error.UNKNOWN_ERROR:
            instructionEl.innerHTML = "An unknown error occurred.";
            break;
      }
    }
    return deferred.promise;
  };
  return o;
}]);

app.service('myMap', ['$q', function($q) {
    var o = {};
    o.init = function() {
      var centerOfUK = new google.maps.LatLng(55.378051,-3.435973);
      var mapCanvas = document.getElementById("map");
      var options = {
          center: centerOfUK,
          zoom: 6,
          disableDefaultUI: true
      };
      o.map = new google.maps.Map(mapCanvas, options);
      o.directionsService = new google.maps.DirectionsService;
      o.directionsDisplay = new google.maps.DirectionsRenderer;
      o.places = new google.maps.places.PlacesService(o.map);

    };

    o.center = function(latitude, longitude){
      //zoom map and center it to my location.
      o.map.setZoom(9);
      o.map.setCenter({lat: latitude, lng: longitude});
    };
    o.search = function(str) {
        var d = $q.defer();
        o.places.textSearch({query: str}, function(results, status) {
            if (status == 'OK') {
                d.resolve(results[0]);
            }
            else d.reject(status);
        });
        return d.promise;
    };

    o.create_marker = function(myLocatObj) {
      // if(o.marker) o.marker.setMap(null);
        var infoWindow = new google.maps.InfoWindow();
        var marker = new google.maps.Marker({
            map: o.map,
            position: new google.maps.LatLng(myLocatObj.latitude, myLocatObj.longitude),
            animation: google.maps.Animation.DROP,
            title: myLocatObj.name
        });

        // Create & place an info window for the location.
          var contentStr = '<div class="infowindow">';
          // if (message) {
          //   contentStr +=message+'<br>';
          // }
          // if (myLocatObj.name) {
          //   contentStr +='<h2 class="narrow">'+myLocatObj.name+'</h2>';
          // }
          if (myLocatObj.pumpModel) {
            contentStr +='<h4 class="narrow">'+myLocatObj.pumpModel+'</h4>';
          }
          if (myLocatObj.location) {
            contentStr +='<h3 class="narrow">'+myLocatObj.location+'</h3>';
          }
          if (myLocatObj.postcode) {
            contentStr +='<h3 class="narrow">'+myLocatObj.postcode+'</h3>';
          }
          if (myLocatObj.distance) {
            contentStr +='<h3 class="narrow">Distance: '+(myLocatObj.distance).toFixed(1)+' Miles</h3>';
          }
          if (myLocatObj.postcode) {
            contentStr +='<button id="getDirectionBtn" class="btn">Get Directions</button><br/>';
          }
        marker.content = contentStr;

        google.maps.event.addListener(marker, 'click', function(){
            infoWindow.setContent('<h2>' + marker.title + '</h2>' +
              marker.content);
            infoWindow.open(o.map, marker);
        });
    };

    o.place_markers = function(locations) {
      o.markers = [];
      // o.directionsDisplay.setMap(null);
      console.log("locations for markers:", locations);
      locations.forEach(function(locationObj){
      console.log("location for each marker:", locationObj);
      o.create_marker(locationObj);
      o.markers.push(marker);
    });
    };

  return o;
}]);

app.factory('chargingStations', ['$http', function($http){
  var o = {
    chargingStations: []
  };

  o.getAll = function(myCarData) {
    var settings = {
      "async": true,
      "crossDomain": true,
      "url": "https://www.ecotricity.co.uk/api/ezx/v1/getPumpList",
      "method": "POST",
      "headers": {
        "content-type": "application/x-www-form-urlencoded",
        "cache-control": "no-cache",
        "postman-token": "ec4aa429-88ca-69b6-6ab8-4294860adf93"
      },
      "data": $.param(myCarData)
    };
    return $http(settings).then(function(data){
      console.log("response:", data.data.result);
      angular.copy(data.data.result, o.chargingStations);
    }, function(err){
      console.log("error", err);
    });
  };
  return o;
}]);

app.controller('mainCtrl',[
    'chargingStations', 'myDetails', 'myMap', 'myCars',
    function(chargingStations, myDetails, myMap, myCars ){
      var self = this;
      myMap.init();
      self.searchedOrigin = {};
      self.findMyLocation = function(){
        myDetails.getMyCoords()
        .then(function setCoords(coordsData){
          console.log(coordsData);
          myDetails.myDetails.latitude = coordsData.latitude;
          myDetails.myDetails.longitude = coordsData.longitude;
          myMap.center(coordsData.latitude, coordsData.longitude);
          myMap.create_marker(myDetails.myDetails);
        });
      };
      self.search = function(){
        console.log("In controller, searchPlace:", self.searchPlace);
        self.apiError = false;
          myMap.search(self.searchPlace)
          .then(
              function(res) { // success
                  console.log("search res:", res);
                  self.searchedOrigin.name = res.name;
                  self.searchedOrigin.latitude = res.geometry.location.lat();
                  self.searchedOrigin.longitude = res.geometry.location.lng();
                  myMap.center(self.searchedOrigin.latitude, self.searchedOrigin.longitude);
                  myMap.create_marker(self.searchedOrigin);
              },
              function(status) { // error
                  self.apiError = true;
                  self.apiStatus = status;
              }
          );

      };

      self.listOfCars = myCars.myCars;
      self.select_car = function(selectedCar){
        console.log("myDetails:", myDetails);
        console.log("hello, in controller! selectedCar:", selectedCar);
        myDetails.set_car(selectedCar);
        // myDetails.getMyCoords();
        // chargingStations.getAll(myDetails.myDetails);
        // self.list = chargingStations.chargingStations;
        // myMap.place_markers(self.list);
      };

      // chargingStations.getAll(myDetails);
      // self.list = chargingStations.chargingStations;
    }
]);
