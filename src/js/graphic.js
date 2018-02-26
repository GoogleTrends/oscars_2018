import graphicMonth from './graphic-month';
import graphicYear from './graphic-year';

function resize() {
	graphicMonth.resize();
	graphicYear.resize();
}

function cleanMonth(data) {
	const clean = data.map(d => ({
		...d,
		month: +d.month
	}));

	return d3
		.nest()
		.key(d => d.country)
		.entries(clean);
}

function init() {
	const path = 'assets/data';

	d3.loadData(
		`${path}/github_geototopo_v1.json`,
		`${path}/movies_by_year.csv`,
		`${path}/movies_by_month.csv`,
		(err, response) => {
			const world = response[0];
			const year = response[1];
			const month = cleanMonth(response[2]);
			graphicMonth.init({ world, year, month });
			graphicYear.init({ world, year, month });
		}
	);
}

export default { init, resize };
