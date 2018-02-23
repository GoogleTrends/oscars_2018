// D3 is included by globally by default
const $map = d3.select('#map');
const $svg = $map.select('svg');
const $g = $svg.select('g');

const BP = 800;
let width = 0;
let height = 0;
let mobile = false;

function resize() {
	width = $map.node().offsetWidth;

	mobile = width < BP;
	// const ratio = 1
	// const h = w * ratio

	height = window.innerHeight * 0.67;
	$svg.at({ width, height });
}

function init() {
	resize();
}

export default { init, resize };
