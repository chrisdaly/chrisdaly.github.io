function load_data(location) {
    var graph;
    jQuery.ajax({
        dataType: "json",
        url: location,
        async: false,
        success: function(data) { graph = data }
    });

    return graph
}

function make_all_ids_lowercase(graph){
    graph.nodes.forEach(function(d) {
        d.id = d.id.toLowerCase();
    })

    graph.links.forEach(function(d) {
        d.source = d.source.toLowerCase();
        d.target = d.target.toLowerCase();

    })

    return graph;
}

function pre_process_graph(graph) {
    graph = make_all_ids_lowercase(graph);
    graph.links = change_link_source_id_to_ref(graph);
    graph.links = add_id_to_links(graph.links);

    graph.nodes = add_node_quantity(graph.nodes)
    graph.nodes = sort_graph_nodes(graph.nodes, 'value')

    return graph
}

function wrangle_data(graph_processed) {
    var graph = $.extend(true, {}, graph_processed)
    var num = filters['node_num']
    graph.nodes = filter_nodes(graph_processed, num);
    graph.links = graph_processed.links.filter(function(d) {
        return ((graph.nodes.includes(d.source)) &
            (graph.nodes.includes(d.target)))
    }) 
    return graph
}


function add_extra_nodes_links_for_curves(graph) {
    var bi_links = [];

    graph.links.forEach(function(link) {
        var s = link.source;
        var t = link.target;
        var i = {link_value: link.value, link_id: s.id + ' ' + t.id };
        graph.nodes.push(i);
        graph.links.push({ source: s, target: i}, 
            { source: i, target: t});
        bi_links.push([s, i, t]);
    });

    graph['bi_links'] = bi_links;

    return graph
}

function change_link_source_id_to_ref(graph) {
    var node_by_id = d3.map(graph.nodes, function(d) { return d.id; })

    graph.links.forEach(function(link) {
        var source = node_by_id.get(link.source)
        var target = node_by_id.get(link.target)
        link.source = source;
        link.target = target;
    });

    return graph.links
}

function add_node_quantity(node_data) {
    for (var i = node_data.length - 1; i >= 0; i--) {
        node = node_data[i];
        node['value'] = Math.floor((Math.random() * 100) + 1);
    }
    return node_data
}

function filter_nodes(graph_processed, num) {
    // nodes_filtered = graph.nodes.filter(function(d) {
    //     if (filters['node_types'].includes(group_mapping[d.group])) {
    //         return d.group
    //     }
    // });

    nodes_filtered = graph_processed.nodes
    nodes_filtered = nodes_filtered.slice(0, num);
    // if (filters['country'] != 'None') {
    //     nodes_filtered = nodes_filtered.filter(function(d) {
    //         return d.Country == filters['country'];
    //     })
    // }

    return nodes_filtered
}

function add_id_to_links(link_data) {
    for (var i = 0, len = link_data.length; i < len; i++) {
        var link = link_data[i];
        link['id'] = link.source.id + ' ' + link.target.id;
    }
    return link_data
}

function sort_graph_nodes(node_data, value) {
    node_data = node_data.sort(function(a, b) {
        return b[value] - a[value];
    })
    return node_data
}