window.mything = function () {
   /*global window */
   /*global WebSocket */

   var build_colors = function () {
    var colors = [];
    console.log('Inside set_colors', pieces);
    for (var i = 0; i < 30; i++ ) {
      var color;
      if (i < 10) {
        color = color_scale_10(i);
        console.log(color, i);
        colors.push(color);
        console.log(colors);
      } else {
        color = color_scale_20(i - 10);
        console.log(color, i);
        colors.push(color);
        console.log(colors);
      }
    }
    return colors;
  };

  var BAR_ATTR = {   
    height : 16,
    offset : 10
  };
  var PIECE_ATTR = {
    height : 15,
    width : 15,
    duration : 500
  };
  var PEER_ATTR = {
    height: 30,
    width: 30,
    margin: 2
  };
  var peers_div_bottom_margin = 5
  var peers = {};
  var peers_div;
  var pieces = {};
  var files = [];
  var partial_message = "";
  var want_file_pos = [];
  var xScale;
  var div_height = 50;
  var padding = 1;
  var text_height = 10;
  var parent_svg;
  var piece_y = Math.floor(BAR_ATTR.height / 2) - Math.floor(PIECE_ATTR.height / 2);
  var mouse_pointer_width = 15;
  var POPOVER_ATTR = {
    height: div_height - (2 * text_height),
    width: (div_height - (2 * text_height)) * 4,
    text_height: 10,
    internal_padding: 2,
    duration: 300,
    opacity: 0.85,
    box_offset: padding,
    peer_square_size: 20,
    text_offset: 4
  };
  var color_scale_10 = d3.scale.category10();
  var color_scale_20 = d3.scale.category20c();
  var colors = build_colors();
  var parser = document.createElement('a');
  parser.href = document.location.origin;
  var ws_address = "ws://" + parser.hostname + ":8001";
  window.THEWEBSOCKET = new WebSocket(ws_address);
  window.onbeforeunload = function () { window.THEWEBSOCKET.close(); };

  var build_model = function (init_dict) {
   want_file_pos = init_dict.want_file_pos;
   want_file_pos.forEach( function(want_index, i) {
     files[i] = {};
     var head_and_tail = init_dict.heads_and_tails[i];
     files[i].path = init_dict.files[want_index].path;
     files[i].relevant = [];
     for (var j = head_and_tail[0]; j <= head_and_tail[1]; j++) {
       files[i].relevant.push(j);
     }
   });
   draw_files();
 };

 
var draw_files = function () {
  peers_div = d3.select("body")
    .append("div")
    .attr("class", "peers_div")
    .style("margin-bottom", peers_div_bottom_margin);

  var divs = d3
    .select("body")
    .selectAll("div.file")
    .data(files)
    .enter()
    .append("div")
    .attr("class", "file")
    .style("height", div_height);

  var texts = divs
    .append("text")
    .text(function (d) { return d.path.join('/'); })
    .style("font-size", text_height)
    .style("font-family", "sans-serif")
    .style("color", "#09C53B")
    .attr("y", 30);

  var svgs = divs
    .append("svg")
    .attr("class", "file");

  var vis_bars = svgs
  .append("g")
  .attr("class", "bar")
  .attr("transform", "translate(0," + BAR_ATTR.offset + ")")
  .attr("id", function (d, i) {
    console.log('inside vis_bars', pieces);
    return "#bar" + d.ip;
  })
  .append("rect")
  .attr("x", 0)
  .attr("y", 0)
  .attr("width", function (d) { 
   return PIECE_ATTR.width * d.relevant.length + padding;
 })
  .attr("height", BAR_ATTR.height)
  .attr("fill", "white")
  .attr("stroke", "gray")
  .attr("stroke-width", 1)
  .attr("opacity", 1)
  .attr("id", function (d, i) {return ("#bar" + i); });

  var vis_pieces = svgs.select("g.bar")
  .selectAll("rect.piece")
  .data(function (d) { return d.relevant; })
  .enter()
  .append("rect")
  .attr("class", "piece")
  .attr("class", function (d) {
    return ("piece" + d); })
  .attr("x", function (d, i) { return padding + i * PIECE_ATTR.width; })
  .attr("y", (BAR_ATTR.height / 2) - (PIECE_ATTR.height / 2))
  .attr("height", PIECE_ATTR.height - padding)
  .attr("width", PIECE_ATTR.width - padding)

  .attr("opacity", 0)

  var piece_click = vis_pieces.on("click", function (d, i, j) {
    var piece_color = this.getAttribute("fill");
    var piece_id = this.getAttribute("class").replace("piece", "");
    var loc_dict = peers[pieces[piece_id]].location
    var xPosition = parseFloat(d3.select(this).attr("x"));
    var yPosition = parseFloat(d3.select(this).attr("y"));

    var tooltip = d3.select(svgs[0][j])
        .append("g")
        .attr("class", "tooltip")
        .attr("transform", "translate(" + (xPosition + mouse_pointer_width) + "," + yPosition + ")")
        .append("rect")
        .attr("class", "popover_main")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", function () {
          return POPOVER_ATTR.width;
        })
        .attr("height", POPOVER_ATTR.height)
        .attr("fill", "white")
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .attr("opacity", 0)
        .transition()
        .duration(POPOVER_ATTR.duration)
        .attr("opacity", POPOVER_ATTR.opacity);

    var piece_text = d3.select("g.tooltip")
      .append("text")
      .attr("x", POPOVER_ATTR.internal_padding + POPOVER_ATTR.peer_square_size + POPOVER_ATTR.text_offset)
      .attr("y", POPOVER_ATTR.text_height + POPOVER_ATTR.internal_padding)
      .text('piece ' + piece_id)
      .attr("font-size", POPOVER_ATTR.text_height)
      .attr("opacity", 0)
      .transition()
      .duration(POPOVER_ATTR.duration)
      .attr("opacity", POPOVER_ATTR.opacity);
    
    var peer_ip_text = d3.select("g.tooltip")
      .append("text")
      .attr("x", function () {
        return POPOVER_ATTR.internal_padding +
        POPOVER_ATTR.peer_square_size + POPOVER_ATTR.text_offset;
      })
      .attr("y", 2 * (POPOVER_ATTR.text_height + POPOVER_ATTR.internal_padding))
      .text(pieces[piece_id])
      .attr("font-size", POPOVER_ATTR.text_height)
      .attr("opacity", 0)
      .transition()
      .duration(POPOVER_ATTR.duration)
      .attr("opacity", POPOVER_ATTR.opacity);

    var peer_location_box = d3.select("g.tooltip")
      .append("g")
      .attr("class", "location_text")
      .attr("transform", function() {
        return "translate(" + (peer_ip_text[0][0].getComputedTextLength() + (3 * POPOVER_ATTR.internal_padding) + POPOVER_ATTR.peer_square_size) + ",0)";
      });

    var country_text = peer_location_box.append("text")
      .attr("x", function () {
        return POPOVER_ATTR.internal_padding + POPOVER_ATTR.text_offset;
      })
      .attr("y", POPOVER_ATTR.text_height + POPOVER_ATTR.internal_padding)
      // Location is in the peer's location property
      .text(loc_dict.country_name)
      .attr("font-size", POPOVER_ATTR.text_height)
      .attr("opacity", 0)
      .transition()
      .duration(POPOVER_ATTR.duration)
      .attr("opacity", POPOVER_ATTR.opacity);

      var region_text = peer_location_box.append("text");

      if (loc_dict.region_name !== '' || loc_dict.city !== '') {
        region_text.attr("x", function () {
        return POPOVER_ATTR.internal_padding + POPOVER_ATTR.text_offset;
      })
      .attr("y", 2 * (POPOVER_ATTR.text_height + POPOVER_ATTR.internal_padding))
      // Location is in the peer's location property
      .text( function () {
        if (loc_dict.city !== '' && loc_dict.region_name !== '') {
            return loc_dict.city + ', ' + loc_dict.region_name;
        } else if (loc_dict.region_name !== ''){
            return loc_dict.region_name;
        } else if (loc_dict.city !== '') {
            return loc_dict.city;
        };
        return loc_string;
      })
      .attr("font-size", POPOVER_ATTR.text_height)
      .attr("opacity", 0)
      .transition()
      .duration(POPOVER_ATTR.duration)
      .attr("opacity", POPOVER_ATTR.opacity);
    }

    var popover_piece_square = d3.select("g.tooltip")
      .append("rect")
      .attr("class", "piece_square")
      .attr("fill", piece_color)
      .attr("x", POPOVER_ATTR.internal_padding)
      .attr("y", (POPOVER_ATTR.height / 2) - (POPOVER_ATTR.peer_square_size / 2))
      .attr("width", POPOVER_ATTR.peer_square_size)
      .attr("height", POPOVER_ATTR.peer_square_size)
      .attr("opacity", 0)
      .transition()
      .duration(POPOVER_ATTR.duration)
      .attr("opacity", 1);

    var adjust_box_size = d3.select("rect.popover_main")
        .attr("width", function () {
          var total_width = POPOVER_ATTR.internal_padding + POPOVER_ATTR.peer_square_size + (3 * POPOVER_ATTR.internal_padding) +
            peer_ip_text[0][0].getComputedTextLength() +
            d3.max([country_text[0][0].getComputedTextLength(),
                   region_text[0][0].getComputedTextLength()]) +
            (4 * POPOVER_ATTR.internal_padding);
          return total_width;
        });
  });

  var mouseout = vis_pieces.on("mouseout", function ()
  {
      d3.selectAll("g.tooltip")
        .remove();
  })
};


var vis_request = function (req_dict) {
};

var get_color = function (ip) {
  return peers[ip]["color"];
};

var vis_write = function (write_dict) {
 var piece_index = write_dict.piece_index;
 ip = write_dict.peer[0];
 pieces[piece_index] = ip;
 peers[ip].pieces.push(piece_index);
 d3.selectAll("rect.piece" + piece_index)
 .attr("fill", get_color(ip))
 .transition()
 .duration(PIECE_ATTR.duration)
 .attr("opacity", 1);
};



var build_peer = function (peer_dict) {
  var peers_list = [];
  var ip = peer_dict.address[0];
  var color = colors.shift();
  var location = peer_dict.location;
  
  peers[ip] = {"color": color, "location": location, "pieces": []};

  for(var key in peers) {
    peers_list.push(key);
  }
  draw_peer_legend(peers_list);
};

var draw_peer_legend = function(peers_list) {
  try {
    var peer_divs = peers_div
      .selectAll("div.peer")
      .data(peers_list)
      .enter()
      .append("div")
      .attr("width", PEER_ATTR.width)
      .attr("height", PEER_ATTR.height)
      .style("width", PEER_ATTR.width)
      .style("height", PEER_ATTR.height)
      .style("display", "inline-block")
      .style("padding", PEER_ATTR.margin)
      .attr("class", "peer");

    peer_svgs = peer_divs
      .append("svg")
      .attr("class", "peer_box")
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", PEER_ATTR.width)
      .attr("height", PEER_ATTR.height)
      .style("width", PEER_ATTR.width)
      .style("height", PEER_ATTR.height)
      .attr("fill", function (d) {
        return peers[d].color;
      });

    } catch (e) {
      console.log(e);
    };
  
  
};

window.THEWEBSOCKET.onmessage = function (chunk) {
  var messages = (partial_message + chunk.data).split("\r\n\r\n");
  partial_message = "";
  messages.forEach(function (message) {
  try {
    var meat = JSON.parse(message);
  } catch (e) {
    if (message[0] === "") {
      return;
    } else if (message[0] === "{") {
        partial_message = message;
        console.log("partial message: " + partial_message);
        console.log("message: " + message);
    } else {
      console.log("Parsing failed: " + messages);
      console.log(e);
    }
  }
  if (meat.kind === "init") {
     build_model(meat);
   } else if (meat.kind === "request") {
     vis_request(meat);
   } else if (meat.kind === "piece") {
     vis_write(meat);
   } else if (meat.kind === "activate") {
    console.log("Activate");
    build_peer(meat);
  } else {
   throw "Data kind invalid";
  }
}
);
};

var send_piece = function (piece_no) {
  var template = {"peer": ["46.165.240.14", 50035], "kind": "piece", "piece_index": NaN};
  template.piece_index = Math.floor(Math.random() * 50);
  window.THEWEBSOCKET.send(JSON.stringify(template));
};

window.addEventListener("click", send_piece); 

};
mything();