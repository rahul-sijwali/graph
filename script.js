window.addEventListener("load", () => {
  const text_box = document.getElementById("text_box");
  const node_area = document.getElementById("node_area");
  const edge_animation_area = document.getElementById("edge_animation_area");
  const edge_area = document.getElementById("edge_area");

  let button_div_height = document.getElementById("buttons").offsetHeight;

  node_area.style.top = button_div_height + 25 + "px";
  node_area.style.height = window.innerHeight - button_div_height - 50 + "px";
  node_area.width = window.innerWidth * 0.95;
  node_area.height = window.innerHeight - button_div_height - 50;

  text_box.width = window.innerWidth * 0.4;
  text_box.height = 20;

  edge_animation_area.style.height =
    window.innerHeight - button_div_height - 50 + "px";
  edge_animation_area.style.top = button_div_height + 25 + "px";
  edge_animation_area.width = node_area.width;
  edge_animation_area.height = node_area.height;

  edge_area.style.height = window.innerHeight - button_div_height - 50 + "px";
  edge_area.style.top = button_div_height + 25 + "px";
  edge_area.width = node_area.width;
  edge_area.height = node_area.height;

  let last_width = node_area.width;
  let last_height = node_area.height;

  const node_area_ctx = node_area.getContext("2d");
  const edge_area_ctx = edge_area.getContext("2d");
  const edge_animation_area_ctx = edge_animation_area.getContext("2d");

  const make_node_button = document.getElementById("make_node");
  const make_edge_button = document.getElementById("make_edge");
  const make_edge_directed_button =
    document.getElementById("make_edge_directed");
  const reset_button = document.getElementById("reset");
  const run_button = document.getElementById("run");

  const STATES = [
    "DEFAULT", //0
    "MAKING_NODE", //1
    "MAKING_EDGE", //2
    "MAKING_DIRECTED_EDGE", //3
  ];
  let selected_node = -1;
  let animation_speed = 10;
  let nodes = {};
  let number_of_nodes = 0;
  let current_state = STATES[0];
  const CURSOR_LOCATION = [0, 0, 0, 0]; // x and y of cursor
  let clicked = 1;
  let edge_animation_id;
  let directed_edge_animation_id;
  let from = -1;
  let to = -1;

  const sleep = (ms) => {
    return new Promise((resolve, reject) => setTimeout(resolve, ms));
  };

  const near_node = () => {
    let nearest_node = 0;
    let minimum_distance = 9999999;
    let distance = 0;
    for (i = 0; i < number_of_nodes; i++) {
      x = nodes[i].x;
      y = nodes[i].y;
      distance =
        (x - CURSOR_LOCATION[0]) * (x - CURSOR_LOCATION[0]) +
        (y - CURSOR_LOCATION[1]) * (y - CURSOR_LOCATION[1]);
      if (Math.min(distance, minimum_distance) < minimum_distance) {
        minimum_distance = Math.min(distance, minimum_distance);
        nearest_node = i;
      }
    }
    return [minimum_distance, nearest_node];
  };
  const distance_between = (node_1, node_2) => {
    return (
      Math.pow(nodes[node_1].x - nodes[node_2].x, 2) +
      Math.pow(nodes[node_1].y - nodes[node_2].y, 2)
    );
  };
  const draw_circle = (x, y, node_number, fill = "red") => {
    node_area_ctx.beginPath();
    node_area_ctx.arc(x, y, 15, 0, 2 * Math.PI);
    node_area_ctx.fillStyle = fill;
    node_area_ctx.fill();
    node_area_ctx.fillStyle = "rgb(0, 0, 0)";
    node_area_ctx.font = "20px Arial";
    if (node_number > 9) {
      node_area_ctx.fillText(node_number, x - 12, y + 6);
    } else {
      node_area_ctx.fillText(node_number, x - 5, y + 5);
    }
    node_area_ctx.stroke();
  };
  const discovered = (from, to) => {
    if (nodes[to].child.includes(from)) {
      colour_edge(from, to, false);
      draw_circle(nodes[to].x, nodes[to].y, to, (fill = "yellow"));
    } else {
      colour_edge(from, to, true);
      draw_circle(nodes[to].x, nodes[to].y, to, (fill = "green"));
    }
  };

  const mousemove_event_handler = (current_state, x, y) => {
    //handles custom cursor animation//runs in mousemove
    switch (current_state) {
      case "MAKING_EDGE":
        [minimum_distance, nearest_node] = near_node();
        /*  console.log(
          "minimum distance ",
          minimum_distance,
          "nearest ",
          nearest_node
        );
       */
        if (minimum_distance < 500) {
          node_area_ctx.clearRect(
            nodes[nearest_node].x - 15,
            nodes[nearest_node].y - 15,
            30,
            30
          );
          draw_circle(
            nodes[nearest_node].x,
            nodes[nearest_node].y,
            nearest_node,
            "rgb(181, 9, 9)"
          );
        } else {
          node_area_ctx.clearRect(
            nodes[nearest_node].x - 15,
            nodes[nearest_node].y - 15,
            30,
            30
          );
          draw_circle(
            nodes[nearest_node].x,
            nodes[nearest_node].y,
            nearest_node
          );
        }

        break;
      case "MAKING_DIRECTED_EDGE":
        [minimum_distance, nearest_node] = near_node();
        if (minimum_distance < 500) {
          node_area_ctx.clearRect(
            nodes[nearest_node].x - 15,
            nodes[nearest_node].y - 15,
            30,
            30
          );
          draw_circle(
            nodes[nearest_node].x,
            nodes[nearest_node].y,
            nearest_node,
            "rgb(181, 9, 9)"
          );
        } else {
          node_area_ctx.clearRect(
            nodes[nearest_node].x - 15,
            nodes[nearest_node].y - 15,
            30,
            30
          );
          draw_circle(
            nodes[nearest_node].x,
            nodes[nearest_node].y,
            nearest_node
          );
        }
        break;
      default:
    }
  };

  const mouse_click_event_handler = () => {
    switch (current_state) {
      case "MAKING_NODE":
        //  console.log(CURSOR_LOCATION);
        // console.log("near node ", near_node());
        if (
          document.elementFromPoint(CURSOR_LOCATION[2], CURSOR_LOCATION[3])
            .id === "node_area" &&
          CURSOR_LOCATION[0] >= 10 &&
          CURSOR_LOCATION[0] <= node_area.width - 10 &&
          CURSOR_LOCATION[1] <= node_area.height - 10 &&
          CURSOR_LOCATION[1] >= 10
        ) {
          [minimum_distance] = near_node();
          //console.log(minimum_distance);
          if (minimum_distance > 2500 || number_of_nodes === 0) {
            nodes[number_of_nodes] = {
              x: CURSOR_LOCATION[0],
              y: CURSOR_LOCATION[1],
              child: [],
            };
            // console.log(nodes);

            draw_circle(
              CURSOR_LOCATION[0],
              CURSOR_LOCATION[1],
              number_of_nodes
            );
            number_of_nodes += 1;
          }
        }

        //  console.log(nodes);
        break;
      case "MAKING_EDGE":
        [minimum_distance, nearest_node] = near_node();
        if (minimum_distance < 500) {
          selected_node = nearest_node;
          clicked = (clicked + 1) % 2;
          if (clicked === 0) {
            from = selected_node;
            edge_animation();
          } else if (clicked === 1) {
            to = selected_node;
            cancelAnimationFrame(edge_animation_id);
            edge_animation_area_ctx.clearRect(
              0,
              0,
              edge_animation_area.width,
              edge_animation_area.height
            );
            draw_edge(from, to);
          }
        } else {
          selected_node = -1;
          clicked = 1;
          cancelAnimationFrame(edge_animation_id);
          edge_animation_area_ctx.clearRect(
            0,
            0,
            edge_animation_area.width,
            edge_animation_area.height
          );
        }

        break;
      case "MAKING_DIRECTED_EDGE":
        [minimum_distance, nearest_node] = near_node();
        if (minimum_distance < 500) {
          selected_node = nearest_node;
          clicked = (clicked + 1) % 2;
          if (clicked === 0) {
            from = selected_node;
            directed_edge_animation();
          } else if (clicked === 1) {
            to = selected_node;
            cancelAnimationFrame(directed_edge_animation_id);
            edge_animation_area_ctx.clearRect(
              0,
              0,
              edge_animation_area.width,
              edge_animation_area.height
            );
            draw_edge(from, to, true);
          }
        } else {
          selected_node = -1;
          clicked = 1;
          cancelAnimationFrame(directed_edge_animation_id);
          edge_animation_area_ctx.clearRect(
            0,
            0,
            edge_animation_area.width,
            edge_animation_area.height
          );
        }
        break;
      default:
    }
  };

  const reset = (clearall = true) => {
    if (clearall) {
      node_area_ctx.clearRect(0, 0, node_area.width, node_area.height);
      edge_area_ctx.clearRect(0, 0, edge_area.width, edge_area.height);
      nodes = {};
      number_of_nodes = 0;
    }
    current_state = "DEFAULT";
    selected_node = -1;
    clicked = 1;
    from = -1;
    to = -1;
  };

  make_node_button.addEventListener("click", () => {
    current_state = "MAKING_NODE";
  });

  make_edge_button.addEventListener("click", () => {
    current_state = "MAKING_EDGE";
  });

  make_edge_directed_button.addEventListener("click", (event) => {
    current_state = "MAKING_DIRECTED_EDGE";
  });

  reset_button.addEventListener("click", reset);

  const run = () => {
    console.log("yes");
    reset(false);
    current_root = -1;
    let visited = [];
    let queue = [];
    queue.push(0);
    for (let i = 0; i < number_of_nodes; i++) {
      visited[i] = 0;
    }
    visited[0] = 1;
    const bfs = () => {
      if (queue.length === 0) {
        return;
      }
      current_root = queue.shift();
      for (let i = 0; i < nodes[current_root].child.length; i++) {
        if (visited[nodes[current_root].child[i]] !== 1) {
          /*  setTimeout(
            discovered, async await sleep()
            1000,
            current_root,
            nodes[current_root].child[i]
          );*/
          discovered(current_root, nodes[current_root].child[i]);
          sleep(700).then(() => {
            console.log(nodes[current_root].child[i]);
            visited[nodes[current_root].child[i]] = 1;
            queue.push(nodes[current_root].child[i]);
          });
        }
      }

      sleep(700).then(bfs);
    };
    bfs();
  };

  run_button.addEventListener("click", run);

  window.addEventListener("mousemove", (event) => {
    //cursor animation loop
    CURSOR_LOCATION[0] = event.offsetX;
    CURSOR_LOCATION[1] = event.offsetY;
    CURSOR_LOCATION[2] = event.clientX;
    CURSOR_LOCATION[3] = event.clientY;
    mousemove_event_handler(
      current_state,
      CURSOR_LOCATION[0],
      CURSOR_LOCATION[1]
    );
    //console.log(current_state);
  });

  window.addEventListener("click", mouse_click_event_handler);

  window.addEventListener("resize", () => {
    button_div_height = document.getElementById("buttons").offsetHeight;

    edge_area.style.height = window.innerHeight - button_div_height - 50 + "px";
    edge_area.style.top = button_div_height + 25 + "px";
    edge_area.width = node_area.width;
    edge_area.height = node_area.height;

    node_area.style.height = window.innerHeight - button_div_height - 50 + "px";
    node_area.width = window.innerWidth * 0.95;
    node_area.height = window.innerHeight - button_div_height - 50;
    text_box.width = window.innerWidth * 0.4;
    node_area.style.top = button_div_height + 25 + "px";

    edge_animation_area.style.height =
      window.innerHeight - button_div_height - 50 + "px";
    edge_animation_area.style.top = button_div_height + 25 + "px";
    edge_animation_area.width = node_area.width;
    edge_animation_area.height = node_area.height;

    edge_area.style.height = window.innerHeight - button_div_height - 50 + "px";
    edge_area.style.top = button_div_height + 25 + "px";
    edge_area.width = node_area.width;
    edge_area.height = node_area.height;

    node_area_ctx.clearRect(0, 0, node_area.width, node_area.height);
    for (let i = 0; i < number_of_nodes; i++) {
      x = nodes[i].x;
      y = nodes[i].y;
      x = x * (node_area.width / last_width);
      y = y * (node_area.height / last_height);
      nodes[i].x = x;
      nodes[i].y = y;
      draw_circle(x, y, i);
    }
    last_width = node_area.width;
    last_height = node_area.height;
  });

  const edge_animation = () => {
    edge_animation_area_ctx.strokeStyle = "red";
    edge_animation_area_ctx.clearRect(
      0,
      0,
      edge_animation_area.width,
      edge_animation_area.height
    );
    edge_animation_area_ctx.lineWidth = 10;
    edge_animation_area_ctx.beginPath();
    edge_animation_area_ctx.moveTo(
      nodes[selected_node].x,
      nodes[selected_node].y
    );
    edge_animation_area_ctx.lineTo(CURSOR_LOCATION[0], CURSOR_LOCATION[1]);
    edge_animation_area_ctx.stroke();

    edge_animation_id = requestAnimationFrame(edge_animation);
  };

  const directed_edge_animation = () => {
    edge_animation_area_ctx.strokeStyle = "red";
    edge_animation_area_ctx.fillStyle = "red";
    edge_animation_area_ctx.clearRect(
      0,
      0,
      edge_animation_area.width,
      edge_animation_area.height
    );
    let from = selected_node;

    let distance =
      Math.pow(nodes[from].x - CURSOR_LOCATION[0], 2) +
      Math.pow(nodes[from].y - CURSOR_LOCATION[1], 2);
    console.log(distance);
    if (distance <= 10000) tol = 0.65;
    else if (distance <= 40000) tol = 0.75;
    else if (distance <= 150000) tol = 0.9;
    else tol = 0.95;
    edge_animation_area_ctx.lineWidth = 10;
    edge_animation_area_ctx.beginPath();
    edge_animation_area_ctx.moveTo(nodes[from].x, nodes[from].y);
    edge_animation_area_ctx.lineTo(CURSOR_LOCATION[0], CURSOR_LOCATION[1]);
    edge_animation_area_ctx.stroke();

    let dx = CURSOR_LOCATION[0] - nodes[from].x;
    let dy = CURSOR_LOCATION[1] - nodes[from].y;
    let dis = dx * dx + dy * dy;

    let midx = dx * tol + nodes[from].x;
    let midy = dy * tol + nodes[from].y;

    dx = CURSOR_LOCATION[0] - midx;
    dy = CURSOR_LOCATION[1] - midy;

    edge_animation_area_ctx.lineWidth = 1;
    edge_animation_area_ctx.beginPath();
    edge_animation_area_ctx.moveTo(midx + 0.5 * dy, midy - 0.5 * dx);
    edge_animation_area_ctx.lineTo(midx - 0.5 * dy, midy + 0.5 * dx);
    edge_animation_area_ctx.lineTo(CURSOR_LOCATION[0], CURSOR_LOCATION[1]);
    edge_animation_area_ctx.closePath();
    edge_animation_area_ctx.fill();
    directed_edge_animation_id = requestAnimationFrame(directed_edge_animation);
  };

  const colour_edge = (from, to, dir, colour = "yellow") => {
    edge_area_ctx.strokeStyle = colour;
    edge_area_ctx.fillStyle = colour;
    if (dir == true) {
      let distance = distance_between(from, to);
      if (distance <= 10000) tol = 0.65;
      else if (distance <= 40000) tol = 0.75;
      else if (distance <= 150000) tol = 0.9;
      else tol = 0.95;
      edge_area_ctx.lineWidth = 10;
      edge_area_ctx.beginPath();
      edge_area_ctx.moveTo(nodes[from].x, nodes[from].y);
      edge_area_ctx.lineTo(nodes[to].x, nodes[to].y);
      edge_area_ctx.stroke();

      let dx = nodes[to].x - nodes[from].x;
      let dy = nodes[to].y - nodes[from].y;

      let midx = dx * tol + nodes[from].x;
      let midy = dy * tol + nodes[from].y;

      dx = nodes[to].x - midx;
      dy = nodes[to].y - midy;

      edge_area_ctx.lineWidth = 1;
      edge_area_ctx.beginPath();
      edge_area_ctx.moveTo(midx + 0.5 * dy, midy - 0.5 * dx);
      edge_area_ctx.lineTo(midx - 0.5 * dy, midy + 0.5 * dx);
      edge_area_ctx.lineTo(nodes[to].x, nodes[to].y);
      edge_area_ctx.closePath();
      edge_area_ctx.fill();
    } else {
      edge_area_ctx.lineWidth = 10;
      edge_area_ctx.beginPath();
      edge_area_ctx.moveTo(nodes[from].x, nodes[from].y);
      edge_area_ctx.lineTo(nodes[to].x, nodes[to].y);
      edge_area_ctx.stroke();
    }
  };
  const draw_edge = (from, to, dir = false, colour = "red") => {
    edge_area_ctx.strokeStyle = colour;
    edge_area_ctx.fillStyle = colour;
    if (
      from !== to &&
      !nodes[from].child.includes(to) &&
      !nodes[to].child.includes(from)
    ) {
      if (dir == true) {
        let distance = distance_between(from, to);
        if (distance <= 10000) tol = 0.65;
        else if (distance <= 40000) tol = 0.75;
        else if (distance <= 150000) tol = 0.9;
        else tol = 0.95;

        nodes[from].child.push(to);
        edge_area_ctx.lineWidth = 10;
        edge_area_ctx.beginPath();
        edge_area_ctx.moveTo(nodes[from].x, nodes[from].y);
        edge_area_ctx.lineTo(nodes[to].x, nodes[to].y);
        edge_area_ctx.stroke();

        let dx = nodes[to].x - nodes[from].x;
        let dy = nodes[to].y - nodes[from].y;

        let midx = dx * tol + nodes[from].x;
        let midy = dy * tol + nodes[from].y;

        dx = nodes[to].x - midx;
        dy = nodes[to].y - midy;

        edge_area_ctx.lineWidth = 1;
        edge_area_ctx.beginPath();
        edge_area_ctx.moveTo(midx + 0.5 * dy, midy - 0.5 * dx);
        edge_area_ctx.lineTo(midx - 0.5 * dy, midy + 0.5 * dx);
        edge_area_ctx.lineTo(nodes[to].x, nodes[to].y);
        edge_area_ctx.closePath();
        edge_area_ctx.fill();
      } else {
        nodes[from].child.push(to);
        nodes[to].child.push(from);
        // edge_area_ctx.strokeStyle = "rgb(230, 16, 16)";
        edge_area_ctx.lineWidth = 10;
        edge_area_ctx.beginPath();
        edge_area_ctx.moveTo(nodes[from].x, nodes[from].y);
        edge_area_ctx.lineTo(nodes[to].x, nodes[to].y);
        edge_area_ctx.stroke();
      }
    }
  };
});
