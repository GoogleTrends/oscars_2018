// D3 is included by globally by default
import * as topojson from 'topojson';
import { geoRobinson } from 'd3-geo-projection';

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
	const projection = geoRobinson()
		// .scale(1)
		.translate([width / 2, height / 2]);

	const path = d3.geoPath().projection(projection);
	const prop = TEST ? 'countries' : 'countries_geo_github';
	const json = world.objects[prop];
	const feature = topojson.feature(world, json);
	console.log({ json, feature });

	$g
		.selectAll('path')
		.data(feature.features)
		.enter()
		.append('path')
		.at('d', path);
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
	const file = TEST ? 'world-110m' : 'github_geototopo_v1';
	updateDimensions();

	d3.loadData(`${path}/${file}.json`, (err, response) => {
		world = response[0];
		setup();
		resize();
	});
}

export default { init, resize };
