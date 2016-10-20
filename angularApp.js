var app = angular.module('ecoAngular1App',[]);

app.factory('myDetails', ['$http', function($http){

  var o = {
    myDetails:{
    "latitude": "55.378051",
    "vehicleMake": "",
    "vehicleModel": "",
    "vehicleSpec": "",
    "longitude": "-3.435973"
    }
  };

  o.set_car = function(selectedCar){
    console.log("hello, in factory! selectedCar:", selectedCar);
    o.myDetails.vehicleMake = selectedCar.vehicleMake;
    o.myDetails.vehicleModel = selectedCar.vehicleModel;
    o.myDetails.vehicleSpec = selectedCar.vehicleSpec;
  };

  o.getMyCoords = function(){
    var instructionEl = document.getElementById("instruction");
    if (navigator.geolocation) {
      instructionEl.innerHTML = "<span class='animated fadeIn'>Finding your location...</span>";
    navigator.geolocation.getCurrentPosition(showPosition, showError);
    } else {
        instructionEl.innerHTML = "Geolocation is not supported by this browser.";
    }
    function showPosition(position){
      console.log("latlng:", position.coords.latitude+ " " + position.coords.longitude );
      o.myDetails.latitude = position.coords.latitude;
      o.myDetails.longitude = position.coords.longitude;
      instructionEl.innerHTML = "<span class='animated fadeIn'>Got your location.</span>";
    }
    function showError(error) {
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

app.service('myMap', [function($q) {
    var o = {};
    o.init = function() {
      var centerOfUK = new google.maps.LatLng(53.4,-1.45);
      var mapCanvas = document.getElementById("map");
      var options = {
          center: centerOfUK,
          zoom: 6,
          disableDefaultUI: true
      };
      o.map = new google.maps.Map(
          document.getElementById("map"), options
      );
      o.directionsService = new google.maps.DirectionsService;
      o.directionsDisplay = new google.maps.DirectionsRenderer;
      o.places = new google.maps.places.PlacesService(o.map);
      o.map = new google.maps.Map(mapCanvas, options);
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

    o.addMarker = function(res) {
        if(o.marker) o.marker.setMap(null);
        o.marker = new google.maps.Marker({
            map: o.map,
            position: res.geometry.location,
            animation: google.maps.Animation.DROP
        });
        this.map.setCenter(res.geometry.location);
    };
  return o;
}]);

// app.controller('newPlaceCtrl', [
//     'myMap',
//     function(myMap) {
//       myMap.init();
//       var self= this;
//       console.log("hello");
//       self.place = {};
//       self.search = function() {
//           self.apiError = false;
//           myMap.search(self.searchPlace)
//           .then(
//               function(res) { // success
//                   myMap.addMarker(res);
//                   self.place.name = res.name;
//                   self.place.lat = res.geometry.location.lat();
//                   self.place.lng = res.geometry.location.lng();
//               },
//               function(status) { // error
//                   self.apiError = true;
//                   self.apiStatus = status;
//               }
//           );
//       };
//
//     self.send = function() {
//         alert(self.place.name + ' : ' + self.place.lat + ', ' + self.place.lng);
//     };
//
// }]);


app.controller('mainCtrl',[
    'chargingStations', 'myDetails', 'myMap',
    function(chargingStations, myDetails, myMap ){
      var self = this;
      myMap.init();
      self.listOfCars = [
        {vehicleMake: "Audi", vehicleModel: "A3 e-tron", vehicleSpec: "(2014-)"},
        {vehicleMake: "Audi", vehicleModel: "Q7 e-Tron", vehicleSpec: "(2015-)"},
        {vehicleMake: "Nissan", vehicleModel: "e-NV200 Combi", vehicleSpec: "(2015-)"},
        {vehicleMake: "Nissan", vehicleModel: "e-NV200 Evalia", vehicleSpec: "(2015-)"},
        {vehicleMake: "Nissan", vehicleModel: "e-NV200 van", vehicleSpec: "(2014-)"},
        {vehicleMake: "Ford", vehicleModel: "C-MAX Energi", vehicleSpec: "(2014-)"},
        {vehicleMake: "Ford", vehicleModel: "Focus EV", vehicleSpec: "(2014-)"},
        {vehicleMake: "Ford", vehicleModel: "Fusion Energi", vehicleSpec: "(2015-)"}
      ];
      self.select_car = function(selectedCar){
        console.log("myDetails:", myDetails);
        console.log("hello, in controller! selectedCar:", selectedCar);
        myDetails.set_car(selectedCar);
        myDetails.getMyCoords();
        chargingStations.getAll(myDetails.myDetails);
        self.list = chargingStations.chargingStations;
      };

      self.markers = [];

      var infoWindow = new google.maps.InfoWindow();
      var createMarker = function(info) {
        var marker = new google.maps.Marker({
          map: myMap.map,
          position: new google.maps.LatLng(info.lat, info.long),
          title: info.place
        });
        marker.content = '<div class="infoWindowContent">' + info.desc + '<br />' + info.lat + ' E,' + info.long +  ' N, </div>';

        google.maps.event.addListener(marker, 'click', function(){
            infoWindow.setContent('<h2>' + marker.title + '</h2>' +
              marker.content);
            infoWindow.open(myMap.map, marker);
        });

        self.markers.push(marker);

      };

      // chargingStations.getAll(myDetails);
      // self.list = chargingStations.chargingStations;
    }
]);
