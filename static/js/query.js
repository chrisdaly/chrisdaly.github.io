// Page margins.
var margin = {top: 30, right: 10, bottom: 20, left: 10};
var width = 960 - margin.left - margin.right,
    height = 700 - margin.top - margin.bottom;

// Create svg.
var svg = d3.select("#right").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// add the tooltip area to the webpage
var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

// Transition duration.
var duration = 500;

// Dimensions for node rectangle.
var rect_dim = {width: 120, height: 25};
var link_dim = [1, 20];

// Instantiate tree layout.
var tree = d3.layout.tree()
  .size([width - margin.left, height - margin.top]);

// Path generator.
var diagonal = d3.svg.diagonal()

// Hides or reveals children depending on node state.
function toggle(d) {
  // If the node has children, stash the data and remove it from this attr.
  if (d.children) {
    d._children = d.children;
    d.children = null;
  }
  // Recover the children from the stash.
  else {
    d.children = d._children;
    d._children = null;
  }
}

// Load JSON data.
d3.json('Data/parsed lucene.json', function(error, json) { //model rules.json
  if (error) throw error;
  console.log(json);

  document.getElementById("left").innerHTML = JSON.stringify(json, undefined, 2);
  // Reassign data to root as a global variable.
  root = json;

  // Init position to top left corner for future transition.
  root.x0 = 0;
  root.y0 = 0;

  // Hide children for this element and all its children.
  function toggleAll(d) {
    if (d && d.children) {
      d.children.forEach(toggleAll);
      toggle(d);
    }}

  // Use tree layout to compute nodes and links data.
  var nodes = tree.nodes(root);
  var links = tree.links(nodes);

  // Scale for link thickness.
  scale_links = d3.scale.linear()
                      .domain(d3.extent(links, function(d) { return +d.source.count; }))
                      .range(link_dim);

  // Scale for node colour.
  scale_nodes = d3.scale.linear()
  .domain(d3.extent(links, function(d) { return +d.target.value; }))
                      .range(["white", "steelblue"]);

  // Initialize the display to only show the root node's children.
  root.children.forEach(toggleAll);
  update(root);
});

// Takes the node of interest (that was clicked on) and draws the new tree structure.
function update(source_node) {
  // Generate new nodes and links using layout and data.
  var nodes = tree.nodes(root);
  var links = tree.links(nodes);

  // Links.
  var link = svg.selectAll('path.link')
    .data(links, function(d) { return d.target.id; })

  var link_enter = link.enter().insert("svg:path", "g.node") // this prevents layering issue.
    .attr('class', 'link')
    .attr("d", function(d) {
        var o = {x: source_node.x0, y: source_node.y0};
        return diagonal({source: o, target: o});
      })

  link_enter.transition()
    .duration(duration)
    .attr("d", diagonal)
    .attr('stroke-width', function(d) { return scale_links(d.target.count) });

  link.transition()
      .duration(duration)
      .attr("d", diagonal)
      .attr('stroke-width', function(d) { return scale_links(d.target.count) });

  // Transition exiting nodes to the parent's new position.
  link.exit().transition()
      .duration(duration)
      .attr("d", function(d) {
        var o = {x: source_node.x, y: source_node.y};
        return diagonal({source: o, target: o});
      })
      .remove();

  // Nodes.
  var node = svg.selectAll('.node')
    .data(nodes, function(d) { return d.id  });

  var node_enter = node.enter().append('g')
    .attr('class', 'node')
    .attr('transform', function (d) { return 'translate(' + source_node.x0 + "," + source_node.y0 + ')'})
    .on("click", function(d) {
      toggle(d);
      update(d, scale_links, scale_nodes);
    });

  // Rect.
  node_enter.append('rect')
    .attr('x', -rect_dim.width/2)
    .attr('y', -rect_dim.height/2)
    .attr("rx", 2)
    .attr("ry", 2)
    .attr("width", 1e-6)
    .attr("height", 1e-6)
    .attr('fill', 'white') //function(d) { return scale_nodes(d.value) })
    .attr('stroke', 'black')
    .on("mouseover", function(d) {
        console.log(d);
        console.log(d3.event.pageX, d3.event.pageY)
        tooltip.transition()
             .duration(200)
             .style("opacity", .9);

        tooltip
              .html("<b>" + d.rule + "</b>" + "<br/>" +
                    "count = " + d.count.toString() )
             .style("left", (d3.event.pageX + 20) + "px")
             .style("top", (d3.event.pageY - 30) + "px")
             .style("background", "grey");
      })
      .on("mouseout", function(d) {
        tooltip.transition()
             .duration(500)
             .style("opacity", 0);
      });

  // Text - Rule.
  node_enter.append('text')
    .text(function(d) { return 'operator' in d ? d.operator : d.rule;})
    .attr('class', 'rule')

  // Text - ID.
  node_enter.append('text')
    .text(function(d) { return d.id; })
    .attr('y', -20);

  // Text - MSE.
  // node_enter.append('text')
  //   .text(function(d) { return 'Count = ' + d.count; })
  //   .attr('y', +20)

  // Transition current nodes to their new position.
  var node_update = node.transition()
      .duration(duration)
      .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })

  node_update.select('rect')
    .attr('width', rect_dim.width)
    .attr('height', rect_dim.height);

  // Transition exiting nodes to the parent's new position.
  var node_exit = node.exit().transition()
      .duration(duration)
      .attr("transform", function(d) { return "translate(" + source_node.x + "," + source_node.y + ")"; })
      .style("fill-opacity", 1e-6)
      .remove();

  node_exit.select("rect")
    .remove()

  node_exit.select("text")
      .remove()

  // Stash the current node positions for future transition.
  nodes.forEach(function(d) {
    d.x0 = d.x;
    d.y0 = d.y;
  });
}
