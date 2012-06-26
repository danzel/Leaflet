
/*
 * L.MarkerClusterGroup extends L.FeatureGroup by clustering the markers contained within
 */

L.MarkerClusterGroup = L.FeatureGroup.extend({

	options: {
		//distanceToCluster: 10, //Any points closer than this will probably get put in to a cluster
		maxClusterRadius: 40 //A cluster will cover at most this many pixels from its center
	},

	initialize: function (layers, options) {
		L.Util.setOptions(this, options);

		L.FeatureGroup.prototype.initialize.call(this, layers); // LayerGroup
	},

	_sqDist: function (p1, p2) {
		var dx = p2.x - p1.x,
			dy = p2.y - p1.y;
		return dx * dx + dy * dy;
	},

	generateClusters: function () {
		//TODO!

		var clusterRadiusSqrd = this.options.maxClusterRadius * this.options.maxClusterRadius;

		var clustered = [];
		var unclustered = [];

		for (var i in this._layers) {
			var l = this._layers[i];
			var xp = l._phax = this._map.project(l.getLatLng());

			var used = false;

			for (var j = 0; j < clustered.length; j++) {
				var c = clustered[j];
				if (this._sqDist(xp, c.center) <= clusterRadiusSqrd) {
					c.add(l, xp);
					used = true;
					break;
				}
			}
			if (!used) {
				for (var j = 0 ; j < unclustered.length; j++) {
					if (this._sqDist(xp, unclustered[j]._phax) <= clusterRadiusSqrd) {
						//Create a new cluster with these 2
						clustered.push(new L.MarkerCluster(this, l, xp, unclustered[j], unclustered[j]._phax));
						unclustered.splice(j, 1);
						used = true;
						break;
					}
				}
				if (!used) {
					unclustered.push(l);
				}
			}
		}
		console.log('made ' + clustered.length + ' clusters');

		//HACK
		this._map._mapPane.className += ' leaflet-zoom-anim';

		//Animate all of the markers in the clusters to move to their cluster center point
		for (var i = 0; i < clustered.length; i++) {
			var c = clustered[i];

			c.startAnimation();
		}

		//TODO: Use the transition stuff to make this more reliable
		var map = this._map;
		setTimeout(function () {

			//HACK
			map._mapPane.className = map._mapPane.className.replace('leaflet-zoom-anim', '');

			//this.createClusters();
			for (var i = 0; i < clustered.length; i++) {
				var c = clustered[i];

				c.createCluster();
			}
		}, 250);
	},

	onAdd: function (map) {
		L.FeatureGroup.prototype.onAdd.call(this, map); // LayerGroup

		//this.generateClusters();
	}

});
