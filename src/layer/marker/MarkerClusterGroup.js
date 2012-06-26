
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
					c.add(l);
					used = true;
					break;
				}
			}
			if (!used) {
				for (var j = 0 ; j < unclustered.length; j++) {
					if (this._sqDist(xp, unclustered[j]._phax) <= clusterRadiusSqrd) {
						//Create a new cluster with these 2
						unclustered[j]._icon.style.opacity = 0.5;
						unclustered[j]._shadow.style.opacity = 0.5;
						clustered.push(new L.MarkerCluster(xp, unclustered[j]));
						unclustered.splice(j, 1);
						used = true;
						break;
					}
				}
				if (!used) {
					unclustered.push(l);
				}
			}

			if (used) {
				l._icon.style.opacity = 0.5;
				l._shadow.style.opacity = 0.5;
			}
		}
		console.log('made ' + clustered.length + ' clusters');


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

L.MarkerCluster = L.Class.extend({
	initialize: function (a, b) {
		this._markers = [a, b];

		this._minX = this._maxX = a.x;
		this._minY = this._maxY = a.y;
		this.center = new L.Point(a.x, a.y);

		this._recalculateCenter(b);
	},

	add: function (new1) {
		this._markers.push(new1);

		this._recalculateCenter(new1);
	},

	_recalculateCenter: function (b) {

		if (b.x < this._minX) {
			this._minX = b.x;
			this.center.x = (this._minX + this._maxX) / 2;
		} else if (b.x > this._maxX) {
			this._maxX = b.x;
			this.center.x = (this._minX + this._maxX) / 2;
		}

		if (b.y < this._minY) {
			this._minY = b.y;
			this.center.y = (this._minY + this._maxY) / 2;
		} else if (b.y > this._maxY) {
			this._maxY = b.y;
			this.center.y = (this._minY + this._maxY) / 2;
		}
	},
});