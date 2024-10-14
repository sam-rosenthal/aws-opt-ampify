import React from 'react';
import {
  Chart,
  ChartCanvas,
  LineSeries,
  XAxis,
  YAxis,
  CrossHairCursor,
  discontinuousTimeScaleProviderBuilder,
  MouseCoordinateX,
  MouseCoordinateY,
  last,
} from "react-financial-charts";
import { timeFormat } from "d3-time-format";
import { Data } from './Graphs';

interface LineChartProps {
  data: Data[];
  width: number;
  height: number;
  ratio: number;
}

function getColor(source: string) {
  const colors: Record<string, string> = {
    'Pinnacle': '#8884d8',
    'Fanduel': '#82ca9d',
    'Draftkings': '#ffc658',
    'Espn': '#ff00ff'
  };
  return colors[source];
}

const LineChart: React.FC<LineChartProps> = ({ data, width, height, ratio }) => {
  const xScaleProvider = discontinuousTimeScaleProviderBuilder().inputDateAccessor((d: any) => new Date(d.Timestamp));
  const {
    data: chartData,
    xScale,
    xAccessor,
    displayXAccessor,
  } = xScaleProvider(data);

  const xExtents = [
    xAccessor(last(chartData)),
    xAccessor(chartData[Math.max(0, chartData.length - 100)]),
  ];

  if (chartData.length === 0) {
    return <div>No data available</div>;
  }

  return (
    <ChartCanvas
      height={height}
      width={width}
      ratio={ratio}
      margin={{ left: 50, right: 50, top: 10, bottom: 30 }}
      seriesName="Sample Data"
      data={chartData}
      xScale={xScale}
      xAccessor={xAccessor}
      displayXAccessor={displayXAccessor}
      xExtents={xExtents}
    >
      <Chart id={1} yExtents={d => d["Over Odds"]}>
        <XAxis axisAt="bottom" orient="bottom" ticks={6} />
        <YAxis axisAt="left" orient="left" ticks={5} />
        <MouseCoordinateX
          at="bottom"
          orient="bottom"
          displayFormat={timeFormat("%Y-%m-%d")}
        />
        <MouseCoordinateY
          at="left"
          orient="left"
          displayFormat={d => d.toFixed(2)}
        />
        {/* Render LineSeries for each source */}
        {['Espn', 'Pinnacle', 'Draftkings', 'Fanduel'].map((source, index) => (
          <LineSeries
            key={index}
            yAccessor={d => d.Source === source ? d["Over Odds"] : undefined}
            strokeStyle={getColor(source)}
          />
        ))}
      </Chart>
      <CrossHairCursor />
    </ChartCanvas>
  );
};

export default LineChart;