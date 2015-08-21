// Width and height
var w = 500;
var h = 100;
var barPadding = 1;

var dataset = [ 25, 7, 5, 26, 11, 8, 25, 14, 23, 19,
                14, 11, 22, 29, 11, 13, 12, 17, 18, 10,
                24, 18, 25, 9, 3 ];

function init()
{


    //Width and height
    var w = 500;
    var h = 300;
    var barPadding = 1;
    var padding = 20;
    
    var dataset = [ 5, 10, 13, 19, 21, 25, 22, 18, 15, 13,
                    11, 12, 15, 20, 18, 17, 16, 18, 23, 25 ];
    
    //Create SVG element
    var svg = d3.select("body")
                .append("svg")
                .attr("width", w)
                .attr("height", h);

    svg.selectAll("rect")
       .data(dataset)
       .enter()
       .append("rect")
       .attr("x", function(d, i) {
            return i * (w / dataset.length);
       })
       .attr("y", function(d) {
            return h - (d * 4);
       })
       .attr("width", w / dataset.length - barPadding)
       .attr("height", function(d) {
            return d * 4;
       })
       .attr("fill", function(d) {
            return "rgb(0, 0, " + (d * 10) + ")";
       });
            
    svg.selectAll("text")
           .data(dataset)
           .enter()
           .append("text")
           .text(function(d) {
                return d;
           })
           .attr("text-anchor", "middle")
           .attr("x", function(d, i) {
                return i * (w / dataset.length) + (w / dataset.length - barPadding) / 2;
           })
           .attr("y", function(d) {
                return h - (d * 4) + 14;
           })
           .attr("font-family", "sans-serif")
           .attr("font-size", "11px")
           .attr("fill", "white");

    var dataset = [
                            [5, 20], [480, 90], [250, 50], [100, 33], [330, 95],
                            [410, 12], [475, 44], [25, 67], [85, 21], [220, 88]
                          ];
    
    //Dynamic, random dataset
    var dataset = [];
    var numDataPoints = 50;
    var xRange = Math.random() * 1000;
    var yRange = Math.random() * 1000;
    for (var i = 0; i < numDataPoints; i++) {
        var newNumber1 = Math.round(Math.random() * xRange);
        var newNumber2 = Math.round(Math.random() * yRange);
        dataset.push([newNumber1, newNumber2]);
    }

    //Create scale functions
    var xScale = d3.scale.linear()
                         .domain([0, d3.max(dataset, function(d) { return d[0]; })])
                         .range([padding, w - padding * 2]);

    var yScale = d3.scale.linear()
                         .domain([0, d3.max(dataset, function(d) { return d[1]; })])
                         .range([h - padding, padding]);

    var rScale = d3.scale.linear()
                         .domain([0, d3.max(dataset, function(d) { return d[1]; })])
                         .range([2, 5]);

    //Define X axis.
    var xAxis = d3.svg.axis()
                  .scale(xScale)
                  .orient("bottom")
                  .ticks(5);

    //Define Y axis.
    var yAxis = d3.svg.axis()
                  .scale(yScale)
                  .orient("left")
                  .ticks(5)
                  .tickFormat(formatAsPercentage);



    var formatAsPercentage = d3.format(".1%");

    //Create SVG element
    var svg = d3.select("body")
                .append("svg")
                .attr("width", w)
                .attr("height", h);


    // Add circles to the canvas.
    svg.selectAll("circle")
       .data(dataset)
       .enter()
       .append("circle")
       .attr("cx", function(d) {
            return xScale(d[0]);
       })
       .attr("cy", function(d) {
            return yScale(d[1]);
       })
       .attr("r", function(d) {
            return rScale(d[1]);
       });

    /*svg.selectAll("text")
       .data(dataset)
       .enter()
       .append("text")
       .text(function(d) {
            return d[0] + "," + d[1];
       })
       .attr("x", function(d) {
            return xScale(d[0]);
       })
       .attr("y", function(d) {
            return yScale(d[1]);
       })
       .attr("font-family", "sans-serif")
       .attr("font-size", "11px")
       .attr("fill", "red");*/

    //Create X axis.              
    svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + (h - padding) + ")")
        .call(xAxis);

    //Create Y axis.
    svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(" + padding + ",0)")
        .call(yAxis);

    var vis=d3.select("body").append("svg").attr("width",200).attr("height",200);

    var rect=vis.selectAll("rect").data([1,4,3,2,5]).enter().append("rect");

    rect.attr("height",function(d) {return d*20;})
      .attr("width", 15)
      .attr("x",function(d,i) {return i*20;})
      .attr("y",function(d) {return 100-20*d;})
      .attr("fill","steelblue");
}
