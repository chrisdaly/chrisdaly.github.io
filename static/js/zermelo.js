//##########################################################################
// Page Setup.
//##########################################################################

var margin = {top: 30, right: 10, bottom: 20, left: 10};
  width = 1900 - margin.left - margin.right,
  height = 700 - margin.top - margin.bottom;

var svg = d3.select("#viz").append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
.append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var tooltip = d3.select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

var duration = 500;
  rect_dim = {width: 60, height: 25};
  link_dim = [.5, 20];
  max_char = 30;
  sort = false;

// How many samples to pull using API.
var hits_size = 5;

// Path generator.
var diagonal = d3.svg.diagonal().projection(function(d) { return [d.y, d.x]; });

// Hides or reveals children depending on node state.
function toggle(d) {
// If the node has children, stash the data and remove it from this attr.
  if (d.children) {
    d._children = d.children;
    d.children = null;
  }
  // Recover the children from the stash.
  else if (d._children) {
    d.children = d._children;
    d._children = null;
  }
}

// Hide children for this element and all its children.
function minimize(d) {
  if (d && d.children) {
    d.children.forEach(minimize);
    toggle(d);
  }
}

function maximize(d) {
  if (d.type == 'binop') {
    if (d._children) {
      d._children.forEach(maximize);
      toggle(d);
    }
    else {
      d.children.forEach(maximize)
    }
  }
}

//##########################################################################
// Initialize viz.
//##########################################################################

function init_viz() {
  // Clear any elements from previous visualizations.
  svg.selectAll('.node').remove();
  svg.selectAll('.link').remove();
  svg.selectAll('.text').remove();
  console.log('data = ', data);

  // Init position to top left corner for future transition.
  data.x0 = height/2;//0;
  data.y0 = 0;
  table = d3.select("table"); //.select("#left").
  thead = table.selectAll('th');
  tbody = table.select("tbody");

  update(data);
  update_ui(data.children[0])
};

//##########################################################################
// Update viz.
//##########################################################################
function update_ui(data_node){
  update_table(data_node)
  update_div(data_node)
}

function update_div(data_node){
  $("#detail").html(("<b>count: </b>" + numberWithCommas(data_node.count) + "</b>" + "<br/>" + "<br/>" +
      "<b>term: </b>" + data_node.query.replace(/\"/g, '')))
}
// The table generation function
function update_table(data_node) {

  console.log('-- update_table -- ');
  console.log("data_node ", data_node);

  var columns_count = ["author_alias", "body", "tags"]; //["id", "created_at",

  data_samples = data_node['samples']//.slice(0, 5);
  console.log("data_node['samples'] = ", data_node['samples']);

  d3.selectAll('td').html('')

  if (data_samples == null) {
    return;
  }
  // create a row for each object in the data
  var rows = d3.select("tbody").selectAll("tr")
      .data(data_samples)

  // Data join
  // create a cell in each row for each column
  var cells = rows.selectAll("td")
      .data(function(row) {
          return columns_count.map(function(column) {
              return {column: column, value: row[column]};
          });
      });

  // Update.
  cells.html(function(d) { return d.value; });
}

// Takes the node of interest (that was clicked on) and draws the new tree structure.
function update(clicked_node) {
  console.log('-- update --');
  update_table(clicked_node);

  // Instantiate tree layout.
  var tree = d3.layout.tree()
    .size([height, width - 4*margin.left]);

  if (sort) {
    tree.sort(function(a, b) {
      return b.count - a.count || d3.ascending(a.term, b.term); })
}

// Use tree layout to compute nodes and links data.
var nodes = tree.nodes(data);
var links = tree.links(nodes);

var extents = d3.extent(links, function(d) {
  if (d.target.operator == 'not') {
    return 1;
  }
  else {
    if (+d.target.count == 0) {
      return +d.target.count; //1
    }
    else {
      return +d.target.count;
    }
  }
})

// Scale for link thickness.
var scale_links = d3.scale.linear()
                    .domain([0, extents[1]])
                    .range(link_dim);

// Links.
var link = svg.selectAll('path.link')
  .data(links, function(d) { return d.target.id; })

var link_enter = link.enter().insert("svg:path", "g.node") // this prevents layering issue.
  .attr('class', function(d) { return d.target.operator != 'not' ? 'link': 'link not' })
  .attr("d", function(d) {
      var o = { x: clicked_node.x0, y: clicked_node.y0 };
      return diagonal({source: o, target: o});
  })

link_enter.transition()
  .duration(duration)
  .attr("d", diagonal);

link.transition()
    .duration(duration)
    .attr("d", diagonal)
    .attr('stroke-width', function(d) { return d.target.operator != 'not' ? scale_links(+d.target.count): scale_links(+d.source.count) }); //scale_links(+d.source.count)

// Transition exiting nodes to the parent's new position.
link.exit().transition()
    .duration(duration)
    .attr("d", function(d) {
      var o = {x: clicked_node.x, y: clicked_node.y};
      return diagonal({source: o, target: o});
    })
    .remove();

// Nodes.
var node = svg.selectAll('.node')
  .data(nodes, function(d) { return d.id });

// Transition current nodes to their new position.
var node_update = node.transition()
    .duration(duration)
    .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; })

var node_enter = node.enter().append('g')
  .attr('class', 'node')//function(d) { return 'operator' in d ? 'node operator': 'node term'})
  .attr('transform', function (d) { return 'translate(' + clicked_node.y0 + "," + clicked_node.x0 + ')'})
  .on("click", function(d) {
    if ('operator' in d) {
      toggle(d);
      update(d);
    }
  });

// Circle.
var countmax = d3.extent(nodes, function(d) { return d.count; })
// console.log(countmax)
var radius = d3.scale.quantile()
  .domain(countmax)
  .range([15,20,25,30,35,40]); //,45,50

node_enter.append('circle')
  .attr('class', function(d) { return 'operator' in d ? 'operator': 'term'} )
  .attr("r", function (d) { return radius(d.count)} );

  node_enter.on('mouseover', function(d) {
    if ('query' in d) { update_ui(d) }
    })
   .on("mouseout",
    function(d) {
        //  $("#detail").html(("<b>count: </b>" + "select" + "</b>" + "<br/>" + "<br/>" +
        //     "<b>term: </b>" + "select"))
    })

// Text - query.
node_enter.append('text')
  .text(function(d) {
    if (d['id'] == 'Results') {
      return abbrNum(d.count, 1) + ' hits'
    } else if ('operator' in d) {
      return d.operator.toString();
    } else {
        query = d.query.replace(/\"/g, '').replace(/(['"])/g, "\\$1").toUpper()
        console.log('query = ', query)
        if (query.length <= max_char){
          return query;
        }
        else {
          return query.slice(0, max_char) + "...";
        }
    }
  })
  .attr('class', function(d) {
      if (d.id == 'Results') {
        return 'results'
      }
      else if ('operator' in d) {
        return 'operator'
      }
      else {
        return 'term'
      }
  });

// Transition current nodes to their new position.
var node_update = node.transition()
    .duration(duration)
    .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; })
     .attr("r", function (d) {return radius(d.count)});

// Transition exiting nodes to the parent's new position.
var node_exit = node.exit().transition()
    .duration(duration)
    .attr("transform", function(d) { return "translate(" + clicked_node.y + "," + clicked_node.x + ")"; })
    .style("fill-opacity", 1e-6)
    .remove();

d3.selectAll('circle').on('mouseover', function(d) {
  // console.log(this)
  d3.select(this).style('stroke', 'red').style('stroke-width', 3)

  var nodesToHighlight = links.map(function (e) { return e.source === d ? e.target : e.target === d ? e.source : 0})

  node.filter(function (d) { return nodesToHighlight.indexOf(d) >= 0; }).select('circle')
       .style('stroke', 'red').style('stroke-width', 3)

  link.style('stroke', function (link_d) {
        return link_d.source === d | link_d.target === d ? '#2FA4DD' : null;
  
  label.style('fill', function (d) { return link_d.source === d | link_d.target === d ? 'black' : null})
  });
})

d3.selectAll('circle').on('mouseout', function(d) {
  // console.log(this)
  d3.select(this).style('stroke', null).style('stroke-width', null)

  var nodesToHighlight = links.map(function (e) { return e.source === d ? e.target : e.target === d ? e.source : 0})
  
  node.filter(function (d) { return nodesToHighlight.indexOf(d) >= 0; }).select('circle')
      .style('stroke', null).style('stroke-width', null)
  
  link.style('stroke', null);
  })

  // Stash the current node positions for future transition.
  nodes.forEach(function(d) {
    d.x0 = d.x;
    d.y0 = d.y;
  });
}

//##########################################################################
// Register interactive event listeners.
//##########################################################################
// Select all input fields named 'filter_continent'.
d3.selectAll('#sort').on('click', function() {
console.log('-- sort --')
  sort = true;
  update(data);
});

d3.selectAll('#minimize').on('click', function() {
  console.log('-- minimize --')
  // Change the display to only show the root node's children.
  data.children.forEach(minimize)
  update(data);
});

d3.selectAll('#maximize').on('click', function() {
  console.log('-- maximize --')
  // Change the display to only show the root node's children.
  data.children.forEach(maximize)
  update(data);
});

$(document).ready(function() {

  $("#test").click(function(e) {
    console.log('-- Button pressed --');
    e.preventDefault();
    e.stopPropagation();

    // Extract query from search bar and get raw data from API.
    var query = $("input[name=query]").val();
    data = get_raw_data(query);

    console.log('-- Initializing viz --');
    sort = false;
    // $('#example').DataTable();
    init_viz();
  });
});
