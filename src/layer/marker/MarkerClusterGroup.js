
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

		L.FeatureGroup.prototype.initialize.call(this, layers);

		this._needsClustering = [];

		this._markersAndClustersAtZoom = {};
	},


	_sqDist: function (p1, p2) {
		var dx = p2.x - p1.x,
			dy = p2.y - p1.y;
		return dx * dx + dy * dy;
	},

	zoomEnd: function () {
		//HACK
		this._map._mapPane.className += ' leaflet-zoom-anim';

		this._mergeSplitClusters();

		this._zoom = this._map._zoom;
	},

	generateInitialClusters: function () {
		var res = this._cluster(this._needsClustering, [], this._map.getZoom());

		this._markersAndClustersAtZoom[this._map._zoom] = res;
		this._zoom = this._map._zoom;

		//Make things appear on the map
		for (var i = 0; i < res.clusters.length; i++) {
			res.clusters[i]._addToMap();
		}
		for (var j = 0; j < res.unclustered.length; j++) {
			L.FeatureGroup.prototype.addLayer.call(this, res.unclustered[j]);
		}
	},

	//Merge and split any existing clusters that are too big or small
	_mergeSplitClusters: function () {
		var map = this._map;

		if (this._zoom < this._map._zoom) {
			var depth = this._map._zoom - this._zoom;
			var startingClusters = this._markersAndClustersAtZoom[this._zoom].clusters;

			while (this._zoom < this._map._zoom) { //Zoom in, split
				var currentClusters = this._markersAndClustersAtZoom[this._zoom].clusters;

				this._zoom++;

				var newState = this._markersAndClustersAtZoom[this._zoom];

				if (!newState) { //If we don't have clusters for the new level, calculate them
					newState = { 'clusters': [], 'unclustered': [] };

					for (var i = 0; i < currentClusters.length; i++) {
						var newClusters;
						if (currentClusters[i]._childClusters.length > 0) {

							//Child clusters should always be 0 as we haven't calculated clusters for this level
							throw 'something is wrong, childClusters length should be 0: ' + currentClusters[i]._childClusters.length;
						} else {
							newClusters = this._cluster(currentClusters[i]._markers, [], this._zoom);
						}

						currentClusters[i]._childClusters = newClusters.clusters;
						currentClusters[i]._markers = newClusters.unclustered;

						newState.clusters = newState.clusters.concat(newClusters.clusters);
						newState.unclustered = newState.unclustered.concat(newClusters.unclustered);
					}

					this._markersAndClustersAtZoom[this._zoom] = newState;
				}
			}

			//Add all children of current clusters to map and remove those clusters from map
			for (var j = 0; j < startingClusters.length; j++) {
				var c = startingClusters[j];
				var startPos = c.getLatLng();

				//Remove old cluster
				L.FeatureGroup.prototype.removeLayer.call(this, c); //TODO Animate

				c._recursivelyAddChildrenToMap(startPos, depth);
			}


			//Start up a function to update the positions of the just added clusters/markers
			//This must happen after otherwise they don't get animated
			setTimeout(function () {

				for (var j = 0; j < startingClusters.length; j++) {
					startingClusters[j]._recursivelyRestoreChildPositions(depth);
				}

				setTimeout(function () {
					//HACK
					map._mapPane.className = map._mapPane.className.replace(' leaflet-zoom-anim', '');

				}, 250);
			}, 0);

		} else if (this._zoom > this._map._zoom) { //Zoom out, merge

			var depth = this._zoom - this._map._zoom;

			//Ensure all of the intermediate zoom levels are generated
			var now;
			var newState;
			while (this._zoom > this._map._zoom) {
				now = this._markersAndClustersAtZoom[this._zoom];
				newState = this._markersAndClustersAtZoom[this._zoom - 1];
				this._zoom--;

				if (!newState) {
					newState = this._cluster(now.clusters.concat(now.unclustered), [], this._zoom);
					this._markersAndClustersAtZoom[this._zoom] = newState;
				}
			}

			//Animate all of the markers in the clusters to move to their cluster center point
			var newClusters = newState.clusters;
			for (var i = 0; i < newClusters.length; i++) {
				var c = newClusters[i];

				c._recursivelyAnimateChildrenIn(this._map.latLngToLayerPoint(c.getLatLng()).round(), depth);
			}

			//TODO: Use the transition timing stuff to make this more reliable
			setTimeout(function() {

				//HACK
				map._mapPane.className = map._mapPane.className.replace(' leaflet-zoom-anim', '');

				for (var j = 0; j < newClusters.length; j++) {
					var cl = newClusters[j];

					cl._addToMap();
					cl._recursivelyRemoveChildrenFromMap(depth);
				}
			}, 250);
		}
	},

	addLayer: function (layer) {
		this._needsClustering.push(layer);

		//TODO: If we have already clustered we'll need to add this one to a cluster
		//Should be able to use _cluster with the current clusters and just this layer

		return this;
	},

	removeLayer: function (layer) {

		//TODO Hrm....
		//Will need to got through each cluster and find the marker, removing it as required, possibly turning its parent from a cluster into an individual marker.
		//Or the easy version: Just recluster everything!

		return this;
	},

	onAdd: function (map) {
		L.FeatureGroup.prototype.onAdd.call(this, map); // LayerGroup

		this._map.on('zoomend', this.zoomEnd, this);
	},

	//Takes a list of objects that have a 'getLatLng()' function (Marker / MarkerCluster)
	//Performs clustering on them (using a greedy algorithm) and returns those clusters.
	//Returns { clusters: [], unclustered: [] }
	_cluster: function (points, existingClusters, zoom) {
		var clusterRadiusSqrd = this.options.maxClusterRadius * this.options.maxClusterRadius,
		    clusters = existingClusters,
		    unclustered = [],
		    center = this._map.getCenter();

		//Calculate pixel positions
		for (var j = 0; j < clusters.length; j++) {
			var c = clusters[j];
			c._projCenter = this._map.project(c.getLatLng(), zoom);
		}

		for (var j2 = 0; j2 < points.length; j2++) {
			var p2 = points[j2];
			p2._projCenter = this._map.project(p2.getLatLng(), zoom);

		}


		//go through each point
		for (var i = 0; i < points.length; i++) {
			var point = points[i];

			var used = false;

			//try add it to an existing cluster
			for (var j = 0; j < clusters.length; j++) {
				var c = clusters[j];
				if (this._sqDist(point._projCenter, c._projCenter) <= clusterRadiusSqrd) {
					c._addChild(point);
					c._projCenter = this._map.project(c.getLatLng(), zoom);

					used = true;
					break;
				}
			}

			//otherwise, look through all of the markers we haven't managed to cluster and see if we should form a cluster with them
			if (!used) {
				for (var k = 0 ; k < unclustered.length; k++) {
					if (this._sqDist(point._projCenter, unclustered[k]._projCenter) <= clusterRadiusSqrd) {
						//Create a new cluster with these 2
						var newCluster = new L.MarkerCluster(this, point, unclustered[k]);
						clusters.push(newCluster);

						newCluster._projCenter = this._map.project(newCluster.getLatLng(), zoom);

						unclustered.splice(k, 1);
						used = true;
						break;
					}
				}
				if (!used) {
					unclustered.push(point);
				}
			}
		}

		//Any clusters that did not end up being a child of a new cluster, make them a child of a new cluster
		for (var l = unclustered.length - 1; l >= 0; l--) {
			var c = unclustered[l];
			delete c._projCenter;

			if (c instanceof L.MarkerCluster) {
				var nc = new L.MarkerCluster(this, c);
				clusters.push(nc);
				unclustered.splice(l, 1);
			}
		}

		//Remove the _projCenter temp variable from clusters
		for (var m = 0; m < clusters.length; m++) {
			delete clusters[m]._projCenter;
			clusters[m]._baseInit();
		}

		return { 'clusters': clusters, 'unclustered': unclustered };
	}
});
