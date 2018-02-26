// D3 is included by globally by default
import * as topojson from 'topojson';
import { geoRobinson } from 'd3-geo-projection';
import colors from './colors';
import months from './months';
import trailers from './trailers';

const $map = d3.select('#year');
const $svg = $map.select('svg');
const $g = $svg.select('g');

const BP = 800;
let width = 0;
let height = 0;
let mobile = false;
let worldData = null;
let movieYearData = null;
let movieMonthData = null;
const currentMonth = 1;
const movieColors = {};

function getMovieColor({ properties }) {
	const { name } = properties;
	const country = movieYearData.find(d => d.country === name);
	if (!country) return colors.default;

	return movieColors[country.max];
}

function update() {
	$g.selectAll('.region').st('fill', getMovieColor);
}

function createKey() {
	const nested = d3
		.nest()
		.key(d => d.max)
		.rollup(v => v.length)
		.entries(movieYearData);

	nested.sort((a, b) => d3.descending(a.value, b.value));

	nested.forEach((d, i) => (movieColors[d.key] = colors.categorical[i]));

	const movieColorsArr = Object.keys(movieColors);
	$map
		.select('.map__key ul')
		.selectAll('li')
		.data(movieColorsArr)
		.enter()
		.append('li')
		.text(d => d)
		.st('color', d => movieColors[d]);
}

function setup() {
	const projection = geoRobinson()
		// .scale(1)
		.translate([width / 2, height / 2]);

	const path = d3.geoPath().projection(projection);
	const json = worldData.objects.countries_geo_github;
	const feature = topojson.feature(worldData, json);

	$g
		.selectAll('.region')
		.data(feature.features, d => d.id)
		.enter()
		.append('path')
		.at('d', path)
		.at('class', d => `region ${d.id}`);
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

function init({ world, year, month }) {
	updateDimensions();

	worldData = world;
	movieYearData = year;
	movieMonthData = month;

	createKey();
	setup();
	resize();
	update();
}

export default { init, resize };
