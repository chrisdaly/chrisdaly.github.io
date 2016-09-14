var margin = {top: 20, right: 20, bottom: 40, left: 60},
    width = 1500 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;

var padding = 80;
var top_padding = 60;

var delay = 100;
var transitionIn = 300;
var transitionOut = 5000;

// How many of the most frequent tokens to take.
var slice = 500

var svg = d3.select("#viz").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

d3.csv("/static/data/yelp_viz.csv", function(error, data) {
  if (error) throw error;

  // Convert to numbers.
  data.forEach(function(d) {
    d.total_count = +d.total_count;
    d.ratio = +(d.ratio);
  });

  // Take top 1000 tokens
  var data = data.sort(function(a, b) {
      return d3.descending(+a.total_count, +b.total_count);
    }).slice(0, slice);

  var xScale = d3.scale.linear()
      .domain(d3.extent(data, function(d) { return d.ratio; })).nice()   // should be .scale.log
      .range([0, width-padding]);

  var yScale = d3.scale.linear()
      .domain(d3.extent(data, function(d) { return d.total_count; })).nice()
      .range([height, top_padding]);

  var color_scale = d3.scale.category10()

  var xAxis = d3.svg.axis()
      .scale(xScale)
      .orient("bottom")
      .ticks(10)
      .tickSize(4, 6);

  var yAxis = d3.svg.axis()
      .scale(yScale)
      .ticks(10, ",.1s")
      .tickSize(4, 6)
      .orient("left");

  // X Axis
  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis)
    .append("text")
      .attr("class", "axistitle")
      .attr("x", width/2)
      .attr("y", 35)
      .style("text-anchor", "middle")
      .text("Ratio of 5 star to 1 star reviews");

  // Y Axis
  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      .attr("class", "axistitle")
      .attr("transform", "rotate(-90)")
      .attr("y", -45)
      .attr("x", -height/2)
      .style("text-anchor", "middle")
      .text("Frequency")

  // Words.
  svg.selectAll()
      .data(data)
    .enter().append("text")
      .attr("class", "word")
      .text(function(d) { return d.token})
      .attr("x", function(d) { return xScale ((d.ratio)); })
      .attr("y", function(d) { return yScale (d.total_count); })
      .on("mouseover", function(d) {
        d3.select(this)
               .transition()
               .ease("elastic")
               .duration(transitionIn)
               .style("fill", function(d) { return color_scale(d.ratio)})
               .style("font-size", "45px")
               .style("font-weight", "bold")
               .style("opacity", 0.9);
      })
      .on("mouseout", function(d) {
        d3.select(this).transition()
               .ease("elastic")
               .duration(transitionOut)
               .style("fill", "grey")
               .style("font-size", "20px")
               .style("font-weight", "normal")
               .style("opacity", 0.5);

      });

  // Initialize gridline.
  svg.append("line")
    .attr("class", "gridline")
    .attr("x1", 0)
    .attr("y1", margin.top+75)
    .attr("x2", 0)
    .attr("y2", height)


  // Set X Scale to log.
  var xScale = d3.scale.log()
      .domain(d3.extent(data, function(d) { return d.ratio; }))  // should be .scale.log
      .range([0, width-padding])
      .nice()

  // Set Y Scale to log.
  var yScale = d3.scale.log()
      .domain(d3.extent(data, function(d) { return d.total_count; }))
      .range([height, top_padding])


  // Update words.
  svg.selectAll(".word").data(data)
      .transition()
      .delay(delay)
      .duration(transitionOut)
      .attr("x", function(d) { return xScale (d.ratio); })
      .attr("y", function(d) { return yScale (d.total_count); })
      .style("opacity", .5)

  // Update X Axis.
  svg.select('.x.axis')
    .transition()
    .delay(delay)
    .duration(transitionOut)
    .call(xAxis.scale(xScale));

  // Update Y Axis.
  svg.select('.y.axis')
    .transition()
    .delay(1000)
    .duration(5000)
    .call(yAxis.scale(yScale));

  // Update Gridline.
  svg.select('.gridline')
    .transition()
    .delay(delay)
    .duration(transitionOut)
    .ease("backInOut")
    .attr("x1", function(d) { return xScale ((2.75)); })
    .attr("y1", margin.top+75)
    .attr("x2", function(d) { return xScale ((2.75)); })
    .attr("y2", height)

});
// move outline and opacity to css
