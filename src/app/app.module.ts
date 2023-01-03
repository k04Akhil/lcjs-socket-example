import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { ChartComponent } from "./chart/chart.component";
import { RealtimeEcgComponent } from "./realtime-ecg/realtime-ecg.component";
import { ChartGridComponent } from './chart-grid/chart-grid.component';

@NgModule({
  declarations: [AppComponent, RealtimeEcgComponent, ChartComponent, ChartGridComponent],
  imports: [BrowserModule, AppRoutingModule, CommonModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
