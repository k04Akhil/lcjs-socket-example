import {
  AfterViewInit,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges
} from "@angular/core";
import {
  AutoCursorModes,
  AxisTickStrategies,
  ChartXY,
  ColorHEX,
  ColorRGBA,
  emptyFill,
  emptyLine,
  lightningChart,
  Point,
  PointShape,
  SolidFill,
  SolidLine
} from "@arction/lcjs";
import { Observable, Subscription } from "rxjs";

const X_VIEW_MS = 4 * 1000;
const info = {
  name: "ECG-II",
  color: ColorHEX("#00ff00"),
  backgroundColor: ColorRGBA(31, 33, 66),
  yMin: 1,
  yMax: 2.2,
};
@Component({
  selector: "ngx-chart",
  templateUrl: "./chart.component.html",
  styleUrls: ["./chart.component.scss"],
})
export class ChartComponent
  implements OnChanges, OnDestroy, AfterViewInit, OnInit
{
  chartXY: ChartXY | any;
  chartId: number | any;
  prevPosX: number = 0;
  tStart = 0;
  pushedDataCount = 0;
  dataPointsPerSecond = 1000; // 100 Hz
  xStep = 1000 / this.dataPointsPerSecond;
  private eventsSubscription: Subscription = new Subscription();
  pointCache: Point[] = [];
  // Limit data input to only happen as fast as monitor is capable of refreshing. This should get rid of extra data processing that wouldn't be visible in any case.
  bufferedIncomingPoints: Point[] = [];
  forwardBufferedIncomingPointsHandle: number | undefined;
  @Input() points: Observable<Point[]> = new Observable<Point[]>();
  chartConfig: any;

  constructor() {
    this.tStart = window.performance.now();
  }

  ngOnInit() {
    // Generate random ID to us as the containerId for the chart and the target div id
    this.chartId = Math.trunc(Math.random() * 1000000);
  }
  ngOnChanges(changes: SimpleChanges) {}

  ngAfterViewInit() {
    this.chartXY = lightningChart().ChartXY({ container: `${this.chartId}` });
    this.chartConfig = this.createChartConfig();
    this.forwardBufferedIncomingPoints = this.forwardBufferedIncomingPoints.bind(this)
    this.eventsSubscription = this.points.subscribe((points: Point[]) => {
      // Place new incoming points into buffer array.
      for (const point of points) {
        this.bufferedIncomingPoints.push(point);
      }
      // Schedule method call that takes buffered points forward (unless already scheduled)
      this.forwardBufferedIncomingPointsHandle =
        this.forwardBufferedIncomingPointsHandle ||
        requestAnimationFrame(this.forwardBufferedIncomingPoints);
    });
  }

  createChartConfig() {
    // Create chartXY
    const chart = this.chartXY;

    // Set chart title
    chart
      .setTitle("")
      .setAutoCursorMode(AutoCursorModes.disabled)
      .setBackgroundFillStyle(new SolidFill({ color: info.backgroundColor }))
      .setBackgroundStrokeStyle(emptyLine)
      .setSeriesBackgroundFillStyle(emptyFill)
      .setSeriesBackgroundStrokeStyle(emptyLine)
      .setMouseInteractions(false);

    const axisX = chart
      .getDefaultAxisX()
      .setTickStrategy(AxisTickStrategies.Numeric)
      .setStrokeStyle(emptyLine)
      .setScrollStrategy(undefined)
      .setInterval(0, X_VIEW_MS);

    const axisY = chart
      .getDefaultAxisY()
      .setStrokeStyle(emptyLine)
      .setInterval(info.yMin, info.yMax, false, true)
      .setTickStrategy(AxisTickStrategies.Numeric);

    // Series for displaying "old" data.
    const seriesRight = chart
      .addLineSeries({
        dataPattern: { pattern: "ProgressiveX" },
      })
      .setName(info.name)
      .setStrokeStyle(
        new SolidLine({
          thickness: 2,
          fillStyle: new SolidFill({ color: info.color }),
        })
      );

    seriesRight.add({ x: 0, y: 0 });

    // Rectangle for hiding "old" data under incoming "new" data.
    const seriesOverlayRight = chart
      .addRectangleSeries()
      .add({ x1: 0, y1: 0, x2: 0, y2: 0 })
      .setFillStyle(new SolidFill({ color: info.backgroundColor }))
      .setStrokeStyle(emptyLine)
      .setMouseInteractions(false);

    // Series for displaying new data.
    const seriesLeft = chart
      .addLineSeries({
        dataPattern: { pattern: "ProgressiveX" },
      })
      .setName(info.name)
      .setStrokeStyle(
        new SolidLine({
          thickness: 2,
          fillStyle: new SolidFill({ color: info.color }),
        })
      );

    const seriesHighlightLastPoints = chart
      .addPointSeries({ pointShape: PointShape.Circle })
      .setPointFillStyle(new SolidFill({ color: ColorHEX("#ffffff") }))
      .setPointSize(5);

    this.chartXY = chart;

    return {
      ...chart,
      seriesLeft,
      seriesRight,
      seriesOverlayRight,
      seriesHighlightLastPoints,
      axisX,
      axisY,
    };
  }

  forwardBufferedIncomingPoints() {
    // Keep track of the latest X (time position), clamped to the sweeping axis range.
    let posX = 0;

    const newDataPointsTimestamped = this.bufferedIncomingPoints;
    const newDataCache = this.pointCache;

    // NOTE: Incoming data points are timestamped, meaning their X coordinates can go outside sweeping axis interval.
    // Clamp timestamps onto the sweeping axis range.
    const newDataPointsSweeping = newDataPointsTimestamped.map((dp) => ({
      x: dp.x % X_VIEW_MS,
      y: dp.y,
    }));

    posX = Math.max(
      posX,
      newDataPointsSweeping[newDataPointsSweeping.length - 1].x
    );

    // Check if the channel completes a full sweep (or even more than 1 sweep even though it can't be displayed).
    let fullSweepsCount = 0;
    let signPrev = false;
    for (const dp of newDataPointsSweeping) {
      const sign = dp.x < this.prevPosX;
      if (sign === true && sign !== signPrev) {
        fullSweepsCount += 1;
      }
      signPrev = sign;
    }

    if (fullSweepsCount > 1) {
      // The below algorithm is incapable of handling data input that spans over several full sweeps worth of data.
      // To prevent visual errors, reset sweeping graph and do not process the data.
      // This scenario is triggered when switching tabs or minimizing the example for extended periods of time.
      this.chartConfig.seriesRight.clear();
      this.chartConfig.seriesLeft.clear();
      newDataCache.length = 0;
    } else if (fullSweepsCount === 1) {
      // Sweeping cycle is completed.
      // Copy data of "left" series into the "right" series, clear "left" series.

      // Categorize new data points into "right" and "left" sides.
      const newDataPointsLeft: Point[] = [];
      for (const dp of newDataPointsSweeping) {
        if (dp.x > this.prevPosX) {
          newDataCache.push(dp);
        } else {
          newDataPointsLeft.push(dp);
        }
      }
      this.chartConfig.seriesRight.clear().add(newDataCache);
      this.chartConfig.seriesLeft.clear().add(newDataPointsLeft);
      newDataCache.length = 0;
      newDataCache.push(...newDataPointsLeft);
    } else {
      // Append data to left.
      this.chartConfig.seriesLeft.add(newDataPointsSweeping);
      // NOTE: While extremely performant, this syntax can crash if called with extremely large arrays (at least 100 000 items).
      newDataCache.push(...newDataPointsSweeping);
    }

    // Highlight last data point.
    const highlightPoints = [
      newDataCache.length > 0
        ? newDataCache[newDataCache.length - 1]
        : newDataPointsSweeping[newDataPointsSweeping.length - 1],
    ];
    this.chartConfig.seriesHighlightLastPoints.clear().add(highlightPoints);

    // Move overlays of old data to right locations.
    const overlayXStart = 0;
    const overlayXEnd = posX + X_VIEW_MS * 0.03;
    this.chartConfig.seriesOverlayRight.setDimensions({
      x1: overlayXStart,
      x2: overlayXEnd,
      y1: this.chartConfig.axisY.getInterval().start,
      y2: this.chartConfig.axisY.getInterval().end,
    });

    this.prevPosX = posX;
    this.forwardBufferedIncomingPointsHandle = undefined;
    this.bufferedIncomingPoints.length = 0
  }

  ngOnDestroy() {
    // "dispose" should be called when the component is unmounted to free all the resources used by the chart
    this.chartXY.dispose();
    this.eventsSubscription.unsubscribe();
    if (this.forwardBufferedIncomingPointsHandle !== undefined)
      cancelAnimationFrame(this.forwardBufferedIncomingPointsHandle);
  }
}
