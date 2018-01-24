function mouse_over(id) {
    transition(id, opacity_highlight_node, opacity_fade,
        opacity_normal_link, text_size_highlight, font_weight_highlight,
        font_weight_normal)
}

function mouse_out(id) {
    transition(id, opacity_normal_node, opacity_normal_node,
        opacity_normal_link, text_size_normal, font_weight_normal,
        font_weight_normal)
}

function transition(id, opacity_highlight_node, opacity_fade, opacity_normal_link, text_size_highlight, font_weight_highlight, font_weight_normal) {
    var segments = segment_nodes(id, graph);
    // console.log(segments)
    transition_nodes(segments['node_id'], opacity_highlight_node, text_size_highlight, font_weight_highlight);
    // transition_neighbours(segments['neighbour_ids'], opacity_highlight_node);
    transition_links(segments['link_ids'], opacity_normal_link);
    transition_other_nodes(segments['node_other_ids'], opacity_fade, font_weight_normal);
    transition_links(segments['links_other_ids'], opacity_fade);
}

function segment_nodes(node_id, graph) {
    var graph = graph;
    var link_ids = get_links_ids_for_node_id([node_id])
    var neighbour_ids = get_neighbour_ids(node_id, link_ids);
    var node_ids = neighbour_ids.concat(node_id)
    var node_other_ids = get_other_nodes(node_ids);
    var links_other_ids = get_other_links_ids(link_ids);

    var node_id_segments = {
        'node_id': node_id,
        'link_ids': link_ids,
        'neighbour_ids': neighbour_ids,
        'node_other_ids': node_other_ids,
        'links_other_ids': links_other_ids
    }
    return node_id_segments
}

function get_links_ids_for_node_id(node_ids) {
    var real_links = graph.links.filter(function(d) { return d.id });
    var links_of_all_nodes = []

    node_ids.forEach(function(node_id) {
        var links_connecting = real_links.filter(function(d) {
            return d.id.includes(node_id)
        })
        links_of_all_nodes.push(...links_connecting)
    })
    link_ids = get_unique_values(links_of_all_nodes, 'id');

    return link_ids
}

function get_neighbour_ids(node_id, link_ids) {
    var neighbour_ids = new Set();

    link_ids.forEach(function(link_id) {
        var neighbour_id = parse_other_node_from_link_id(link_id, node_id);
        neighbour_ids.add(neighbour_id);
    })
    neighbour_ids = Array.from(neighbour_ids);
    return neighbour_ids
}

function get_other_nodes(node_ids) {

    node_data_real = graph.nodes.filter(function(d) { return d.id })
    all_node_ids = get_unique_values(node_data_real, 'id')

    node_other_ids = all_node_ids.filter(x => node_ids.indexOf(x) < 0);

    return node_other_ids
}

function get_other_links_ids(link_ids) {
    link_data_real = graph.links.filter(function(d) { return d.id })
    all_link_ids = get_unique_values(link_data_real, 'id')
    links_other_ids = all_link_ids.filter(x => link_ids.indexOf(x) < 0);
    return links_other_ids
}

function parse_other_node_from_link_id(link_id, node_id) {
    return link_id.replace(node_id, '').replace(' ', '')
}

function transition_nodes(node_ids, opacity_node, text_multiplier, font_weight) {
    node = nodes.filter(function(d) {
        return node_ids.includes(d.id)
    })

    node
        .transition()
        .duration(500)
        .style('opacity', opacity_node)

    node
        .select('text')
        .transition()
        .delay(100)
        .duration(500)
        .attr('font-size', function(d) {
            return radius(d[radius_metric]) * text_multiplier + 'px'
        })
        .attr('font-weight', font_weight);
}

// function transition_neighbours(node_ids, opacity) {
//     node = nodes.filter(function(d) {
//         return node_ids.includes(d.id);
//     })

//     node
//         .transition()
//         .duration(1000)
//         .style('opacity', opacity);

//     node
//         .select('text')
//         .transition()
//         .delay(100)
//         .duration(500)
//         .attr('font-size', function(d) {
//             return radius(d[radius_metric]) + 'px'
//         })
//         .attr('font-weight', 'inherit');
// }

function transition_other_nodes(node_ids, opacity, font_weight) {
    node = nodes.filter(function(d) {
        return node_ids.includes(d.id);
    })

    node.transition()
        .duration(1000)
        .style('opacity', opacity);

    node
        .select('text')
        .transition()
        .delay(100)
        .duration(500)
        .attr('font-size', function(d) {
            return radius(d[radius_metric]) + 'px'
        })
        .attr('font-weight', font_weight);
}


function transition_links(link_ids, opacity) {
    var link = links.filter(function(d) {
        return link_ids.includes(d[1].link_id)
    })

    link.transition()
        .duration(1000)
        .style('stroke-opacity', opacity)
        .style('stroke-width', function(link_) {
            return scale_links(link_[1].value)
        })
}


function show_tooltip(d) {
    if (tooltip_display == false) {
        return
    }
    coords = calc_tooltip_coords();

    tooltip.transition()
        .style('display', 'block')
        .duration(200)
        .style("opacity", .9);

    tooltip.html("<div>" +
            '<p class="left"><img src="Resources/png/' + d['Country'].toLowerCase() + '.png' + '"></p>' +
            "<p class='right'><h2>" + d["id"] + "</h2></p>" +
            "<p><b>Name: </b>" + d["Top 50 Names"] + '</p><br style="clear:both"/>' +
            "<p><b>Employer Affiliation: </b>" + "<br/>" + d["Bio update"] + '</p><br/>' +
            '<p class="left"><b>Twitter Followers: </b></p>' + '<p class="right">' + d["Twitter Followers"] + '</p><br style="clear:both"/>' +
            '<p class="left"><b>Mentions of Top 50: </b></p>' + '<p class="right">' + d["Mentions of Top 50 (number of stakeholders)"] + '</p><br style="clear:both"/>' +
            '<p class="left"><b>Mentioned by Top 50: </b></p>' + '<p class="right">' + d["Mentioned by Top 50 (number of stakeholders)"] + '</p><br style="clear:both"/>' +
            '<p class="left"><b>Mentions overall on Twitter in the last year: </b></p>' + '<p class="right">' + d["Mentions on Twitter in the last year"] + '</p><br style="clear:both"/>' +
            '<p class="left"><b>Interconnectivity: </b></p>' + '<p class="right">' + d["Interconnectivity"] + '</p><br style="clear:both"/>' +
            '</div>')
        .style("left", coords.x + "px")
        .style("top", coords.y + "px");
}

function hide_tooltip() {
    tooltip.transition()
        .duration(800)
        .style("opacity", 0)
        .transition()
        .duration(1)
        .style('display', 'None')
        .style("left", 0 + "px")
        .style("top", 0 + "px");
}