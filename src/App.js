import logo from './logo.svg';
import './App.css';
import $ from 'jquery';
import "jquery-ui-dist/jquery-ui";
import React, { useState, useEffect } from 'react';

const radius = 10;
const threshold = 30;
const levelX = threshold;
const levelY = threshold;

function App() {
    



  const [inputValue, setInputValue] = useState(`1
2
3
4
5
1 2
1 3
3 5
5 4
2 4`);

  useEffect(() => {
    trigger(inputValue);
  }, [inputValue]);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleDownloadClick = () => {
    const svg = document.querySelector("#graph-svg");
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const DOMURL = window.URL || window.webkitURL || window;
    const img = new Image();
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = DOMURL.createObjectURL(svgBlob);

    img.onload = function () {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const pngBlob = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngBlob;
      downloadLink.download = "graph.png";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      DOMURL.revokeObjectURL(pngBlob);
    };

    img.src = url;
  };

  const trigger = (input) => {
    const svg = document.querySelector("#graph-svg");
    clearSVG(svg);
    parseInput(input, svg);
  };

  const parseInput = (text, svg) => {
    const taken = {};
    const graph = {};
    const location = {};
    const level = [];
    const nodeLevel = {};
    let totalLevels = 0;
    const lines = text.split(/\r?\n/);

    for (let line of lines) {
      const words = line.split(" ");
      const arr = [];

      for (let word of words) {
        let num = parseInt(word);
        if (!isNaN(num)) {
          arr.push(num);
        }
      }

      let len = arr.length;
      if (len === 0) {
        continue;
      } else if (len === 1) {
        initializeNodes(graph, arr);
      } else if (len === 2) {
        initializeNodes(graph, arr);
        const sourceNode = arr[0];
        const destinationNode = arr[1];
        graph[sourceNode].push(destinationNode);
        graph[destinationNode].push(sourceNode);
      }
    }

    let index = 0;
    for (let node in graph) {
      if (!nodeLevel.hasOwnProperty(node)) {
        nodeLevel[node] = 1;
        const maxLevels = visit(svg, graph, level, nodeLevel, location, taken, node);
        totalLevels = Math.max(totalLevels, maxLevels);
      }
      index++;
    }

    console.log("graph", graph);
    for (let node in graph) {
      drawNode(svg, location[node][0], location[node][1], node);
    }
  };

  const visit = (svg, graph, level, nodeLevel, location, taken, start, parent = -1) => {
    const queue = [];
    queue.push(start);
    const visited = {};
    visited[start] = true;
    let maxLevel = 0;

    while (queue.length > 0) {
      const node = queue.pop();
      let currLevel = nodeLevel[node];
      if (level.length <= currLevel) level[currLevel] = threshold;
      if (level.length <= currLevel + 1) level[currLevel + 1] = threshold;
      const row = graph[node];
      let currY = currLevel * threshold;

      maxLevel = Math.max(maxLevel, nodeLevel[node]);

      if (!location.hasOwnProperty(node)) {
        drawNode(svg, level[currLevel], currY, node);
        location[node] = [level[currLevel], currY];
        level[currLevel] += threshold;
      }

      for (let neb of row) {
        if (!location.hasOwnProperty(neb)) {
          drawNode(svg, level[currLevel + 1], currY + threshold, neb);
          location[neb] = [level[currLevel + 1], currY + threshold];
          level[currLevel + 1] += threshold;
          nodeLevel[neb] = currLevel + 1;
        }

        const edge = [node, neb];
        const backEdge = [neb, node];

        if (!taken.hasOwnProperty(edge) && !taken.hasOwnProperty(backEdge)) {
          const delta = Math.abs(location[neb][0] - location[node][0]);
          if (nodeLevel[node] === nodeLevel[neb] && delta > threshold) {
            drawCurve(svg, location[node][0], location[node][1], location[node][0], location[node][1] + threshold / 2, location[neb][0], location[neb][1] + threshold / 2, location[neb][0], location[neb][1]);
          } else {
            drawEdge(svg, location[node][0], location[node][1], location[neb][0], location[neb][1]);
          }
          taken[edge] = true;
        }

        if (!visited.hasOwnProperty(neb)) {
          visited[neb] = true;
          queue.push(neb);
        }
      }
    }

    return maxLevel;
  };

  const initializeNodes = (graph, arr) => {
    for (let node of arr) {
      if (!graph.hasOwnProperty(node)) {
        graph[node] = [];
      }
    }
  };

  const drawNode = (svg, x, y, text) => {
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", x);
    circle.setAttribute("cy", y);
    circle.setAttribute("r", radius);
    circle.setAttribute("fill", "rgb(0,200,100)");

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", x);
    label.setAttribute("y", y + 3);
    label.setAttribute("font-size", "7pt");
    label.setAttribute("fill", "white");
    label.setAttribute("text-anchor", "middle");
    label.textContent = text;

    svg.appendChild(circle);
    svg.appendChild(label);
  };

  const drawEdge = (svg, x1, y1, x2, y2) => {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);
    line.setAttribute("stroke", "rgb(0,100,200)");
    line.setAttribute("stroke-width", "1");

    svg.appendChild(line);
  };

  const drawCurve = (svg, x1, y1, x2, y2, x3, y3, x4, y4) => {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", `M ${x1} ${y1} C ${x2} ${y2}, ${x3} ${y3}, ${x4} ${y4}`);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "rgb(0,100,200)");
    path.setAttribute("stroke-width", "1");

    svg.appendChild(path);
  };

  const clearSVG = (svg) => {
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }
  };

  return (
    <div className="App">
            <div id="header">
                <h1>Graph Plotter</h1>
                <p>Visualize your complex graph with ease!</p>
            </div>
            <div id="instructions">
                <h2>Instructions</h2>
                <ol>
                    <li>Enter your graph data in the input area below:</li>
                    <ul>
                        <li>Each line represents a node or an edge in the graph.</li>
                        <li>To define a node, enter a single number.</li>
                        <li>To define an edge, enter two numbers separated by a space, representing the source and destination nodes.</li>
                    </ul>
                    <li>As you make changes in the input area, the graph visualization will update automatically in real-time.</li>
                </ol>
            </div>
            <div id="container">
                <div id="input-panel">
                    <h2>Graph Input</h2>
                    <textarea value={inputValue} onChange={handleInputChange} rows={20} cols={15} />
                </div>
                <div id="output-panel">
                    <h2>Graph Output Visualization</h2>
                    <div id="svg-container">
                        <svg id="graph-svg"></svg>
                    </div>
                    <button id="download-btn" onClick={handleDownloadClick}>Download Graph as PNG</button>
                </div>
            </div>

            <div id="footer">
            Design with ❤️ by Faizan Habib㊣
                <p>&copy; 2023 Graph Plotter. All rights reserved.</p>
            </div>
    </div>
  );
}


export default App;
