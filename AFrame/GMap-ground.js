
MERCATOR = {
	
	fromLatLngToPoint: function(latLng){
		var siny = Math.min(
			Math.max(
				Math.sin(latLng.lat * (Math.PI / 180)), 
				-.9999
			),
			.9999
		);
		return {
			x: 128 + latLng.lng * (256/360),
			y: 128 + 0.5 * Math.log((1 + siny) / (1 - siny)) * - (256 / (2 * Math.PI))
		};
	},
	
	fromPointToLatLng: function(point){
		return {
			lat: (2 * Math.atan(Math.exp((point.y - 128) / -(256 / (2 * Math.PI)))) - Math.PI / 2)/ (Math.PI / 180),
			lng: (point.x - 128) / (256 / 360)
		};
		
	},
	
	getTileAtLatLng: function(latLng, zoom){
		var
			t = Math.pow(2, zoom),
			s = 256/t,
			p = this.fromLatLngToPoint(latLng)
		;
		return {
			x: Math.floor(p.x/s),
			y: Math.floor(p.y/s),
			z: zoom
		};
	},
	
	getTileBounds: function(tile){
		tile = this.normalizeTile(tile);
		var
			t = Math.pow(2, tile.z),
			s = 256/t,
			sw = {
				x: tile.x*s,
				y: (tile.y*s) + s
			},
			ne = {
				x: tile.x*s + s,
				y: (tile.y*s)
			}
		;
		return {
			sw: this.fromPointToLatLng(sw),
			ne: this.fromPointToLatLng(ne)
		};
	},
	
	normalizeTile: function(tile){
		var t = Math.pow(2, tile.z);
		tile.x = ((tile.x%t)+t)%t;
		tile.y = ((tile.y%t)+t)%t;
		return tile;
	}
	
}

function mturl(latitude,longitude,zoom,type){
	/*
	sat
	http://mt0.google.com/vt/lyrs=s&x=1325&y=3143&z=13

	hyb
	http://mt0.google.com/vt/lyrs=y&x=1325&y=3143&z=13

	sat+traf
	http://mt0.google.com/vt/lyrs=s@221097413,traffic&x=1325&y=3143&z=13

	h = roads only
	m = standard roadmap
	p = terrain
	r = somehow altered roadmap
	s = satellite only
	t = terrain only
	y = hybrid
	*/
	if(typeof(type) != 'string') type = 'y';
	var xyz = MERCATOR.getTileAtLatLng({lat:latitude,lng:longitude},zoom);
	return 'http://mt'+parseInt(Math.random()*4)+'.google.com/vt/lyrs='+type+'&x='+xyz.x+'&y='+xyz.y+'&z='+zoom;
}

/*

(function mturl(latitude,longitude,zoom){
	var xyz = MERCATOR.getTileAtLatLng({lat: latitude, lng: longitude}, zoom);
	return 'http://mt0.google.com/vt/lyrs=y&x='+xyz.x+'&y='+xyz.y+'&z='+zoom;
})(55.1532964, 37.4693835, 18)


http://mt0.google.com/vt/lyrs=y&x=158356&y=82720&z=18

MERCATOR.getTileBounds({x:158356,y:82731,z:18})

ne:
lat: 55.1451340140052
lng: 37.470245361328125
sw:
lat: 55.14434917097695
lng: 37.4688720703125

*/


var hash_fences = {};

function ce(t,a){ var f = document.createElement(t); for(var k in a) f.setAttribute(k, a[k]); return f; }

function load_hash(d){
	
	hash_fences[d.hash] = d.objects;
	
	for(var i=0; i<d.objects.length; i++){
		
		var
			o = d.objects[i],
			element_id = 'fence_' + o.id.replace(':', '_')
		;
		
		if(!document.getElementById(element_id)){
			
			fences.appendChild( ce(
				'a-collada-model',
				{
					'id': element_id,
					'src': 'https://yaglov.ru/cadastre/fence.php?id='+encodeURIComponent(o.id),
					'gps-place': 'longitude: '+o.extent.xmin+'; latitude: '+o.extent.ymin,
					'transparent-texture': '',
					'data-cn': o.id
				}
			) );
			
		}
		
	}
	
}



function load_ground_tile(latitude, longitude, tile_zoom, tile_type){
	if(typeof(tile_type) == 'undefined')
		tile_type = 'y';
	if(typeof(tile_zoom) == 'undefined')
		tile_zoom = 18;
	
	var gpsPosition = camera.components['gps-position'];
	
	var xyz = MERCATOR.getTileAtLatLng({lat: latitude, lng: longitude}, tile_zoom);
	var tile_url = '//mt'+parseInt(Math.random()*4)+'.google.com/vt/lyrs='+tile_type+'&x='+xyz.x+'&y='+xyz.y+'&z='+tile_zoom;
	
	var tile_bounds = MERCATOR.getTileBounds({x: xyz.x, y: xyz.y, z: tile_zoom});
	
	var tile_id = 'tile_'+xyz.x+'_'+xyz.y;
	var tile_width = gpsPosition.calcMeters(
		{
			longitude: tile_bounds.ne.lng,
			latitude: tile_bounds.ne.lat
		},
		{
			longitude: tile_bounds.ne.lng,
			latitude: tile_bounds.sw.lat
		}
	);
	var tile_height = gpsPosition.calcMeters(
		{
			longitude: tile_bounds.sw.lng,
			latitude: tile_bounds.ne.lat
		},
		{
			longitude: tile_bounds.ne.lng,
			latitude: tile_bounds.ne.lat
		}
	);
	/*
	ne:
	lat: 55.1451340140052
	lng: 37.470245361328125
	sw:
	lat: 55.14434917097695
	lng: 37.4688720703125
	*/
	//if(!ground.querySelector('a-entity#'+tile_id)){
	if(!document.getElementById(tile_id)){
		/*
		ground.appendChild(ce('a-plane', {
			id: tile_id,
			height: tile_height,
			width: tile_width,
			rotation: '-90 0 0',
			src: tile_url,
			'gps-place': 'longitude: ' + (tile_bounds.sw.lng-(tile_bounds.sw.lng-tile_bounds.ne.lng)/2) + '; latitude: ' + (tile_bounds.sw.lat-(tile_bounds.sw.lat-tile_bounds.ne.lat)/2)
		}));
		*/
		ground.appendChild(ce('a-entity', {
			id: tile_id,
			geometry: 'primitive: plane; height: '+tile_height+'; width: '+tile_width,
			//position: '0 0 0',
			rotation: '-90 0 0',
			material: 'shader: flat; src: url(' + tile_url + ')',
			//'gps-place': 'latitude: ' + tile_bounds.ne.lat + '; longitude:' + tile_bounds.ne.lng
			'gps-place': 'longitude: ' + (tile_bounds.sw.lng-(tile_bounds.sw.lng-tile_bounds.ne.lng)/2) + '; latitude: ' + (tile_bounds.sw.lat-(tile_bounds.sw.lat-tile_bounds.ne.lat)/2)
		}));
		
	}
}


window.onload = function(){
	
	var camera = document.getElementById('camera');
	
	camera.addEventListener('componentchanged', function (evt) {
		switch(evt.detail.name){
		case 'rotation':
			var newData = evt.target.getAttribute('rotation');
			console.log('camera rotation changed', newData);
			var
				compassRotation = camera.components['compass-rotation'],
				lookControls = camera.components['look-controls']
			;
			camera_angle.innerText = newData.y;
			if(lookControls){
				yaw_angle.innerText = THREE.Math.radToDeg(lookControls.yawObject.rotation.y);
			}
			if(compassRotation){
				compass_heading.innerText = compassRotation.heading;
			}
			break;
		case 'position':
			var newData = evt.target.getAttribute('position');
			console.log('camera position changed', newData);
			var
				gpsPosition = camera.components['gps-position']
			;
			camera_p_x.innerText = newData.x;
			camera_p_z.innerText = newData.z;
			if(gpsPosition){
				if(gpsPosition.crd){
					crd_longitude.innerText = gpsPosition.crd.longitude;
					crd_latitude.innerText = gpsPosition.crd.latitude;
					
					var hash = Geohash.encode(gpsPosition.crd.latitude, gpsPosition.crd.longitude, 7);
					geohash_7chars.innerText = hash;
					
					if(typeof(hash_fences[hash]) == 'undefined'){
						hash_fences[hash] = null;
						document.head.appendChild(ce('script', {
							src: 'https://yaglov.ru/cadastre/hash.php?hash='+hash+'&callback=load_hash'
						}));
					}
					var olat = 0.0006;
					var olng = 0.0006;
					for(var tlat = gpsPosition.crd.latitude - olat*2; tlat <= gpsPosition.crd.latitude + olat*2; tlat += olat)
					for(var tlng = gpsPosition.crd.longitude - olng*2; tlng <= gpsPosition.crd.longitude + olng*2; tlng += olng)
						load_ground_tile(tlat, tlng, 18, 'y');
					
				}
				if(gpsPosition.zeroCrd){
					zero_crd_longitude.innerText = gpsPosition.zeroCrd.longitude;
					zero_crd_latitude.innerText = gpsPosition.zeroCrd.latitude;
				}
			}
			
			break;
		}
	});
	
	
};
