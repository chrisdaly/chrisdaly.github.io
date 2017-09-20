var margin = {top: 20, right: 20, bottom: 40, left: 60};

var width = 1920 - margin.left - margin.right,
    height = 300 - margin.top - margin.bottom;
    bar_padding = 1;

var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
	
var g = svg.append("g")
    .attr("transform", "translate(" + (10 * margin.left) + "," + (5 * margin.top) + ")");

var alphabet = "abcdefghijklmnopqrstuvwxyz".split("");
var distance = 30;
var duration = 1500;

function update_viz(data){
	// Same transition timing for everything to reference.
	var t = d3.transition()
  		.duration(duration / 2);

	var text = g.selectAll('text')
		.data(data, function(d) { return d; })

	text.enter()
		.append('text')
		.text(function(d) { return d; })
		.attr('class', 'enter')
		.attr('x', function(d, i) { return i * distance})
		.attr('y', -60)
		.style('fill-opacity', 1e-6)
	   .transition(t)
		.attr('y', 0)
		.style('fill-opacity', 1)
		
	text.attr('class', 'update')
		.attr('y', 0)
	   .transition(t)
		.attr('x', function(d, i) { return i * distance})
		
	text.exit()
		.attr('class', 'exit')
	   .transition(t)
		.attr('y', 60)
		.style('fill-opacity', 1e-6)
		.remove();
}

// Init.
update_viz(alphabet)

d3.interval(function() {
	d3.shuffle(alphabet);
	j = Math.floor(Math.random() * 26);
	console.log(alphabet.slice(0, j).sort());
	update_viz(alphabet.slice(0, j).sort());
}, duration)