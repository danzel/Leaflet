
/*
 * L.MarkerClusterGroup extends L.FeatureGroup by clustering the markers contained within
 */

L.MarkerClusterGroup = L.FeatureGroup.extend({

	options: {
		distanceToCluster: 10, //Any points closer than this will probably get put in to a cluster
		maxClusterRadius: 20 //A cluster will cover at most this many pixels from its center
	},

	initialize: function (layers, options) {
		L.Util.setOptions(this, options);

		L.FeatureGroup.prototype.initialize.call(this, layers); // LayerGroup
	},


	generateClusters: function () {
		//TODO!
		var layers = [];

		for (var i in this._layers) {
			layers.push(this._layers[i]);
		}



		/*
		//Work out who should get clustered
		var distances = [];
		for (var x = 0; x < layers.length - 1; x++) {
			var xp = this._map.project(layers[x].getLatLng());
			for (var y = x + 1; y < layers.length; y++) {
				var dist = xp.distanceTo(this._map.project(layers[y].getLatLng()));
				if (dist < distanceToCluster) {
					distances.push({ dist: dist, a: x, b: y });
				}
			}
		}

		//Sort so closest are at the start
		distances.sort(function (a, b) { return a.dist - b.dist; });

		var clusters = [];

		//Now cluster them
		for (var i = 0; i < distances.length; i++) {
			var d = distances[i];

			//Check if we should be in an existing cluster
			for (var j = 0; j < clusters.length; j++) {
				var c = clusters[j];

				if (c.distanceTo(
			}
		}*/
	},

	onAdd: function (map) {
		L.FeatureGroup.prototype.onAdd.call(this, map); // LayerGroup

		this.generateClusters();
	}

});