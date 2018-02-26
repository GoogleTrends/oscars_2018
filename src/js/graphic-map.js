// D3 is included by globally by default
import * as topojson from 'topojson';
import { geoRobinson } from 'd3-geo-projection';
import colors from './colors';
import months from './months';
import trailers from './trailers';

const $map = d3.select('#map');
const $graphic = $map.select('.map__graphic');
const $chart = $graphic.select('.graphic__chart');
const $svg = $map.select('svg');
const $g = $svg.select('g');
const $uiLabel = $map.select('.ui__label');

const BP = 800;
const SECOND = 1000;
const EASE = d3.easeCubicInOut;
let width = 0;
let height = 0;
let mobile = false;
let worldData = null;
let movieYearData = null;
let movieMonthData = null;

let worldFeature = null;
let projection = null;
let path = null;
let currentMonth = 0;
let active = d3.select(null);

let colorDict = null;

const zoom = d3.zoom().scaleExtent([1, 5]);

function getMovieColor({ properties }) {
	const { name } = properties;
	const country = movieMonthData.find(d => d.key === name);
	if (!country) return colors.default;

	const m = country.values.find(d => d.month === currentMonth);
	return colorDict[m.max];
}

function update() {
	$g.selectAll('.region').st('fill', getMovieColor);
}

function resetZoom() {
	active.classed('is-active', false);
	active = d3.select(null);

	// const bounds = path.bounds($g);
	// const dx = bounds[1][0] - bounds[0][0];
	// const dy = bounds[1][1] - bounds[0][1];
	// const x = (bounds[0][0] + bounds[1][0]) / 2;
	// const y = (bounds[0][1] + bounds[1][1]) / 2;

	// const scale = Math.max(
	// 	1,
	// 	Math.min(8, 0.9 / Math.max(dx / width, dy / height))
	// );
	// const translateX = width / 2 - scale * x;
	// const translateY = height / 2 - scale * y;

	// const zoomTransform = d3.zoomIdentity
	// 	.translate(translateX, translateY)
	// 	.scale(scale);

	// $g
	// 	.transition()
	// 	.duration(SECOND)
	// 	.ease(EASE)
	// 	.call(zoom.transform, zoomTransform);

	$g
		.transition()
		.duration(SECOND)
		.ease(EASE)
		.call(zoom.transform, d3.zoomIdentity);

	// $svg
	// 	.transition()
	// 	.call(zoom.translate([width / 2, height / 2]).scale(1).event);
}

function handleSlider() {
	currentMonth = +this.value;
	const index = currentMonth - 1;
	const str = index < 0 ? 'Last year' : `${months[index]} 2017`;
	$uiLabel.text(str);
	update();
}

function handleZoom() {
	const ratio = 1 / d3.event.transform.k * 0.5;

	$g.at('transform', d3.event.transform);

	$g.selectAll('.region').st('stroke-width', `${ratio}px`);
}

function handleRegionClick(d) {
	if (active.node() === this) return resetZoom();
	active.classed('active', false);
	active = d3.select(this).classed('active', true);

	console.log(d);
	const bounds = path.bounds(d);
	const dx = bounds[1][0] - bounds[0][0];
	const dy = bounds[1][1] - bounds[0][1];
	const x = (bounds[0][0] + bounds[1][0]) / 2;
	const y = (bounds[0][1] + bounds[1][1]) / 2;

	const scale = Math.max(
		1,
		Math.min(8, 0.9 / Math.max(dx / width, dy / height))
	);
	const translateX = width / 2 - scale * x;
	const translateY = height / 2 - scale * y;

	const zoomTransform = d3.zoomIdentity
		.translate(translateX, translateY)
		.scale(scale);

	$g
		.transition()
		.duration(SECOND)
		.ease(EASE)
		.call(zoom.transform, zoomTransform);
}

function setup() {
	const json = worldData.objects.countries_geo_github;
	worldFeature = topojson.feature(worldData, json);

	projection = geoRobinson()
		.translate([width / 2, height / 2])
		.fitSize([width, height], worldFeature);

	path = d3.geoPath().projection(projection);

	$g
		.selectAll('.region')
		.data(worldFeature.features, d => d.id)
		.enter()
		.append('path')
		.at('d', path)
		.at('class', d => `region ${d.id}`)
		.on('click', handleRegionClick);

	$map.select('.slider').on('input', handleSlider);

	zoom.on('zoom', handleZoom);

	resetZoom();
}

function updateDimensions() {
	width = $chart.node().offsetWidth;

	mobile = width < BP;
	const ratio = 2;
	height = Math.floor(width / ratio);
}

function resize() {
	updateDimensions();
	$svg.at({ width, height });
	projection
		.translate([width / 2, height / 2])
		.fitSize([width, height], worldFeature);
	path = d3.geoPath().projection(projection);
}

function init({ world, year, month, movieColors }) {
	updateDimensions();

	colorDict = movieColors;
	worldData = world;
	movieYearData = year;
	movieMonthData = month;

	setup();
	resize();
	update();
}

export default { init, resize };
