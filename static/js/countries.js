//##########################################################################
// Context variables.
//##########################################################################

var parameters = {

  // Helper datastructure for the individual columns to show.
  columns: [
  {
    // Column name, i.e. the name of the property in the country object.
    name: "name", 
    label: 'Country',
    // A function showing how to format the cells of this column.
    format: function(d) { return d; }, 
    // How to aggregate this column data values.
    rollup: function(names) { return names[0]; }
  },
  {
    name: "continent",
    label: 'Continent',
    format: function(d) { return d; },
    // Select the first continent - all should be the same.
    rollup: function(continents) { return continents[0]; }
  },
  {
    name: "gdp",
    label: 'GDP',
    // Format as float with grouping.
    format: d3.format("0,f"),
    // Return the total GDP.
    rollup: function(gdps) { return d3.sum(gdps); }
  },
  {
    name: "life_expectancy",
    label: 'Life Expectancy',
    format: d3.format("0.3r"),
    // Return the mean life expectancy.
    rollup: function(life_expectancies) { return d3.mean(life_expectancies); }
  },
  {
    name: "population",
    label: 'Population',
    // Use scientific notation for this column.
    format: d3.format(".2s"),
    rollup: function(population) { return d3.sum(population); }
  },
  {
    name: "year",
    label: 'Year',
    format: function(d) { return d; },
    // Select the first year - all should be the same.
    rollup: function(years) { return years[0] }
  }
  ],

  // Initailze raw data.
  data: null,

  // UI filters to apply to data.
  filter: {
    year : 1995,
    continents: {
      Americas : true,
      Europe : true,
      Africa: true,
      Asia : true,
      Oceania: true
    }
  },

  makeViz: false,

  // UI filters to apply to visualization.
  vizFilter: {
    population: false,
    life_expectancy : false,
    gdp : false
    
  },

  // Sort parameters.
  sort: {
    by : 'name',
    asc: true
  },

  // Boolean flag to check if data should be aggregated.
  aggregate: false,

  // Tracks max values of these fields, useful for axis limits.
  gdp: 0,
  life_expectancy: 0,
  population: 0,


  // Initialze table.
  table : null,
  thead : null,
  tbody : null,
  svg : null,
  svgHeight : 1000,
  svgWidth : 1500,
  width : 0,
  height: 0,

  barHeight : 7.7,
  barHeight : 7.7,
  textOffset : -10,
  xAxis: null,
  paddingForLabel : 300,

  margin : {
    top: 20, 
    right: 200, 
    bottom: 30, 
    left: 150
  },

  isLogScale : false,
  timeChanged : false,

  colours: {
    Americas : "#FAA43A",
    Europe : "#F15854",
    Asia : "#60BD68",
    Oceania : "#DECF3F",
    Africa : "#5DA5DA"
  }
};

//##########################################################################
// Visualization initialization and data loading.
//##########################################################################

d3.json("/static/data/countries_1995_2012.json", function (error, data) {
  parameters.data = flattenYears(data);
  deriveYears();
  initVis();
  update();
});

/**
* Create the basic elements of the visualization.
**/
function initVis() {
  // Append a table to the html body.
  parameters.table = d3.select("body").select("#left").append("table");

  // Add a table caption.
  // parameters.table.append("caption").html("World Countries Ranking");

  // Add a thead and a header row for the column headers
  parameters.thead = parameters.table.append("thead").append('tr');

  // Add a table body for the rows.
  parameters.tbody = parameters.table.append("tbody");

  // Defining svg parameters.
  parameters.width = (parameters.svgWidth - parameters.margin.left - parameters.margin.right)
  parameters.height = (parameters.svgHeight - parameters.margin.top - parameters.margin.bottom)

  // Create svg element
  parameters.svg = d3.select("body").select(".svg")

  parameters.svg
  .attr("width", parameters.width)
  .attr("height", parameters.height)

  // Adding the X axis.
  parameters.svg.selectAll("g").filter(".axis").append("g")
  .attr("class", "x axis")
  .attr("transform", "translate(" + parameters.margin.left + ", " + 2*parameters.barHeight + ")")
  .attr("y", parameters.margin.top)


}

/**
* Flatten the given complex data structure such that it will look like the countries_2012.json file 
by inlining common properties and flattening the array.
**/
function flattenYears(data) {
  var flat = [];

  parameters.maxPop

    //For each country.
    data.forEach(function(country) {
        // For each year in each country.
        country.years.forEach(function(yearData) {
            // Extend the year object with the common properties stored just once in the country object.
            yearData.name = country.name;
            yearData.continent = country.continent;

            // Add it to the final flat array.
            flat.push(yearData);

            compareMax(yearData, "gdp")
            compareMax(yearData, "population")
            compareMax(yearData, "life_expectancy")
          })
      });

    return flat; 
}

function compareMax(yearData, variable) {
  if (yearData[variable] > parameters[variable]) {
    parameters[variable] = yearData[variable]
  }
}

/**
* Derive the min and maximal years in the dataset and update the time slider accordingly.
**/
 function deriveYears() {
    // Get the min and max year.
    var years = d3.extent(parameters.data.map(getter('year')));
    var minYear = years[0];
    var maxYear = years[1];

    // Select the first year.
    parameters.filter.year = minYear; 

    // Update the UI elements.
    d3.select('#min_time').text(minYear);
    d3.select('#max_time').text(maxYear);

    // Update the time slider values.
    d3.select('#filter_time').attr({
      min : minYear,
      max : maxYear,
      value: minYear
    });
  }

//##########################################################################
// Data wrangling.
//##########################################################################

/**
* Takes the raw data and applies filters such as continent and aggregation to it.
**/
function wrangleData(rawData) {

  // Reassign raw data to filtered.
  var filteredData = rawData;

  // Filter by year.
  filteredData = filteredData.filter(function(row) {
    return row.year === parameters.filter.year;
  });

  // Check if a continent variable has been checked.
  if (anyContinentSelected()) {
    filteredData = filteredData.filter(function (row) {
      var continent = row.continent;
          // Filter based on checked continents.
          return parameters.filter.continents[continent];
        });
  }
  // Check if the aggregate variable has been checked.
  if (parameters.aggregate) {
      //Create a nested version
      var nested = d3.nest()
              // Group by continent.
              .key(getter('continent'))
              .rollup(function(countries_in_continent) {
                  // Create a summary object.
                  var aggregatedCountry = {};
                  // Each column has a method how to aggregate its properties values.
                  // Map all columns to their rollup version.
                  parameters.columns.forEach(function(col) {
                      // Map the countries to one property of the column.
                      var colValues = countries_in_continent.map(getter(col.name));
                      // Combine the values.
                      var aggregateValue = col.rollup(colValues);
                      // Store the aggregatedValue within the resulting object.
                      aggregatedCountry[col.name] = aggregateValue;
                    });
                  // Return the summary object
                  return aggregatedCountry;
                })
              // Apply it to the data.
              .entries(filteredData); 

      // Map to the same style.
      filteredData = nested.map(function(entry) {
        var aggregatedCountry = entry.values;

          // Set the name of the aggregatedCountry to be the continent, i.e. the key of the group.
          aggregatedCountry.name = entry.key;

          return aggregatedCountry;
        });
    }

  // Helper function that returns the desired property from a row.
  var sortGetter = getter(parameters.sort.by);

  // Sort ascending.
  if (parameters.sort.asc) { 
      // Sort the array given a compare function returning an integer:
      // a < b -> < 0
      // a > b -> > 0
      // a == 0 -> = 0
      filteredData = filteredData.sort(function(a,b) {

          // Compare the properties
          var result = d3.ascending(sortGetter(a), sortGetter(b));

          // If their is no difference in property values, then sort by country name 
          if (result === 0) { 
            return d3.ascending(a.name, b.name);
          }
          return result;
        });
  // Sort descending.
  } else {
    filteredData = filteredData.sort(function(a,b) {
      var result = d3.descending(sortGetter(a), sortGetter(b));
      if (result === 0) {
        return d3.descending(a.name, b.name);
      }
      return result;
    });
  }
  // Return the result of all the data wrangling.
  return filteredData;
}

/**
* Helper function determining if any continent was checked.
**/
function anyContinentSelected() {
  // Check if any continent is set to true.
  // Get the property names / key names of the parameter.filter.continents object i.e. the list of continents.
  var continents = Object.keys(parameters.filter.continents);

  // Check if there is a continent where its value within parameters.filter.continents set to true.
  return continents.some(function(continent) {
    var isChecked = parameters.filter.continents[continent];
    return isChecked === true;
  });
}

//##########################################################################
// Update visualization
//##########################################################################

/**
 * Derive the data and update the vizualisation.
 **/
function update() {
  // Wrangle the data to be used.
  var filteredData = wrangleData(parameters.data);

  // Update the visualization.
  updateVis(filteredData);     
}

/**
* Update the visualization.
**/
function updateVis(data) {
  // Update the table headers.
  updateHeaders();

  // Update the rows.
  updateRows(data);

  // Check if a viz radio button was pressed.
  if (parameters.makeViz) {
    updateSvg(data)
  }
}

/**
* Update the chart.
**/
function updateSvg(data) {
  // Get the possible parameters for visualization.
  var keys = Object.keys(parameters.vizFilter);

  // Get the one parameter that is checked true.
  var vizFilter = keys.filter(function(key) {
    return parameters.vizFilter[key];
  });

  // Get the max value of the checked viz parameter.
  var max = parameters[vizFilter]

  // Transition time.
  var timePerElement = (1000 / data.length)

  // Linear scale, possibly log for GDP/population?
  var xScale  = d3.scale.linear()
    .domain([0, max])
    .range([0, parameters.width-parameters.paddingForLabel])

  // Add the x axis.
  var xAxis = d3.svg.axis()
    .scale(xScale)
    .orient("top")
    .tickPadding(0)

  // Data join.
  parameters.svg = d3.select("body").select(".svg")
  var groups = parameters.svg.select("g").filter(".bars").selectAll("g").data(data)

  // Enter. 
  var groupsEnter = groups.enter().append("g")
    .attr("class", "groups")
    .attr("transform", function(d, i) {
      return "translate(" + parameters.margin.left + "," + (3*parameters.barHeight + (i * parameters.barHeight))+ ")" 
    })

  // Remove text and rect elements not affected by exit().
  // http://stackoverflow.com/questions/32534525/d3-elements-within-a-group-not-being-removed-properly
  groups.selectAll("text").remove();
  groups.selectAll("rect").remove();

  /// Add the bars.
  bars = groups.append("rect")
    .attr("class", "bar")
    .attr("height", parameters.barHeight - 1)
    .attr("width", 0)
    .style("fill", "white")
    .on("mouseover", function() {
          d3.select(this).classed("hover", true);
        })
      .on("mouseout", function() {
           d3.select(this).classed("hover", false)

      })

  // Add gridlines.
  var grids = parameters.svg.selectAll("line.horizontalGrid").data(xScale.ticks())

  // Adding country names.
  var text = groups.append("text")
    .attr("class", "countryName")
    .attr("x", parameters.textOffset)
    .attr("y", parameters.barHeight / 2)
    .attr("dy", ".35em")
    .text(function(d) { return d.name })
    .style("text-anchor","end")
    .attr("fill", "black")

  // Adding the X axis.
  var graphAxis = parameters.svg.selectAll("g").filter(".x")
  .attr("transform", "translate(" + parameters.margin.left + ", " + parameters.margin.top + ")")
  .transition()
  .duration(1000)
  .call(xAxis);

  grids.enter().append("line")
    .attr(
    {
        "class":"horizontalGrid",
        "x1" : function(d){ return 0;},
        "x2" : function(d){ return 0;},
        "y1" : parameters.margin.top,
        "y2" : 3*parameters.barHeight + (data.length * parameters.barHeight),
        "fill" : "none",
        "shape-rendering" : "crispEdges",
        "stroke" : "white",
        "stroke-width" : "1px"
    });

  // Add a bottom line.
  var bottomAxis = parameters.svg
  .append("line")
  .attr(
    {
        "class":"horizontalGrid",
        "x1" : function(d){ return parameters.margin.left;},
        "x2" : function(d){ return parameters.width-parameters.margin.left;},
        "y1" : 3*parameters.barHeight + (data.length * parameters.barHeight),
        "y2" : 3*parameters.barHeight + (data.length * parameters.barHeight),
        "fill" : "none",
        "shape-rendering" : "crispEdges",
        "stroke" : "darkgrey",
        "stroke-width" : "1px"
    });

  // If the time filter hasn't been touched then animate.
  if (parameters.timeChanged == false){

    bars
      .transition()
      .ease("linear")
      .duration(300)
      .delay(function(d, i) {
        return i*timePerElement
      })
      .attr("width", function(d) {
        return xScale(d[vizFilter])
      })
      .style("fill", function(d) {
        // Look up the continent and corresponding colour.
        return parameters.colours[d.continent];
      })

    grids
      .transition()
      .ease("linear")
      .duration(1000)
      .delay(function(d, i) {
        return i*timePerElement
      })
      .attr(
        {
          "x1" : function(d){ return parameters.margin.left + xScale(d);},
          "x2" : function(d){ return parameters.margin.left + xScale(d);},
          "y1" : parameters.margin.top,
          "y2" : 3*parameters.barHeight + (data.length * parameters.barHeight),
          "stroke" : "darkgrey",
        });
    }

  // Otherwise just move bars without animation.
  else {
    parameters.timeChanged = false;

    bars
      .attr("width", function(d) {
        return xScale(d[vizFilter])
      })
      .style("fill", function(d) {
        // Look up the continent and corresponding colour.
        return parameters.colours[d.continent];
      })
  }

  // Exit.
  groups.exit().remove()
  grids.exit().remove()

}

/**
* Update the table headers
**/
function updateHeaders() {
  // Data join.
  var theads = parameters.thead.selectAll("th").data(parameters.columns);

  // Enter.
  var theadsEnter = theads.enter()
  .append("th")
          .on("click", onHeaderClick); //when the user clicks on the header call the onHeaderClick function given by name

  // Update.
  theads.text(function(d) {
    var label = d.label;
      //sorted by this column -> change label
      if (parameters.sort.by === d.name) {
          //append special characters depending on ascending or descending using a shorthand if
          label += parameters.sort.asc ? "\u25B4" : "\u25BE";
        }
        return label;
      });

  //Exit.
  theads.exit().remove();
}

/**
* Update the table body/rows.
**/
function updateRows(data) {
  // Data join.
  var rows = parameters.tbody.selectAll("tr.row").data(data);

  //Enter.
  var rowsEnter = rows.enter()
  .append("tr").attr("class", "row");

  // Update - using individual row function
  updateRow(rows);

  // Exit.
  rows.exit().remove();
}

/**
* Update one specific row
**/
function updateRow(rows) {

  // Data join - nested data join during rows update.
  var cells = rows.selectAll("td")
  .data(function (row) {
    return getCells(row);
  });

  /*console.log("CELLS = " + cells)
  console.log(cells)*/

  // Enter.
  var cellsEnter = cells.enter().append("td");

  // Update.
  cells.text(function(d, i) {
      // Use the index to determine the column, e.g. 0 ... name
      var column = parameters.columns[i];

      // Each column has a function format for formatting its cell values.
      return column.format(d);
    });

  // Exit.
  cells.exit().remove();
}

/**
* Helper function parsing the individual cell values for the given row.
*/
function getCells(row) {
  // Look up the columns and map each element of 
  return parameters.columns.map(function(col) {
      // Lookup the column name in the given row and return its value.
      return row[col.name];
    });
}

//##########################################################################
// Register interactive event listeners.
//##########################################################################

// Select all input fields named 'filter_continent'.
d3.selectAll('input[name="filter_continent"]').on('click', function() {
    // Get the value of the clicked filter check box.
    var continent = d3.select(this).property('value');

    // Get the checked state.
    var checked = d3.select(this).property('checked');

    // Update the continents filter state.
    parameters.filter.continents[continent] = checked;

    update();
  });

// Select all input fields named 'aggregate'.
d3.selectAll('input[name="aggregate"]').on('click', function() {
    // Check if the click radio button is the continent aggregated one.
    var isContinent = d3.select(this).property('value') === 'continent';

    // Get the checked state.
    var checked = d3.select(this).property('checked');

    // Update the aggregat filter state if aggregate and continent button checked.
    parameters.aggregate = checked && isContinent;

    update();
  });

// Since there is just a single instance of the time range, it can be directly 
// accessed it by its defined id.
d3.select('#filter_time').on('input', function() {

  parameters.timeChanged = true;

    // Set the value of the time range and convert it to an integer.
    var year = parseInt(d3.select(this).property('value'));

    // Update the parameter.
    parameters.filter.year = year;

    update();
  });

// Select all input fields named 'vizFilter'.
d3.selectAll('input[name="viz"]').on('click', function() {
    // Get the value of the clicked filter check box.
    var type = d3.select(this).property('value');

    // Get the checked state.
    var checked = d3.select(this).property('checked');

    // Start the visualization.
    parameters.makeViz = true;

    // Reset all the viz filters to false/
    parameters.vizFilter["population"] = false;
    parameters.vizFilter["gdp"] = false;
    parameters.vizFilter["life_expectancy"] = false;

    // Update the checked value.
    parameters.vizFilter[type] = checked;

    update();
  });


d3.selectAll("#buttons").on("click", function() {
  changeScale();
});

/**
* Helper function.
*/
 function onHeaderClick(column) {
    // If we already sort by this column, toggle the ascending/descending boolean value.
    if (parameters.sort.by === column.name) {
      parameters.sort.asc = !parameters.sort.asc;
    } else {
        // Sort by a new attribute.
        // Store the property name in sort.by and use ascending by default.
        parameters.sort.by = column.name;
        parameters.sort.asc = true;
      }
      update();
    }


    changeScale = function() {
      if (parameters.isLogScale) {
        scaleX = d3.scale.linear().domain([1, 10000]).range([300, 10]);
        parameters.isLogScale = false;
      } else {
        scaleX = d3.scale.log().domain([1, 10000]).range([300, 10]);
        parameters.isLogScale = true;
      }

      axisY.scale(scaleY);
      d3.select(".y.axis").transition().call(axisY);

      return svg.selectAll(".datapoints").transition().attr("cy", function(d) {
        return scaleY(d.value);
      });
    }

//##########################################################################
// Global helper functions.
//##########################################################################

/**
* Helper function creating an accessor function for the given attribute
*/
 function getter(name) {
  return function(d) { return d[name];}
}

/**
* Returns the given object.
*/
 function returnD(d) {
  return d;
}