////////// Enourmous Thanks David https://bl.ocks.org/davidcdupuis/3f9db940e27e07961fdbaba9f20c79ec //////////
var w = window.innerWidth;
var h = window.innerHeight;

var currYear = 2018;

var svg = d3.select("body").append("svg")
  .attr("width", w)
  .attr("height", h)
  .style("cursor", "move")
  .style("background-color", "white");

var g = svg.append("g");
var color = d3.scaleOrdinal(d3.schemeCategory20);

// FORCE SIMULATION
var simulation = d3.forceSimulation()
  .force("link", d3.forceLink().id(function(d) {
    return d.id;
  }))
  .force("charge", d3.forceManyBody().strength(-2000))
  .force("center", d3.forceCenter(w / 2, h / 2))
  .force("collide", d3.forceCollide(100));

// ZOOM PARAMETERS
var min_zoom = 0.05;
var max_zoom = 6;
var zoom = d3.zoom()
  .scaleExtent([min_zoom, max_zoom])
  .on("zoom", zoomed);
svg.call(zoom);
var transform = d3.zoomIdentity
  .translate(w / 1.8, h / 2.5)
  .scale(0.2);

svg.call(zoom.transform, transform);

// BASIC NODE SIZE
var nominal_stroke = 1;
var nominal_node_size = 20;

// GRAPH VARIABLES
var cx = w / 2;
var cy = h / 2;

// HIGHLIGHT VARIABLES
var focus_node = null,
  highlight_node = null;
var highlight_color = "blue";
var highlight_trans = 0.1;

// ----- GLOBAL FUNCTIONS -----
function dragStart(d) {
  if (!d3.event.active) simulation.alphaTarget(0.5).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragging(d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

function dragEnd(d) {
  if (!d3.event.active) simulation.alphaTarget(0.1);
  d.fx = null;
  d.fy = null;
}

function zoomed() {
  g.attr("transform", d3.event.transform);
}

function isInList(el, list) {
  for (var i = 0; i < list.length; i++) {
    if (el == list[i]) return true;
  }
  return false;
}

// ----- MANAGE JSON DATA -----
d3.json("data/red.json", function(error, graph) {
  if (error) throw error;

  var gnd = graph.nodes;
  var gnl = graph.links;

  // INITIALIZE THE LINKS
  var link = g.append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(gnl)
    .enter()
    .append("line")
    .attr("stroke-width", function(d) {
      return nominal_stroke * 2
    })

  var div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  // Tooltip
  function createTooltip(d) {

    div.transition()
      .duration(200)
      .style("opacity", .9);

    div.html("<table><tr><td>" + d.name + "</td></tr><tr><td>" + d.category + "</td></tr><tr><td>" + "</td></tr></table>")
      .style("left", (d3.event.pageX) + "px")
      .style("top", (d3.event.pageY - 28) + "px");
  }

  // drawCircles();

  // INITIALIZE THE NODES
  var node = g.append("g")
    .attr("class", "nodes")
    .selectAll("circles")
    .data(gnd)
    .enter()
    .append("circle")
    .attr("r", nominal_node_size)
    .attr("fill", function(d) {
      if (d.year !== "")
        return color(d.year);
      else
        return "black";
    })
    .style("cursor", "pointer")
    .on("mouseover", createTooltip)
    .call(d3.drag()
      .on("start", dragStart)
      .on("drag", dragging)
      .on("end", dragEnd));

  simulation.nodes(gnd)
    .on("tick", annulus_ticked);

  simulation.force("link")
    .links(gnl);

  function getY(year) {
    if (year !== "") {
      var multiplier = Math.abs(parseInt(year) - currYear);
      var separator = 30;
      return (multiplier + 1) * separator;
    } else {
      return 2010;
    }
  }

  //function returns small and big radiuses of annulus based on Point year
  function getAnnulus(year) {
    var big_radius;
    var separator = 200;
    if (year !== "") {
      var multiplier = Math.abs(parseInt(year) - currYear);
      big_radius = (multiplier + 1) * separator;
    } else {
      big_radius = 2010;
    }
    return [big_radius - separator, big_radius];
  }

  //function to verify if X in the correct position
  function verifyPosition(x, y, small_r, big_r) {
    var point;
    //verify if P is in annulus defined by small_r and big_r
    if ((Math.pow(x - cx, 2) + Math.pow(y - cy, 2)) <= Math.pow(small_r, 2)) {
      // P inside small circle
      point = recalculateP(x, y, small_r);
    } else if ((Math.pow(x - cx, 2) + Math.pow(y - cy, 2)) > Math.pow(big_r, 2)) {
      // P outside big circle
      point = recalculateP(x, y, big_r);
    } else {
      point = [x, y];
    }
    return point;
  }

  //places point off circle on circle ring
  function recalculateP(x, y, r) {
    var vx = x - cx;
    var vy = y - cy;
    var norm = Math.sqrt(Math.pow(vx, 2) + Math.pow(vy, 2));
    var new_x = cx + vx / norm * r;
    var new_y = cy + vy / norm * r;
    return [new_x, new_y];
  }

  // function to return link and node position when simulation is generated
  function ticked() {
    // Each year is placed on a different level to get chronological order of paper network

    node
      .attr("cx", function(d) {
        return d.x;
      })
      .attr("cy", function(d) {
        return d.y;
      });

    link
      .attr("x1", function(d) {
        return d.source.x;
      })
      .attr("y1", function(d) {
        return d.source.y;
      })
      .attr("x2", function(d) {
        return d.target.x;
      })
      .attr("y2", function(d) {
        return d.target.y;
      });
  }

  function annulus_ticked() {
    node
      .attr("cx", function(d) {
        var annulus = getAnnulus(d.year);
        var position = verifyPosition(d.x, d.y, annulus[0], annulus[1]);
        d.x = position[0];
        return d.x;
      })
      .attr("cy", function(d) {
        var annulus = getAnnulus(d.year);
        var position = verifyPosition(d.x, d.y, annulus[0], annulus[1]);
        d.y = position[1];
        return d.y;
      });

    link
      .attr("x1", function(d) {
        return d.source.x;
      })
      .attr("y1", function(d) {
        return d.source.y;
      })
      .attr("x2", function(d) {
        return d.target.x;
      })
      .attr("y2", function(d) {
        return d.target.y;
      });
  }

  function pythag(r, b, coord) {
    r += nodeBaseRad;

    // force use of b coord that exists in circle to avoid sqrt(x<0)
    b = Math.min(w - r - strokeWidth, Math.max(r + strokeWidth, b));

    var b2 = Math.pow((b - radius), 2),
      a = Math.sqrt(hyp2 - b2);

    // radius - sqrt(hyp^2 - b^2) < coord < sqrt(hyp^2 - b^2) + radius
    coord = Math.max(radius - a + r + strokeWidth,
      Math.min(a + radius - r - strokeWidth, coord));

    return coord;
  }

  //// Effects
  d3.select('#degree').on('click', function() {
    node.attr("r", function(d) {
      return d.degree * 4
    })
  });


});
