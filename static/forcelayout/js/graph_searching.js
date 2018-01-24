function get_other_links(link_ids) {
    link_data_real = link_data.filter(function(d) { return d.id })
    all_link_ids = get_unique_values(link_data_real, 'id')
    links_other_ids = all_link_ids.filter(x => link_ids.indexOf(x) < 0);
    return links_other_ids
}

function get_links_for_nodes(node_id) {
    var real_links = link_data.filter(function(d) {
        return d.id
    });

    var links_connecting = real_links.filter(function(d) {
        return d.id.includes(node_id)
    })

    return links_connecting
}

function get_other_nodes(node_id, neighbour_ids) {
    node_ids = neighbour_ids.concat(node_id)
    node_data_real = node_data.filter(function(d) { return d.id })
    all_node_ids = get_unique_values(node_data_real, 'id')

    node_other_ids = all_node_ids.filter(x => node_ids.indexOf(x) < 0);

    return node_other_ids
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

function parse_other_node_from_link_id(link_id, node_id) {
    return link_id.replace(node_id, '').replace(' ', '')
}

function check_nodes_for_string() {
    val = document.getElementById('search').value.toLowerCase()
    console.log(val)
    real_node_data = node_data.filter(function(d) { return d.id; })

    // dim_all();
    if (val.length == 0) {
        update(node_data, link_data)
    } else {
        for (var i = 0; i < real_node_data.length; i++) {
            var node = real_node_data[i]
            if ((node['id']).toLowerCase().includes(val)) {
            transition_node(node['id'], opacity_highlight, text_size_highlight, font_weight_highlight);
            }
        }
    }
}
