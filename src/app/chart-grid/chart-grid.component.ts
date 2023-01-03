import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from "@angular/core";

@Component({
  selector: "app-chart-grid",
  templateUrl: "./chart-grid.component.html",
  styleUrls: ["./chart-grid.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartGridComponent implements OnInit {
  @ViewChild("canvas", { static: true })
  canvas?: ElementRef<HTMLCanvasElement>;
  context: CanvasRenderingContext2D | null | undefined;

  constructor() {}

  ngOnInit(): void {
    this.context = this.canvas?.nativeElement.getContext("2d");

    if (this.context) {
      this.context.canvas.width = 1900;
      this.context.canvas.height = 300;
      this.context.lineWidth = .4;
    }
    this.drawBoard();
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
