
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

		this._needsClustering = []; //TODO Revisit

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

		//for (var i = 0; i < this._clusters.length; i++) {
		//	this._clusters[i].recalculateCenter();
		//}
		this._mergeSplitClusters();
		//this._needsClustering = this._needsClustering.concat(this._unclustered); //TODO: Efficiency? Maybe a loop with push

		//this._generateClusters();
		this._zoom = this._map._zoom;
	},

	generateInitialClusters: function () {
		//HACK
		this._map._mapPane.className += ' leaflet-zoom-anim';

		var res = this._cluster(this._needsClustering, [], this._map.getZoom());

		this._markersAndClustersAtZoom[this._map._zoom] = res;
		this._zoom = this._map._zoom;

		//TODO Make things appear on the map
		for (var i = 0; i < res.clusters.length; i++) {
			res.clusters[i].createCluster();
		}
		for (var j = 0; j < res.unclustered.length; j++) {
			L.FeatureGroup.prototype.addLayer.call(this, res.unclustered[j]);
		}
	},

	//Merge and split any existing clusters that are too big or small
	_mergeSplitClusters: function () {

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
							console.log('something is wrong, childClusters length should be 0: ' + currentClusters[i]._childClusters.length);
							throw "";
						} else {
							newClusters = this._cluster(currentClusters[i]._markers, [], this._zoom);
						}

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
				this._map.removeLayer(c._marker); //TODO Animate
				console.log('remove cluster ex');

				c.recursivelyAddChildrenToMap(startPos, depth);
			}


			//Start up a function to update the positions of the just added clusters/markers
			//This must happen after otherwise they don't get animated
			setTimeout(function () {
				for (var j = 0; j < startingClusters.length; j++) {
					startingClusters[j].recursivelyRepositionChildren(depth);
				}
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
			console.log('new ' + newState.clusters.length + ' un ' + newState.unclustered.length);

			//Animate all of the markers in the clusters to move to their cluster center point
			var newClusters = newState.clusters;
			for (var i = 0; i < newClusters.length; i++) {
				var c = newClusters[i];

				c.recursivelyAnimateChildrenIn(this._map.latLngToLayerPoint(c.getLatLng()).round(), depth);
			}

			//TODO: Use the transition stuff to make this more reliable
			var map = this._map;
			setTimeout(function() {

				//HACK
				map._mapPane.className = map._mapPane.className.replace('leaflet-zoom-anim', '');

				//this.createClusters();
				for (var j = 0; j < newClusters.length; j++) {
					var cl = newClusters[j];

					cl.createCluster();
					cl.recursivelyRemoveChildrenFromMap(depth);
				}
			}, 250);


			//Move all things to new locations
			//Add new clusters
			//console.log('Zoom ' + res.clusters.length + ' clusters, ' + res.unclustered.length + ' unclustered');

			//this._clusters = res.clusters.concat(res.unclustered);
		}
	},

	_generateClusters: function () {
		//TODO!
		throw "ASD";
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
		//L.FeatureGroup.prototype.addLayer.call(this, layer);

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
	_cluster: function (points, existingClusters, zoom) {

		var clusterRadiusSqrd = this.options.maxClusterRadius * this.options.maxClusterRadius,
		    clusters = existingClusters,
		    unclustered = [],
		    center = this._map.getCenter();

		//Recalculate existing cluster centers
		for (var j = 0; j < clusters.length; j++) {
			var c = clusters[j];
			c.center = this._map._latLngToNewLayerPoint(c.getLatLng(), zoom, center);
		}

		for (var i = 0; i < points.length; i++) {
			var l = points[i];
			var lp = this._map._latLngToNewLayerPoint(l.getLatLng(), zoom, center);

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
						var newCluster = new L.MarkerCluster(this, l, unclustered[k]);
						clusters.push(newCluster);
						if (zoom != this._map._zoom) {
							newCluster.center = this._map._latLngToNewLayerPoint(newCluster.getLatLng(), zoom, center);
						}
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

		//Any clusters that did not end up being a child of a new cluster, make them a child of a new cluster
		for (var l = unclustered.length - 1; l >= 0; l--) {

			var c = unclustered[l];

			if (c instanceof L.MarkerCluster) {
				clusters.push(new L.MarkerCluster(this, c));
				unclustered.splice(l, 1);
			}
		}

		return { 'clusters': clusters, 'unclustered': unclustered };
	}
});
