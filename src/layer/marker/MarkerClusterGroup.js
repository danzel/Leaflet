
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
		//HACK
		this._map._mapPane.className += ' leaflet-zoom-anim';

		this._needsClustering = this._needsClustering.concat(this._unclustered); //TODO: Efficiency? Maybe a loop with push
		for (var i = 0; i < this._clusters.length; i++) {
			this._clusters[i].recalculateCenter();
		}
		this._mergeSplitClusters();

		this._generateClusters();
	},

	generateClusters: function () {
		//HACK
		this._map._mapPane.className += ' leaflet-zoom-anim';

		this._needsClustering = this._needsClustering.concat(this._unclustered || []);
		this._generateClusters();
	},
		//Merge and split any existing clusters that are too big or small
	_mergeSplitClusters: function () {
		if (this._map._zoom > this._zoom) { //Zoom in, split
			//TODO
		} else if (this._map._zoom < this._zoom) { //Zoom out, merge
			var res = this._cluster(this._clusters, []);
			console.log('Zoom ' + res.clusters.length + ' clusters, ' + res.unclustered.length + ' unclustered');
			this._clusters = res.clusters.concat(res.unclustered);
		}
	},

	_generateClusters: function () {
		this._zoom = this._map._zoom;
		//TODO!

		var res = this._cluster(this._needsClustering, this._clusters || []);

		console.log('made ' + res.clusters.length + ' clusters, ' + res.unclustered.length + ' unclustered');

		this._needsClustering = [];
		this._clusters = res.clusters;
		this._unclustered = res.unclustered;

		//Animate all of the markers in the clusters to move to their cluster center point
		for (var i = 0; i < this._clusters.length; i++) {
			var c = this._clusters[i];

			c.startAnimation();
		}

		//TODO: Use the transition stuff to make this more reliable
		var map = this._map;
		setTimeout(function () {

			//HACK
			map._mapPane.className = map._mapPane.className.replace('leaflet-zoom-anim', '');

			//this.createClusters();
			for (var j = 0; j < res.clusters.length; j++) {
				var cl = res.clusters[j];

				cl.createCluster();
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
	},


	//Takes a list of objects that have a 'getLatLng()' function (Marker / MarkerCluster)
	//Returns { clusters: [], unclustered: [] }
	_cluster: function (points, existingClusters) {

		var clusterRadiusSqrd = this.options.maxClusterRadius * this.options.maxClusterRadius,
		    clusters = existingClusters,
		    unclustered = [];

		for (var i = 0; i < points.length; i++) {
			var l = points[i];
			var lp = this._map.latLngToLayerPoint(l.getLatLng());

			var used = false;

			for (var j = 0; j < clusters.length; j++) {
				var c = clusters[j];
				if (this._sqDist(lp, c.center) <= clusterRadiusSqrd) {
					c.add(l);
					used = true;
					break;
				}
			}

			if (!used) {
				for (var k = 0 ; k < unclustered.length; k++) {
					var kp = this._map.latLngToLayerPoint(unclustered[k].getLatLng());
					if (this._sqDist(lp, kp) <= clusterRadiusSqrd) {
						//Create a new cluster with these 2
						clusters.push(new L.MarkerCluster(this, l, unclustered[k]));
						unclustered.splice(k, 1);
						used = true;
						break;
					}
				}
				if (!used) {
					unclustered.push(l);
				}
			}
		}

		return { 'clusters': clusters, 'unclustered': unclustered };
	}
});
