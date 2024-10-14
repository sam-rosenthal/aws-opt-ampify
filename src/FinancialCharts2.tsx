import React, { memo } from 'react';
import {
    Chart,
    ChartCanvas,
    LineSeries,
    CurrentCoordinate,
    XAxis,
    YAxis,
    CrossHairCursor,
    MouseCoordinateX,
    MouseCoordinateY,
    ZoomButtons,
    discontinuousTimeScaleProviderBuilder,
    last,
    withDeviceRatio,
    withSize,
    EdgeIndicator,
    SingleValueTooltip,
} from "react-financial-charts";
import { timeFormat } from "d3-time-format";
import { format } from "d3-format";
import { Data } from './Graphs2';

interface LineChartProps {
    data: Data[];
    width: number;
    height: number;
    ratio: number;
}

const margin = { left: 50, right: 50, top: 10, bottom: 30 };
const pricesDisplayFormat = format(".1f");

function getColor(source: string) {
    const colors: Record<string, string> = {
        'Pinnacle': '#8884d8',
        'Fanduel': '#82ca9d',
        'Draftkings': '#ffc658',
        'Espn': '#ff00ff' // Example color, you can change it
    };
    return colors[source];
}

const LineChart: React.FC<LineChartProps> = ({ data, width, height, ratio }) => {
    const xScaleProvider = discontinuousTimeScaleProviderBuilder().inputDateAccessor((d: Data) => d.Timestamp);
    const {
        xScale,
        xAccessor,
        displayXAccessor,
    } = xScaleProvider(data);

    const xExtents = [
        xAccessor(last(data)),
        xAccessor(data[Math.max(0, data.length - 100)]),
    ];

    const timeDisplayFormat = timeFormat("%Y-%m-%d %H:%M:%S");

    if (data.length === 0) {
        return <div>No data available</div>;
    }

    return (
        <ChartCanvas
            height={height}
            width={width}
            ratio={ratio}
            margin={margin}
            seriesName="Sample Data"
            data={data}
            displayXAccessor={displayXAccessor}
            xScale={xScale}
            xAccessor={xAccessor}
            xExtents={xExtents}
            // zoomAnchor={({ xScale }) => last(xScale.domain())} // Define zoomAnchor with the expected type
        >
            <Chart id={1} yExtents={d => d.Line}>
                <XAxis />
                <YAxis showGridLines tickFormat={pricesDisplayFormat} />

                <MouseCoordinateX 
                    displayFormat={timeDisplayFormat}
                />
                <MouseCoordinateY 
                    displayFormat={pricesDisplayFormat}
                />

                {/* Render LineSeries for each source */}
                {['Espn', 'Pinnacle', 'Draftkings', 'Fanduel'].map((source, index) => (
                    <>
                        <LineSeries
                            key={index}
                            yAccessor={d => d.Source === source ? d.Line : null}
                            strokeStyle={getColor(source)} 
                        />
                        
                        <EdgeIndicator
                            itemType="last"
                            orient="right"
                            edgeAt="right"
                            yAccessor={d => d.Source === source ? d.Line : null}
                            fill={getColor(source)}
                            lineStroke={getColor(source)}
                            displayFormat={pricesDisplayFormat} />

                        <SingleValueTooltip
                            yAccessor={d => d.Source === source ? d.Line : null}
                            yLabel={source}
                            yDisplayFormat={pricesDisplayFormat}
                            valueFill={getColor(source)}
                            origin={[8, index*16]}
                    />
                    </>
                ))}

            </Chart>
            <CrossHairCursor />
        </ChartCanvas>
    );
};

// Wrap the functional component with memo
const MemoizedLineChart = memo(LineChart);

export default MemoizedLineChart;
