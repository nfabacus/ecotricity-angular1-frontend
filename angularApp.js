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

  o.getMyCoords = function(){
    var deferred = $q.defer();

    if (navigator.geolocation) {
      console.log("Finding your location...");
      navigator.geolocation.getCurrentPosition(showPosition, showError);
    } else {
      console.log("Geolocation is not supported by this browser.");
    }
    function showPosition(position){
      console.log("your coords found:", position.coords);
      deferred.resolve(position.coords);
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

    o.markers = [];
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

  o.create_marker = function(locatObj) {
    locatObj.markerIcon = o.select_markerIcon(locatObj.pumpModel);
    console.log("In create_marker,");
    console.log("locatObj:", locatObj);
    var infoWindow = new google.maps.InfoWindow();
    var marker = new google.maps.Marker({
          map: o.map,
          position: new google.maps.LatLng(locatObj.latitude, locatObj.longitude),
          animation: google.maps.Animation.DROP,
          title: locatObj.name,
          icon: locatObj.markerIcon
    });

    // Create & place an info window for the location.
    var contentStr = '<div class="infowindow">';

    if (locatObj.pumpModel) {
      contentStr +='<h4 class="narrow">'+locatObj.pumpModel+'</h4>';
    }
    if (locatObj.location) {
      contentStr +='<h3 class="narrow">'+locatObj.location+'</h3>';
    }
    if (locatObj.postcode) {
      contentStr +='<h3 class="narrow">'+locatObj.postcode+'</h3>';
    }
    if (locatObj.distance) {
      contentStr +='<h3 class="narrow">Distance: '+(locatObj.distance).toFixed(1)+' Miles</h3>';
    }
    if (locatObj.postcode) {
      contentStr +='<button id="getDirectionBtn" class="btn">Get Directions</button><br/>';
    }
    if (locatObj.pumpDetails){
      locatObj.pumpDetails.forEach(function(pumpObj){
        var pumpStr ="<div class='pumpDiv'>"
        pumpObj.connector.forEach(function(connector){
          var connectorStr =
            "<div class='connectorDiv'>"+
            "<img src='"+o.select_markerIcon(connector.type)+"' />"+
            "<h4>Connector "+connector.connectorId+": "+connector.name+"</h4>"+
            "<p>Compatibility with your car: "+connector.compatible+"</p>"+
            "<p>Availability: "+connector.status+"</p>"+
            "<p>Session Duration: "+connector.sessionDuration+" mins</p>"+
            "</div>";
          pumpStr += connectorStr;
        });
          pumpStr +="</div>";
          contentStr += pumpStr;
      });
    }

    marker.content = contentStr;

    google.maps.event.addListener(marker, 'click', function(){
        infoWindow.setContent('<h2>' + marker.title + '</h2>' +
          marker.content);
        infoWindow.open(o.map, marker);
    });
    return marker;
  };

  o.place_myLocMarker = function(location){
    if(o.myLocMarker) {
      o.clear_marker(o.myLocMarker);
      o.clear_markers(o.markers);
    }
    o.myLocMarker = o.create_marker(location);
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
  return o;
}]);

app.factory('chargingStations', ['$q','$http', function($q, $http){
  var o = {
    chargingStations: []
  };

  o.getAll = function(myCarData) {
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
    console.log("getAll param data:", settings.data);
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
    var contentStr;
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
    'chargingStations', 'myDetails', 'myMap', 'myCars',
    function(chargingStations, myDetails, myMap, myCars ){
      var self = this;
      myMap.init();
      $('.menuBox').scrollTop(0);
      // self.searchedOrigin = {};
      self.findMyLocation = function(){
        myDetails.getMyCoords()
        .then(function setCoords(coordsData){
          console.log(coordsData);
          myDetails.myDetails.name = "My location";
          myDetails.myDetails.latitude = coordsData.latitude;
          myDetails.myDetails.longitude = coordsData.longitude;
          myMap.center(coordsData.latitude, coordsData.longitude);
          myMap.place_myLocMarker(myDetails.myDetails);
        });
      };
      self.search = function(){
        console.log("In controller, searchPlace:", self.searchPlace);
        self.apiError = false;
          myMap.textSearch(self.searchPlace)
          .then(
              function(res) { // success
                  myDetails.myDetails.name = res.name;
                  myDetails.myDetails.latitude = res.geometry.location.lat();
                  myDetails.myDetails.longitude = res.geometry.location.lng();

                  myMap.center(myDetails.myDetails.latitude, myDetails.myDetails.longitude);
                  myMap.place_myLocMarker(myDetails.myDetails);
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
      };

      self.findStations = function(){
        self.apiError = false;
        if(!myDetails.myDetails.name || !myDetails.myDetails.latitude || !myDetails.myDetails.longitude || !myDetails.myDetails.vehicleMake ||!myDetails.myDetails.vehicleModel ||!myDetails.myDetails.vehicleSpec){
          console.log("clicked but some detail is missing");
        } else {
          chargingStations.getAll(myDetails.myDetails)
          .then(
            function(res) { //success
              self.list = res;
              angular.copy(res, chargingStations.chargingStations);
              console.log("in getAll, chargingStations:", chargingStations.chargingStations);
              console.log("myMap:", myMap);
              chargingStations.chargingStations.forEach(function(station, index){
                chargingStations.get_pumpDetails(station, myDetails.myDetails).then(
                  function(res) {
                    chargingStations.chargingStations[index].pumpDetails = res;

                    console.log("index", index);
                    console.log("charginStations.charginStations[index]:", chargingStations.chargingStations[index]);
                    console.log("res", res);
                    var marker = myMap.create_marker(chargingStations.chargingStations[index]);
                    myMap.markers.push(marker);

                  },
                  function(status) { // error
                    self.apiError = true;
                    self.apiStatus = status;
                  }
                );

              });
            },
            function(status) { // error
              self.apiError = true;
              self.apiStatus = status;
            }
          );
        }
      };
    }
]);
