import {
  AfterViewInit,
  ChangeDetectionStrategy, Component,
  ElementRef,
  Input,
  OnInit,
  ViewChild
} from "@angular/core";
import { Observable } from "rxjs";
import { IChartProperties } from "../interfaces/chart-properties.interface";

@Component({
  selector: "app-chart-grid",
  templateUrl: "./chart-grid.component.html",
  styleUrls: ["./chart-grid.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartGridComponent implements OnInit, AfterViewInit {
  @ViewChild("canvas", { static: true })
  canvas?: ElementRef<HTMLCanvasElement>;
  @Input() chartProps: Observable<IChartProperties> =
    new Observable<IChartProperties>();
  context: CanvasRenderingContext2D | null | undefined;

  constructor() {}

  ngOnInit(): void {
    this.context = this.canvas?.nativeElement.getContext("2d");
  }

  ngAfterViewInit() {
    this.chartProps.subscribe((res: IChartProperties) => {
      this.setChartProperties(res);
      this.drawBoard();
    });
  }

  setChartProperties(res: IChartProperties) {
    if (this.context) {
      this.context.canvas.width = res.width - 20;
      this.context.canvas.height = res.height - 25;
      this.context.lineWidth = 0.4;
    }
  }

  drawBoard() {
    if (!this.context) {
      return;
    }

    const bw = 1840;
    const bh = 280;
    const p = 10;

    for (var x = 0; x <= bw; x += 40) {
      this.context.moveTo(0.5 + x + p, p);
      this.context.lineTo(0.5 + x + p, bh + p);
    }

    for (var x = 0; x <= bh; x += 40) {
      this.context.moveTo(p, 0.5 + x + p);
      this.context.lineTo(bw + p, 0.5 + x + p);
    }
    this.context.strokeStyle = "green";
    this.context.stroke();
  }
}
