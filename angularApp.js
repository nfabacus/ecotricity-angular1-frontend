var app = angular.module('ecoAngular1App',[]);

app.config(['$compileProvider', function ($compileProvider) {
    $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|local|data|chrome-extension):/);
}]);

app.directive('directoryBrand', function(){
  return {
    templateUrl: 'directory-brand.html'
  };
});
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
    "name": "",
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

  o.get_myCoords = function(){
    var deferred = $q.defer();

    if (navigator.geolocation) {
      console.log("Finding your location...");
      navigator.geolocation.getCurrentPosition(show_position, show_error);
    } else {
      console.log("Geolocation is not supported by this browser.");
    }
    function show_position(position){
      console.log("your coords found:", position.coords);
      deferred.resolve(position.coords);
    }
    function show_error(error) {
      deferred.reject();
      switch(error.code) {
        case error.PERMISSION_DENIED:
            document.getElementById('errorMessage').innerHTML = "User denied the request for Geolocation.";
            break;
        case error.POSITION_UNAVAILABLE:
            document.getElementById('errorMessage').innerHTML = "Location information is unavailable.";
            break;
        case error.TIMEOUT:
            document.getElementById('errorMessage').innerHTML = "The request to get user location timed out.";
            break;
        case error.UNKNOWN_ERROR:
            document.getElementById('errorMessage').innerHTML = "An unknown error occurred.";
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
    o.markers = [];
    o.htmlElm ="";
    o.compiled =[];
    o.infoWindow = new google.maps.InfoWindow();
    var centerOfUK = new google.maps.LatLng(55.378051,-3.435973);
    var mapCanvas = document.getElementById("map");
    var options = {
        center: centerOfUK,
        zoom: 6,
        disableDefaultUI: false
    };
    o.map = new google.maps.Map(mapCanvas, options);
    o.places = new google.maps.places.PlacesService(o.map);
  };

  o.center = function(latitude, longitude){
    o.map.setZoom(9);
    o.map.setCenter({lat: latitude, lng: longitude});
  };
  o.textSearch = function(str) {
      var deferred = $q.defer();
      o.places.textSearch({query: str}, function(results, status) {
          if (status == 'OK') {
              deferred.resolve(results[0]);
          }
          else deferred.reject(status);
      });
      return deferred.promise;
  };

  o.select_markerIcon = function(pumpModel){
    console.log("pumbModel:", pumpModel);
    var iconImg ="";
    switch(pumpModel) {
      case "DC (CHAdeMO) / CCS":
        iconImg = "library/images/pin-acdc-dc.png";
        break;
      case "AC (RAPID) / DC (CHAdeMO)":
        iconImg = "library/images/pin-dcac-ac.png";
        break;
        case "AC (RAPID)":
          iconImg = "library/images/pin-ac.png";
          break;
      case "AC (Medium)":
        iconImg = "library/images/pin-ac.png";
        break;
      case "DC (CHAdeMO)":
        iconImg = "library/images/pin-acdc.png";
        break;
      case "CCS":
        iconImg = "library/images/pin-dc.png";
        break;
      default:
    }
    return iconImg;
  };

  o.place_myLocMarker = function(location, marker){
    if(o.myLocMarker) {
      o.clear_marker(o.myLocMarker);
      o.clear_markers(o.markers);
    }
    o.myLocMarker = marker;
  };

  o.clear_marker = function(marker){
    marker.setMap(null);
  };
  o.clear_markers = function(markers){
    markers.forEach(function(marker){
      o.clear_marker(marker);
    });
    o.markers = [];
  };
  o.calculateAndDisplayRoute = function(origin, destination) {
    // Clear past route.
    document.getElementById("directionsPanel").innerHTML = "";

    var mapCenter = new google.maps.LatLng(origin.latitude, origin.longitude);
    var mapCanvas = document.getElementById("directionsMap");
    var options = {
        center: mapCenter,
        zoom: 6,
        disableDefaultUI: false
    };
    o.directionsMap = new google.maps.Map(mapCanvas, options);
    o.directionsService = new google.maps.DirectionsService;
    o.directionsDisplay = new google.maps.DirectionsRenderer;

    o.directionsDisplay.setMap(o.directionsMap);
    o.directionsDisplay.setPanel(document.getElementById('directionsPanel'));
    o.directionsService.route({
      origin: origin.latitude+","+origin.longitude,
      destination: destination,
      travelMode: 'DRIVING',
      unitSystem: google.maps.UnitSystem.IMPERIAL
    }, function(response, status) {
      if (status === 'OK') {
        o.directionsDisplay.setDirections(response);
      } else {
        window.alert('Directions request failed due to ' + status);
      }
    });
  };
  return o;
}]);

app.factory('chargingStations', ['$q','$http', function($q, $http){
  var o = {
    chargingStations: []
  };

  o.get_10Stations = function(myCarData) {
    var deferred = $q.defer();
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
    console.log("get_10Stations param data:", settings.data);
    $http(settings).then(function(data){
      console.log("response:", data.data.result);
      deferred.resolve(data.data.result);
    }, function(err){
      deferred.reject();
      console.log("error", err);
    });
    return deferred.promise;
  };

  o.get_pumpDetails = function(locatObj, mydetails){
    console.log("locatObj:", locatObj);
    console.log("mydetails:", mydetails);
    var deferred = $q.defer();
    var settings = {
      "async": true,
      "crossDomain": true,
      "url": "https://www.ecotricity.co.uk/api/ezx/v1/getLocationDetails",
      "method": "POST",
      "headers": {
        "content-type": "application/x-www-form-urlencoded",
        "cache-control": "no-cache",
        "postman-token": "10b6d71a-a038-1043-76cf-d80c5aa3005f"
      },
      "data": $.param({
        vehicleSpecification: mydetails.vehicleSpec,
        vehicleModel: mydetails.vehicleModel,
        locationId: locatObj.locationId,
        vehicleMake: mydetails.vehicleMake
      })
    };
    $http(settings).then(function(data){
      console.log("response for pump details:", data.data.result.pump);
      deferred.resolve(data.data.result.pump);
    }, function(err){
      deferred.reject();
      console.log("error", err);
    });
    return deferred.promise;
  };
  return o;
}]);

app.controller('mainCtrl',[
    'chargingStations', 'myDetails', 'myMap', 'myCars', '$timeout', '$scope', '$compile', function(chargingStations, myDetails, myMap, myCars, $timeout, $scope, $compile ){
      var self = this;
      self.reset = function() {
        self.selectedCar = null;
        self.loading = false;
        self.message = null;
        self.searchPlace = "";
        self.list = null;
        myDetails.myDetails = {};
        chargingStations.chargingStations = [];
        self.stationDetails = null;
        self.menuMode = true;
        self.mapMode = false;
        self.stationPanelMode = false;
        myMap.init();
        $('body').scrollTop(0);
        $('.menuBox').scrollTop(0);
      };
      self.reset();

      self.find_myLocation = function(){
        if(!myDetails.myDetails.vehicleMake ||!myDetails.myDetails.vehicleModel ||!myDetails.myDetails.vehicleSpec){
          self.message = "Please select your car first.";
          $timeout(function(){
            self.message = null;
          }, 2000);
        } else {
          self.message = "Finding your location...";
          self.loading = true;
          myDetails.get_myCoords()
          .then(
            function set_coords(coordsData){ //success
              console.log(coordsData);
              self.message = "Got your location.";
              self.loading = false;
              myDetails.myDetails.name = "My location";
              myDetails.myDetails.latitude = coordsData.latitude;
              myDetails.myDetails.longitude = coordsData.longitude;
              myMap.center(coordsData.latitude, coordsData.longitude);
              var myMarker = self.create_marker(myDetails.myDetails);
              myMap.place_myLocMarker(myDetails.myDetails, myMarker);
              $timeout(function(){
                self.message = null;
              }, 2000);
              self.find_stations();
          });
        }
      };
      self.search = function(){
        if(!myDetails.myDetails.vehicleMake ||!myDetails.myDetails.vehicleModel ||!myDetails.myDetails.vehicleSpec){
          self.message = "Please select your car first.";
          $timeout(function(){
            self.message = null;
          }, 2000);
        } else {
          self.message = "Finding your location...";
          self.loading = true;
          console.log("In controller, searchPlace:", self.searchPlace);
          self.apiError = false;
            myMap.textSearch(self.searchPlace)
            .then(
                function(res) { // success
                  self.message = "Got your location.";
                  self.loading = false;
                  myDetails.myDetails.name = res.name;
                  myDetails.myDetails.latitude = res.geometry.location.lat();
                  myDetails.myDetails.longitude = res.geometry.location.lng();

                  myMap.center(myDetails.myDetails.latitude, myDetails.myDetails.longitude);
                  var searchMarker = self.create_marker(myDetails.myDetails);
                  myMap.place_myLocMarker(myDetails.myDetails, searchMarker);
                  $timeout(function(){
                    self.message = null;
                  }, 2000);
                  self.find_stations();
                },
                function(status) { // error
                    self.apiError = true;
                    self.apiStatus = status;
                }
            );
          }
      };

      self.listOfCars = myCars.myCars;
      self.select_car = function(selectedCar){
        console.log("myDetails:", myDetails);
        console.log("hello, in controller! selectedCar:", selectedCar);
        self.selectedCar = selectedCar.vehicleMake+" "+selectedCar.vehicleModel+" "+selectedCar.vehicleSpec;
        myDetails.set_car(selectedCar);
      };

      self.find_stations = function(){
        self.apiError = false;
        if(!myDetails.myDetails.name || !myDetails.myDetails.latitude || !myDetails.myDetails.longitude || !myDetails.myDetails.vehicleMake ||!myDetails.myDetails.vehicleModel ||!myDetails.myDetails.vehicleSpec){

          self.message = "Please select your car and location first.";
          $timeout(function(){
            self.message = null;
          }, 2000);
        } else {
          self.menuMode = false;
          self.stationPanelMode = false;
          self.mapMode = true;
          self.message = "Searching 10 charging stations nearest to you...";
          self.loading = true;
          chargingStations.get_10Stations(myDetails.myDetails)
          .then(
            function(res) { //success
              self.message = "Found 10 nearest charging stations.";
              self.loading = false;
              self.list = res;
              console.log("LIST(should have no duplicate station):", self.list);
              angular.copy(res, chargingStations.chargingStations);
              console.log("in get_10Stations, chargingStations:", chargingStations.chargingStations);
              console.log("myMap:", myMap);
              chargingStations.chargingStations.forEach(function(station, index){
                console.log("index inside charginstations.foreach:", index);
                chargingStations.get_pumpDetails(station, myDetails.myDetails).then(
                  function(res) {
                    console.log("index inside get_pumpDetails:", index);
                    chargingStations.chargingStations[index].pumpDetails = res;

                    console.log("charginStations.charginStations[index]:", chargingStations.chargingStations[index]);
                    console.log("res", res);
                    var marker = self.create_marker(chargingStations.chargingStations[index]);
                    myMap.markers[index]=marker;
                  },
                  function(status) { // error
                    self.apiError = true;
                    self.apiStatus = status;
                  }
                );

              });
              $timeout(function(){
                self.message = null;
              }, 2500);
            },
            function(status) { // error
              self.apiError = true;
              self.apiStatus = status;
            }
          );
        }
      };


      // Create markers for charging stations on the map
      self.select_markerIcon = function(pumpModel){
        return myMap.select_markerIcon(pumpModel);
      };

      self.create_marker = function(locatObj) {
        locatObj.markerIcon = myMap.select_markerIcon(locatObj.pumpModel);
        console.log("In create_marker,");
        console.log("locatObj:", locatObj);
        var marker = new google.maps.Marker({
              map: myMap.map,
              position: new google.maps.LatLng(locatObj.latitude, locatObj.longitude),
              animation: google.maps.Animation.DROP,
              title: locatObj.name,
              icon: locatObj.markerIcon
        });

        // Create & place an info window for the location.
        var content = '<div class="infowindow">';

        if(locatObj.name){
          content += '<h2>' + marker.title + '</h2>';
        }

        if (locatObj.pumpModel) {
          content +='<h4 class="narrow">'+locatObj.pumpModel+'</h4>';
        }
        if (locatObj.location) {
          content +='<h3 class="narrow">'+locatObj.location+'</h3>';
        }
        if (locatObj.postcode) {
          content +='<h3 class="narrow">'+locatObj.postcode+'</h3>';
        }
        if (locatObj.distance) {
          content +='<h3 class="narrow">Distance: '+(locatObj.distance).toFixed(1)+' Miles</h3>';
        }
        if (locatObj.postcode) {
          content +='<button class="btn" ng-click="mCtrl.open_stationPanel('+locatObj.locationId+')">Details</button><br/>';
        }

        content +="</div>";

        var compiled = $compile(content)($scope);

        google.maps.event.addListener(
          marker,
          'click',
          function(){
                console.log("compiled var in myMap service after click", compiled[0]);
                myMap.infoWindow.setContent( compiled[0]);
                myMap.infoWindow.open( myMap.map, marker );
        });

        return marker;
      };

      self.open_InfoWindowByMarkerIndex = function(index) {
        console.log("index in infoWindow:", index);
        console.log("myMap.markers array in infoWindow:", myMap.markers);
        google.maps.event.trigger(myMap.markers[index], 'click');
      };

      self.open_stationPanel = function(locationId){
        console.log("open Station Panel!! locationId is ", locationId);
       self.stationDetails = chargingStations.chargingStations.filter(function(station){
          return station.locationId === String(locationId);
        })[0];
        console.log("stationDetails with (more than 1) pumpS details:", self.stationDetails);
        self.menuMode = false;
        self.mapMode = false;
        self.stationPanelMode = true;

      };

      self.close_stationPanel = function(){
        console.log("closed Station Panel!!");
        self.stationPanelMode = false;
        self.menuMode = false;
        self.mapMode = true;
      };

      self.get_directions = function(){
        var myLatiLong = {latitude: myDetails.myDetails.latitude, longitude: myDetails.myDetails.longitude};
        myMap.calculateAndDisplayRoute(myLatiLong, self.stationDetails.postcode);
      };

    }
]);
