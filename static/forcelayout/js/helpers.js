String.prototype.format = function() {
    var i = 0,
        args = arguments;
    return this.replace(/{}/g, function() {
        return typeof args[i] != 'undefined' ? args[i++] : '';
    });
}

String.prototype.toUpper = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

function validate_mouse_position(x, a, b) {
    console.log(x, a, b)
    if (x < a) x = a;
    if (x > b) x = b;
    console.log(x)
    return x;
}

function calc_tooltip_coords() {

    var mouse_x = d3.event.pageX;
    var mouse_y = d3.event.pageY;
    var div_name = '#viz';

    var offset_left = $(div_name).offset()['left'];
    var offset_top = $(div_name).offset()['top'];
    var tooltip_width = $('.tooltip').width();
    var tooltip_height = $('.tooltip').height();

    var left = mouse_x - tooltip_offset - tooltip_width;
    var right = mouse_x + tooltip_offset;
    var top = mouse_y - tooltip_offset - tooltip_height;
    var bottom = mouse_y + tooltip_offset;

    if (mouse_x <= offset_left + (width / 2)) {
        x = left;
    } else {
        x = right;
    }

    if (mouse_y <= height / 2) {
        y = top
    } else {
        y = bottom
    }

    if ((x == right) & (mouse_x >= (width - tooltip_width))) {
        x = left
    } else if ((x == left) & (mouse_x <= (tooltip_width + offset_left))) {
        x = right
    }

    if ((y == top) & (mouse_y <= tooltip_height)) {
        y = bottom
    } else if ((y == bottom) & (mouse_y >= height - tooltip_height)) {
        y = top
    }

    return { 'x': x, 'y': y }
}

function toggle_array(l, val) {
    i = l.indexOf(val)

    if (i == -1) {
        l.push(val)
        return 1
    } else {
        if (l.length > 1) {
            l.splice(i, 1)
            return .4
        }
    }
    return false
}


function get_unique_values(data, value) {
    var set_of_values = {};

    data.forEach(function(d) {
        var name = (d[value]);
        set_of_values[name] = 1
    })
    unique_values = Object.keys(set_of_values)

    return unique_values;
}


function shade_colour(colour, percent) {

    var R = parseInt(colour.substring(1,3),16);
    var G = parseInt(colour.substring(3,5),16);
    var B = parseInt(colour.substring(5,7),16);

    R = parseInt(R * (100 + percent) / 100);
    G = parseInt(G * (100 + percent) / 100);
    B = parseInt(B * (100 + percent) / 100);

    R = (R<255)?R:255;  
    G = (G<255)?G:255;  
    B = (B<255)?B:255;  

    var RR = ((R.toString(16).length==1)?"0"+R.toString(16):R.toString(16));
    var GG = ((G.toString(16).length==1)?"0"+G.toString(16):G.toString(16));
    var BB = ((B.toString(16).length==1)?"0"+B.toString(16):B.toString(16));

    return "#"+RR+GG+BB;
}