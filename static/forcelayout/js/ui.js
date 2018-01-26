function create_ui(){
    create_dropdown();
    create_slider();
    create_tooltip();
    create_legend();
    create_buttons();
}


function create_slider() {

    var slider = d3.sliderHorizontal()
        .min(0)
        .max(max_length)
        .default(max_length)
        .step(1)
        .width(300)
        .on('onchange', val => {
            filter_num(val);
        });

    var g = d3.select("div#slider2").append("svg")
        .attr("width", 500)
        .attr("height", 100)
        .append("g")
        .attr("transform", "translate(30,30)");

    g.call(slider);
}

function create_dropdown() {
    var select = d3.select('#dropdown')
        .on('change', dropdown_change)

    select.selectAll("option")
        .data(countries)
        .enter()
        .append("option")
        .attr("value", function(d) { return d; })
        .text(function(d) { return d; })
}

function dropdown_change() {
    val = d3.select('select#dropdown').property('value');
    filters['country'] = val;
    update();
};

function create_tooltip() {
    tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .on('mouseover', function(d, i) {
            tooltip.transition().duration(0).style('opacity', .9); // on mouse over cancel circle mouse out transistion
        })
        .on('mouseout', function(d, i) {
            hide_tooltip();
        });
}

function create_legend() {
    var legend = d3.select("#legend")
        .append("svg").attr('id', 'legend')
        .attr('width', '100%');

    legend.append("circle")
        .attr("r", 20)
        .attr('cx', 25)
        .attr('cy', 25)
        .style('fill', '#494848');

    legend.append("text")
        .text('Node Radius = Number of followers')
        .attr('x', 60)
        .attr('y', 25)
        .attr('dominant-baseline', 'central')
        .style('font-size', '15px');

    var line_data = [
        { "x": 10, "y": 60 },
        { "x": 40, "y": 60 }
    ];

    var line_generator = d3.line()
        .x(function(d) { return d.x; })
        .y(function(d) { return d.y; });

    legend.append("path")
        .attr("d", line_generator(line_data))
        .attr("stroke", "#494848") // TODO. put colour in variable and ref.
        .attr("stroke-width", 7)
        .style('opacity', opacity_normal);

    legend.append("text")
        .text('Link Width = In-degree of mentions and retweets')
        .attr('x', 60)
        .attr('y', 60)
        .attr('dominant-baseline', 'central')
        .style('font-size', '15px');
}


function create_buttons() {
    var circles_offset = 70;

    var button_div = d3.select("#type")
        .append("svg").attr('id', 'type')
        .attr('width', '100%')

    var buttons = button_div.selectAll('.circle')
        .data(groups)
        .enter()
        .append("g")

    buttons.append("circle")
        .attr('id', function(d) { return d; })
        .attr("r", 20)
        .attr("fill", function(d) { return colour(d) })
        .attr('cx', function(i, d) { return i * circles_offset })
        .attr('cy', 25)
        .on('click', update_type_filter)

    buttons.append("text")
        .text(function(d) { return d; })
        .attr('x', function(i, d) { return i * circles_offset })
        .attr('y', 60)
        .attr('text-anchor', 'middle')
        .style('font-size', '15px');

}