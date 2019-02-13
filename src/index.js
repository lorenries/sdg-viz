import * as d3 from "d3";
import Scatterplot from "./charts/Scatterplot";
import debounce from "lodash.debounce";
import "./index.scss";

document.addEventListener("DOMContentLoaded", () => {
  const viz = document.querySelector(".chart-container");
  const slider = document.querySelector(".slider");

  d3.json(
    "https://gist.githubusercontent.com/lorenries/683a2000a759fae0dfaba99efaca5822/raw/55bda09b030e1d385dc1a1d7392f558fec2c77fd/sdg_clean_data.json"
  ).then(data => {
    const initialData = data.filter(d => d.year === "2015");

    const xAccessor = d => +d.mortality_data;
    const yAccessor = d => parseFloat(d.health_data);

    // instatiate the chart with the data and the container
    const chart = new Scatterplot({
      el: viz,
      data: initialData,
      x: xAccessor,
      y: yAccessor,
      xDomain: d3.extent(data, xAccessor),
      yDomain: [0, d3.max(data, yAccessor)],
      xAxisLabel: "Maternal mortality ratio (per 100,000 live births)",
      yAxisLabel: "Births attended by skilled health staff (% of total)"
    });

    // listen for resize events to update the chart's width and height for semi-🔥 responsiveness
    window.addEventListener(
      "resize",
      debounce(function() {
        chart.draw();
      }, 300)
    );

    slider.addEventListener("input", e => {
      const year = e.target.value;
      const newData = data.filter(d => d.year == year);
      chart.updateData(newData, year);
    });
  });
});
