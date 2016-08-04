var colors = {
  "England":  "#6a3d9a",
  "France": "#1f78b4",
  "Germany": "#ffd92f",
  "Italy": "#33a02c",
  "Spain": "#e31a1c"
};

var seasons = {
  "0": "2008/2009",
  "1": "2009/2010",
  "2": "2010/2011",
  "3": "2011/2012",
  "4": "2012/2013",
  "5": "2013/2014",
  "6": "2014/2015",
  "7": "2015/2016"};

var margin = {top: 20, right: 20, bottom: 30, left: 50},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var x = d3.scale.linear()
    .range([0, width]);

var y = d3.scale.linear()
    .range([height, 0]);

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom")
    .tickFormat(function(d) {
      return seasons[d]
    })

var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left");

var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// add the tooltip area to the webpage
var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);
//
// var legend = svg.append("g")
//     .attr("class", "legend")
//     .attr("x", 100  )
//     .attr("y", 100)
//     .attr("height", 200)
//     .attr("width", 200)

d3.csv("/static/data/teams_entropy.csv", function(error, data) {
  if (error) throw error;

  data.forEach(function(d) {
    d.Entropy = +d.Entropy;
    d.X = +d.X;
  });

  x.domain(d3.extent(data, function(d) { return d.X; })).nice(); // Make axis end in round number.
  y.domain(d3.extent(data, function(d) { return d.Entropy; })).nice();

  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis)
    .append("text")
      .attr("class", "label")
      .attr("x", width/2)
      .attr("y", 30)
      .style("text-anchor", "middle")
      .text("Season");

  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      .attr("class", "label")
      .attr("transform", "rotate(-90)")
      .attr("y", -35)
      .attr("x", -height/2)
      .style("text-anchor", "middle")
      .text("Entropy (H)")


  svg.selectAll(".dot")
      .data(data)
    .enter().append("circle")
      .attr("class", "dot")
      .attr("r", 3.5)
      .attr("cx", function(d) { return x(d.X); })
      .attr("cy", function(d) { return y(d.Entropy); })
      .style("fill", function(d) { return colors[d.League]; })
      .on("mouseover", function(d) {
          tooltip.transition()
               .duration(200)
               .style("opacity", .9)

          tooltip.html("<b>"+ d["Team"] + "</b>" + "<br/>" +
                      d["League"] + "<br/>" +
                      d["Season"] + "<br/>" +
	                    "H = " + Math.round(d["Entropy"] * 100) / 100)
               .style("left", (d3.event.pageX + 20) + "px")
               .style("top", (d3.event.pageY - 30) + "px")
               .style("background", colors[d.League]);
      })
      .on("mouseout", function(d) {
          tooltip.transition()
               .duration(500)
               .style("opacity", 0);
      });

    // draw legend
    var legend = svg.selectAll(".legend")
        .data(Object.keys(colors))
      .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) { return "translate(10," + (height-102+(i * 20)) + ")"; });

    // draw legend text
    legend.append("text")
        .attr("x", 15)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "start")
        .text(function(d) { return d;})

    // draw legend colored rectangles
    legend.append("circle")
        .attr("class", "dot")
        .attr("r", 3.5)
        .attr("cx", 5 )
        .attr("cy", 7.5)
        .style("fill", function(d) {
          return colors[d];})
});
// move outline and opacity to css
