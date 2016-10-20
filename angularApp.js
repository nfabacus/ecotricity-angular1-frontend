var app = angular.module('ecoAngular1App',[]);

app.factory('myDetails', ['$http', function($http){

  var o = {
    "latitude": "55.378051",
    "vehicleMake": "",
    "vehicleModel": "",
    "vehicleSpec": "",
    "longitude": "-3.435973"
  };

  o.set_car = function(selectedCar){
    console.log("hello, in factory! selectedCar:", selectedCar);
    // o.vehicleMake = selectedCar.vehicleMake;
    // o.vehicleModel = selectedCar.vehicleModel;
    // o.vehicleSpec = selectedCar.vehicleSpec;
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

app.service('Map', [function($q) {

    this.init = function() {
        var options = {
            center: new google.maps.LatLng(55.378051, -3.435973),
            zoom: 10,
            disableDefaultUI: true
        };
        this.map = new google.maps.Map(
            document.getElementById("map"), options
        );
        this.places = new google.maps.places.PlacesService(this.map);
    };

    this.search = function(str) {
        var d = $q.defer();
        this.places.textSearch({query: str}, function(results, status) {
            if (status == 'OK') {
                d.resolve(results[0]);
            }
            else d.reject(status);
        });
        return d.promise;
    };

    this.addMarker = function(res) {
        if(this.marker) this.marker.setMap(null);
        this.marker = new google.maps.Marker({
            map: this.map,
            position: res.geometry.location,
            animation: google.maps.Animation.DROP
        });
        this.map.setCenter(res.geometry.location);
    };

}]);

app.controller('newPlaceCtrl', [
    'Map',
    function(Map) {
      var self= this;
      console.log("hello");
      self.place = {};
      self.search = function() {
          self.apiError = false;
          Map.search(self.searchPlace)
          .then(
              function(res) { // success
                  Map.addMarker(res);
                  self.place.name = res.name;
                  self.place.lat = res.geometry.location.lat();
                  self.place.lng = res.geometry.location.lng();
              },
              function(status) { // error
                  self.apiError = true;
                  self.apiStatus = status;
              }
          );
      };

    self.send = function() {
        alert(self.place.name + ' : ' + self.place.lat + ', ' + self.place.lng);
    };

    Map.init();
}]);


app.controller('mainCtrl',[
    'chargingStations', 'myDetails',
    function(chargingStations, myDetails ){
      var self = this;

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
        chargingStations.getAll(myDetails);
        self.list = chargingStations.chargingStations;
      };

      // chargingStations.getAll(myDetails);
      // self.list = chargingStations.chargingStations;
    }
]);
