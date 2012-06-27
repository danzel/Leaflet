
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

		this._needsClustering = [];
	},

	_sqDist: function (p1, p2) {
		var dx = p2.x - p1.x,
			dy = p2.y - p1.y;
		return dx * dx + dy * dy;
	},

	zoomEnd: function () {
		this._needsClustering = this._needsClustering.concat(this._unclustered); //TODO: Efficiency? Maybe a loop with push
		for (var i = 0; i < this._clustered.length; i++) {
			this._clustered[i].recalculateCenter();
		}
		this._mergeSplitClusters();

		this.generateClusters();
	},

	//Merge and split any existing clusters that are too big or small
	_mergeSplitClusters: function () {
		var clusterRadiusSqrd = this.options.maxClusterRadius * this.options.maxClusterRadius;

		if (this._map._zoom > this._zoom) { //Zoom in, split
			/*var todo = this._clustered;
			this._clustered = [];

			for (var i = 0; i < todo.length; i++) {

			}*/

		} else if (this._map._zoom > this._zoom) { //Zoom out, merge
			/*
			var newClusters = [];

			for (var i = 0; i < this._clustered.length; i++) {
				for (var j = i + 1; j < this._clustered.length; j++) {
					var ic = this._clustered[i];
					var jc = this._clustered[j];

					if (this._sqDist(ic.center, jc.center) <= clusterRadiusSqrd) { //Merge these 2
						//Create a new cluster with the markers of each
						var n = new L.MarkerCluster(this, ic._markers[0], this._map.latLngToLayerPoint(ic._markers[0]._latlng), ic._markers[1], this._map.latLngToLayerPoint(ic._markers[1]._latlng));
						for (var z = 2; z < ic._markers.length; z++) {
							n.add(ic._markers[z], this._map.latLngToLayerPoint(ic._markers[z]._latlng));
						}
						for (var x = 0; x < jc._markers.length; x++) {
							n.add(jc._markers[x], this._map.latLngToLayerPoint(jc._markers[x]._latlng));
						}
						newClusters.push(n);

						//Remove these 2 clusters

					}
				}
			}*/

		}
	},

	generateClusters: function () {
		this._zoom = this._map._zoom;
		//TODO!

		var clusterRadiusSqrd = this.options.maxClusterRadius * this.options.maxClusterRadius;

		var clustered = this._clustered || [];
		var unclustered = [];

		for (var i = 0; i < this._needsClustering.length; i++) {
			var l = this._needsClustering[i];
			var xp = l._phax = this._map.latLngToLayerPoint(l.getLatLng());

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
		this._needsClustering = [];
		this._clustered = clustered;
		this._unclustered = unclustered;

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

	addLayer: function (layer) {
		L.FeatureGroup.prototype.addLayer.call(this, layer);

		this._needsClustering.push(layer);
	},

	//TODO: removeLayer
	onAdd: function (map) {
		L.FeatureGroup.prototype.onAdd.call(this, map); // LayerGroup

		this._map.on('zoomend', this.zoomEnd, this);

		//this.generateClusters();
	}

});
