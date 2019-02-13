import * as d3 from "d3";

class Scatterplot {
  constructor(opts) {
    this.el = opts.el;
    this.data = opts.activeData;
    this.x = opts.x;
    this.y = opts.y;
    this.xDomain = opts.xDomain;
    this.yDomain = opts.yDomain;
    this.xAxisLabel = opts.xAxisLabel;
    this.yAxisLabel = opts.yAxisLabel;
    this.margin = opts.margin || {
      top: 10,
      right: 20,
      bottom: 0,
      left: 50
    };
    this.buttonState = {
      Asia: false,
      Europe: false,
      Africa: false,
      Oceania: false,
      Americas: false
    };
    this.selectedPoints = [];
    this.draw();
  }

  draw() {
    this.width = this.el.offsetWidth - this.margin.left - this.margin.right;
    this.height = this.width * 0.7 - this.margin.top - this.margin.bottom;

    this.el.innerHTML = "";

    this.calculateScales();
    this.appendButtons();

    const svg = d3
      .select(this.el)
      .append("svg")
      .attr("width", this.el.offsetWidth)
      .attr("height", this.el.offsetWidth * 0.7);

    this.chart = svg
      .append("g")
      .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

    this.addAxes();
    this.drawPoints();

    this.chart
      .append("text")
      .attr("x", 50)
      .attr("y", this.height - 50)
      .attr("class", "year")
      .text("2015");
  }

  calculateScales() {
    this.xScale = d3
      .scaleLog()
      .domain(this.xDomain)
      .range([0, this.width])
      .nice();

    this.yScale = d3
      .scaleLinear()
      .domain(this.yDomain)
      .range([this.height, 0]);

    this.colorScale = d3
      .scaleOrdinal()
      .domain(["Asia", "Europe", "Africa", "Oceania", "Americas"])
      .range([
        "rgb(88, 80, 141)",
        "rgb(188, 80, 144)",
        "rgb(255, 99, 97)",
        "rgb(0, 63, 92)",
        "rgb(255, 166, 0)"
      ]);
  }

  appendButtons() {
    const buttons = d3
      .select(this.el)
      .append("div")
      .attr("class", "buttons");

    buttons
      .selectAll("button")
      .data(["Asia", "Europe", "Africa", "Oceania", "Americas"])
      .join("button")
      .style("background-color", d => this.colorScale(d))
      .text(d => d)
      .on("click", d => {
        if (!this.buttonState[d]) {
          d3.select(d3.event.target).style("opacity", 0.1);
          d3.selectAll(`circle.${d}`).attr("opacity", 0.1);
          this.buttonState[d] = true;
          return;
        }
        if (this.buttonState[d]) {
          d3.select(d3.event.target).style("opacity", 1);
          d3.selectAll(`circle.${d}`).attr("opacity", 1);
          this.buttonState[d] = false;
          return;
        }
      });
  }

  drawPoints() {
    this.chart
      .selectAll("circle")
      .data(this.data, d => d.id)
      .join(
        enter => {
          enter
            .append("circle")
            .attr("cx", d => this.xScale(this.x(d)))
            .attr("cy", d => this.yScale(this.y(d)))
            .attr("r", 6)
            .attr("stroke", "#ddd")
            .attr("stroke-width", 1)
            .attr("fill", d => this.colorScale(d.region))
            .attr("opacity", d => (this.buttonState[d.region] ? 0.1 : 1))
            .attr("class", d => d.region)
            .on("click", d => {
              if (this.selectedPoints[d.id]) {
                delete this.selectedPoints[d.id];
                this.updateAnnotationPositions();
                return;
              }
              if (!this.selectedPoints[d.id]) {
                this.selectedPoints[d.id] = d;
                this.updateAnnotationPositions();
                console.log(this.selectedPoints);
                return;
              }
            });
        },
        update => {
          update
            .transition()
            .duration(400)
            .attr("cx", d => this.xScale(this.x(d)))
            .attr("cy", d => this.yScale(this.y(d)));
        },
        exit => exit.remove()
      );
  }

  addAxes() {
    const xAxis = d3
      .axisBottom()
      .scale(this.xScale)
      .ticks(7, ",")
      .tickSize(this.height);

    const yAxis = d3
      .axisLeft()
      .scale(this.yScale)
      .ticks(5)
      .tickSize(-this.width);

    this.chart
      .append("g")
      .attr("class", "axis x")
      .call(xAxis);

    this.chart
      .append("g")
      .attr("class", "axis y")
      .call(yAxis);

    this.chart
      .append("g")
      .append("text")
      .attr("class", "y axis-label")
      .attr("text-anchor", "end")
      .attr("transform", `translate(${20}, ${this.margin.top + 5}) rotate(-90)`)
      .text(this.yAxisLabel);

    this.chart
      .append("g")
      .append("text")
      .attr("class", "x axis-label")
      .attr("text-anchor", "end")
      .attr("transform", `translate(${this.width - 10}, ${this.height - 10})`)
      .text(this.xAxisLabel);
  }

  updateYear(activeYear) {
    d3.select(".year").text(activeYear);
  }

  updateData(newData, activeYear) {
    this.data = newData;
    const map = d3.map(this.data, d => d.id);
    Object.keys(this.selectedPoints).forEach(d => {
      if (map.has(d)) {
        this.selectedPoints[d] = map.get(d);
      }
      if (!map.has(d)) {
        this.selectedPoints[d] = null;
      }
    });
    this.drawPoints();
    this.updateYear(activeYear);
    this.updateAnnotationPositions();
  }

  updateAnnotationPositions() {
    this.chart
      .selectAll("text.annotation")
      .data(Object.keys(this.selectedPoints), d => d)
      .join(
        enter =>
          enter
            .append("text")
            .attr("class", "annotation")
            .attr("x", d => this.xScale(this.x(this.selectedPoints[d])) + 10)
            .attr("y", d => this.yScale(this.y(this.selectedPoints[d])))
            .text(d => this.selectedPoints[d].name),
        update =>
          update
            .attr("x", d =>
              this.selectedPoints[d]
                ? this.xScale(this.x(this.selectedPoints[d])) + 10
                : -100
            )
            .attr("y", d =>
              this.selectedPoints[d]
                ? this.yScale(this.y(this.selectedPoints[d]))
                : -100
            )
            .transition()
            .duration(400)
            .attr("opacity", d => (this.selectedPoints[d] ? 1 : 0)),
        exit => exit.remove()
      );
  }
}

export default Scatterplot;
