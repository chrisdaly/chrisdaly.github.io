queue()
    .defer(d3.csv, "/static/data/donations.csv")
    .defer(d3.json, "/static/geojson/us-states.json")
    .await(makeGraphs);

function makeGraphs(error, projectsJson, statesJson) {

	//console.log(projectsJson)
	/*
		date_posted: Sun Sep 01 2002 00:00:00 GMT+0100 (GMT Daylight Time)
		poverty_level: "moderate poverty"
		resource_type: "Supplies"
		school_state: "NY"
		total_donations: 125
	*/

	//console.log(statesJson)
	/*
		{"type":"FeatureCollection","features":[
			{"type":"Feature",
			"id":"01",
			"properties":{"name":"AL"},
			"geometry":{"type":"Polygon","
			coordinates":[[[-87.359296,35.00118],[-85.606675,34.984749],[...]]]}},
	*/

	// Clean projectsJson data.
	var donorschooseProjects = projectsJson;
	var dateFormat = d3.time.format("%Y-%m-%d %H:%M:%S");
	donorschooseProjects.forEach(function(d) {
    // Convert to datetime.
		d["date_posted"] = dateFormat.parse(d["date_posted"]);

    // Give every row with the same month an identical value to group later.
		d["date_posted"].setDate(1);
		d["total_donations"] = +d["total_donations"];
	});

	// Create a Crossfilter instance.
	var ndx = crossfilter(donorschooseProjects);

	// Define 5 data dimensions.
	var dateDim = ndx.dimension(function(d) { return d["date_posted"]; });
	var resourceTypeDim = ndx.dimension(function(d) { return d["resource_type"]; });
	var povertyLevelDim = ndx.dimension(function(d) { return d["poverty_level"]; });
	var stateDim = ndx.dimension(function(d) { return d["school_state"]; });
	var totalDonationsDim  = ndx.dimension(function(d) { return d["total_donations"]; });

	console.log(stateDim)

	// Define 6 data groups.
  var all = ndx.groupAll();
	var numProjectsByDate = dateDim.group();
	var numProjectsByResourceType = resourceTypeDim.group();
	var numProjectsByPovertyLevel = povertyLevelDim.group();
	var totalDonationsByState = stateDim.group().reduceSum(function(d) {
		return d["total_donations"];
	});
	var totalDonations = ndx.groupAll().reduceSum(function(d) {return d["total_donations"];});

  // Calculate max values to size charts.
	var max_state = totalDonationsByState.top(1)[0].value;
	var minDate = dateDim.bottom(1)[0]["date_posted"];
	var maxDate = dateDim.top(1)[0]["date_posted"];

  // Define chart type and its corresponding div.
	var timeChart = dc.barChart("#time-chart");
	var resourceTypeChart = dc.rowChart("#resource-type-row-chart");
	var povertyLevelChart = dc.rowChart("#poverty-level-row-chart");
	var usChart = dc.geoChoroplethChart("#us-chart");
	var numberProjectsND = dc.numberDisplay("#number-projects-nd");
	var totalDonationsND = dc.numberDisplay("#total-donations-nd");

  // Pass in relevant params to each chart.
	numberProjectsND
		.formatNumber(d3.format("d"))
		.valueAccessor(function(d) {console.log(d); return d; })
		.group(all);

	totalDonationsND
		.formatNumber(d3.format("d"))
		.valueAccessor(function(d) {return d; })
		.group(totalDonations)
		.formatNumber(d3.format(".3s"));

	timeChart
		.width(600)
		.height(160)
		.margins({top: 10, right: 50, bottom: 30, left: 50})
		.dimension(dateDim)
		.group(numProjectsByDate)
		.transitionDuration(500)
		.x(d3.time.scale().domain([minDate, maxDate]))
		.elasticY(true)
		.xAxisLabel("Year")
		.yAxis().ticks(4);

	resourceTypeChart
        .width(300)
        .height(250)
        .dimension(resourceTypeDim)
        .group(numProjectsByResourceType)
        .xAxis().ticks(4);

	povertyLevelChart
		.width(300)
		.height(250)
        .dimension(povertyLevelDim)
        .group(numProjectsByPovertyLevel)
        .xAxis().ticks(4);

	usChart.width(1000)
		.height(330)
		.dimension(stateDim)
		.group(totalDonationsByState)
		.colors(["#E2F2FF", "#C4E4FF", "#9ED2FF", "#81C5FF", "#6BBAFF", "#51AEFF", "#36A2FF", "#1E96FF", "#0089FF", "#0061B5"])
		.colorDomain([0, max_state])
		.overlayGeoJson(statesJson["features"], "state", function (d) {
			return d.properties.name;
		})
		.projection(d3.geo.albersUsa()
    				.scale(600)
    				.translate([340, 150]))
		.title(function (p) {
			return "State: " + p["key"]
					+ "\n"
					+ "Total Donations: " + Math.round(p["value"]) + " $";
		})

    // Render charts.
    dc.renderAll();

};
