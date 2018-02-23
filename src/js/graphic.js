// D3 is included by globally by default
import * as topojson from 'topojson';

const TEST = false;

const $map = d3.select('#map');
const $svg = $map.select('svg');
const $g = $svg.select('g');

const BP = 800;
let width = 0;
let height = 0;
let mobile = false;

let world = null;

function setup() {
	const projection = d3
		.geoMercator()
		.scale(width / 2 / Math.PI)
		.translate([width / 2, height / 2]);

	const path = d3.geoPath().projection(projection);
	const prop = TEST ? 'countries' : 'nat_earth_geojson';
	const json = world.objects[prop];
	const feature = topojson.feature(world, json);
	console.log(feature);
	$svg.append('path').at('d', path(feature));
}

function updateDimensions() {
	width = $map.node().offsetWidth;

	mobile = width < BP;
	// const ratio = 1
	// const h = w * ratio

	height = window.innerHeight * 0.67;
}

function resize() {
	updateDimensions();
	$svg.at({ width, height });
}

function init() {
	const path = 'assets/data';
	const file = TEST ? 'world-110m' : 'nat_earth_topo_2';
	d3.loadData(`${path}/${file}.json`, (err, results) => {
		if (err) console.error(err);
		world = results[0];
		updateDimensions();
		setup();
		resize();
	});
}

export default { init, resize };
