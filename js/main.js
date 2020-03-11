'use strict';

require([
	"esri/layers/FeatureLayer",
	"esri/layers/GraphicsLayer",
	"esri/Basemap",
	"esri/Map",
	"esri/views/MapView",
	"esri/tasks/QueryTask",
	"esri/tasks/support/Query",
	"esri/Graphic",
	"esri/geometry/Extent",
	"dojo/on",
	"d3/d3.v4.min",
	"esri/widgets/Home",
	"esri/widgets/Locate"
], function(FeatureLayer, GraphicsLayer, Basemap, Map, MapView, QueryTask, QueryParameters, Graphic, GeoExtent, on, d3, Home, Locate) {

	// Paste the URL here.
	var hospital_url = '';

	var template = { // autocasts as new PopupTemplate()
		title: "{NAME}",
		content: [{
			type: "fields",
			fieldInfos: [{
				fieldName: "STATE_NAME",
				label: "State",
				visible: true,
			}]
		}]
	};

	var feature_layer = new FeatureLayer({
		url: hospital_url,
		popupTemplate: template,
		renderer: {
			type: "simple",
			symbol: {
				type: "simple-marker",
				size: 6,
				color: "yellow"
			}
		},
		visible: false
	});

	var display_layer = new GraphicsLayer();

	var map = new Map({
		basemap: "streets",
		layers: [feature_layer, display_layer]
	});

	var view = new MapView({
		container: "viewDiv",
		map: map,
		zoom: 5,
		center: [-95, 40]
	});

    var locate_me = new Locate({
        view: view
    });
    view.ui.add(locate_me, "top-left");

    var home = new Home({
       view: view
    });
    view.ui.add(home, "top-left");

	var query_task = new QueryTask({
		url: hospital_url + '/0'
	});

	var query_params = new QueryParameters({
		where: "1=1",
		returnGeometry: true,
		outFields: ["*"],
		units: 'miles'
	});

	function add_graphics(feature_array) {
		var graphics_array = [];
		for (var i = 0; i < feature_array.length; i++) {
			var new_graphic = new Graphic({
				attributes: {"NAME": feature_array[i].attributes.NAME, "STATE_NAME": feature_array[i].attributes.STATE_NAME},
				geometry: feature_array[i].geometry,
                symbol: {
                    type: "simple-marker",
                    color: 'blue',
                    size: 4,
                    outline: {
                        color: 'black',
                        width: 1  // Set to zero to hide outline
                    }
                },
                popupTemplate: template
			});
			graphics_array.push(new_graphic);
		}
		display_layer.addMany(graphics_array);
	}

    function zoom_extent(response) {
        display_layer.when(function () {
            var x_extent = d3.extent(response.features, function (d) {
                return d.geometry.x;
            });
            var y_extent = d3.extent(response.features, function (d) {
                return d.geometry.y;
            });
            var margin = 100;  // feet
            var new_extent = new GeoExtent({
                spatialReference: response.spatialReference,
                xmin: x_extent[0] - margin,
                xmax: x_extent[1] + margin,
                ymin: y_extent[0] - margin,
                ymax: y_extent[1] + margin
            });
            view.goTo(new_extent, {duration: 500});  // Go to the new extent in this much time (in mili-sec; animation).
        });
    }

	on($("#search"),"click", function(evt){
		display_layer.removeAll();
		var state = $("#state")[0].value;
		query_params.where = "STATE_NAME LIKE UPPER('" + state + "')";
		query_task.execute(query_params).then(function(response){
			if (response.features.length === 0) {
				alert('Enter valid US state name');
			} else {
				add_graphics(response.features);
				zoom_extent(response);
			}
		})
	})

})