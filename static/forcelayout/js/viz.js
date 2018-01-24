var graph_raw = load_data("/static/forcelayout/data/mdl.json");

var graph_processed = pre_process_graph(graph_raw);

function update() {
    graph = wrangle_data(graph_processed);
    graph = add_extra_nodes_links_for_curves(graph);
    update_viz(graph);
}

var margin = { 'top': 20, 'right': 10, 'bottom': 10, 'left': 10 };
var width = $('#viz').width() - margin.left - margin.right;
var height = $('#viz').height() - margin.top - margin.bottom;

var link_dim = [.5, 20];
var radius_range = [5, 10, 15, 20];
var stroke_fade = .2;
var opacity_normal_node = .8;
var opacity_highlight_node = 1;
var opacity_normal_link = .8;
var opacity_highlight = 1;
var opacity_fade = .05;
var text_size_highlight = 1.8;
var text_size_normal = 1;

// text_multiplier


var font_weight_highlight = 'bolder';
var font_weight_normal = 'inherit';
var tooltip_offset = 20;
var radius_metric = 'value';
var tooltip_display = false;

var colour = d3.scaleOrdinal(["#2FA4DD", "#002B3F", "#F15922", "#75899B",
    "#9B3737", "#494848"
])

var svg = d3.select("#viz").append("svg")
    .attr('id', 'network')
    .attr("width", width)
    .attr("height", height + margin.top + margin.bottom)
    .call(d3.zoom().on("zoom", function() {
        svg.attr("transform", d3.event.transform)
    }))
    .on("dblclick.zoom", null)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

svg.append("g").attr("class", "links");
svg.append("g").attr("class", "nodes");

var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function(d) { return d.id; }))
    .force("collide", d3.forceCollide())
    .force("charge", d3.forceManyBody().theta(1).distanceMax(800).strength(-100)) //
    .force("center", d3.forceCenter(width / 2, height / 2))
    .alphaDecay(0.01)
    .alpha(0.5)
    .force("y", d3.forceY())
    .force("x", d3.forceX());

function create_filters(graph_processed) {
    countries = get_unique_values(graph_processed.nodes, 'Country');
    countries.splice(0, 0, "None");

    max_length = graph_processed.nodes.length;

    group_mapping = {
        1: 'HCP',
        2: 'advocate',
        3: 'patient'
    };

    filters = {
        'node_types': Object.values(group_mapping),
        'node_num': graph_processed.links.length,
        'country': 'None'
    };
}

create_filters(graph_processed)
create_ui();
update();


function update_viz(graph) {
    scale_links = d3.scaleLinear()
        .domain(d3.extent(graph.links, function(d) { return d.value }))
        .range(link_dim);

    radius = d3.scaleQuantile()
        .domain(d3.extent(graph.nodes, function(d) { return d[radius_metric] }))
        .range(radius_range);

    links = svg.select(".links").selectAll(".link")
        .data(graph.bi_links, function(d) { return d.id; })

    links.exit().transition().duration(200)
        .attr("stroke-width", function(d) { return 0 })
        .style('opacity', 0)
        .remove();

    links = links.enter()
        .append("path")
        .merge(links)
        .attr("class", "link")
        .attr('id', function(d) { return d[0].id + ' ' + d[2].id })
        .style("stroke-width", function(d) { return scale_links(d[1].link_value) })
        .style("stroke", function(d) { return colour(d[0].group); })
        .style("stroke-opacity", opacity_normal_link);

    function get_link_value(graph, id) {
        graph.bi_links.filter(function(d) {
            return d.id == d
        })
    }

    nodes = svg.select(".nodes").selectAll(".node")
        .data(graph.nodes.filter(function(d) { return d.id; }))

    nodes.exit().transition().duration(700)
        .attr("r", 0)
        .style('opacity', 0)
        .remove();

    nodes = nodes.enter()
        .append("g")
        .attr("class", "node")
        .attr('id', function(d) { return d.id; })
        .merge(nodes)
        .style('opacity', opacity_normal_node)

    nodes
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended))
    nodes
        .on('mouseover', function(d) {
            // Fixes ordering of text and other circles.
            this.parentNode.appendChild(this);
            show_tooltip(d);
            mouse_over(d.id)
        })
        .on("mouseout", function(d) {
            hide_tooltip()
            mouse_out(d.id)
        })
        .on("dblclick", releasenode);

    nodes.selectAll("text").remove();
    nodes.selectAll("circle").remove();

    circles = nodes.append("circle")
        .attr("r", function(d) { return radius(parseInt(d[radius_metric])); })
        .attr('id', function(d) { return d.id; })
        .attr("fill", function(d) { return colour(d.group); })
        .style('stroke', function(d) { return colour(d.group); })
        .style('stroke-width', 1)

    labels = nodes.append("text")
        .attr("fill", function(d) {
            var colour_original = colour(d.group);
            return shade_colour(colour_original, -40);
        })
        .attr('font-size', function(d) {
            return radius(d[radius_metric]) + 6 + 'px'
        })
        .attr('class', function(d) { return group_mapping[d.group] })
        .text(function(d) { return d['id'] });

    simulation
        .nodes(graph.nodes)
        .on("tick", ticked);

    simulation.force("link")
        .links(graph.links);

    // Prevents nodes from initializing and sticking to top left.click
    // They are placed before simulation can give them coords.
    simulation.restart()
}

function releasenode(d) {
    d.fx = null;
    d.fy = null;
}

function ticked() {
    links.attr("d", create_curve);
    nodes.attr("transform", function(d) {
        return "translate(" + d.x + ', ' + d.y + ')';
    })
}

function create_curve(d) {
    return "M" + d[0].x + "," + d[0].y +
        "S" + d[1].x + "," + d[1].y +
        " " + d[2].x + "," + d[2].y;
}

function dragstarted(d) {
    if (!d3.event.active) simulation.alphaTarget(0.1).restart();
    d3.select(this).classed("fixed", d.fixed = true);
}

function dragged(d) {
    d.fx = d3.event.x //validate_mouse_position(d3.event.x, 10, width); //
    d.fy = d3.event.y //validate_mouse_position(d3.event.y, 10, height); //
}

function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0.1);
}

function sort_graph_nodes(node_data) {
    node_data.sort(function(a, b) {
        return b['value'] - a['value'];
    })
    return node_data
}



function update_type_filter(d) {
    val = d3.select(this).attr('id');
    opacity = toggle_array(filters['node_types'], val)
    if (opacity == false) {
        return
    }
    d3.select(this).style('opacity', opacity_normal_link)
    update()
}



function filter_num(val) {
    filters['node_num'] = val;
    update();
}

function check_nodes_for_string(ele) {
    if (event.key != 'Enter') {
        return
    }

    var val = ele.value;

    if (val == '') {
        var node_ids = get_unique_values(graph.nodes, 'id')
        var link_ids = get_unique_values(graph.links, 'id')
        transition_nodes(node_ids, opacity_normal_node);
        transition_links(link_ids, opacity_normal_link)

    } else {
        var real_node_data = graph.nodes.filter(function(d) { return d.id; })
        node_ids = get_node_ids_matching_substring(real_node_data, val);
        var node_other_ids = get_other_nodes(node_ids)
        link_ids = get_links_ids_for_node_id(node_ids);
        links_other_ids = get_other_links_ids(link_ids)

        transition_nodes(node_ids, opacity_highlight_node, text_size_highlight, font_weight_highlight);
        transition_neighbours(node_other_ids, opacity_fade)
        transition_links(link_ids, opacity_normal_link)
        transition_links(links_other_ids, opacity_fade)
    }
}

function get_node_ids_matching_substring(node_data, val) {
    var node_ids = [];
    for (var i = 0; i < node_data.length; i++) {
        var node = node_data[i]
        if ((node['id']).toLowerCase().includes(val)) {
            node_ids.push(node['id'])
        }
    }
    return node_ids
}

function get_unique_values(data, value) {
    var set_of_values = {};

    data.forEach(function(d) {
        var name = (d[value]);
        set_of_values[name] = 1
    })
    var unique_values = Object.keys(set_of_values)

    return unique_values;
}

d3.selectAll('input[id="checkbox_tooltip"]').on('click', function() {
    var checked = d3.select(this).property('checked');

    if (checked == false) {
        tooltip_display = false;
    } else {
        tooltip_display = true;
    }
});



// TODO: put text in g to control z values.
// TODO: fix data filtering, issues with combining multiple filters at once.
// TODO: better country filtering.
// TODO: calculate centrality
// TODO: node self reference, source == target, make path a loop???
// TODO: wrap transition params into dict.
